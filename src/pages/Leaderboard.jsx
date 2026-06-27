import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Crown, BookOpen, Award, Flame, Loader2, ArrowRight, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const RANK_STYLES = {
  1: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10', border: 'border-amber-200 dark:border-amber-800', icon: Crown, iconColor: 'text-amber-500', ring: 'ring-2 ring-amber-300' },
  2: { bg: 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/20', border: 'border-gray-300 dark:border-gray-600', icon: Medal, iconColor: 'text-gray-400', ring: 'ring-2 ring-gray-300' },
  3: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/15 dark:to-amber-900/10', border: 'border-orange-200 dark:border-orange-800', icon: Medal, iconColor: 'text-orange-400', ring: 'ring-2 ring-orange-300' },
};

const Leaderboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score');

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').user?.id; } catch { return null; }
  })();

  useEffect(() => {
    fetch(`${API_BASE}/api/academy/leaderboard?limit=50`)
      .then(r => r.ok ? r.json() : { leaderboard: [] })
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const sorted = React.useMemo(() => {
    if (!data?.leaderboard) return [];
    const list = [...data.leaderboard];
    if (sortBy === 'courses') list.sort((a, b) => b.courses_completed - a.courses_completed);
    else if (sortBy === 'badges') list.sort((a, b) => b.badges_earned - a.badges_earned);
    else if (sortBy === 'streak') list.sort((a, b) => b.streak_days - a.streak_days);
    else list.sort((a, b) => b.score - a.score);
    return list.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [data, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Leaderboard | Munal AI Academy</title></Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/15 backdrop-blur rounded-full px-4 py-1.5 mb-4 border border-amber-400/20">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-amber-200">Top Learners</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Leaderboard</h1>
          <p className="text-gray-400 max-w-xl mx-auto">See who's leading the way. Complete courses, earn badges, and keep your streak going to climb the ranks.</p>
          {data && <p className="text-sm text-amber-300/60 mt-3">{data.total_learners} learners competing</p>}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-8" data-testid="leaderboard-page">
        {/* Sort Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'score', label: 'Overall Score', icon: Trophy },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'streak', label: 'Streak', icon: Flame },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSortBy(tab.id)}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                sortBy === tab.id
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-slate-900 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300"
              )} data-testid={`sort-${tab.id}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Trophy className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No learners yet</h3>
            <p className="text-sm text-gray-500 mb-4">Be the first to join the leaderboard!</p>
            <Link to="/academy/courses"><button className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">Start Learning</button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 Podium */}
            {sorted.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[sorted[1], sorted[0], sorted[2]].map((entry, idx) => {
                  const rank = [2, 1, 3][idx];
                  const style = RANK_STYLES[rank];
                  const RankIcon = style.icon;
                  return (
                    <div key={entry.user_id} className={cn("rounded-2xl border p-4 text-center transition-all", style.bg, style.border, rank === 1 && "scale-105 shadow-lg shadow-amber-500/10")}>
                      <RankIcon className={cn("w-6 h-6 mx-auto mb-2", style.iconColor)} />
                      <div className={cn("w-14 h-14 rounded-full mx-auto flex items-center justify-center text-lg font-bold mb-2", style.ring,
                        "bg-white dark:bg-slate-800 text-gray-900 dark:text-white")} data-testid={`podium-${rank}`}>
                        {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (entry.name || '?')[0]?.toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.name}</p>
                      {entry.headline && <p className="text-[10px] text-gray-400 truncate">{entry.headline}</p>}
                      <p className="text-xl font-bold text-amber-600 mt-1">{entry.score}</p>
                      <p className="text-[10px] text-gray-400">points</p>
                      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" /> {entry.courses_completed}</span>
                        <span className="flex items-center gap-0.5"><Award className="w-3 h-3" /> {entry.badges_earned}</span>
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" /> {entry.streak_days}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Learner</div>
              <div className="col-span-2 text-center">Courses</div>
              <div className="col-span-2 text-center">Badges</div>
              <div className="col-span-1 text-center">Streak</div>
              <div className="col-span-2 text-right">Score</div>
            </div>

            {/* Rows */}
            {sorted.slice(sorted.length >= 3 ? 3 : 0).map(entry => {
              const isCurrentUser = entry.user_id === currentUserId;
              return (
                <div key={entry.user_id}
                  className={cn("grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl border transition-all",
                    isCurrentUser
                      ? "bg-violet-50 dark:bg-violet-900/15 border-violet-200 dark:border-violet-800"
                      : "bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 hover:shadow-sm"
                  )} data-testid={`leaderboard-row-${entry.rank}`}>
                  <div className="col-span-1">
                    <span className={cn("text-sm font-bold", entry.rank <= 3 ? "text-amber-500" : "text-gray-400")}>#{entry.rank}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-bold text-violet-600 shrink-0">
                      {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (entry.name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</p>
                        {isCurrentUser && <Badge className="text-[8px] bg-violet-100 text-violet-700 px-1">You</Badge>}
                      </div>
                      {entry.headline && <p className="text-[10px] text-gray-400 truncate">{entry.headline}</p>}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{entry.courses_completed}</span>
                    <span className="text-[10px] text-gray-400 ml-0.5">/{entry.courses_enrolled}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{entry.badges_earned}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-0.5">
                      <Flame className="w-3 h-3 text-orange-400" />{entry.streak_days}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-lg font-bold text-amber-600">{entry.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scoring Info */}
        <div className="mt-10 p-5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">How Scoring Works</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Course Completed', pts: '+10', icon: BookOpen, color: 'violet' },
              { label: 'Certificate Earned', pts: '+8', icon: Award, color: 'emerald' },
              { label: 'Badge Earned', pts: '+5', icon: Trophy, color: 'amber' },
              { label: 'Active Day', pts: '+1', icon: Flame, color: 'orange' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <s.icon className={cn("w-5 h-5 mx-auto mb-1", `text-${s.color}-500`)} />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.pts}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Leaderboard;
