/**
 * Amdox Nexus AI Platform - Enterprise Shared Types
 * Used by both React Frontend and Express backend.
 */

export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'finance_manager'
  | 'hr_manager'
  | 'supply_chain_manager'
  | 'project_manager'
  | 'employee';

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  domain: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string | null; // null for Super Admin
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  joinedDate?: string;
  status: 'active' | 'inactive';
  salary?: number;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  date: string;
  account: string; // e.g., 'Revenue', 'Salaries', 'Rent', 'Cost of Goods Sold', 'Marketing'
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoicePayment {
  date: string;
  amount: number;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'check';
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate: number; // e.g., 10 for 10%
  discount: number; // absolute amount
  total: number;
  status: 'unpaid' | 'paid' | 'overdue';
  paidAmount: number;
  payments: InvoicePayment[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'leave' | 'late';
  checkIn?: string;
  checkOut?: string;
}

export interface PayrollRecord {
  id: string;
  month: string; // e.g., "May"
  year: number; // e.g., 2026
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  processedDate?: string;
}

export interface EmployeeProfile {
  id: string;
  tenantId: string;
  userId: string;
  department: string;
  joinedDate: string;
  status: 'active' | 'suspended' | 'resigned';
  attendance: AttendanceRecord[];
  payrollHistory: PayrollRecord[];
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  quantityInStock: number;
  minThreshold: number;
  costPrice: number;
  sellingPrice: number;
  vendorId: string;
  lastReorderedAt?: string;
}

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'active' | 'inactive';
}

export interface PurchaseOrderItem {
  itemSku: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  vendorId: string;
  orderDate: string;
  expectedDate: string;
  items: PurchaseOrderItem[];
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planning' | 'ongoing' | 'completed' | 'on_hold';
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description: string;
  assigneeId: string;
  startDate: string;
  endDate: string;
  progress: number; // 0 to 100
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dependencies: string[]; // item IDs
}

export interface AppNotification {
  id: string;
  tenantId: string | null;
  userId: string | null; // null for tenant-wide, or all
  message: string;
  type: 'info' | 'warning' | 'success';
  isRead: boolean;
  createdAt: string;
}

export interface AiInsight {
  id: string;
  type: 'forecast' | 'financial' | 'employee' | 'anomaly' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  summary: string;
  details: string;
  metricLabel?: string;
  metricValue?: string;
  chartData?: any[];
  timestamp: string;
}
