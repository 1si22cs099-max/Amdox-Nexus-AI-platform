import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, hashPassword } from './server/db';
import { generateAllInsights } from './server/aiEngine';
import { triggerNotification, sendEmailNotification } from './server/notifier';
import { 
  User, Tenant, LedgerEntry, Invoice, EmployeeProfile, 
  InventoryItem, Vendor, PurchaseOrder, Project, Task 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Custom Secret for Simulated JWT Token Signature
const JWT_SECRET = 'amdox-nexus-super-secret-9a8b7c';

// Helper to encode state to "JWT" Base64 token
function signJwt(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  // Simple signature simulation
  const signature = Buffer.from(`${header}.${body}.${JWT_SECRET}`).toString('base64url').substring(0, 30);
  return `${header}.${body}.${signature}`;
}

// Helper to decode simulated JWT
function verifyAndDecodeJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const computedSig = Buffer.from(`${header}.${body}.${JWT_SECRET}`).toString('base64url').substring(0, 30);
    
    if (computedSig !== signature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Express Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Auth token requested' });
  }

  const userPayload = verifyAndDecodeJwt(token);
  if (!userPayload) {
    return res.status(403).json({ error: 'Invalid or expired credentials session' });
  }

  req.user = userPayload;
  next();
}

// REST APIs

// 1. Authentication Endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { companyName, industry, domain, name, email, password } = req.body;

  if (!companyName || !domain || !name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all company and administrator credentials.' });
  }

  const db = readDb();
  
  // Verify email uniqueness
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'This business email is already registered.' });
  }

  // Provision Tenant
  const tenantId = `tenant-${domain.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().substring(8)}`;
  const tenantObj: Tenant = {
    id: tenantId,
    name: companyName,
    industry: industry || 'Technology',
    domain,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.tenants.push(tenantObj);

  // Provision Tenant Admin User
  const adminId = `usr-${tenantId.substring(7)}-${Math.round(Math.random() * 900 + 100)}`;
  const userObj = {
    id: adminId,
    tenantId,
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'tenant_admin' as const,
    department: 'Management',
    designation: 'Managing Director & Partner',
    status: 'active' as const,
    createdAt: new Date().toISOString()
  };

  db.users.push(userObj);

  // Push some basic boilerplate inventory item and ledger so the tenant has baseline visual playground charts
  const item1: InventoryItem = {
    id: `inv-${Date.now()}-1`,
    tenantId,
    sku: 'SKU-BOILERPLATE-01',
    name: 'Production Core Switch Board',
    description: 'Boilerplate electronics transceivers for test operations.',
    category: 'Electronics',
    unit: 'pcs',
    quantityInStock: 12,
    minThreshold: 20,
    costPrice: 80,
    sellingPrice: 120,
    vendorId: 'vnd-mock'
  };
  db.inventory.push(item1);

  const ledg1: LedgerEntry = {
    id: `ldgr-${Date.now()}-1`,
    tenantId,
    date: new Date().toISOString().split('T')[0],
    account: 'Revenue',
    type: 'credit',
    amount: 15000,
    description: 'Initial Company Setup Credit',
    reference: 'SEED-001'
  };
  db.ledger.push(ledg1);

  writeDb();

  // Send Resend confirmation email
  const emailContent = `<h1>Welcome to Amdox Nexus AI Platform</h1>
    <p>Dear ${name},</p>
    <p>Congratulations! Your enterprise tenant environment is provisioned successfully matching domain "${domain}".</p>
    <p>Your Tenant Admin email: <strong>${email}</strong></p>
    <p>Use your account to customize and map finance ledgers, team structures, supply lines, and predictive AI analytics.</p>`;
  
  await triggerNotification({
    tenantId,
    userId: adminId,
    message: `Account activated successfully for "${companyName}". Administrator: ${name}.`,
    type: 'success',
    sendEmail: true,
    emailRecipient: email,
    emailSubject: 'Welcome to Amdox Nexus AI Platform - Environment Activated',
  });

  const token = signJwt({ id: adminId, tenantId, name, email, role: 'tenant_admin' });
  return res.json({ token, user: { id: adminId, tenantId, name, email, role: 'tenant_admin' } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter registered login credentials.' });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid login email or password combination.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'This corporate profile is marked deactivated.' });
  }

  const token = signJwt({ 
    id: user.id, 
    tenantId: user.tenantId, 
    name: user.name, 
    email: user.email, 
    role: user.role 
  });

  console.log(`[Auth] User ${user.name} (${user.role}) logged in successfully.`);

  return res.json({ 
    token, 
    user: { 
      id: user.id, 
      tenantId: user.tenantId, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    } 
  });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Authorized session user not found.' });
  }
  return res.json({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    salary: user.salary,
    status: user.status
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter required.' });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Return friendly status to prevent verification exploits
    return res.json({ message: 'If registered, a secure reset link has been dispatched.' });
  }

  const resetLink = `https://amdox-nexus-erp.platform/reset-credentials?token=simulated-${Date.now()}`;
  const htmlContent = `
    <h2>Amdox Nexus Account Password Reset</h2>
    <p>Dear ${user.name},</p>
    <p>We received an enterprise request to change your portal key. Click the local simulation address below to proceed:</p>
    <p><a href="${resetLink}" style="color: #4F46E5; font-weight: 600;">Reset Portal Key</a></p>
    <p>If you did not request this, you may safely ignore this message.</p>
  `;

  await sendEmailNotification(email, '[Amdox Nexus ERP] Reset Authorization Key Request', htmlContent);
  return res.json({ message: 'If registered, a secure reset link has been dispatched.' });
});


