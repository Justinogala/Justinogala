import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search, Lock, Star, Clock, Users, GraduationCap, Filter, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;
const CATEGORIES = ['All', 'AI', 'Prompt Engineering', 'Cloud', 'DevOps', 'Cybersecurity', 'Data Science', 'Software Engineering', 'Product Management'];
const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

const AcademyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const PAGE_SIZE = 12;

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (level !== 'All') params.set('level', level);
    if (search) params.set('search', search);
    if (showPremiumOnly) params.set('is_premium', 'true');
    params.set('limit', PAGE_SIZE);
    params.set('offset', page * PAGE_SIZE);

    const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    setLoading(true);
    fetch(`${API_BASE}/api/academy/courses?${params}`, { headers })
      .then(r => r.ok ? r.json() : { courses: [], total: 0 })
      .then(d => { setCourses(d.courses || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [category, level, search, showPremiumOnly, page]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [category, level, search, showPremiumOnly]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Courses | Munal AI Academy</title></Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-4 border border-white/10">
            <GraduationCap className="w-4 h-4 text-violet-300" />
            <span className="text-sm text-violet-200">Munal AI Academy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Course Catalog</h1>
          <p className="text-gray-300 max-w-2xl mx-auto mb-6">Master AI, Cloud, DevOps, and more with expert-led courses. Free and premium content available.</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full"
              data-testid="courses-search"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", category === c ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" : "text-gray-500 border-gray-200 hover:border-gray-300 dark:border-gray-700")}>
                {c}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border capitalize", level === l ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300" : "text-gray-500 border-gray-200 dark:border-gray-700")}>
                  {l === 'All' ? 'All Levels' : l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No courses found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="courses-grid">
            {courses.map(course => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to={`/academy/courses/${course.id}`} className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all block" data-testid={`course-card-${course.id}`}>
                  <div className="relative h-40 bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 overflow-hidden">
                    {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-10 h-10 text-violet-300" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <Badge className="text-[10px] bg-white/90 text-gray-700">{course.category}</Badge>
                      <Badge className={cn("text-[10px] capitalize", course.level === 'beginner' ? 'bg-green-100 text-green-700' : course.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{course.level}</Badge>
                    </div>
                    {course.is_premium && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Pro</span>}
                    {!course.is_premium && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400 text-black">Free</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors mb-2">{course.title}</h3>
                    {course.instructor_name && (
                      <p className="text-[11px] text-gray-400 mb-2 truncate">By {course.instructor_name}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.estimated_hours}h</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons?.length || 0} lessons</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolled_count || 0}</span>
                    </div>
                    {course.enrolled ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                          <span>Progress</span><span className="font-semibold text-violet-600">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full text-xs bg-violet-600 hover:bg-violet-700 text-white">
                        {course.is_premium ? 'Enroll (Pro)' : 'Start Learning'} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10" data-testid="courses-pagination">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 400, behavior: 'smooth' }); }} className="gap-1">
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => { setPage(i); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                className={cn("w-9 h-9 rounded-lg text-sm font-medium transition-all", page === i ? "bg-violet-600 text-white shadow-md" : "bg-white dark:bg-slate-900 text-gray-600 border border-gray-200 dark:border-gray-700 hover:border-violet-300")}
                data-testid={`page-${i}`}>
                {i + 1}
              </button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 400, behavior: 'smooth' }); }} className="gap-1">
              Next
            </Button>
          </div>
        )}
        {total > 0 && <p className="text-center text-xs text-gray-400 mt-3">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} courses</p>}
      </section>
      <Footer />
    </div>
  );
};

export default AcademyCourses;
