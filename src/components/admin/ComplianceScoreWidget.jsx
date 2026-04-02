import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Shield, ShieldCheck, KeyRound, AlertTriangle, ArrowRight, Loader2,
  TrendingUp, TrendingDown, Minus, Camera
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const GRADE_STYLES = {
  A: { text: 'text-emerald-600', label: 'Excellent' },
  B: { text: 'text-green-600', label: 'Good' },
  C: { text: 'text-amber-600', label: 'Fair' },
  D: { text: 'text-orange-600', label: 'Poor' },
  F: { text: 'text-red-600', label: 'Critical' },
};

const ScoreRing = ({ score, grade }) => {
  const style = GRADE_STYLES[grade] || GRADE_STYLES.F;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex-shrink-0" data-testid="compliance-score-ring">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-slate-700" />
        <circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
          stroke="url(#scoreGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {score >= 75 ? (
              <><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></>
            ) : score >= 50 ? (
              <><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></>
            ) : (
              <><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></>
            )}
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="compliance-score-value">{Math.round(score)}</span>
        <span className={`text-xs font-semibold ${style.text}`} data-testid="compliance-grade">{style.label}</span>
      </div>
    </div>
  );
};

const Sparkline = ({ snapshots, trend }) => {
  if (!snapshots || snapshots.length < 2) return null;

  const scores = snapshots.map(s => s.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;

  const w = 240;
  const h = 56;
  const padX = 4;
  const padY = 4;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const points = scores.map((s, i) => ({
    x: padX + (i / (scores.length - 1)) * plotW,
    y: padY + plotH - ((s - min) / range) * plotH,
    score: s,
    date: snapshots[i].taken_at,
    grade: snapshots[i].grade,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  const lastScore = scores[scores.length - 1];
  const strokeColor = lastScore >= 75 ? '#10b981' : lastScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="mt-3" data-testid="compliance-sparkline">
      {/* Trend badge */}
      {trend && (
        <div className="flex items-center gap-1.5 mb-2" data-testid="compliance-trend">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className={`text-xs font-semibold ${
            trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-500'
          }`} data-testid="compliance-trend-value">
            {trend.direction === 'flat' ? 'No change' : `${trend.change} pts ${trend.direction === 'up' ? 'up' : 'down'}`}
          </span>
          <span className="text-xs text-gray-400">vs last week</span>
        </div>
      )}

      {/* Sparkline SVG */}
      <TooltipProvider delayDuration={0}>
        <svg width={w} height={h} className="overflow-visible" data-testid="sparkline-svg">
          {/* Area fill */}
          <path d={areaPath} fill={strokeColor} opacity={0.08} />
          {/* Line */}
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots with tooltips */}
          {points.map((p, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <circle
                  cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 3}
                  fill={i === points.length - 1 ? strokeColor : 'white'}
                  stroke={strokeColor} strokeWidth={1.5}
                  className="cursor-pointer transition-all hover:r-[5]"
                  data-testid={`sparkline-dot-${i}`}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-semibold">{Math.round(p.score)} ({p.grade})</p>
                <p className="text-gray-400">{new Date(p.date).toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </svg>
      </TooltipProvider>

      <p className="text-[10px] text-gray-400 mt-1">{snapshots.length}-week history</p>
    </div>
  );
};

const SubScore = ({ icon: Icon, label, score, detail, color }) => (
  <div className="flex items-center gap-3" data-testid={`subscore-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(score)}%</span>
      </div>
      <Progress value={score} className="h-1.5" />
      <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
    </div>
  </div>
);

const ComplianceScoreWidget = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapping, setSnapping] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [scoreRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/compliance-score`),
          fetch(`${API_URL}/api/admin/compliance-score/history`),
        ]);
        if (scoreRes.ok) setData(await scoreRes.json());
        if (histRes.ok) setHistory(await histRes.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const takeSnapshot = async () => {
    setSnapping(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/compliance-score/snapshot`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (d.success) {
        toast({ title: 'Snapshot Saved', description: `Score ${d.snapshot.score} (${d.snapshot.grade}) captured.` });
        // Refresh history
        const histRes = await fetch(`${API_URL}/api/admin/compliance-score/history`);
        if (histRes.ok) setHistory(await histRes.json());
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to take snapshot' });
    } finally {
      setSnapping(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-100 dark:border-slate-700 shadow-sm" data-testid="compliance-widget-loading">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.error) return null;

  const { score, grade, breakdown } = data;
  const { tfa, password, login } = breakdown;

  return (
    <Card className="border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden" data-testid="compliance-score-widget">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Score Ring + Sparkline */}
          <div className="flex flex-col items-center justify-center p-6 lg:p-8 lg:border-r border-gray-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 lg:min-w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">Security Score</h3>
            </div>
            <ScoreRing score={score} grade={grade} />
            <Sparkline snapshots={history?.snapshots} trend={history?.trend} />
          </div>

          {/* Right: Breakdown */}
          <div className="flex-1 p-6 lg:p-8 space-y-5">
            <div className="space-y-4">
              <SubScore
                icon={ShieldCheck}
                label="2FA Adoption"
                score={tfa.score}
                detail={`${tfa.enabled} of ${tfa.total} users enabled`}
                color="bg-violet-500"
              />
              <SubScore
                icon={KeyRound}
                label="Password Strength"
                score={password.score}
                detail={`${password.strong} strong, ${password.weak} weak`}
                color="bg-blue-500"
              />
              <SubScore
                icon={AlertTriangle}
                label="Login Security"
                score={login.score}
                detail={`${login.locked_accounts} locked, ${login.high_fail_users} high-fail, ${login.suspicious_events} events`}
                color="bg-amber-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link to="/admin/2fa-dashboard">
                <Button variant="outline" size="sm" className="text-xs" data-testid="compliance-link-2fa">
                  2FA Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link to="/admin/security-policies">
                <Button variant="outline" size="sm" className="text-xs" data-testid="compliance-link-policies">
                  Security Policies <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Button
                variant="outline" size="sm" className="text-xs"
                onClick={takeSnapshot} disabled={snapping}
                data-testid="take-snapshot-btn"
              >
                {snapping ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />}
                Snapshot
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceScoreWidget;