// 2. Super Admin Endpoints (requires Super Admin Token verification)
app.get('/api/super/tenants', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Elevated Super privilege is requested.' });
  }
  const db = readDb();
  return res.json(db.tenants);
});

app.post('/api/super/tenants', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Elevated Super privilege is requested.' });
  }

  const { companyName, industry, domain, adminName, adminEmail, adminPassword } = req.body;
  if (!companyName || !domain || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing tenant configuration schema parameters.' });
  }

  const db = readDb();
  const tenantId = `tenant-${domain.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().substring(8)}`;
  
  const newTenant: Tenant = {
    id: tenantId,
    name: companyName,
    industry,
    domain,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const newAdmin = {
    id: `usr-${tenantId.substring(7)}-admin`,
    tenantId,
    name: adminName,
    email: adminEmail,
    passwordHash: hashPassword(adminPassword),
    role: 'tenant_admin' as const,
    department: 'Executive Board',
    designation: 'Tenant Administrator',
    status: 'active' as const,
    createdAt: new Date().toISOString()
  };

  db.tenants.push(newTenant);
  db.users.push(newAdmin);
  writeDb();

  await triggerNotification({
    tenantId: null,
    userId: null,
    message: `Enterprise Platform: New Tenant "${companyName}" successfully provisioned by Cloud Security.`,
    type: 'success',
    sendEmail: true,
    emailRecipient: adminEmail,
    emailSubject: `[Amdox Nexus] tenant Workspace Provisioned: ${companyName}`,
  });

  return res.json({ success: true, tenant: newTenant });
});

app.get('/api/super/analytics', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Elevated Super privilege is requested.' });
  }
  const db = readDb();
  
  const totalTenants = db.tenants.length;
  const totalProfiles = db.users.length;
  const invoiceTransactions = db.invoices.reduce((a, b) => a + b.total, 0);

  return res.json({
    totalTenants,
    totalProfiles,
    invoiceTransactions,
    dbSizeEstimate: JSON.stringify(db).length,
    activeAnomaliesCount: db.notifications.filter(n => n.type === 'warning').length
  });
});


// 3. User Management Endpoints
app.get('/api/users', authenticateToken, (req: any, res) => {
  const db = readDb();
  // Filter by user's tenant (or view all if super admin)
  const userTenant = req.user.tenantId;
  const list = userTenant 
    ? db.users.filter(u => u.tenantId === userTenant)
    : db.users;

  // Mask hashed passwords
  return res.json(list.map(({ passwordHash, ...safeUser }) => safeUser));
});

