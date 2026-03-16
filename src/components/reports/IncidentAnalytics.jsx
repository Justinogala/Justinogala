import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Clock, ArrowUpRight,
  Loader2, AlertTriangle, Shield, Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

const SEVERITY_COLORS = {
  minor: { bg: '#22c55e', label: 'Minor' },
  moderate: { bg: '#eab308', label: 'Moderate' },
  major: { bg: '#f97316', label: 'Major' },
  critical: { bg: '#ef4444', label: 'Critical' },
  serious_occurrence: { bg: '#991b1b', label: 'SOR' },
};

const TYPE_LABELS = {
  injury: 'Injury',
  medication_error: 'Medication Error',
  property_damage: 'Property Damage',
  behavioural: 'Behavioural',
  safeguarding: 'Safeguarding',
  near_miss: 'Near Miss',
  other: 'Other',
};

const TYPE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

// =========== SVG Chart Components ===========

const SeverityTrendChart = ({ data }) => {
  if (!data?.length) return <EmptyChart message="No trend data available yet" />;

  const severityKeys = Object.keys(SEVERITY_COLORS);
  const maxVal = Math.max(1, ...data.map(d => severityKeys.reduce((sum, k) => sum + (d[k] || 0), 0)));

  const W = 600, H = 220, PL = 36, PB = 32, PT = 12, PR = 12;
  const chartW = W - PL - PR;
  const chartH = H - PB - PT;
  const barGroupW = chartW / data.length;
  const barW = Math.min(barGroupW * 0.6, 48);

  // y-axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid lines */}
      {yTicks.map(tick => {
        const y = PT + chartH - (tick / maxVal) * chartH;
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" strokeWidth="0.5" />
            <text x={PL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{tick}</text>
          </g>
        );
      })}

      {/* Stacked bars */}
      {data.map((d, i) => {
        const x = PL + i * barGroupW + (barGroupW - barW) / 2;
        let cumY = 0;
        return (
          <g key={d.month}>
            {severityKeys.map(sev => {
              const val = d[sev] || 0;
              if (val === 0) return null;
              const barH = (val / maxVal) * chartH;
              const y = PT + chartH - cumY - barH;
              cumY += barH;
              return (
                <motion.rect
                  key={sev}
                  x={x} y={y} width={barW} height={barH}
                  rx="3"
                  fill={SEVERITY_COLORS[sev].bg}
                  initial={{ height: 0, y: PT + chartH }}
                  animate={{ height: barH, y }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              );
            })}
            {/* Month label */}
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">
              {d.month.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart = ({ data }) => {
  if (!data?.length) return <EmptyChart message="No incident types recorded yet" />;

  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 90, cy = 90, r = 70, innerR = 45;

  const slices = [];
  let runningAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const startAngle = runningAngle;
    const endAngle = runningAngle + angle;
    runningAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    slices.push({ path, color: TYPE_COLORS[i % TYPE_COLORS.length], ...d });
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-40 h-40 shrink-0">
        {slices.map((s, i) => (
          <motion.path
            key={i} d={s.path} fill={s.color}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="hover:opacity-80 transition-opacity cursor-default"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9ca3af">Total</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="truncate text-gray-700 dark:text-gray-300">{TYPE_LABELS[s.type] || s.type}</span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">{s.count}</span>
            <span className="text-xs text-gray-400 w-10 text-right">{Math.round(s.count / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResponseTimeChart = ({ data }) => {
  const filtered = (data || []).filter(d => d.avg_hours !== null);
  if (!filtered.length) return <EmptyChart message="No response time data yet — update report statuses to generate metrics" />;

  const maxHours = Math.max(1, ...filtered.map(d => d.avg_hours));
  const W = 500, H = 160, PL = 100, PB = 6, PT = 10, PR = 50;
  const chartW = W - PL - PR;
  const barH = Math.min(28, (H - PT - PB) / filtered.length - 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {filtered.map((d, i) => {
        const y = PT + i * ((H - PT - PB) / filtered.length);
        const w = (d.avg_hours / maxHours) * chartW;
        const sev = SEVERITY_COLORS[d.severity] || { bg: '#94a3b8', label: d.severity };
        return (
          <g key={d.severity}>
            <text x={PL - 8} y={y + barH / 2 + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {sev.label}
            </text>
            <motion.rect
              x={PL} y={y} width={w} height={barH} rx="4" fill={sev.bg}
              initial={{ width: 0 }} animate={{ width: w }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            <text x={PL + w + 6} y={y + barH / 2 + 3} fontSize="10" fontWeight="600" fill="#374151">
              {d.avg_hours}h
            </text>
            <text x={PL + w + 36} y={y + barH / 2 + 3} fontSize="8" fill="#9ca3af">
              ({d.count})
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
    <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
  </div>
);

// =========== Main Component ===========

const IncidentAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/reports/analytics`);
        const data = await res.json();
        if (data.success) setAnalytics(data.analytics);
      } catch (e) {
        console.error('Failed to load analytics', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!analytics) {
    return <EmptyChart message="Could not load analytics data" />;
  }

  const { severity_trend, type_breakdown, response_times, monthly_summary } = analytics;
  const ms = monthly_summary || {};

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Monthly Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="analytics-summary-cards">
        <SummaryCard
          label="This Month" value={ms.current_count ?? 0}
          sub={ms.change_pct > 0 ? `+${ms.change_pct}% vs last month` : ms.change_pct < 0 ? `${ms.change_pct}% vs last month` : 'No prior data'}
          icon={ms.change_pct > 0 ? TrendingUp : ms.change_pct < 0 ? TrendingDown : Minus}
          accent={ms.change_pct > 0 ? 'text-red-500' : ms.change_pct < 0 ? 'text-green-500' : 'text-gray-400'}
        />
        <SummaryCard label="Closure Rate" value={`${ms.closure_rate ?? 0}%`} sub="Current month" icon={Shield} accent="text-emerald-500" />
        <SummaryCard label="Escalated" value={ms.escalated ?? 0} sub="Auto-escalated (24h)" icon={AlertTriangle} accent="text-amber-500" />
        <SummaryCard label="Prev. Month" value={ms.prev_count ?? 0} sub={ms.current_month?.slice(0, 7) || ''} icon={BarChart3} accent="text-indigo-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card data-testid="severity-trend-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Severity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityTrendChart data={severity_trend} />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {Object.entries(SEVERITY_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: val.bg }} />
                  {val.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="type-breakdown-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" /> Incident Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={type_breakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Response Times */}
      <Card data-testid="response-time-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" /> Avg. Response Time by Severity
            <Badge variant="outline" className="text-[10px] ml-auto font-normal">Hours to first review</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseTimeChart data={response_times} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SummaryCard = ({ label, value, sub, icon: Icon, accent }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <Icon className={cn("w-4 h-4", accent)} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </CardContent>
  </Card>
);

export default IncidentAnalytics;
