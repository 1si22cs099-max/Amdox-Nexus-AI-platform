import fs from 'fs';
import path from 'path';
import { 
  Tenant, User, LedgerEntry, Invoice, EmployeeProfile, 
  InventoryItem, Vendor, PurchaseOrder, Project, Task, AppNotification, AiInsight 
} from '../src/types';

const DB_PATH = path.join(process.cwd(), 'server', 'db.json');

// Memory cache of DB
let dbCache: {
  tenants: Tenant[];
  users: Array<User & { passwordHash: string }>;
  ledger: LedgerEntry[];
  invoices: Invoice[];
  employees: EmployeeProfile[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  projects: Project[];
  tasks: Task[];
  notifications: AppNotification[];
} = {
  tenants: [],
  users: [],
  ledger: [],
  invoices: [],
  employees: [],
  inventory: [],
  vendors: [],
  purchaseOrders: [],
  projects: [],
  tasks: [],
  notifications: []
};

// Ensure server directory exists
function ensureDirectory() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read database from file
export function readDb() {
  ensureDirectory();
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      dbCache = JSON.parse(content);
    } else {
      seedInitialData();
      writeDb();
    }
  } catch (error) {
    console.error('Error reading db.json, using state in-memory:', error);
    if (dbCache.tenants.length === 0) {
      seedInitialData();
    }
  }
  return dbCache;
}

// Write database to file
export function writeDb() {
  ensureDirectory();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
  }
}

// Simple deterministic hash for demo passwords
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'hashed_' + Math.abs(hash).toString(16);
}