app.post('/api/users', authenticateToken, async (req: any, res) => {
  const { name, email, password, role, department, designation, salary } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Provide name, email, pass, and designated role.' });
  }

  // Permitted to Create users: Tenant Admin or Super Admin
  const isAuthorized = req.user.role === 'super_admin' || req.user.role === 'tenant_admin';
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Access denied: Tenant Administrative scope required.' });
  }

  const tenantId = req.user.tenantId; // Create user under creator's tenant
  if (!tenantId && req.user.role !== 'super_admin') {
    return res.status(400).json({ error: 'Invalid workspace instance bounds.' });
  }

  const db = readDb();
  const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'This corporate profile email is already assigned.' });
  }

  const newUserId = `usr-${tenantId ? tenantId.substring(7) : 'gen'}-${Math.round(Math.random() * 9000 + 1000)}`;
  const newUser = {
    id: newUserId,
    tenantId,
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    department: department || 'General Engineering',
    designation: designation || 'Associate Professional',
    status: 'active' as const,
    salary: salary ? Number(salary) : undefined,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // If HR profile is being added, construct supplementary profiles
  if (role === 'employee' && tenantId) {
    const freshEmployeeProfile: EmployeeProfile = {
      id: `emp-${newUserId.substring(4)}`,
      tenantId,
      userId: newUserId,
      department: department || 'General Engineering',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      attendance: [],
      payrollHistory: []
    };
    db.employees.push(freshEmployeeProfile);
  }

  writeDb();

  await triggerNotification({
    tenantId,
    userId: null,
    message: `Account Onboarding: Profile registered for ${name} (${role}) inside Department: ${department}.`,
    type: 'success',
    sendEmail: true,
    emailRecipient: email,
    emailSubject: `[Amdox Nexus] Corporate Credentials Created`,
  });

  const { passwordHash, ...safeUser } = newUser;
  return res.json(safeUser);
});


// 4. Finance Module Endpoints
app.get('/api/finance/ledger', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Invalid tenant instance context.' });

  const db = readDb();
  const entries = db.ledger.filter(item => item.tenantId === tenantId);
  return res.json(entries);
});

app.post('/api/finance/ledger', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  // Access validation: Finance, Admin, or Super
  const canAccess = ['tenant_admin', 'finance_manager', 'super_admin'].includes(req.user.role);
  if (!canAccess) return res.status(403).json({ error: 'Finance executive limits requested.' });

  const { account, type, amount, description, reference } = req.body;
  if (!account || !type || !amount) {
    return res.status(400).json({ error: 'Fields account, type, and amount are standard parameters.' });
  }

  const db = readDb();
  const newEntry: LedgerEntry = {
    id: `ldgr-${Date.now()}`,
    tenantId,
    date: new Date().toISOString().split('T')[0],
    account,
    type,
    amount: Number(amount),
    description: description || '',
    reference: reference || 'MANUAL-REF'
  };

  db.ledger.push(newEntry);
  writeDb();

  return res.json(newEntry);
});

app.get('/api/finance/invoices', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant scope requested.' });

  const db = readDb();
  return res.json(db.invoices.filter(inv => inv.tenantId === tenantId));
});

