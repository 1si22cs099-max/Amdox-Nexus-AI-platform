import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tenant } from '../types';
import { 
  Building2, Landmark, Plus, CheckCircle, RefreshCw, AlertCircle, 
  Database, ShieldAlert, Cpu, BarChart2, CheckCircle2 
} from 'lucide-react';

export default function SuperAdminModule() {
  const { apiFetch, user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New tenant form state
  const [showForm, setShowForm] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    companyName: '',
    industry: 'High-Tech Manufacturing',
    domain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: 'nexus123'
  });

  const loadSuperData = async () => {
    setLoading(true);
    try {
      const [tenantsData, analyticsData] = await Promise.all([
        apiFetch('/api/super/tenants'),
        apiFetch('/api/super/analytics')
      ]);
      setTenants(tenantsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed loading system administrator catalogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuperData();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.companyName || !tenantForm.domain || !tenantForm.adminEmail) {
      alert('Provide company metadata and admin verification credentials.');
      return;
    }
    try {
      await apiFetch('/api/super/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantForm)
      });
      alert(`Tenant "${tenantForm.companyName}" successfully provisioned by Cloud Security.`);
      setTenantForm({
        companyName: '',
        industry: 'High-Tech Manufacturing',
        domain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: 'nexus123'
      });
      setShowForm(false);
      loadSuperData();
    } catch (err: any) {
      alert(err.message || 'Tenant workspace provisioning failed.');
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 my-8">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto stroke-[1.5]" />
        <h3 className="text-base font-semibold text-red-950 font-sans">Elevated Platform Scopes Restricted</h3>
        <p className="text-sm text-red-700 leading-relaxed font-sans">
          This panel is restricted strictly to platform Super Administrators. Authenticate with platform seed account `superadmin@nexus.com` to manage tenant properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-905 tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            Platform Admin Console
          </h2>
          <p className="text-sm text-gray-500 mt-1">Multi-tenant workspace monitors, company signups, and global SaaS health analytics.</p>
        </div>
        <button
          onClick={loadSuperData}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="h-3 w-3" /> Refresh analytics
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">Provisioned Corporations</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900 font-sans">{analytics?.totalTenants || 0} Tenants</span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">SAAS POOL</span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">Global Profiles</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900 font-sans">{analytics?.totalProfiles || 0} Users</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">AUTHENTICATED</span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">Operating Volume Pool</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900 font-sans">${(analytics?.invoiceTransactions || 0).toLocaleString()}</span>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">TRANSACTIONS</span>
              </div>
            </div>

            <div className="bg-white border border-gray-250/50 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">Database Size (Mock)</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900 font-sans">{(analytics?.dbSizeEstimate / 1024).toFixed(1)} KB</span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">PERSISTENCE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Register New Tenant Form and Tenants Listing */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-950 font-sans">Active Tenant Workspaces</h3>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">Global ledger boundaries and sandbox allocations.</p>
                  </div>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-indigo-900 hover:bg-slate-800 transition rounded-lg font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> {showForm ? 'Cancel Provision' : 'Provision Tenant Workspace'}
                  </button>
                </div>

                {/* Provision Form overlay */}
                {showForm && (
                  <form onSubmit={handleCreateTenant} className="bg-dashed bg-gray-50/60 p-5 border border-gray-200 rounded-2xl space-y-4 animate-fade-in text-xs">
                    <h4 className="text-xs font-mono font-bold text-indigo-950 uppercase tracking-widest">Provisioning Configuration Schema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Company Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Industries"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                          value={tenantForm.companyName}
                          onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Assigned Industry</label>
                        <select
                          className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 mt-1"
                          value={tenantForm.industry}
                          onChange={(e) => setTenantForm({ ...tenantForm, industry: e.target.value })}
                        >
                          <option value="High-Tech Manufacturing">High-Tech Manufacturing</option>
                          <option value="Biotechnology & Clinical">Biotechnology & Clinical</option>
                          <option value="Logistics and Distribution">Logistics and Distribution</option>
                          <option value="Financial Operations">Financial Operations</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Domain Prefix</label>
                        <input
                          type="text"
                          required
                          placeholder="acme.com"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                          value={tenantForm.domain}
                          onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Tenant Admin Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Eleanor Vance"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                          value={tenantForm.adminName}
                          onChange={(e) => setTenantForm({ ...tenantForm, adminName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Tenant Admin Email</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@acme.com"
                          className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                          value={tenantForm.adminEmail}
                          onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-950 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase rounded-lg"
                    >
                      POST AND DISPATCH TO SAAS CORE
                    </button>
                  </form>
                )}

                {/* Tenants Listing */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead>
                      <tr className="border-b uppercase font-mono text-gray-400">
                        <th className="py-2.5">Corporate Tenant ID</th>
                        <th>Name</th>
                        <th>Industry Scope</th>
                        <th>Domain Profile</th>
                        <th className="text-right">Platform status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {tenants.map(tn => (
                        <tr key={tn.id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-mono font-semibold text-gray-900">{tn.id}</td>
                          <td className="font-medium text-gray-800">{tn.name}</td>
                          <td>{tn.industry}</td>
                          <td className="font-mono text-gray-400">{tn.domain}</td>
                          <td className="text-right py-3">
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-105 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                              {tn.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Platform Governance Information */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Platform Governance</h3>
                <p className="text-xs text-slate-355 leading-relaxed font-sans">
                  The Amdox Nexus AI Platform functions as a single-database isolated multi-tenant ERP controller.
                </p>
                <div className="space-y-3.5 pt-2">
                  <div className="flex gap-3 text-xs">
                    <span className="p-1 bg-slate-805 rounded text-indigo-400"><Database className="h-4 w-4" /></span>
                    <div className="text-left leading-tight">
                      <div className="font-semibold text-slate-205">Data Isolation</div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Automatic tenant filtering isolates multi-organization financial accounts and staff lists cleanly.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="p-1 bg-slate-805 rounded text-indigo-400"><Database className="h-4 w-4" /></span>
                    <div className="text-left leading-tight">
                      <div className="font-semibold text-slate-205">Resend Notifier Dispatch</div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans animate-pulse">Email logs and alert payloads route automatically through our secure background server notifier.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
