import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Play, Check, Lock, Clock, Users, Award, ArrowLeft, ChevronDown, ChevronUp, Star, GraduationCap, Zap, Radio, HelpCircle, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const AcademyCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  const fetchCourse = useCallback(async () => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setCourse(d);
        if (d.enrolled && d.lessons?.length > 0) {
          const incomplete = d.lessons.find(l => !d.completed_lessons?.includes(l.id));
          setActiveLesson(incomplete || d.lessons[0]);
        } else if (d.lessons?.length > 0) {
          setActiveLesson(d.lessons[0]);
        }
      } else navigate('/academy/courses');
    } catch { navigate('/academy/courses'); }
    finally { setLoading(false); }
  }, [courseId, token, navigate]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleEnroll = async () => {
    if (!token) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/enroll`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        toast({ title: 'Enrolled successfully!' });
        fetchCourse();
      } else {
        if (d.detail?.includes('Pro subscription')) {
          toast({ variant: 'destructive', title: 'Pro subscription required', description: 'Upgrade to access premium courses.' });
          navigate('/academy/subscription');
        } else {
          toast({ variant: 'destructive', title: d.detail || 'Failed to enroll' });
        }
      }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
    finally { setEnrolling(false); }
  };

  const handleComplete = async (lessonId) => {
    if (!token) return;
    setCompleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        toast({ title: d.completed ? 'Course completed! Certificate earned!' : 'Lesson completed!' });
        fetchCourse();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
    finally { setCompleting(false); }
  };

  const handleQuizSubmit = async () => {
    if (!token || !activeLesson) return;
    const quiz = activeLesson.quiz || [];
    const answers = quiz.map((_, i) => quizAnswers[i] ?? -1);
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${activeLesson.id}/quiz-submit`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        const d = await res.json();
        setQuizResult(d);
        if (d.passed) toast({ title: `Quiz passed! Score: ${d.score}%` });
        else toast({ variant: 'destructive', title: `Quiz not passed. Score: ${d.score}% (need ${d.pass_threshold}%)` });
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to submit quiz' }); }
    finally { setSubmittingQuiz(false); }
  };

  // Reset quiz state when changing lesson
  useEffect(() => { setQuizAnswers({}); setQuizResult(null); }, [activeLesson?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!course) return null;

  const parseEmbed = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>{course.title} | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link to="/academy/courses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            {activeLesson && course.has_access && activeLesson.video_url ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 dark:border-gray-700" data-testid="video-player">
                <iframe src={parseEmbed(activeLesson.video_url)} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={activeLesson.title} />
              </div>
            ) : activeLesson && !course.has_access ? (
              <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-violet-950 flex flex-col items-center justify-center text-white border border-gray-200 dark:border-gray-700">
                <Lock className="w-12 h-12 text-violet-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-sm text-gray-300 mb-4">Upgrade to Pro to access this course</p>
                <Link to="/academy/subscription"><Button className="bg-violet-600 hover:bg-violet-700 gap-2"><Zap className="w-4 h-4" /> Upgrade to Pro</Button></Link>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                <GraduationCap className="w-16 h-16 text-violet-300" />
              </div>
            )}

            {/* Active Lesson Info */}
            {activeLesson && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{activeLesson.title}</h2>
                  <p className="text-sm text-gray-400">{activeLesson.duration}</p>
                </div>
                {course.enrolled && course.has_access && !course.completed_lessons?.includes(activeLesson.id) && (
                  <Button onClick={() => handleComplete(activeLesson.id)} disabled={completing} className="bg-green-600 hover:bg-green-700 gap-2" data-testid="complete-lesson-btn">
                    <Check className="w-4 h-4" /> Mark Complete
                  </Button>
                )}
                {course.completed_lessons?.includes(activeLesson.id) && (
                  <Badge className="bg-green-100 text-green-700 gap-1"><Check className="w-3 h-3" /> Completed</Badge>
                )}
              </div>
            )}

            {/* Course Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
            </div>

            {/* What You'll Learn */}
            {course.what_you_learn?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What You'll Learn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.what_you_learn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Quiz */}
            {activeLesson?.quiz?.length > 0 && course.enrolled && course.has_access && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5" data-testid="lesson-quiz">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-500" /> Lesson Quiz
                  <span className="text-xs text-gray-400 font-normal ml-auto">{activeLesson.quiz.length} questions · Pass: {course.pass_threshold || 70}%</span>
                </h3>

                {quizResult ? (
                  <div className="space-y-4">
                    {/* Score Summary */}
                    <div className={cn("p-4 rounded-xl text-center", quizResult.passed ? "bg-green-50 dark:bg-green-900/20 border border-green-200" : "bg-red-50 dark:bg-red-900/20 border border-red-200")}>
                      <div className={cn("text-3xl font-bold mb-1", quizResult.passed ? "text-green-600" : "text-red-600")}>{quizResult.score}%</div>
                      <p className={cn("text-sm font-medium", quizResult.passed ? "text-green-700" : "text-red-700")}>
                        {quizResult.passed ? 'Passed!' : 'Not Passed'} · {quizResult.correct}/{quizResult.total} correct
                      </p>
                      {!quizResult.passed && <p className="text-xs text-gray-500 mt-1">Need {quizResult.pass_threshold}% to pass</p>}
                    </div>
                    {/* Results per question */}
                    <div className="space-y-3">
                      {quizResult.results?.map((r, i) => (
                        <div key={i} className={cn("p-3 rounded-lg border", r.is_correct ? "bg-green-50/50 border-green-200 dark:bg-green-900/10" : "bg-red-50/50 border-red-200 dark:bg-red-900/10")}>
                          <div className="flex items-start gap-2">
                            {r.is_correct ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{r.question}</p>
                              {r.explanation && <p className="text-xs text-gray-500 mt-1">{r.explanation}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="w-full">Retake Quiz</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeLesson.quiz.map((q, qi) => (
                      <div key={qi} className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{qi + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                          {(q.options || []).map((opt, oi) => (
                            <button key={oi} onClick={() => setQuizAnswers(p => ({ ...p, [qi]: oi }))}
                              className={cn("flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-all",
                                quizAnswers[qi] === oi ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400"
                              )} data-testid={`quiz-option-${qi}-${oi}`}
                            >
                              <span className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                                quizAnswers[qi] === oi ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300"
                              )}>{String.fromCharCode(65 + oi)}</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button onClick={handleQuizSubmit} disabled={submittingQuiz || Object.keys(quizAnswers).length < activeLesson.quiz.length}
                      className="w-full bg-purple-600 hover:bg-purple-700 gap-2" data-testid="submit-quiz-btn">
                      {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                      Submit Quiz ({Object.keys(quizAnswers).length}/{activeLesson.quiz.length} answered)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Enrollment Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-lg" data-testid="enrollment-card">
              {course.instructor_name && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  {course.instructor_avatar && <img src={course.instructor_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{course.instructor_name}</p>
                    <p className="text-[11px] text-gray-400">{course.instructor_title}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Level</span><Badge className="capitalize text-[10px]">{course.level}</Badge></div>
                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium">{course.estimated_hours}h</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Lessons</span><span className="font-medium">{course.lessons?.length || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Enrolled</span><span className="font-medium">{course.enrolled_count || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-medium">{course.is_premium ? `$${course.price}/Pro` : 'Free'}</span></div>
              </div>

              {course.enrolled ? (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-bold text-violet-600">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2 mb-3" />
                  {course.progress >= 100 ? (
                    <Badge className="w-full justify-center py-2 bg-green-100 text-green-700 gap-1"><Award className="w-4 h-4" /> Course Completed!</Badge>
                  ) : (
                    <p className="text-xs text-gray-400 text-center">Keep going! You're doing great.</p>
                  )}
                </div>
              ) : (
                <Button onClick={handleEnroll} disabled={enrolling} className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2" data-testid="enroll-btn">
                  {enrolling ? 'Enrolling...' : course.is_premium ? <><Lock className="w-4 h-4" /> Enroll (Pro Required)</> : <><Play className="w-4 h-4" /> Start Learning — Free</>}
                </Button>
              )}
            </div>

            {/* Lesson List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="lesson-list">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                Course Content ({course.lessons?.length || 0} lessons)
              </h3>
              <div className="max-h-[400px] overflow-y-auto">
                {(course.lessons || []).map((lesson, i) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isCompleted = course.completed_lessons?.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-800/50 transition-colors",
                        isActive ? "bg-violet-50 dark:bg-violet-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      )}
                      data-testid={`lesson-${lesson.id}`}
                    >
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isCompleted ? "bg-green-100 text-green-600" : isActive ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-400"
                      )}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium truncate", isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300")}>{lesson.title}</p>
                        <p className="text-[10px] text-gray-400">{lesson.duration}</p>
                      </div>
                      {!course.has_access && course.is_premium && <Lock className="w-3 h-3 text-gray-300 shrink-0" />}
                      {course.has_access && lesson.video_url && <Play className="w-3 h-3 text-gray-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {course.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => <span key={tag} className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{tag}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AcademyCourseDetail;