app.post('/api/finance/invoices', authenticateToken, async (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const canAccess = ['tenant_admin', 'finance_manager'].includes(req.user.role);
  if (!canAccess) return res.status(403).json({ error: 'Finance permission scopes required.' });

  const { clientName, clientEmail, issueDate, dueDate, items, taxRate, discount } = req.body;
  if (!clientName || !clientEmail || !items || items.length === 0) {
    return res.status(400).json({ error: 'Fill in client name, email and billing items.' });
  }

  const db = readDb();
  
  // Calculate pricing math
  const subTotal = items.reduce((sum: number, it: any) => sum + (Number(it.qty) * Number(it.rate)), 0);
  const discountVal = Number(discount) || 0;
  const taxMultiplier = 1 + (Number(taxRate || 10) / 100);
  const netTotal = Math.max(0, Math.round((subTotal - discountVal) * taxMultiplier));

  const invoiceNum = `INV-${Math.round(Math.random() * 9000 + 1000)}`;

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    tenantId,
    invoiceNumber: invoiceNum,
    clientName,
    clientEmail,
    issueDate: issueDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: items.map((i: any) => ({
      description: i.description,
      qty: Number(i.qty),
      rate: Number(i.rate),
      amount: Number(i.qty) * Number(i.rate)
    })),
    taxRate: Number(taxRate || 10),
    discount: discountVal,
    total: netTotal,
    status: 'unpaid',
    paidAmount: 0,
    payments: []
  };

  db.invoices.push(newInvoice);
  writeDb();

  // Alert and email client
  const invoiceLink = `https://amdox-nexus-erp.platform/invoice/viewer?id=${newInvoice.id}`;
  const mailContent = `
    <h2>Enterprise Invoice Dispatched: ${invoiceNum}</h2>
    <p>Dear Finance Team at ${clientName},</p>
    <p>Amdox Nexus dynamic invoice tracking has generated itemized deliverables amounting to <strong>$${netTotal.toLocaleString()}</strong>.</p>
    <p>Issued Date: ${newInvoice.issueDate} | Terms: Due by ${newInvoice.dueDate}</p>
    <h3>Item Summary:</h3>
    <ul>
      ${newInvoice.items.map(it => `<li>${it.description} (Qty: ${it.qty} @ $${it.rate}) - $${it.amount}</li>`).join('')}
    </ul>
    <p>Please secure settlements at your earliest convenience.</p>
  `;

  await triggerNotification({
    tenantId,
    userId: null,
    message: `Billing Pipeline: Dispatched Invoice ${invoiceNum} for $${netTotal.toLocaleString()} to ${clientName}.`,
    type: 'info',
    sendEmail: true,
    emailRecipient: clientEmail,
    emailSubject: `[Amdox Nexus Billing] Invoice ${invoiceNum} Outstanding`,
  });

  return res.json(newInvoice);
});

app.post('/api/finance/invoices/:id/pay', authenticateToken, async (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { amount, method } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Specify positive receipt amount.' });

  const db = readDb();
  const invoice = db.invoices.find(inv => inv.id === id && inv.tenantId === tenantId);
  
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  const amtPay = Number(amount);
  invoice.paidAmount += amtPay;
  invoice.payments.push({
    date: new Date().toISOString().split('T')[0],
    amount: amtPay,
    method: method || 'bank_transfer'
  });

  if (invoice.paidAmount >= invoice.total) {
    invoice.status = 'paid';
  }

  // Automatically register a corresponding ledger line under 'Revenue'
  const newLedg: LedgerEntry = {
    id: `ldgr-pay-${Date.now()}`,
    tenantId,
    date: new Date().toISOString().split('T')[0],
    account: 'Revenue',
    type: 'credit',
    amount: amtPay,
    description: `Invoice settlement receipt for ${invoice.invoiceNumber}`,
    reference: invoice.invoiceNumber
  };
  db.ledger.push(newLedg);
  writeDb();

  await triggerNotification({
    tenantId,
    userId: null,
    message: `Collections Sync: Payment of $${amtPay.toLocaleString()} applied on ${invoice.invoiceNumber}. Unpaid balance: $${(invoice.total - invoice.paidAmount).toLocaleString()}.`,
    type: 'success',
    sendEmail: true,
    emailRecipient: invoice.clientEmail,
    emailSubject: `[Amdox Nexus] Payment Acknowledgment: ${invoice.invoiceNumber}`,
  });

  return res.json(invoice);
});


// 5. HR Module Endpoints
app.get('/api/hr/employees', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  const list = db.employees.filter(emp => emp.tenantId === tenantId);

  // Hydrate user info
  const hydrated = list.map(emp => {
    const user = db.users.find(u => u.id === emp.userId);
    return {
      ...emp,
      name: user?.name,
      email: user?.email,
      designation: user?.designation,
      salary: user?.salary,
      role: user?.role
    };
  });

  return res.json(hydrated);
});

