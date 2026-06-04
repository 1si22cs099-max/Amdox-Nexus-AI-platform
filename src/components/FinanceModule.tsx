import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LedgerEntry, Invoice } from '../types';
import { 
  DollarSign, FileText, Plus, Landmark, Send, 
  CreditCard, Tag, RefreshCw, ChevronRight, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function FinanceModule() {
  const { apiFetch, user } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ledger Form state
  const [newLedger, setNewLedger] = useState({
    account: 'Revenue',
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    description: '',
    reference: ''
  });

  // Invoice creator state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    clientEmail: '',
    discount: '0',
    taxRate: '10',
    items: [{ description: '', qty: 1, rate: 100 }]
  });

  // Invoice payment state
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cash' | 'check'>('bank_transfer');

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [ledgerData, invoiceData] = await Promise.all([
        apiFetch('/api/finance/ledger'),
        apiFetch('/api/finance/invoices')
      ]);
      setLedger(ledgerData);
      setInvoices(invoiceData);
    } catch (err) {
      console.error('Failed loading finance statements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleCreateLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedger.amount || Number(newLedger.amount) <= 0) {
      alert('Provide a valid numeric transaction amount.');
      return;
    }
    try {
      await apiFetch('/api/finance/ledger', {
        method: 'POST',
        body: JSON.stringify(newLedger)
      });
      setNewLedger({ account: 'Revenue', type: 'credit', amount: '', description: '', reference: '' });
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Ledger write failed');
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', qty: 1, rate: 0 }]
    });
  };

  const handleRemoveInvoiceItem = (idx: number) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== idx)
    });
  };

  const handleInvoiceItemChange = (idx: number, field: string, val: string) => {
    const updatedItems = [...invoiceForm.items];
    (updatedItems[idx] as any)[field] = field === 'description' ? val : Number(val);
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientName || !invoiceForm.clientEmail || invoiceForm.items.some(i => !i.description)) {
      alert('Provide client credentials and billing item specifications.');
      return;
    }
    try {
      await apiFetch('/api/finance/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceForm)
      });
      setInvoiceForm({
        clientName: '',
        clientEmail: '',
        discount: '0',
        taxRate: '10',
        items: [{ description: '', qty: 1, rate: 100 }]
      });
      setShowInvoiceForm(false);
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Invoice creation failed.');
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !paymentAmount || Number(paymentAmount) <= 0) return;
    try {
      await apiFetch(`/api/finance/invoices/${payingInvoice.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod
        })
      });
      setPayingInvoice(null);
      setPaymentAmount('');
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Payment processing error');
    }
  };

  // Pricing computations
  const totalRevenue = ledger
    .filter(item => item.type === 'credit')
    .reduce((sum, current) => sum + current.amount, 0);

  const totalExpenses = ledger
    .filter(item => item.type === 'debit')
    .reduce((sum, current) => sum + current.amount, 0);

  const netOperatingIncome = totalRevenue - totalExpenses;
  const operatingProfitMargin = totalRevenue > 0 ? (netOperatingIncome / totalRevenue) * 100 : 0;

  const totalOutstandingAR = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, current) => sum + (current.total - current.paidAmount), 0);

  // Filter permission check
  const isFinanceTeam = ['super_admin', 'tenant_admin', 'finance_manager'].includes(user?.role || '');

  if (!isFinanceTeam) {
    return (
      <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 my-8">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto stroke-[1.5]" />
        <h3 className="text-base font-semibold text-red-950 font-sans">Corporate Authorization Restrict</h3>
        <p className="text-sm text-red-800 leading-relaxed font-sans">
          Your profile account is restricted to roles of **Tenant Admin** or **Finance Manager** for analytical ledger audits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-600" />
            General Ledger & Accounts Receivable
          </h2>
          <p className="text-sm text-gray-500 mt-1">Double-entry accounting, invoice creations, and automated collections tracking.</p>
        </div>
        <button
          onClick={loadFinanceData}
          className="flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-mono tracking-tight"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Records
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Gross Operating Income</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-emerald-600 font-sans tracking-tight">${totalRevenue.toLocaleString()}</span>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">REVENUE</span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Operating Expenses</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-rose-600 font-sans tracking-tight">${totalExpenses.toLocaleString()}</span>
                <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">DEBITS</span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Net Operating Profit</span>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-semibold tracking-tight ${netOperatingIncome >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                  ${netOperatingIncome.toLocaleString()}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${netOperatingIncome >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
                  {operatingProfitMargin.toFixed(1)}% MARGIN
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Active Accounts Receivable (AR)</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-amber-600 font-sans tracking-tight">${totalOutstandingAR.toLocaleString()}</span>
                <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">OUTSTANDING</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Box: Invoicing & Payments Pipeline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 font-sans">Billing & Invoices System</h3>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">Dispatched enterprise customer invoicing templates.</p>
                  </div>
                  <button
                    onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-indigo-900 hover:bg-indigo-800 transition rounded-lg font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> {showInvoiceForm ? 'Cancel Invoice' : 'Issue Invoice'}
                  </button>
                </div>

                {/* Form to Create Invoice */}
                {showInvoiceForm && (
                  <form onSubmit={handleCreateInvoice} className="bg-dashed bg-gray-50/50 p-5 rounded-2xl border border-gray-200 mt-4 space-y-4 animate-fade-in">
                    <h4 className="text-xs font-mono font-bold text-indigo-900 uppercase tracking-wide">Generate Corporate Statement</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 font-mono">Client Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Corp"
                          className="w-full text-sm p-2 rounded-lg mt-1 border border-gray-200 bg-white"
                          value={invoiceForm.clientName}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 font-mono">Client Billing Email</label>
                        <input
                          type="email"
                          required
                          placeholder="billing@acme.com"
                          className="w-full text-sm p-2 rounded-lg mt-1 border border-gray-200 bg-white"
                          value={invoiceForm.clientEmail}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Invoice Items Spec list */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-bold font-mono text-gray-500 uppercase">Deliverables Spec Matrix</span>
                        <button
                          type="button"
                          onClick={handleAddInvoiceItem}
                          className="text-xs font-mono text-indigo-600 hover:underline"
                        >
                          + Add Deliverable
                        </button>
                      </div>
                      
                      {invoiceForm.items.map((it, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            required
                            placeholder="Deliverable description"
                            className="flex-grow text-xs p-2 rounded-lg border border-gray-200 bg-white"
                            value={it.description}
                            onChange={(e) => handleInvoiceItemChange(idx, 'description', e.target.value)}
                          />
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            className="w-14 text-xs p-2 rounded-lg border border-gray-200 bg-white text-center"
                            value={it.qty}
                            onChange={(e) => handleInvoiceItemChange(idx, 'qty', e.target.value)}
                          />
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Rate"
                            className="w-20 text-xs p-2 rounded-lg border border-gray-200 bg-white text-right"
                            value={it.rate}
                            onChange={(e) => handleInvoiceItemChange(idx, 'rate', e.target.value)}
                          />
                          {invoiceForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceItem(idx)}
                              className="text-xs text-rose-500 hover:underline px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <label className="text-xs font-medium text-gray-600 font-mono">Discounts applied ($)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full text-xs p-2 rounded-lg mt-1 border border-gray-200 bg-white"
                          value={invoiceForm.discount}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 font-mono">Tax Assessment (%)</label>
                        <input
                          type="number"
                          placeholder="10"
                          className="w-full text-xs p-2 rounded-lg mt-1 border border-gray-200 bg-white"
                          value={invoiceForm.taxRate}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-2 text-xs bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg transition font-mono font-bold tracking-wider"
                    >
                      POST AND DISPATCH VIA NOTIFIER
                    </button>
                  </form>
                )}

                {/* Listing Invoices */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead>
                      <tr className="border-b uppercase font-mono text-gray-400">
                        <th className="py-2.5">Invoice #</th>
                        <th>Customer</th>
                        <th>Issued</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-mono font-semibold text-gray-900">{inv.invoiceNumber}</td>
                          <td>
                            <div className="font-medium text-gray-900">{inv.clientName}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{inv.clientEmail}</div>
                          </td>
                          <td className="font-mono text-[11px] text-gray-400">{inv.issueDate}</td>
                          <td className="font-medium text-gray-900">${inv.total.toLocaleString()}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-250'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                            {inv.paidAmount > 0 && inv.status !== 'paid' && (
                              <div className="text-[9px] text-gray-400 mt-1 font-mono">Paid: ${inv.paidAmount.toLocaleString()}</div>
                            )}
                          </td>
                          <td className="text-right py-3">
                            {inv.status !== 'paid' ? (
                              <button
                                onClick={() => {
                                  setPayingInvoice(inv);
                                  setPaymentAmount((inv.total - inv.paidAmount).toString());
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 font-sans border border-indigo-150 px-2 py-1 rounded hover:bg-indigo-100 transition"
                              >
                                <CreditCard className="h-3 w-3" /> Record Payment
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1 font-sans">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Fully Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Settle Invoice Modal/Modal form */}
              {payingInvoice && (
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 animate-fade-in shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-sans font-medium text-slate-100">Record Settlement: {payingInvoice.invoiceNumber}</h4>
                    <button onClick={() => setPayingInvoice(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <form onSubmit={handlePayInvoice} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-xs font-mono text-slate-400">Payment Amount ($)</label>
                      <input
                        type="number"
                        required
                        max={payingInvoice.total - payingInvoice.paidAmount}
                        className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-400">Settlement Method</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white"
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                      >
                        <option value="bank_transfer">ACH/Bank Wire</option>
                        <option value="credit_card">Corporate Credit Card</option>
                        <option value="cash">Petty Cash</option>
                        <option value="check">Check Voucher</option>
                      </select>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-medium"
                      >
                        Commit Settlement
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Box: Double-entry Ledger Ledger Audit */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <div className="border-b border-gray-50 pb-4">
                  <h3 className="text-base font-semibold text-gray-900 font-sans">Double-entry Ledger Audit</h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Append system credits and operating expenses.</p>
                </div>

                <form onSubmit={handleCreateLedger} className="space-y-3 bg-gray-50/60 p-4 border border-gray-100 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Ledger Account</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg mt-1 bg-white border border-gray-200"
                        value={newLedger.account}
                        onChange={(e) => setNewLedger({ ...newLedger, account: e.target.value })}
                      >
                        <option value="Revenue">Revenue (Client Payout)</option>
                        <option value="Salaries">People Salaries Expense</option>
                        <option value="Rent">Facilities & Rent</option>
                        <option value="Materials">Materials & Inventory Procurement</option>
                        <option value="Marketing">Marketing campaigns</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Tx Type</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg mt-1 bg-white border border-gray-200 font-mono"
                        value={newLedger.type}
                        onChange={(e: any) => setNewLedger({ ...newLedger, type: e.target.value })}
                      >
                        <option value="credit">Credit / Inflow (+)</option>
                        <option value="debit">Debit / Outflow (-)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Invoiced Amount ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Amount"
                        className="w-full text-xs p-2 rounded-lg mt-1 bg-white border border-gray-200"
                        value={newLedger.amount}
                        onChange={(e) => setNewLedger({ ...newLedger, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Audit Reference ID</label>
                      <input
                        type="text"
                        placeholder="e.g. BILL-90"
                        className="w-full text-xs p-2 rounded-lg mt-1 bg-white border border-gray-200 font-mono"
                        value={newLedger.reference}
                        onChange={(e) => setNewLedger({ ...newLedger, reference: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Transaction memo/narrative statement"
                      className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                      value={newLedger.description}
                      onChange={(e) => setNewLedger({ ...newLedger, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 text-xs text-white bg-indigo-900 border border-indigo-950 hover:bg-slate-800 rounded-lg font-mono font-medium"
                  >
                    Commit ledger Entry
                  </button>
                </form>

                {/* Ledger stream history list */}
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {ledger.map(lg => (
                    <div 
                      key={lg.id}
                      className="flex justify-between items-start p-3 border border-gray-100 rounded-xl hover:bg-gray-50/50"
                    >
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-medium text-gray-900 text-xs">{lg.account}</span>
                          <span className={`text-[8px] px-1 rounded-sm uppercase tracking-tight font-mono ${
                            lg.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {lg.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-sans">{lg.description}</p>
                        <div className="text-[9px] text-gray-400 font-mono">Ref: {lg.reference} | Date: {lg.date}</div>
                      </div>
                      <div className={`font-mono text-xs font-semibold ${
                        lg.type === 'credit' ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {lg.type === 'credit' ? '+' : '-'}${lg.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
