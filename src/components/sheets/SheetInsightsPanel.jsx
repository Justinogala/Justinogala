import React, { useState, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Lightbulb, BarChart3,
  Loader2, X, RefreshCw, ArrowUpRight, AlertTriangle, Target, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
};

const InsightIcon = ({ type }) => {
  const map = {
    trend: <TrendingUp className="w-4 h-4 text-blue-500" />,
    outlier: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    pattern: <Eye className="w-4 h-4 text-violet-500" />,
    recommendation: <Target className="w-4 h-4 text-emerald-500" />,
  };
  return map[type] || <Lightbulb className="w-4 h-4 text-gray-500" />;
};

const ChartRenderer = ({ chart }) => {
  if (!chart?.data?.length) return null;

  if (chart.type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chart.data}
            cx="50%"
            cy="50%"
            outerRadius={75}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            fontSize={11}
          >
            {chart.data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === 'line') {
    const yKeys = chart.yKeys || ['value'];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar chart
  const yKeys = chart.yKeys || Object.keys(chart.data[0] || {}).filter(k => k !== 'name');
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chart.data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

const SheetInsightsPanel = ({ sheetId, sheetData, isOpen, onToggle }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets/${sheetId}/ai/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setInsights(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [sheetId]);

  if (!isOpen) return null;

  return (
    <div className="w-[420px] flex-shrink-0 border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden" data-testid="insights-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Insights</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={analyze} disabled={loading} className="h-7 w-7 p-0" data-testid="refresh-insights-btn">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-7 w-7 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!insights && !loading && !error && (
          <div className="text-center py-12" data-testid="insights-empty">
            <BarChart3 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Analyze your spreadsheet data</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">AI will identify trends, outliers, and generate charts</p>
            <Button onClick={analyze} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="analyze-btn">
              <BarChart3 className="w-4 h-4" /> Analyze Data
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="insights-loading">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500">Analyzing your data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400" data-testid="insights-error">
            {error}
            <Button variant="ghost" size="sm" onClick={analyze} className="mt-2 text-red-600">Retry</Button>
          </div>
        )}

        {insights && !loading && (
          <>
            {/* Summary */}
            {insights.summary && (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3" data-testid="insights-summary">
                <p className="text-sm text-gray-700 dark:text-gray-300">{insights.summary}</p>
              </div>
            )}

            {/* Key Metrics */}
            {insights.key_metrics?.length > 0 && (
              <div data-testid="insights-metrics">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  {insights.key_metrics.map((m, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{m.label}</span>
                        <TrendIcon trend={m.trend} />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            {insights.charts?.length > 0 && (
              <div data-testid="insights-charts">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Charts</h4>
                {insights.charts.map((chart, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 mb-3">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{chart.title}</h5>
                    <ChartRenderer chart={chart} />
                  </div>
                ))}
              </div>
            )}

            {/* Insights */}
            {insights.insights?.length > 0 && (
              <div data-testid="insights-list">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Insights</h4>
                <div className="space-y-2">
                  {insights.insights.map((ins, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5"><InsightIcon type={ins.type} /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ins.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ins.description}</p>
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 capitalize">{ins.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SheetInsightsPanel;