app.post('/api/hr/attendance', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { employeeId, date, status, checkIn, checkOut } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!employeeId || !status || !date) {
    return res.status(400).json({ error: 'Properties employeeId, date, and state are parameters.' });
  }

  const db = readDb();
  const empProfile = db.employees.find(e => e.id === employeeId && e.tenantId === tenantId);
  if (!empProfile) return res.status(404).json({ error: 'Target HR profile not found.' });

  // Update or append attendance date
  const index = empProfile.attendance.findIndex(a => a.date === date);
  if (index >= 0) {
    empProfile.attendance[index] = { date, status, checkIn, checkOut };
  } else {
    empProfile.attendance.push({ date, status, checkIn, checkOut });
  }

  writeDb();
  return res.json(empProfile);
});

app.post('/api/hr/payroll', authenticateToken, async (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { employeeId, month, year, baseSalary, bonuses, deductions } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!employeeId || !month || !year) {
    return res.status(400).json({ error: 'Provide employeeId, month, and salary year.' });
  }

  const db = readDb();
  const empProfile = db.employees.find(e => e.id === employeeId && e.tenantId === tenantId);
  if (!empProfile) return res.status(404).json({ error: 'Employee not found.' });

  const userObj = db.users.find(u => u.id === empProfile.userId);

  const base = Number(baseSalary || userObj?.salary || 4000);
  const bonus = Number(bonuses || 0);
  const deduct = Number(deductions || 0);
  const net = base + bonus - deduct;

  const newPayroll = {
    id: `pay-${Date.now()}`,
    month,
    year: Number(year),
    baseSalary: base,
    bonuses: bonus,
    deductions: deduct,
    netSalary: net,
    status: 'paid' as const,
    processedDate: new Date().toISOString().split('T')[0]
  };

  empProfile.payrollHistory.push(newPayroll);

  // Write corresponding debit ledger transaction
  const payrollLedg: LedgerEntry = {
    id: `ldgr-payroll-${Date.now()}`,
    tenantId,
    date: new Date().toISOString().split('T')[0],
    account: 'Salaries',
    type: 'debit',
    amount: net,
    description: `Payroll dispatch to ${userObj?.name} for ${month} ${year}`,
    reference: `PAY-${month.substring(0, 3).toUpperCase()}-${year}`
  };
  db.ledger.push(payrollLedg);
  writeDb();

  if (userObj?.email) {
    await triggerNotification({
      tenantId,
      userId: userObj.id,
      message: `Payroll Cleared: Your monthly payslip for ${month} is cleared. Base Salary: $${base.toLocaleString()}, Overtime/Bonus: $${bonus.toLocaleString()}, Deductions: $${deduct.toLocaleString()}. Net Dispatched: $${net.toLocaleString()}.`,
      type: 'success',
      sendEmail: true,
      emailRecipient: userObj.email,
      emailSubject: `[Amdox HR] Electronic Payslip Ready - ${month} ${year}`,
    });
  }

  return res.json(empProfile);
});


// 6. Supply Chain & Inventory Module Endpoints
app.get('/api/inventory', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  return res.json(db.inventory.filter(item => item.tenantId === tenantId));
});

app.post('/api/inventory', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { sku, name, description, category, unit, quantityInStock, minThreshold, costPrice, sellingPrice, vendorId } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!sku || !name || !quantityInStock || !costPrice || !sellingPrice || !vendorId) {
    return res.status(400).json({ error: 'Required: sku, name, starting stock, pricing values, and supplier ID.' });
  }

  const db = readDb();
  const newItem: InventoryItem = {
    id: `inv-item-${Date.now()}`,
    tenantId,
    sku,
    name,
    description: description || '',
    category: category || 'General',
    unit: unit || 'pcs',
    quantityInStock: Number(quantityInStock),
    minThreshold: Number(minThreshold || 10),
    costPrice: Number(costPrice),
    sellingPrice: Number(sellingPrice),
    vendorId
  };

  db.inventory.push(newItem);
  writeDb();
  return res.json(newItem);
});

