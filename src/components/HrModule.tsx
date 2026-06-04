import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeProfile, User } from '../types';
import { 
  Users, Calendar, CreditCard, Clock, Award, 
  ChevronRight, Sparkles, Plus, CheckCircle, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function HrModule() {
  const { apiFetch, user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance recording state
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'leave' | 'late',
    checkIn: '09:00',
    checkOut: '17:00'
  });

  // Payroll processing state
  const [payrollForm, setPayrollForm] = useState({
    month: 'May',
    year: new Date().getFullYear().toString(),
    bonuses: '0',
    deductions: '0'
  });

  const loadHrData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/hr/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Failed loading HR profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHrData();
  }, []);

  const handlePostAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await apiFetch('/api/hr/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          ...attendanceForm
        })
      });
      alert(`Attendance saved successfully for ${selectedEmp.name}.`);
      setSelectedEmp(null);
      loadHrData();
    } catch (err: any) {
      alert(err.message || 'Failed saving attendance.');
    }
  };

  const handleProcessPayroll = async (empId: string, baseSal: number) => {
    if (!window.confirm('Do you want to process payroll payment for this employee? This creates legal receipts and registers a debit in the General Ledger.')) {
      return;
    }
    try {
      await apiFetch('/api/hr/payroll', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: empId,
          month: payrollForm.month,
          year: Number(payrollForm.year),
          baseSalary: baseSal,
          bonuses: Number(payrollForm.bonuses),
          deductions: Number(payrollForm.deductions)
        })
      });
      alert('Payroll disbursed. Notification email dispatched to employee.');
      loadHrData();
    } catch (err: any) {
      alert(err.message || 'Failed dispatching payroll.');
    }
  };

  const isHrPrivileged = ['super_admin', 'tenant_admin', 'hr_manager'].includes(user?.role || '');

  if (!isHrPrivileged) {
    return (
      <div className="bg-amber-50/50 border border-amber-150 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 my-8">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto stroke-[1.5]" />
        <h3 className="text-base font-semibold text-amber-950 font-sans">Role Credentials Check</h3>
        <p className="text-sm text-amber-800 leading-relaxed font-sans">
          Access is limited to **Tenant Admins** and **HR Managers** profiles to preserve sensitive staff compensation records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Human Resources Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Configure employee lifecycles, payroll runs, visual attendance records, and KPI parameters.</p>
        </div>
        <button
          onClick={loadHrData}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Team Roster
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Roster Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-gray-150/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-950 font-sans">Team Lifecycle Roster</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead>
                      <tr className="border-b uppercase font-mono text-gray-400">
                        <th className="py-2.5">Name</th>
                        <th>Department</th>
                        <th>Compensation</th>
                        <th>Status</th>
                        <th className="text-center">Payroll Dispatch</th>
                        <th className="text-right">Attendance Clock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/50">
                          <td className="py-3">
                            <div className="font-semibold text-gray-900">{emp.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{emp.designation || 'Engineer'} | {emp.email}</div>
                          </td>
                          <td className="font-medium text-gray-800">{emp.department}</td>
                          <td className="font-mono text-gray-900 font-medium">${(emp.salary || 0).toLocaleString()}/mo</td>
                          <td>
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-serif font-semibold">
                              {emp.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <button
                              onClick={() => handleProcessPayroll(emp.id, emp.salary || 4500)}
                              className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded hover:bg-indigo-100 transition"
                            >
                              Disburse Pay
                            </button>
                            <div className="text-[9px] text-gray-400 mt-1 font-mono">Month: {payrollForm.month}</div>
                          </td>
                          <td className="text-right py-3">
                            <button
                              onClick={() => {
                                setSelectedEmp(emp);
                                setAttendanceForm({
                                  date: new Date().toISOString().split('T')[0],
                                  status: 'present',
                                  checkIn: '09:00',
                                  checkOut: '17:00'
                                });
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-sans border text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded transition"
                            >
                              <Clock className="h-3 w-3 text-indigo-500" /> Log Attendance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Log Box overlay */}
              {selectedEmp && (
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-indigo-400 tracking-wide">Record Clocking: {selectedEmp.name}</h4>
                    <button onClick={() => setSelectedEmp(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <form onSubmit={handlePostAttendance} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-slate-400">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white font-mono"
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-slate-400">Status</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white"
                        value={attendanceForm.status}
                        onChange={(e: any) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                      >
                        <option value="present">Present (On Time)</option>
                        <option value="late">Late Arrival</option>
                        <option value="absent">Unexcused Absent</option>
                        <option value="leave">Approved Leave</option>
                      </select>
                    </div>
                    {attendanceForm.status !== 'absent' && attendanceForm.status !== 'leave' && (
                      <>
                        <div>
                          <label className="text-[10px] uppercase font-mono text-slate-400">In</label>
                          <input
                            type="text"
                            placeholder="09:00"
                            className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white font-mono"
                            value={attendanceForm.checkIn}
                            onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-mono text-slate-400">Out</label>
                          <input
                            type="text"
                            placeholder="17:00"
                            className="w-full text-xs p-2 rounded-lg mt-1 border border-slate-700 bg-slate-850 text-white font-mono"
                            value={attendanceForm.checkOut}
                            onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-4 mt-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition"
                      >
                        Save Attendance Record
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Box: Payroll Variables & Quick-KPI */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-150/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-950 font-sans border-b pb-3.5">Payroll Cycle Setup</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Process Month</label>
                    <select
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg mt-1 bg-white font-mono"
                      value={payrollForm.month}
                      onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    >
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Cycle Year</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg mt-1 bg-white font-mono"
                      value={payrollForm.year}
                      onChange={(e) => setPayrollForm({ ...payrollForm, year: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Bonus Add ($)</label>
                    <input
                      type="number"
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg mt-1 bg-white"
                      value={payrollForm.bonuses}
                      onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Deductions ($)</label>
                    <input
                      type="number"
                      className="w-full text-xs p-2 border border-gray-200 rounded-lg mt-1 bg-white"
                      value={payrollForm.deductions}
                      onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-sans italic leading-relaxed">
                  Adjusting these values instantly modifies final payout totals, email ledger stubs, and core financial debits for any "Disburse Pay" action clicked in the roster table.
                </p>
              </div>

              {/* Attendance Breakdown Audit */}
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-900 tracking-wider">Attendance Score Audits</span>
                <div className="space-y-4">
                  {employees.map(emp => {
                    const present = emp.attendance?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
                    const totalAtt = emp.attendance?.length || 0;
                    const rate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 100;
                    return (
                      <div key={emp.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-800 font-sans">{emp.name}</span>
                          <span className="font-mono text-gray-500 font-bold">{rate}% attendance</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full" 
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
