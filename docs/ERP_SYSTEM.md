# Amdox Nexus AI Platform - System Manual & API Spec

This document details the multi-tenant architecture, database schema bounds, simulated artificial intelligence routines, and REST specifications for the **Amdox Nexus AI Platform**.

---

## 1. Relational Database Schema Mapping (`/server/db.json`)

The platform utilizes a persistent single-file database (`db.json`) with isolated multi-tenant records matching the following structure:

```typescript
interface DatabaseSchema {
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
}
```

* **Isolation Key**: For non-Super Admin workflows, every GET/POST controller filters records matching the verified `tenantId` extracted from the custom base64 secure JWT session header.

---

## 2. Simulated Local AI Decision Engines (`/server/aiEngine.ts`)

To remain completely fast, reliable, and self-contained, the application implements five high-density local algorithmic and statistical engines:

1. **Demand Forecasting (3-Month Moving Average)**:
   * **Formula**: $\hat{D}_{t} = \frac{1}{k} \sum_{i=1}^{k} D_{t-i}$ (Moving rolling window where $k = 4$ months).
   * Generates projected inventory demands for upcoming quarters to alert procurement managers prior to raw stock starvation.

2. **Financial Trend Estimator (Linear Regression)**:
   * **Formula**: $Y = mX + c$.
   * Maps monthly revenue ($credits$) and operational expenses ($debits$) over time. Fits a linear trend slope ($m$) using least-squares regressions to calculate net margins, cash reserves trend lines, and operating capital runrates.

3. **Asset & Performance Scoring (Weighted Key Indexes)**:
   * Compiles individual attendance scores ($PresentRate \times 30\%$) and active roadmap task deliverables ($CompletionRate \times 70\%$) to calculate an aggregate corporate efficiency index out of 100 for each logged-in employee.

4. **Statistical Anomaly Detection (Standard Deviation Filters)**:
   * **Formula**: Threshold $T = \mu + 1.8\sigma$ (Where $\mu$ is the mean and $\sigma$ is the standard deviation).
   * Automatically flags transaction costs or project milestone timeline delays that deviate past normal corporate constraints.

5. **Rule-Based Dynamic Recommendations**:
   * Evaluates active stock thresholds vs present warehouse tallies, sending automated reorder recommendations and ACH payment reminders for outstanding accounts receivable.

---

## 3. Operational REST Service Specifications

### Authentication Workspace
* `POST /api/auth/signup`: Provisions empty tenant directory, maps domain records, registers Tenant Administrator.
* `POST /api/auth/login`: Authenticates passphrase against custom deterministic hash, returns secure JWT token.
* `GET /api/auth/me`: Decodes JWT token and claims current user role clearance.
* `POST /api/auth/forgot-password`: Dispatches credentials recovery link to corporate mailbox via Resend.

### Accounts Ledger & Billing
* `GET /api/finance/ledger`: Returns chronologically nested credit/debit records.
* `POST /api/finance/ledger`: Commits credit/debit reference entry into books.
* `GET /api/finance/invoices`: Returns tenant client invoices.
* `POST /api/finance/invoices`: Dispatches sub-totaled invoice models, trigger Resend client billing mailer.
* `POST /api/finance/invoices/:id/pay`: Applies bank wire, cash, or credit card payment and automatically books a corresponding General Ledger credit.

### Human Resources Lifecycle
* `GET /api/hr/employees`: Renders corporate hierarchy profiles, payroll tallies, and monthly metrics.
* `POST /api/hr/attendance`: Updates daily presence indices.
* `POST /api/hr/payroll`: Disburses salary statements, triggers payslip email alerts, and debits operating cash books.

### Supply Chains & Procurement
* `GET /api/inventory`: Returns warehouse SKU counts.
* `POST /api/inventory`: Catalogues new semiconductor, board, or material assets.
* `GET /api/vendors`: Lists suppliers contact profiles.
* `POST /api/inventory/purchase-orders`: Commits replenishment purchase order and alerts vendors.
* `POST /api/inventory/purchase-orders/:id/approve`: Receives external supplies, increments warehouse registries, and enters materials debit ledgers.

---

## 4. Local Quick-Start Execution

```bash
# 1. Clean build directory
npm run clean

# 2. Transpile core typescript packages and bundle production server
npm run build

# 3. Boot local fullstack container and database files
npm run dev
```

Platform seed profiles bypass standard signup routines. Standard password for all shortcuts is: `nexus123`.