app.get('/api/vendors', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  return res.json(db.vendors.filter(v => v.tenantId === tenantId));
});

app.post('/api/vendors', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { name, contactEmail, contactPhone, address } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!name || !contactEmail) return res.status(400).json({ error: 'Provider supplier name and account email.' });

  const db = readDb();
  const newVendor: Vendor = {
    id: `vnd-${Date.now()}`,
    tenantId,
    name,
    contactEmail,
    contactPhone: contactPhone || '',
    address: address || '',
    status: 'active'
  };

  db.vendors.push(newVendor);
  writeDb();
  return res.json(newVendor);
});

app.get('/api/inventory/purchase-orders', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  return res.json(db.purchaseOrders.filter(po => po.tenantId === tenantId));
});

app.post('/api/inventory/purchase-orders', authenticateToken, async (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { vendorId, items, expectedDate } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!vendorId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Provide vendor reference and purchase items.' });
  }

  const db = readDb();
  const vendor = db.vendors.find(v => v.id === vendorId && v.tenantId === tenantId);
  if (!vendor && vendorId !== 'vnd-mock') {
    return res.status(404).json({ error: 'Supplier vendor not resolved.' });
  }

  const poNum = `PO-${Math.round(Math.random() * 8000 + 1000)}`;
  const totalSum = items.reduce((sum: number, it: any) => sum + (Number(it.qty) * Number(it.unitPrice)), 0);

  const purchaseObj: PurchaseOrder = {
    id: `po-${Date.now()}`,
    tenantId,
    poNumber: poNum,
    vendorId,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: expectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: items.map((i: any) => ({
      itemSku: i.itemSku,
      qty: Number(i.qty),
      unitPrice: Number(i.unitPrice),
      total: Number(i.qty) * Number(i.unitPrice)
    })),
    status: 'pending',
    totalAmount: totalSum
  };

  db.purchaseOrders.push(purchaseObj);
  writeDb();

  // Alert developer or agent
  if (vendor?.contactEmail) {
    const poHtml = `
      <h2>Purchase Order Dispatched: ${poNum}</h2>
      <p>Dear Supply desk at ${vendor.name},</p>
      <p>Amdox Nexus Automated Supply chain manager has triggered a REST replenishment PO for: <strong>$${totalSum.toLocaleString()}</strong>.</p>
      <h3>Procurement Queue:</h3>
      <ul>
        ${purchaseObj.items.map(it => `<li>SKU ${it.itemSku} (Qty Requested: ${it.qty} @ $${it.unitPrice})</li>`).join('')}
      </ul>
      <p>Fulfill to scheduled delivery bounds around: ${purchaseObj.expectedDate}.</p>
    `;

    await triggerNotification({
      tenantId,
      userId: null,
      message: `Supply Line: Replenishment Purchase Order ${poNum} triggered to ${vendor.name} for $${totalSum.toLocaleString()}.`,
      type: 'info',
      sendEmail: true,
      emailRecipient: vendor.contactEmail,
      emailSubject: `[Amdox Procurement] New Purchase Queue ${poNum}`,
    });
  }

  return res.json(purchaseObj);
});

// Update PO status (e.g. approve or mark completed, which replenishes the stock automatically!)
app.post('/api/inventory/purchase-orders/:id/approve', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  const po = db.purchaseOrders.find(p => p.id === id && p.tenantId === tenantId);
  if (!po) return res.status(404).json({ error: 'Purchase queue not found.' });

  if (po.status === 'completed') {
    return res.status(400).json({ error: 'This purchase line has already completed fulfillment.' });
  }

  po.status = 'completed';

  // Replenish stock for each item in the purchase order!
  po.items.forEach(it => {
    const invItem = db.inventory.find(inv => inv.sku === it.itemSku && inv.tenantId === tenantId);
    if (invItem) {
      invItem.quantityInStock += it.qty;
    }
  });

  // Record a debit entry under Ledger accounts
  const poDebit: LedgerEntry = {
    id: `ldgr-po-${Date.now()}`,
    tenantId,
    date: new Date().toISOString().split('T')[0],
    account: 'Materials',
    type: 'debit',
    amount: po.totalAmount,
    description: `Settlement payout for Supply PO ${po.poNumber}`,
    reference: po.poNumber
  };
  db.ledger.push(poDebit);

  writeDb();
  return res.json(po);
});


