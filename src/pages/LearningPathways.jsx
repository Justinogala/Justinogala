import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Map, BookOpen, Clock, ArrowLeft, ArrowRight, Play, Lock, Check, Loader2, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const ICON_MAP = {
  brain: '🧠', code: '💻', megaphone: '📣', 'heart-pulse': '🏥',
  cloud: '☁️', palette: '🎨', 'trending-up': '📈', film: '🎬',
};

// --- List Page ---
const PathwaysList = () => {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/academy/pathways`, { headers })
      .then(r => r.ok ? r.json() : { pathways: [] })
      .then(d => setPathways(d.pathways || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Learning Pathways | Munal AI Academy</title></Helmet>
      <Header />

      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-4 border border-white/10">
            <Map className="w-4 h-4 text-violet-300" />
            <span className="text-sm text-violet-200">Curated Learning Journeys</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Learning Pathways</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Follow structured multi-course paths designed by experts. Each pathway guides you from beginner to job-ready.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10" data-testid="pathways-list">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pathways.map(p => (
              <Link key={p.id} to={`/academy/pathways/${p.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-xl transition-all group" data-testid={`pathway-${p.id}`}>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${p.color}15` }}>
                    {ICON_MAP[p.icon] || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {p.course_count} courses</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.estimated_weeks} weeks</span>
                  <Badge variant="outline" className="text-[9px] capitalize">{p.level}</Badge>
                </div>
                {p.enrolled && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-violet-600">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                )}
                {!p.enrolled && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium mt-1">
                    Start pathway <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// --- Detail Page ---
const PathwayDetail = () => {
  const { pathwayId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/academy/pathways/${pathwayId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPathway(d); else navigate('/academy/pathways'); })
      .finally(() => setLoading(false));
  }, [pathwayId]);

  const handleEnroll = async () => {
    if (!token) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/pathways/${pathwayId}/enroll`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast({ title: 'Enrolled in pathway!' }); window.location.reload(); }
    } catch {}
    finally { setEnrolling(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;
  if (!pathway) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>{pathway.title} | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8" data-testid="pathway-detail">
        <Link to="/academy/pathways" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> All Pathways
        </Link>

        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: `${pathway.color}15` }}>
            {ICON_MAP[pathway.icon] || '📚'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pathway.title}</h1>
            <p className="text-gray-500 mt-1">{pathway.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {pathway.course_count} courses</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {pathway.estimated_weeks} weeks</span>
              <Badge variant="outline" className="capitalize">{pathway.level}</Badge>
            </div>
          </div>
          {!pathway.enrolled && (
            <Button onClick={handleEnroll} disabled={enrolling} className="bg-violet-600 hover:bg-violet-700 gap-2 shrink-0" data-testid="enroll-pathway-btn">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start Pathway
            </Button>
          )}
        </div>

        {pathway.enrolled && (
          <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Pathway Progress</span>
              <span className="text-sm font-bold text-violet-600">{pathway.progress}% ({pathway.completed_courses}/{pathway.course_count})</span>
            </div>
            <Progress value={pathway.progress} className="h-2.5" />
          </div>
        )}

        {/* Course List */}
        <div className="space-y-3">
          {(pathway.courses || []).map((course, i) => (
            <Link key={course.id} to={`/academy/courses/${course.id}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group" data-testid={`pathway-course-${course.id}`}>
              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                course.progress >= 100 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              )}>
                {course.progress >= 100 ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-violet-100 dark:bg-violet-900/30">
                {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} /> : null}
                <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-violet-300" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors truncate">{course.title}</h3>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                  <Badge variant="secondary" className="text-[9px]">{course.category}</Badge>
                  <span>{course.lesson_count} lessons</span>
                  <span>{course.estimated_hours}h</span>
                </div>
              </div>
              {course.enrolled ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={course.progress} className="h-1.5 w-20" />
                  <span className="text-xs font-semibold text-violet-600 w-8 text-right">{course.progress}%</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 shrink-0">Not started</span>
              )}
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export { PathwaysList, PathwayDetail };
