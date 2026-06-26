import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Award, Calendar, Flame, Clock, ArrowRight, GraduationCap, Star, Lock, Sparkles, Trophy, Play, Zap, Download, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const AcademyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/api/academy/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(d => {
      if (d) setData(d);
      else navigate('/login');
    }).catch(() => navigate('/login'))
    .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { continue_learning, completed_courses, certificates, upcoming_events, recommended, subscription, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Academy Dashboard | Munal AI</title></Helmet>
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8" data-testid="academy-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Academy</h1>
            <p className="text-sm text-gray-500 mt-1">Your personalized learning hub</p>
          </div>
          <div className="flex gap-3">
            <Link to="/academy/courses">
              <Button variant="outline" className="gap-2"><BookOpen className="w-4 h-4" /> Browse Courses</Button>
            </Link>
            <Link to="/academy/subscription">
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Zap className="w-4 h-4" /> {subscription.plan === 'free' ? 'Upgrade to Pro' : `${subscription.plan} Plan`}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" data-testid="academy-stats">
          {[
            { label: 'Courses Enrolled', value: stats.courses_enrolled, icon: BookOpen, color: 'text-violet-500' },
            { label: 'Completed', value: stats.courses_completed, icon: Trophy, color: 'text-green-500' },
            { label: 'Certificates', value: stats.certificates_earned, icon: Award, color: 'text-amber-500' },
            { label: 'Learning Streak', value: `${stats.learning_streak} days`, icon: Flame, color: 'text-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</span>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {continue_learning.length > 0 && (
              <section data-testid="continue-learning">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-violet-500" /> Continue Learning
                </h2>
                <div className="space-y-3">
                  {continue_learning.slice(0, 4).map(c => (
                    <Link key={c.course_id} to={`/academy/courses/${c.course_id}`} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                      {c.thumbnail ? <img src={c.thumbnail} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" /> : <div className="w-20 h-14 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-violet-400" /></div>}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors truncate">{c.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant="secondary" className="text-[9px]">{c.category}</Badge>
                          <span className="text-[11px] text-gray-400">{c.completed_lessons}/{c.total_lessons} lessons</span>
                        </div>
                        <Progress value={c.progress} className="h-1.5 mt-2" />
                      </div>
                      <span className="text-sm font-semibold text-violet-600">{c.progress}%</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended */}
            {recommended.length > 0 && (
              <section data-testid="recommended-courses">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" /> Recommended for You
                  </h2>
                  <Link to="/academy/courses" className="text-sm text-violet-600 hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommended.slice(0, 4).map(c => (
                    <Link key={c.id} to={`/academy/courses/${c.id}`} className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all">
                      <div className="relative h-28 bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 overflow-hidden">
                        {c.thumbnail ? <img src={c.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-8 h-8 text-violet-300" /></div>}
                        {c.is_premium && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Pro</span>}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors">{c.title}</h3>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                          <Badge variant="secondary" className="text-[9px]">{c.category}</Badge>
                          <span>{c.estimated_hours}h</span>
                          <span>{c.enrolled_count} enrolled</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed_courses.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-500" /> Completed Courses
                </h2>
                <div className="flex flex-wrap gap-3">
                  {completed_courses.map(c => (
                    <Link key={c.course_id} to={`/academy/courses/${c.course_id}`} className="flex items-center gap-3 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm font-medium text-green-700 dark:text-green-300 hover:shadow-sm transition-all">
                      <Trophy className="w-4 h-4" /> {c.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certificates */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="certificates-section">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Certificates</h3>
              {certificates.length > 0 ? (
                <div className="space-y-2">
                  {certificates.slice(0, 5).map(cert => (
                    <Link key={cert.id} to={`/academy/certificates/${cert.id}`} className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-sm", cert.status === 'pass' ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800")}>
                      {cert.status === 'pass' ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{cert.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] font-bold", cert.status === 'pass' ? "text-green-600" : "text-red-600")}>{cert.quiz_score || 0}% — {cert.status === 'pass' ? 'PASS' : 'FAIL'}</span>
                          <span className="text-[10px] text-gray-400">{cert.cert_number}</span>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Complete a course to earn your first certificate!</p>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-500" /> Upcoming Events</h3>
              {upcoming_events.length > 0 ? (
                <div className="space-y-2">
                  {upcoming_events.map(ev => (
                    <Link key={ev.id} to={`/events/${ev.id}`} className="block p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">{ev.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {ev.event_format || 'Event'}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No upcoming events</p>
              )}
              <Link to="/events" className="block mt-3 text-xs text-violet-600 hover:underline text-center">View All Events</Link>
            </div>

            {/* Subscription Card */}
            <div className={cn("rounded-xl border p-5", subscription.plan !== 'free' ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white border-violet-500" : "bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800")}>
              <h3 className={cn("font-semibold mb-2 flex items-center gap-2", subscription.plan !== 'free' ? "text-white" : "text-gray-900 dark:text-white")}>
                <Zap className="w-4 h-4" /> {subscription.plan !== 'free' ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : 'Free Plan'}
              </h3>
              {subscription.plan === 'free' ? (
                <>
                  <p className="text-xs text-gray-400 mb-3">Upgrade to access premium courses, livestreams, and certificates.</p>
                  <Link to="/academy/subscription">
                    <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white">Upgrade to Pro — $29/mo</Button>
                  </Link>
                </>
              ) : (
                <p className="text-xs text-white/70">All premium content unlocked. Thank you for being a {subscription.plan} member!</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AcademyDashboard;