// 7. Project & Tasks Module Endpoints
app.get('/api/projects', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  return res.json(db.projects.filter(p => p.tenantId === tenantId));
});

app.post('/api/projects', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { name, description, startDate, endDate, budget } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!name || !startDate || !endDate || !budget) {
    return res.status(400).json({ error: 'Fill in name, starting date, target bounds, and strategic budget.' });
  }

  const db = readDb();
  const newProj: Project = {
    id: `proj-${Date.now()}`,
    tenantId,
    name,
    description: description || '',
    startDate,
    endDate,
    budget: Number(budget),
    spent: 0,
    status: 'planning'
  };

  db.projects.push(newProj);
  writeDb();
  return res.json(newProj);
});

app.get('/api/tasks', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  return res.json(db.tasks.filter(t => t.tenantId === tenantId));
});

app.post('/api/tasks', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { projectId, name, description, assigneeId, startDate, endDate, progress, status, dependencies } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });
  if (!projectId || !name || !assigneeId) {
    return res.status(400).json({ error: 'Fill in project ID, task name, and developer assignee.' });
  }

  const db = readDb();
  const newTask: Task = {
    id: `tsk-${Date.now()}`,
    tenantId,
    projectId,
    name,
    description: description || '',
    assigneeId,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: Number(progress || 0),
    status: status || 'todo',
    dependencies: dependencies || []
  };

  db.tasks.push(newTask);
  writeDb();
  return res.json(newTask);
});

app.put('/api/tasks/:id', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const { progress, status, name, description, assigneeId, endDate } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  const db = readDb();
  const task = db.tasks.find(t => t.id === id && t.tenantId === tenantId);
  if (!task) return res.status(404).json({ error: 'Roadmap task not resolved.' });

  if (progress !== undefined) task.progress = Math.min(100, Math.max(0, Number(progress)));
  if (status !== undefined) {
    task.status = status;
    if (status === 'done') task.progress = 100;
  }
  if (name) task.name = name;
  if (description) task.description = description;
  if (assigneeId) task.assigneeId = assigneeId;
  if (endDate) task.endDate = endDate;

  writeDb();
  return res.json(task);
});


// 8. simulated AI Insights Endpoints
app.get('/api/ai/insights', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Tenant context expected.' });

  try {
    const rawInsights = generateAllInsights(tenantId);
    return res.json(rawInsights);
  } catch (err) {
    console.error('[AI Router Error] Failed analyzing algorithms:', err);
    return res.status(500).json({ error: 'Failed computing analytical forecasts.' });
  }
});


// 9. Notifications Endpoints
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const role = req.user.role;

  const db = readDb();
  
  // Filter alerts matching tenant (and user-specific or global tenant-level notifications)
  let list = db.notifications;
  if (role !== 'super_admin') {
    list = list.filter(n => n.tenantId === tenantId && (n.userId === null || n.userId === userId));
  }

  return res.json(list);
});

app.post('/api/notifications/read-all', authenticateToken, (req: any, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const db = readDb();

  db.notifications.forEach(n => {
    if (n.tenantId === tenantId && (n.userId === null || n.userId === userId)) {
      n.isRead = true;
    }
  });

  writeDb();
  return res.json({ success: true });
});


// Serve Front-End SPA Assets (Integrated Express + Vite Pipeline)
async function startFullStack() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[System] Development Environment Detected. Mounting hot Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[System] Production Environment Detected. Binding static distribution folders...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Pre-evaluate database setup
  readDb();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Amdox Nexus] Full stack server successfully live on: http://0.0.0.0:${PORT}`);
  });
}

startFullStack().catch(err => {
  console.error('[System Startup Failed] ', err);
});