// Seed mock database with enterprise data
function seedInitialData() {
  console.log('--- SEEDING DATABASE ---');

  // 1. Tenants (Organizations)
  const tenant1: Tenant = {
    id: 'tenant-amdox',
    name: 'Amdox Corp',
    industry: 'High-Tech Manufacturing',
    domain: 'amdox.com',
    status: 'active',
    createdAt: '2025-01-10T08:00:00Z'
  };

  const tenant2: Tenant = {
    id: 'tenant-nexus',
    name: 'Nexus Logistics & Supply',
    industry: 'Logistics and Distribution',
    domain: 'nexuslogistics.com',
    status: 'active',
    createdAt: '2025-03-15T09:30:00Z'
  };

  dbCache.tenants = [tenant1, tenant2];

  // 2. Users (all standard passwords set to 'nexus123')
  const defaultPassHash = hashPassword('nexus123');

  dbCache.users = [
    // Super admin (no tenant restrictions)
    {
      id: 'usr-super',
      tenantId: null,
      name: 'Eleanor Vance',
      email: 'superadmin@nexus.com',
      passwordHash: defaultPassHash,
      role: 'super_admin',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z'
    },
    // Amdox Corp users
    {
      id: 'usr-amdox-admin',
      tenantId: 'tenant-amdox',
      name: 'James Amdox',
      email: 'admin@amdox.com',
      passwordHash: defaultPassHash,
      role: 'tenant_admin',
      department: 'Executive Office',
      designation: 'CEO / Managing Director',
      status: 'active',
      createdAt: '2025-01-11T10:00:00Z'
    },
    {
      id: 'usr-amdox-finance',
      tenantId: 'tenant-amdox',
      name: 'Sarah Jenkins',
      email: 'finance@amdox.com',
      passwordHash: defaultPassHash,
      role: 'finance_manager',
      department: 'Finance & Treasury',
      designation: 'VP of Finance',
      status: 'active',
      salary: 11500,
      createdAt: '2025-01-12T11:00:00Z'
    },
    {
      id: 'usr-amdox-hr',
      tenantId: 'tenant-amdox',
      name: 'Marcus Brody',
      email: 'hr@amdox.com',
      passwordHash: defaultPassHash,
      role: 'hr_manager',
      department: 'People Operations',
      designation: 'HR Lead',
      status: 'active',
      salary: 8000,
      createdAt: '2025-01-12T12:00:00Z'
    },
    {
      id: 'usr-amdox-supply',
      tenantId: 'tenant-amdox',
      name: 'Vikram Singh',
      email: 'supply@amdox.com',
      passwordHash: defaultPassHash,
      role: 'supply_chain_manager',
      department: 'Supply Chain & Inventory',
      designation: 'Inventory Logistics Chief',
      status: 'active',
      salary: 8500,
      createdAt: '2025-01-15T09:00:00Z'
    },
    {
      id: 'usr-amdox-project',
      tenantId: 'tenant-amdox',
      name: 'Clara Oswald',
      email: 'projects@amdox.com',
      passwordHash: defaultPassHash,
      role: 'project_manager',
      department: 'Product Delivery',
      designation: 'Senior Project Delivery Manager',
      status: 'active',
      salary: 9000,
      createdAt: '2025-01-15T14:00:00Z'
    },
    {
      id: 'usr-amdox-employee',
      tenantId: 'tenant-amdox',
      name: 'John Doe',
      email: 'employee@amdox.com',
      passwordHash: defaultPassHash,
      role: 'employee',
      department: 'Product Delivery',
      designation: 'Senior Frontend Engineer',
      status: 'active',
      salary: 6200,
      createdAt: '2025-01-18T10:00:00Z'
    },
    {
      id: 'usr-amdox-emp2',
      tenantId: 'tenant-amdox',
      name: 'Janet Foster',
      email: 'janet@amdox.com',
      passwordHash: defaultPassHash,
      role: 'employee',
      department: 'Finance & Treasury',
      designation: 'Financial Analyst',
      status: 'active',
      salary: 5800,
      createdAt: '2025-02-01T09:00:00Z'
    }
  ];

  // 3. Ledger (Finance - History of debits and credits for last 5 months)
  const currentYear = new Date().getFullYear();
  dbCache.ledger = [
    // Month -4 (Jan 2026/latest)
    { id: 'ldgr-1', tenantId: 'tenant-amdox', date: `${currentYear}-01-15`, account: 'Revenue', type: 'credit', amount: 45000, description: 'Software consulting contract payout', reference: 'INV-1001' },
    { id: 'ldgr-2', tenantId: 'tenant-amdox', date: `${currentYear}-01-25`, account: 'Salaries', type: 'debit', amount: 15400, description: 'Payroll Jan 2026', reference: 'PAY-JAN' },
    { id: 'ldgr-3', tenantId: 'tenant-amdox', date: `${currentYear}-01-28`, account: 'Rent', type: 'debit', amount: 3500, description: 'Office rental space', reference: 'RENT-JAN' },
    // Month -3 (Feb 2026)
    { id: 'ldgr-4', tenantId: 'tenant-amdox', date: `${currentYear}-02-15`, account: 'Revenue', type: 'credit', amount: 48500, description: 'Enterprise platform delivery', reference: 'INV-1002' },
    { id: 'ldgr-5', tenantId: 'tenant-amdox', date: `${currentYear}-02-25`, account: 'Salaries', type: 'debit', amount: 15400, description: 'Payroll Feb 2026', reference: 'PAY-FEB' },
    { id: 'ldgr-6', tenantId: 'tenant-amdox', date: `${currentYear}-02-27`, account: 'Materials', type: 'debit', amount: 5600, description: 'Electronic parts vendor restock', reference: 'PO-2001' },
    // Month -2 (Mar 2026)
    { id: 'ldgr-7', tenantId: 'tenant-amdox', date: `${currentYear}-03-12`, account: 'Revenue', type: 'credit', amount: 59000, description: 'Quarterly hardware component shipment', reference: 'INV-1003' },
    { id: 'ldgr-8', tenantId: 'tenant-amdox', date: `${currentYear}-03-25`, account: 'Salaries', type: 'debit', amount: 15400, description: 'Payroll Mar 2026', reference: 'PAY-MAR' },
    { id: 'ldgr-9', tenantId: 'tenant-amdox', date: `${currentYear}-03-28`, account: 'Marketing', type: 'debit', amount: 4800, description: 'Q1 Digital Campaigns', reference: 'MKT-01' },
    // Month -1 (Apr 2026)
    { id: 'ldgr-10', tenantId: 'tenant-amdox', date: `${currentYear}-04-10`, account: 'Revenue', type: 'credit', amount: 62000, description: 'Cloud Nexus integration completion', reference: 'INV-1004' },
    { id: 'ldgr-11', tenantId: 'tenant-amdox', date: `${currentYear}-04-25`, account: 'Salaries', type: 'debit', amount: 21200, description: 'Payroll Apr 2026 (including Clara onboarding)', reference: 'PAY-APR' },
    { id: 'ldgr-12', tenantId: 'tenant-amdox', date: `${currentYear}-04-29`, account: 'Rent', type: 'debit', amount: 3500, description: 'Office rental space', reference: 'RENT-APR' },
    // Month 0 (May 2026)
    { id: 'ldgr-13', tenantId: 'tenant-amdox', date: `${currentYear}-05-08`, account: 'Revenue', type: 'credit', amount: 71000, description: 'Advanced chipsets bulk order delivery', reference: 'INV-1005' },
    { id: 'ldgr-14', tenantId: 'tenant-amdox', date: `${currentYear}-05-25`, account: 'Salaries', type: 'debit', amount: 21200, description: 'Payroll May 2026', reference: 'PAY-MAY' },
    { id: 'ldgr-15', tenantId: 'tenant-amdox', date: `${currentYear}-05-27`, account: 'Materials', type: 'debit', amount: 12500, description: 'Supply reorders (Microcontrollers)', reference: 'PO-2002' }
  ];

  // 4. Invoices
  dbCache.invoices = [
    {
      id: 'inv-1',
      tenantId: 'tenant-amdox',
      invoiceNumber: 'INV-1004',
      clientName: 'Zenith Labs Inc',
      clientEmail: 'contact@zenithlabs.com',
      issueDate: `${currentYear}-04-10`,
      dueDate: `${currentYear}-05-10`,
      items: [
        { description: 'Cloud Integration Module', qty: 1, rate: 45000, amount: 45000 },
        { description: 'Custom Dashboard Development', qty: 1, rate: 17000, amount: 17000 }
      ],
      taxRate: 10,
      discount: 2000,
      total: 60000,
      status: 'paid',
      paidAmount: 60000,
      payments: [{ date: `${currentYear}-04-15`, amount: 60000, method: 'bank_transfer' }]
    },
    {
      id: 'inv-2',
      tenantId: 'tenant-amdox',
      invoiceNumber: 'INV-1005',
      clientName: 'Hyperion Aerospace',
      clientEmail: 'procurement@hyperion.com',
      issueDate: `${currentYear}-05-08`,
      dueDate: `${currentYear}-06-08`,
      items: [
        { description: 'AX-90 Microprocessor Chipsets', qty: 50, rate: 1200, amount: 60000 },
        { description: 'Testing & Integrity Verification', qty: 1, rate: 11000, amount: 11000 }
      ],
      taxRate: 10,
      discount: 0,
      total: 78100, // 71000 + 7100
      status: 'unpaid',
      paidAmount: 0,
      payments: []
    },
    {
      id: 'inv-3',
      tenantId: 'tenant-amdox',
      invoiceNumber: 'INV-1006',
      clientName: 'Novis Telecom',
      clientEmail: 'billing@novis.net',
      issueDate: `${currentYear}-05-20`,
      dueDate: `${currentYear}-06-20`,
      items: [
        { description: 'Amdox Network Switch Module v4', qty: 2, rate: 15400, amount: 30800 }
      ],
      taxRate: 10,
      discount: 800,
      total: 33000,
      status: 'unpaid',
      paidAmount: 0,
      payments: []
    }
  ];

  // 5. Employees and Attendance/Payroll
  dbCache.employees = [
    {
      id: 'emp-john',
      tenantId: 'tenant-amdox',
      userId: 'usr-amdox-employee',
      department: 'Product Delivery',
      joinedDate: '2025-01-18',
      status: 'active',
      attendance: [
        { date: `${currentYear}-05-18`, status: 'present', checkIn: '08:55', checkOut: '17:05' },
        { date: `${currentYear}-05-19`, status: 'present', checkIn: '09:02', checkOut: '17:15' },
        { date: `${currentYear}-05-20`, status: 'late', checkIn: '09:42', checkOut: '17:00' },
        { date: `${currentYear}-05-21`, status: 'present', checkIn: '08:45', checkOut: '17:30' },
        { date: `${currentYear}-05-22`, status: 'present', checkIn: '08:50', checkOut: '17:00' },
        { date: `${currentYear}-05-25`, status: 'present', checkIn: '09:01', checkOut: '17:05' },
        { date: `${currentYear}-05-26`, status: 'absent' },
        { date: `${currentYear}-05-27`, status: 'present', checkIn: '08:58', checkOut: '17:02' },
        { date: `${currentYear}-05-28`, status: 'leave' },
        { date: `${currentYear}-05-29`, status: 'present', checkIn: '09:05', checkOut: '17:00' }
      ],
      payrollHistory: [
        { id: 'pay-john-1', month: 'March', year: currentYear, baseSalary: 6200, bonuses: 500, deductions: 200, netSalary: 6500, status: 'paid', processedDate: `${currentYear}-03-25` },
        { id: 'pay-john-2', month: 'April', year: currentYear, baseSalary: 6200, bonuses: 0, deductions: 150, netSalary: 6050, status: 'paid', processedDate: `${currentYear}-04-25` },
        { id: 'pay-john-3', month: 'May', year: currentYear, baseSalary: 6200, bonuses: 200, deductions: 100, netSalary: 6300, status: 'paid', processedDate: `${currentYear}-05-25` }
      ]
    },
    {
      id: 'emp-janet',
      tenantId: 'tenant-amdox',
      userId: 'usr-amdox-emp2',
      department: 'Finance & Treasury',
      joinedDate: '2025-02-01',
      status: 'active',
      attendance: [
        { date: `${currentYear}-05-18`, status: 'present', checkIn: '08:45', checkOut: '17:15' },
        { date: `${currentYear}-05-19`, status: 'present', checkIn: '08:50', checkOut: '17:05' },
        { date: `${currentYear}-05-20`, status: 'present', checkIn: '08:48', checkOut: '17:10' },
        { date: `${currentYear}-05-21`, status: 'present', checkIn: '08:40', checkOut: '17:00' },
        { date: `${currentYear}-05-22`, status: 'present', checkIn: '08:55', checkOut: '17:00' },
        { date: `${currentYear}-05-25`, status: 'present', checkIn: '08:42', checkOut: '17:25' },
        { date: `${currentYear}-05-26`, status: 'present', checkIn: '08:45', checkOut: '17:10' },
        { date: `${currentYear}-05-27`, status: 'present', checkIn: '08:50', checkOut: '17:15' },
        { date: `${currentYear}-05-28`, status: 'present', checkIn: '08:44', checkOut: '17:00' },
        { date: `${currentYear}-05-29`, status: 'present', checkIn: '08:40', checkOut: '17:10' }
      ],
      payrollHistory: [
        { id: 'pay-janet-1', month: 'March', year: currentYear, baseSalary: 5800, bonuses: 300, deductions: 120, netSalary: 5980, status: 'paid', processedDate: `${currentYear}-03-25` },
        { id: 'pay-janet-2', month: 'April', year: currentYear, baseSalary: 5800, bonuses: 300, deductions: 120, netSalary: 5980, status: 'paid', processedDate: `${currentYear}-04-25` },
        { id: 'pay-janet-3', month: 'May', year: currentYear, baseSalary: 5800, bonuses: 400, deductions: 100, netSalary: 6100, status: 'paid', processedDate: `${currentYear}-05-25` }
      ]
    }
  ];

  // 6. Vendors
  dbCache.vendors = [
    {
      id: 'vnd-1',
      tenantId: 'tenant-amdox',
      name: 'Apex Chips Manufacturing Ltd',
      contactEmail: 'orders@apexchips.com',
      contactPhone: '+1-555-0129',
      address: 'Industrial Zone Silicon Block 12, CA',
      status: 'active'
    },
    {
      id: 'vnd-2',
      tenantId: 'tenant-amdox',
      name: 'Global Electronic Sourcing',
      contactEmail: 'sales@globalelectronics.com',
      contactPhone: '+1-555-4089',
      address: 'Route de Geneve 45, Lausanne, Switzerland',
      status: 'active'
    }
  ];

  // 7. Inventory (Supply Chain)
  dbCache.inventory = [
    {
      id: 'inv-item-1',
      tenantId: 'tenant-amdox',
      sku: 'SKU-NEX-CH-90',
      name: 'AX-90 Microprocessing Unit',
      description: 'Advanced multi-core compute microprocessor for enterprise operations',
      category: 'Semiconductors',
      unit: 'pcs',
      quantityInStock: 145, // Healthy stock
      minThreshold: 50,
      costPrice: 850,
      sellingPrice: 1200,
      vendorId: 'vnd-1'
    },
    {
      id: 'inv-item-2',
      tenantId: 'tenant-amdox',
      sku: 'SKU-NEX-SW-40',
      name: 'S-40 Base Network Transceiver',
      description: 'Optic network switch board supporting v4 standard routing protocols',
      category: 'Electronics',
      unit: 'pcs',
      quantityInStock: 22, // Low stock, triggers Warning Insight!
      minThreshold: 35,
      costPrice: 9500,
      sellingPrice: 15400,
      vendorId: 'vnd-2'
    },
    {
      id: 'inv-item-3',
      tenantId: 'tenant-amdox',
      sku: 'SKU-NEX-CAP-10',
      name: 'Solid Aluminum Capacitor Modules',
      description: 'High durability electronic solid capacitor arrays',
      category: 'Passive Components',
      unit: 'box',
      quantityInStock: 80,
      minThreshold: 40,
      costPrice: 120,
      sellingPrice: 195,
      vendorId: 'vnd-2'
    }
  ];

  // 8. Purchase Orders (PO)
  dbCache.purchaseOrders = [
    {
      id: 'po-1',
      tenantId: 'tenant-amdox',
      poNumber: 'PO-2001',
      vendorId: 'vnd-1',
      orderDate: `${currentYear}-02-10`,
      expectedDate: `${currentYear}-02-28`,
      items: [
        { itemSku: 'SKU-NEX-CH-90', qty: 25, unitPrice: 850, total: 21250 }
      ],
      status: 'completed',
      totalAmount: 21250
    },
    {
      id: 'po-2',
      tenantId: 'tenant-amdox',
      poNumber: 'PO-2002',
      vendorId: 'vnd-2',
      orderDate: `${currentYear}-05-15`,
      expectedDate: `${currentYear}-06-05`,
      items: [
        { itemSku: 'SKU-NEX-SW-40', qty: 15, unitPrice: 9500, total: 142500 }
      ],
      status: 'pending', // Pending order being shipped in June
      totalAmount: 142500
    }
  ];

  // 9. Projects
  dbCache.projects = [
    {
      id: 'proj-1',
      tenantId: 'tenant-amdox',
      name: 'Amdox Nexus ERP Phase 1',
      description: 'Bootstrap the central web portal, configure multi-tenant backend architecture and user dashboards.',
      startDate: `${currentYear}-01-15`,
      endDate: `${currentYear}-06-30`,
      budget: 85000,
      spent: 64500,
      status: 'ongoing'
    },
    {
      id: 'proj-2',
      tenantId: 'tenant-amdox',
      name: 'Hyperion AX-90 Qualification Trials',
      description: 'Execute thermal load stress tests and aerospace conformance certification trials on AX-90 compute modules.',
      startDate: `${currentYear}-05-01`,
      endDate: `${currentYear}-08-15`,
      budget: 35000,
      spent: 8000,
      status: 'ongoing'
    }
  ];

  // 10. Tasks
  dbCache.tasks = [
    {
      id: 'tsk-1',
      tenantId: 'tenant-amdox',
      projectId: 'proj-1',
      name: 'Establish core multi-tenant security routers',
      description: 'Implement JWT validation filters on server side with custom cryptographic verification.',
      assigneeId: 'usr-amdox-employee',
      startDate: `${currentYear}-01-20`,
      endDate: `${currentYear}-02-10`,
      progress: 100,
      status: 'done',
      dependencies: []
    },
    {
      id: 'tsk-2',
      tenantId: 'tenant-amdox',
      projectId: 'proj-1',
      name: 'Dynamic ledger charting and invoice tracking',
      description: 'Create the primary analytical ledger system and automated invoice PDF/Receipt generation routines.',
      assigneeId: 'usr-amdox-finance',
      startDate: `${currentYear}-02-15`,
      endDate: `${currentYear}-04-05`,
      progress: 100,
      status: 'done',
      dependencies: ['tsk-1']
    },
    {
      id: 'tsk-3',
      tenantId: 'tenant-amdox',
      projectId: 'proj-1',
      name: 'Predictive mathematical trend engine',
      description: 'Integrate linear regressions and analytical moving average pipelines to supply chain data.',
      assigneeId: 'usr-amdox-employee',
      startDate: `${currentYear}-04-10`,
      endDate: `${currentYear}-05-25`,
      progress: 85,
      status: 'in_progress',
      dependencies: ['tsk-2']
    },
    {
      id: 'tsk-4',
      tenantId: 'tenant-amdox',
      projectId: 'proj-1',
      name: 'Client deployment rehearsals and UAT approvals',
      description: 'Setup integration sandbox and request corporate customer signoff of user permission trees.',
      assigneeId: 'usr-amdox-admin',
      startDate: `${currentYear}-06-01`,
      endDate: `${currentYear}-06-25`,
      progress: 15,
      status: 'todo',
      dependencies: ['tsk-3']
    },
    // Project 2 tasks
    {
      id: 'tsk-5',
      tenantId: 'tenant-amdox',
      projectId: 'proj-2',
      name: 'Thermal load profiling inside vacuum chambers',
      description: 'Install probe triggers and map AX-90 power consumption curves under continuous 80C stress state.',
      assigneeId: 'usr-amdox-employee',
      startDate: `${currentYear}-05-02`,
      endDate: `${currentYear}-05-20`,
      progress: 100,
      status: 'done',
      dependencies: []
    },
    {
      id: 'tsk-6',
      tenantId: 'tenant-amdox',
      projectId: 'proj-2',
      name: 'Aerospace conformance declaration drafting',
      description: 'Assemble complete diagnostic trace files and draft standard compliance logs for submission.',
      assigneeId: 'usr-amdox-project',
      startDate: `${currentYear}-05-22`,
      endDate: `${currentYear}-07-10`,
      progress: 30,
      status: 'in_progress',
      dependencies: ['tsk-5']
    }
  ];

  // 11. Initial Notifications
  dbCache.notifications = [
    {
      id: 'notif-1',
      tenantId: 'tenant-amdox',
      userId: null,
      message: 'System upgrade completed. All analytical models refreshed for Q2.',
      type: 'success',
      isRead: false,
      createdAt: `${currentYear}-05-01T09:00:00Z`
    },
    {
      id: 'notif-2',
      tenantId: 'tenant-amdox',
      userId: 'usr-amdox-supply',
      message: 'Stock Alert: S-40 Base Network Transceiver quantity (22) has dropped below threshold safety margin (35).',
      type: 'warning',
      isRead: false,
      createdAt: `${currentYear}-05-28T14:15:00Z`
    },
    {
      id: 'notif-3',
      tenantId: 'tenant-amdox',
      userId: 'usr-amdox-finance',
      message: 'New Invoice Issued: INV-1006 sent to Novis Telecom for $33,000.00.',
      type: 'info',
      isRead: true,
      createdAt: `${currentYear}-05-20T11:00:00Z`
    }
  ];

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}
