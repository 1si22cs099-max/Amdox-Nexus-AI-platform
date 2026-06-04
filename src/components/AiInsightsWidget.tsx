import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiInsight } from '../types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  Sparkles, Brain, TrendingUp, AlertTriangle, Lightbulb, 
  Compass, ArrowUpRight, CheckCircle, RefreshCw, Layers
} from 'lucide-react';

export default function AiInsightsWidget() {
  const { apiFetch } = useAuth();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'forecast' | 'financial' | 'employee' | 'anomaly' | 'recommendation'>('all');

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/ai/insights');
      setInsights(data);
    } catch (err) {
      console.error('Failed retrieving local insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const filtered = selectedCategory === 'all' 
    ? insights 
    : insights.filter(i => i.type === selectedCategory);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return <span className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-mono border border-red-200 dark:border-red-900/60 font-medium">CRITICAL</span>;
      case 'medium':
        return <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-mono border border-amber-200 dark:border-amber-900/60 font-medium">WARNING</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-mono border border-emerald-200 dark:border-emerald-900/60 font-medium font-semibold">STABLE</span>;
    }
  };

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'forecast':
        return <Compass className="h-5 w-5 text-blue-500" />;
      case 'financial':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'employee':
        return <Brain className="h-5 w-5 text-indigo-500" />;
      case 'anomaly':
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            Nexus Algorithmic AI Core
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time local prediction models, trend matrices, and mathematical safety checkups.</p>
        </div>
        <button 
          onClick={fetchInsights}
          className="flex items-center gap-1.5 self-start px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition border border-indigo-100 rounded-lg bg-white"
        >
          <RefreshCw className="h-3 w-3" /> Re-Evaluate Core Models
        </button>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'forecast', 'financial', 'employee', 'anomaly', 'recommendation'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              selectedCategory === cat 
                ? 'bg-indigo-900 text-white border-indigo-900' 
                : 'text-gray-600 bg-white hover:bg-gray-50 border-gray-200'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-100">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-mono text-gray-400">Recalculating regression slopes and running moving averages...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-gray-100">
          <Layers className="h-10 w-10 text-gray-300 mx-auto stroke-[1.5]" />
          <p className="text-sm text-gray-400 mt-3">No active alerts matched chosen algorithm filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Insights Timeline Feed */}
          <div className="lg:col-span-7 space-y-4">
            {filtered.map(insight => (
              <div 
                key={insight.id}
                className="bg-white border hover:shadow-sm border-gray-150/80 rounded-xl p-5 transition flex flex-col md:flex-row gap-4 items-start"
              >
                <div className="p-2.5 bg-gray-50 rounded-xl max-w-max">
                  {getImpactIcon(insight.type)}
                </div>
                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs uppercase font-mono tracking-wider text-gray-400">{insight.type} checkup</span>
                    {getSeverityBadge(insight.severity)}
                  </div>
                  <h3 className="font-sans font-medium text-gray-900 text-[15px]">{insight.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-sans">{insight.summary}</p>
                  <p className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-lg font-sans border border-gray-100">{insight.details}</p>
                  {insight.metricLabel && (
                    <div className="flex items-baseline gap-2 pt-2 border-t border-gray-50 mt-2">
                      <span className="text-xs text-gray-400 font-mono">{insight.metricLabel}:</span>
                      <span className="text-sm font-semibold font-sans text-indigo-900">{insight.metricValue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Chart Visualizer Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-gray-150/80 rounded-xl p-5 sticky top-6">
              <h3 className="text-sm font-mono font-medium text-gray-500 uppercase tracking-wider mb-4">Neural Graph Inspection</h3>
              
              {/* Load a dynamic visual representation depending on current active filters */}
              {insights.some(i => i.type === 'financial' && i.chartData) && (
                <div className="space-y-6 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">Financial Extrapolation (Linear Regression)</span>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 rounded-full font-mono">Slope Target</span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={insights.find(i => i.type === 'financial')?.chartData || []}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#E5E7EB" />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#E5E7EB" />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                        <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={1} fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    Gray zone projects actual credit vs debit data. Shaded zone extrapolated using a high-density trend equation matching ledger records with standard deviation safety buffers.
                  </p>
                </div>
              )}

              {insights.some(i => i.type === 'employee' && i.chartData) && (
                <div className="space-y-6 mt-6 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                  <span className="text-xs font-semibold text-slate-800">Dynamic Performance Scoring Multi-factors</span>
                  <div className="h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={insights.filter(i => i.type === 'employee').map(i => ({
                          name: i.title.replace('KPI Scorecard: ', ''),
                          score: parseInt(i.metricValue || '0')
                        }))}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]}>
                          {insights.filter(i => i.type === 'employee').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#818CF8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
