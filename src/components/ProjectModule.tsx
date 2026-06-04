import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Project, Task, User } from '../types';
import { 
  Projector, Plus, CheckCircle, RefreshCw, AlertCircle, CalendarRange, 
  UserCheck, Briefcase, Paperclip, BarChart2, CheckCircle2 
} from 'lucide-react';

export default function ProjectModule() {
  const { apiFetch, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New project state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: '50000'
  });

  // New task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    assigneeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: '0',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    dependencies: [] as string[]
  });

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const [projData, taskData, usersData] = await Promise.all([
        apiFetch('/api/projects'),
        apiFetch('/api/tasks'),
        apiFetch('/api/users')
      ]);
      setProjects(projData);
      setTasks(taskData);
      setTeam(usersData.filter((u: any) => u.role !== 'super_admin'));
      
      if (projData.length > 0) {
        setSelectedProjectId(projData[0].id);
      }
      if (usersData.length > 0) {
        const firstTeamUser = usersData.find((u: any) => u.role !== 'super_admin');
        if (firstTeamUser) {
          setTaskForm(prev => ({ ...prev, assigneeId: firstTeamUser.id }));
        }
      }
    } catch (err) {
      console.error('Failed loading PM database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.startDate || !projectForm.budget) {
      alert('Fill in strategic name, timelines, and budgets.');
      return;
    }
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectForm)
      });
      setShowProjectForm(false);
      loadProjectData();
    } catch (err: any) {
      alert(err.message || 'Failed making project entry.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.name || !taskForm.assigneeId || !selectedProjectId) {
      alert('Provide task name, project reference and developer assignee.');
      return;
    }
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProjectId,
          ...taskForm
        })
      });
      setShowTaskForm(false);
      setTaskForm(prev => ({ ...prev, name: '', description: '' }));
      loadProjectData();
    } catch (err: any) {
      alert(err.message || 'Sprint creation failed.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done') => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      loadProjectData();
    } catch (err: any) {
      alert(err.message || 'Task state write abort');
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, progress: number) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ progress })
      });
      loadProjectData();
    } catch (err: any) {
      alert(err.message || 'Task progress write abort');
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeTasks = tasks.filter(t => t.projectId === selectedProjectId);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'done':
        return <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-100 font-medium">DONE</span>;
      case 'review':
        return <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-250 font-medium">REVIEWS</span>;
      case 'in_progress':
        return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-250 font-medium animate-pulse">INGRESS</span>;
      default:
        return <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-200">TODO</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-indigo-600" />
            Roadmaps & Sprints Delivery
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gantt milestone matrices, budget allocation metrics, and sprint ticket dispatch engines.</p>
        </div>
        <button
          onClick={loadProjectData}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="h-3 w-3" /> Sync PM Database
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top selection strip */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 uppercase">Active Enterprise Core:</span>
              <select
                className="text-xs font-semibold text-indigo-900 p-2 bg-white border border-gray-200 rounded-lg min-w-56 uppercase"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              {['super_admin', 'tenant_admin', 'project_manager'].includes(user?.role || '') && (
                <button
                  onClick={() => { setShowProjectForm(!showProjectForm); setShowTaskForm(false); }}
                  className="px-3 py-1.5 text-xs bg-indigo-900 hover:bg-slate-800 text-white rounded-lg font-medium transition"
                >
                  + Setup Corporate Project
                </button>
              )}
              <button
                onClick={() => { setShowTaskForm(!showTaskForm); setShowProjectForm(false); }}
                className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 rounded-lg font-medium transition"
              >
                + Schedule Sprint Task
              </button>
            </div>
          </div>

          {/* Project Creator Form overlay */}
          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="bg-dashed bg-gray-50/60 p-5 border border-gray-200 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-mono font-bold text-indigo-950 uppercase">Establish Corporate Project Blueprint</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Strategic Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Nexus Phase 2 Rollout"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Strategic Budget limit ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">Scope & Deliverables Description</label>
                <input
                  type="text"
                  placeholder="Summarize product roadmap outputs"
                  className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 font-mono"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Estimated Release Date</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 font-mono"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-950 text-white font-mono font-bold text-xs uppercase hover:bg-slate-800 rounded-lg">Launch Project Profile</button>
            </form>
          )}

          {/* Task Creator Form overlay */}
          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="bg-dashed bg-indigo-50/50 p-5 border border-indigo-200 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-mono font-bold text-indigo-900 uppercase">Schedule Sprint Ticket</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-indigo-900 uppercase">Task Identifier Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Integrate auth routes"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-indigo-900 uppercase">Assigned Professional</label>
                  <select
                    className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200 mt-1"
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    required
                  >
                    {team.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-indigo-900 uppercase">Implementation Notes</label>
                <input
                  type="text"
                  placeholder="Instruction set summary for developer"
                  className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono select-none">
                <div>
                  <label className="text-[10px] tracking-tight uppercase text-indigo-900">Sprint Start</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200 font-mono"
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-tight uppercase text-indigo-900">Sprint End</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200 font-mono"
                    value={taskForm.endDate}
                    onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase rounded-lg">Enqueue Sprint Ticket</button>
            </form>
          )}

          {activeProject ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Project Status Metrics */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border hover:shadow-xs border-gray-150 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-2.5 items-start">
                    <span className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl"><Briefcase className="h-5 w-5 text-indigo-600" /></span>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-gray-900 tracking-tight font-sans">{activeProject.name}</h4>
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide">{activeProject.status}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-sans leading-relaxed">{activeProject.description}</p>

                  <div className="space-y-1.5 font-mono text-[11px] text-gray-400 border-t border-b border-gray-50 py-3">
                    <div>Start line: <span className="text-gray-800 font-medium">{activeProject.startDate}</span></div>
                    <div>Target Delivery: <span className="text-indigo-600 font-medium">{activeProject.endDate}</span></div>
                  </div>

                  {/* Budget tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">Financial Budget Utilization</span>
                      <span className="font-mono font-bold text-gray-500">${activeProject.spent.toLocaleString()} / ${activeProject.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (activeProject.spent / activeProject.budget) > 0.85 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, (activeProject.spent / activeProject.budget) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Team Assignment listing */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-mono font-bold text-indigo-900 uppercase">Assigned Roadmap Team</h4>
                  <div className="space-y-3">
                    {team.map(t => (
                      <div key={t.id} className="flex gap-3 items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100/50 flex items-center justify-center font-mono font-semibold text-xs text-indigo-700 uppercase">
                          {t.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div className="text-left leading-tight">
                          <div className="text-xs font-semibold text-gray-800">{t.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono italic">{t.designation || t.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tasks List / CSS Gantt Chart visualizer */}
              <div className="lg:col-span-8 space-y-6">
                {/* CSS visual Gantt-style chart */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-sm font-mono font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                    <BarChart2 className="h-4 w-4" /> Visual Deliverable Timeline
                  </h3>
                  
                  <div className="space-y-4 pt-2">
                    {activeTasks.length === 0 ? (
                      <p className="text-xs text-gray-450 italic text-center p-6 bg-slate-50 border rounded-xl">No active milestone tasks. Schedule a task above to generate visual deliverables timeline.</p>
                    ) : (
                      activeTasks.map(t => {
                        const assignee = team.find(member => member.id === t.assigneeId);
                        return (
                          <div key={t.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-gray-50 pb-3">
                            <div className="space-y-0.5 text-left">
                              <h4 className="text-xs font-semibold text-gray-900 leading-snug">{t.name}</h4>
                              <p className="text-[10px] text-gray-400 truncate max-w-xs">{assignee ? assignee.name : 'Unassigned'}</p>
                            </div>

                            {/* Timeline Slider bar */}
                            <div className="md:col-span-2 space-y-1">
                              <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                                <span>{t.startDate}</span>
                                <span className="font-bold text-indigo-600">{t.progress}% Progress</span>
                                <span>{t.endDate}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 shadow-inner border border-gray-150">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full font-mono text-[9px] font-semibold text-white text-right"
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Dropdowns controls inside chart for instant playable interactions! */}
                            <div className="flex gap-1.5 justify-end">
                              <select
                                className="text-[10px] p-1.5 border border-gray-200 rounded-md font-mono text-gray-600"
                                value={t.status}
                                onChange={(e: any) => handleUpdateTaskStatus(t.id, e.target.value)}
                              >
                                <option value="todo">TODO</option>
                                <option value="in_progress">INGRESS</option>
                                <option value="review">REVIEWS</option>
                                <option value="done">DONE</option>
                              </select>
                              <select
                                className="text-[10px] p-1.5 border border-gray-200 rounded-md font-mono text-gray-600"
                                value={t.progress}
                                onChange={(e: any) => handleUpdateTaskProgress(t.id, Number(e.target.value))}
                              >
                                <option value="0">0%</option>
                                <option value="25">25%</option>
                                <option value="50">50%</option>
                                <option value="75">75%</option>
                                <option value="100">100%</option>
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Text tasks item summary lists to fulfill completeness description */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-gray-950 font-sans">Milestone Scrum backlog</h3>
                  
                  <div className="space-y-3.5">
                    {activeTasks.map(t => (
                      <div key={t.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
                        <div className="text-left space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-xs">{t.name}</span>
                            {getStatusBadge(t.status)}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Assignee: {team.find(tm => tm.id === t.assigneeId)?.name || 'Technical resource'} | Target: {t.endDate}
                          </div>
                        </div>

                        {t.status !== 'done' && (
                          <div className="self-end md:self-center">
                            <button
                              onClick={() => handleUpdateTaskStatus(t.id, 'done')}
                              className="text-[11px] font-sans font-medium hover:bg-indigo-900 bg-slate-900 text-white px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Sign-off Task
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl border">
              <p className="text-sm text-gray-400 italic">Please select or configure a strategic corporate project to view active timeline sprints.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
