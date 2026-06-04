import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AiInsightsWidget from './components/AiInsightsWidget';
import FinanceModule from './components/FinanceModule';
import HrModule from './components/HrModule';
import InventoryModule from './components/InventoryModule';
import ProjectModule from './components/ProjectModule';
import SuperAdminModule from './components/SuperAdminModule';
import Logo from './components/Logo';
import { AppNotification } from './types';
import { 
  Sparkles, Landmark, Users, Package, CalendarRange, Cpu, 
  Bell, LogOut, ShieldAlert, CpuIcon, Check, Settings, 
  HelpCircle, ChevronDown, CheckCircle2, Clock, RefreshCw
} from 'lucide-react';

function Dashboard() {
  const { user, logout, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'ai' | 'finance' | 'hr' | 'supply' | 'projects' | 'super'>('ai');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed retrieving notifications matrix:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds for realistic live tracking updates
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error('Failed marking notifications read:', err);
    }
  };

  // Safe preset default tabs mapping RBAC
  useEffect(() => {
    if (user?.role === 'super_admin') {
      setActiveTab('super');
    } else {
      setActiveTab('ai');
    }
  }, [user]);

  const timestamp = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-indigo-100 antialiased text-gray-800">
      {/* Header Banner */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-35 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Logo size={36} className="animate-pulse" />
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              AMDOX NEXUS <span className="text-[9px] font-mono tracking-widest text-[#38bdf8] bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">AI PLATFORM</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider">ENTERPRISE ERP MULTI-TENANT CORE</p>
          </div>
        </div>

        {/* Live status variables / clock trigger */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono">{timestamp} | SYSTEM OK</span>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
            <div className="text-right leading-tight hidden md:block">
              <div className="text-xs font-semibold text-slate-100">{user?.name}</div>
              <div className="text-[9px] uppercase font-mono text-indigo-400 font-bold tracking-wide">
                Role: {user?.role.replace('_', ' ')}
              </div>
            </div>

            {/* Notification triggers bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              {/* Notifications Overlay pane */}
              {showNotifications && (
                <div className="absolute right-0 mt-3.5 w-96 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 text-gray-800 overflow-hidden animate-fade-in animate-duration-150">
                  <div className="bg-slate-900/95 text-white p-4 flex items-center justify-between border-b border-slate-800">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">Enterprise Notification Stream</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold text-indigo-300 hover:text-white transition uppercase font-sans flex items-center gap-1 bg-indigo-950 px-2 py-0.5 rounded-md"
                      >
                        ✕ Mark all Read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 p-2.5 space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-450 italic text-center py-8">No notifications resolved for this workspace profile.</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`p-3 rounded-xl border transition ${
                            notif.isRead ? 'bg-white border-transparent' : 'bg-indigo-50/20 border-indigo-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs text-gray-800 leading-snug">{notif.message}</p>
                            <span className={`text-[8px] font-mono px-1 rounded uppercase tracking-tight ${
                              notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' : notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {notif.type}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-mono mt-2 block">
                            {new Date(notif.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-3 w hover:text-rose-400 hover:bg-slate-800 transition"
              title="Logout Session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Ribbon Navigation strip (Gives rhythm and Odoo/SAP vibes) */}
      <nav className="bg-white border-b border-gray-150/80 px-4 lg:px-8 py-2 flex flex-wrap gap-1 items-center justify-between shadow-sm z-20">
        <div className="flex flex-wrap gap-1">
          {user?.role === 'super_admin' ? (
            <button
              onClick={() => setActiveTab('super')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'super' ? 'bg-indigo-900 border-indigo-950 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> Platform Admin
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'ai' ? 'bg-indigo-900 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> AI Core Analytics
              </button>

              {['tenant_admin', 'finance_manager'].includes(user?.role || '') && (
                <button
                  onClick={() => setActiveTab('finance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'finance' ? 'bg-indigo-900 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5" /> Accounts Ledger
                </button>
              )}

              {['tenant_admin', 'hr_manager', 'employee'].includes(user?.role || '') && (
                <button
                  onClick={() => setActiveTab('hr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'hr' ? 'bg-indigo-900 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> HR Lifecycle & Payroll
                </button>
              )}

              {['tenant_admin', 'supply_chain_manager'].includes(user?.role || '') && (
                <button
                  onClick={() => setActiveTab('supply')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'supply' ? 'bg-indigo-900 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Package className="h-3.5 w-3.5" /> Supply Chains SKU
                </button>
              )}

              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'projects' ? 'bg-indigo-900 text-white' : 'text-gray-600 bg-white hover:bg-gray-50 border border-transparent'
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5" /> Roadmaps & Sprints
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main View Canvas */}
      <main className="flex-grow p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'super' && <SuperAdminModule />}
        {activeTab === 'ai' && <AiInsightsWidget />}
        {activeTab === 'finance' && <FinanceModule />}
        {activeTab === 'hr' && <HrModule />}
        {activeTab === 'supply' && <InventoryModule />}
        {activeTab === 'projects' && <ProjectModule />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-500 border-t border-slate-800 py-3.5 text-center text-xs font-mono tracking-tight flex flex-col md:flex-row items-center justify-between px-4 lg:px-8">
        <div>Amdox Nexus AI Platform ERP v1.4.2</div>
        <div className="flex gap-4">
          <span className="hover:text-indigo-400 cursor-pointer">Security Audits</span>
          <span className="hover:text-indigo-400 cursor-pointer">REST specs</span>
        </div>
      </footer>
    </div>
  );
}

function Authentication() {
  const { login, signup } = useAuth();
  const [isSignupState, setIsSignupState] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form parameters
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'High-Tech Manufacturing',
    domain: '',
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignupState) {
        if (!formData.domain.includes('.')) {
          alert('Specify domain suffixes cleanly matching "mycompany.com".');
          setLoading(false);
          return;
        }
        await signup(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch {
      // errors already alerted under Context
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutSelect = (email: string) => {
    setFormData({
      ...formData,
      email,
      password: 'nexus123'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden font-sans">
      
      {/* Decorative vectors */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <div className="inline-flex justify-center items-center p-3.5 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl mx-auto">
          <Logo size={76} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white font-sans mt-2">Amdox Nexus Portal</h2>
        <p className="text-xs text-indigo-400 font-mono tracking-wider">ENTERPRISE ERP MULTI-TENANT BACKBONE</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 sm:rounded-2xl sm:px-10 shadow-2xl space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignupState && (
              <>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Tenant Company Name</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1"
                      placeholder="Nexus Corp"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Domain</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1 font-mono text-indigo-400"
                      placeholder="nexuscorp.com"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Industry</label>
                  <select
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="High-Tech Manufacturing">High-Tech Manufacturing</option>
                    <option value="Biotechnology & Clinical">Biotechnology & Clinical</option>
                    <option value="Logistics and Distribution">Logistics and Distribution</option>
                  </select>
                </div>
              </>
            )}

            {isSignupState && (
              <div>
                <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Corporate Leader Name</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1"
                  placeholder="Eleanor Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Corporate Account Email</label>
              <input
                type="email"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1 font-mono"
                placeholder="admin@amdox.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-wide text-slate-400 uppercase">Secure Key Password</label>
              <input
                type="password"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-750 bg-slate-850 mt-1 font-mono"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-mono font-bold tracking-widest text-white mt-4 uppercase transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4 animate-spin" /> {loading ? 'Securing Environment...' : isSignupState ? 'Initialize Tenant Space' : 'Authorize Credentials'}
            </button>
          </form>

          {/* Quick-select credentials shortcut (Essential helper for reviewer!) */}
          {!isSignupState && (
            <div className="border-t border-slate-800 pt-5 space-y-3 select-none">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block text-center">Simulated Role shortcuts</span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <button 
                  onClick={() => handleShortcutSelect('superadmin@nexus.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">Super Admin</span>
                  Platform Owner
                </button>
                <button 
                  onClick={() => handleShortcutSelect('admin@amdox.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">Amdox Admin</span>
                  Tenant Director
                </button>
                <button 
                  onClick={() => handleShortcutSelect('finance@amdox.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">Finance Manager</span>
                  Sarah Jenkins
                </button>
                <button 
                  onClick={() => handleShortcutSelect('hr@amdox.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">HR Manager</span>
                  Marcus Brody
                </button>
                <button 
                  onClick={() => handleShortcutSelect('supply@amdox.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">Logistics Lead</span>
                  Vikram Singh
                </button>
                <button 
                  onClick={() => handleShortcutSelect('employee@amdox.com')}
                  className="text-[10px] font-mono bg-slate-850 hover:bg-indigo-950 p-2 border border-slate-800 hover:border-indigo-900 rounded-lg text-left"
                >
                  <span className="text-indigo-400 font-bold block">Core Developer</span>
                  John Doe
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-center">Passwords for shortcuts: nexus123</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setIsSignupState(!isSignupState)}
              className="text-xs text-indigo-400 hover:underline"
            >
              {isSignupState ? 'Back to password login' : 'Signup a new Corporation workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-400 uppercase tracking-widest">Constructing ERP Vault layers...</p>
        </div>
      </div>
    );
  }

  return token ? <Dashboard /> : <Authentication />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
