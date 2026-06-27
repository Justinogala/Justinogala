import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Award, BookOpen, Clock, Flame, Trophy, Star, GraduationCap, ArrowRight, Loader2, Play, Map, CheckCircle, Calendar, Zap, MessageSquare, FlaskConical, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const BADGE_ICONS = {
  rocket: Zap, 'book-open': BookOpen, 'graduation-cap': GraduationCap,
  zap: Zap, flame: Flame, 'fire-extinguisher': Flame, star: Star,
  'message-square': MessageSquare, map: Map, 'flask-conical': FlaskConical,
  hammer: Hammer, award: Award,
};

const AcademyDashboardEnhanced = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchDashboard();
    checkBadges();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/academy/dashboard/enhanced`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const checkBadges = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/academy/badges/check`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.newly_earned?.length > 0) {
          setNewBadges(d.newly_earned);
          d.newly_earned.forEach(b => toast({ title: `Badge earned: ${b.title}!`, description: b.description }));
        }
      }
    } catch {}
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;
  if (!data) return null;

  const { stats, continue_learning, completed_courses, badges, activity_days, enrolled_pathways, certificates } = data;

  // Generate streak calendar (last 30 days)
  const today = new Date();
  const calendarDays = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    calendarDays.push({ date: dateStr, active: activity_days?.includes(dateStr), day: d.getDate() });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>My Learning Dashboard | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-8" data-testid="enhanced-dashboard">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Courses', value: stats.courses_completed, sub: `of ${stats.courses_enrolled} enrolled`, icon: BookOpen, color: 'violet' },
            { label: 'Certificates', value: stats.certificates_earned, sub: 'earned', icon: Award, color: 'amber' },
            { label: 'Badges', value: stats.badges_earned, sub: `of ${badges.length} total`, icon: Trophy, color: 'orange' },
            { label: 'Hours', value: stats.total_hours, sub: 'learned', icon: Clock, color: 'blue' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid={`stat-${s.label.toLowerCase()}`}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2",
                s.color === 'violet' ? 'bg-violet-100 dark:bg-violet-900/30' :
                s.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                s.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              )}>
                <s.icon className={cn("w-4.5 h-4.5",
                  s.color === 'violet' ? 'text-violet-600' :
                  s.color === 'amber' ? 'text-amber-600' :
                  s.color === 'orange' ? 'text-orange-600' :
                  'text-blue-600'
                )} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[11px] text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Continue Learning + Completed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            {continue_learning.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="continue-learning">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-violet-500" /> Continue Learning
                </h2>
                <div className="space-y-3">
                  {continue_learning.slice(0, 5).map(c => (
                    <Link key={c.course_id} to={`/academy/courses/${c.course_id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group" data-testid={`continue-${c.course_id}`}>
                      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-violet-100 dark:bg-violet-900/30 relative">
                        {c.thumbnail && <img src={c.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />}
                        <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-violet-300" /></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600 transition-colors">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={c.progress} className="h-1.5 flex-1 max-w-[120px]" />
                          <span className="text-[11px] font-semibold text-violet-600">{c.progress}%</span>
                          <span className="text-[10px] text-gray-400">{c.completed_lessons}/{c.total_lessons} lessons</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pathways */}
            {enrolled_pathways?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="my-pathways">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Map className="w-4 h-4 text-indigo-500" /> My Pathways
                </h2>
                <div className="space-y-3">
                  {enrolled_pathways.map(p => (
                    <Link key={p.id} to={`/academy/pathways/${p.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}15` }}>
                        <Map className="w-5 h-5" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={p.progress} className="h-1.5 flex-1 max-w-[120px]" />
                          <span className="text-[11px] text-gray-500">{p.completed_courses}/{p.total_courses} courses</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Courses */}
            {completed_courses.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="completed-courses">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Completed ({completed_courses.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completed_courses.slice(0, 6).map(c => (
                    <Link key={c.course_id} to={`/academy/courses/${c.course_id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 hover:bg-green-100/50 transition-colors">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{c.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {continue_learning.length === 0 && completed_courses.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <GraduationCap className="w-14 h-14 text-violet-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start your learning journey</h3>
                <p className="text-sm text-gray-500 mb-4">Browse our 91+ courses and enroll in your first one.</p>
                <Link to="/academy/courses"><Button className="bg-violet-600 hover:bg-violet-700 gap-2"><BookOpen className="w-4 h-4" /> Browse Courses</Button></Link>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Streak Calendar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="streak-calendar">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" /> Learning Streak
                <Badge variant="secondary" className="ml-auto text-[10px]">{activity_days?.length || 0} days</Badge>
              </h3>
              <div className="grid grid-cols-10 gap-1">
                {calendarDays.map(d => (
                  <div key={d.date} title={d.date}
                    className={cn("w-full aspect-square rounded-sm text-[8px] flex items-center justify-center font-medium",
                      d.active ? "bg-violet-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}>
                    {d.day}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Last 30 days</p>
            </div>

            {/* Badges */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="badges-section">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-amber-500" /> Badges
                <Badge variant="secondary" className="ml-auto text-[10px]">{data.earned_badges_count}/{badges.length}</Badge>
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {badges.map(b => {
                  const Icon = BADGE_ICONS[b.icon] || Award;
                  return (
                    <div key={b.id} title={`${b.title}: ${b.description}${b.earned ? ` (Earned ${new Date(b.earned_at).toLocaleDateString()})` : ''}`}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-default",
                        b.earned ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800" : "bg-gray-50 dark:bg-gray-800/50 opacity-40"
                      )} data-testid={`badge-${b.id}`}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", b.earned ? "" : "grayscale")}
                        style={{ backgroundColor: b.earned ? `${b.color}20` : undefined }}>
                        <Icon className="w-4 h-4" style={{ color: b.earned ? b.color : '#9CA3AF' }} />
                      </div>
                      <span className="text-[8px] font-medium text-center text-gray-600 dark:text-gray-400 leading-tight">{b.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certificates */}
            {certificates?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="certificates-section">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-emerald-500" /> Certificates ({certificates.length})
                </h3>
                <div className="space-y-2">
                  {certificates.slice(0, 5).map(c => (
                    <Link key={c.id} to={`/academy/certificates/${c.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center",
                        c.status === 'pass' ? 'bg-green-100' : 'bg-red-100')}>
                        <Award className={cn("w-3 h-3", c.status === 'pass' ? 'text-green-600' : 'text-red-600')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{c.course_title || 'Course'}</p>
                        <p className="text-[10px] text-gray-400">{c.quiz_score}% — {c.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="space-y-2">
              <Link to="/academy/courses" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-violet-600">Browse Courses</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </Link>
              <Link to="/academy/pathways" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                <Map className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600">Learning Pathways</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </Link>
              <Link to="/academy/capstone-projects" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                <Hammer className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600">Capstone Projects</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </Link>
              <Link to="/academy/certifications" className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-600">Certifications</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AcademyDashboardEnhanced;
