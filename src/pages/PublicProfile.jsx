import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Award, BookOpen, Trophy, Loader2, GraduationCap, ExternalLink, Github, Globe, Hammer, Share2, CheckCircle, Linkedin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const BADGE_ICONS = {
  rocket: '🚀', 'book-open': '📖', 'graduation-cap': '🎓', zap: '⚡',
  flame: '🔥', 'fire-extinguisher': '🔥', star: '⭐', 'message-square': '💬',
  map: '🗺️', 'flask-conical': '🧪', hammer: '🔨', award: '🏆',
};

const PublicProfile = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${API_BASE}/api/academy/profile/${userId}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [userId]);

  const shareUrl = `${window.location.origin}/academy/profile/${userId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLinkedIn = () => {
    const text = `Check out my learning profile on Munal AI Academy! I've completed ${data.stats.courses_completed} courses and earned ${data.stats.badges_earned} badges.`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
        <p className="text-gray-500">This profile doesn't exist or is set to private.</p>
        <Link to="/academy/courses"><Button className="mt-6 bg-violet-600 hover:bg-violet-700">Browse Courses</Button></Link>
      </div>
      <Footer />
    </div>
  );

  const { user, completed_courses, certificates, badges, capstone_projects, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>{user.name || 'Learner'}'s Profile | Munal AI Academy</title></Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shrink-0" data-testid="profile-avatar">
              {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" /> : (user.name || '?')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="profile-name">{user.name || 'Learner'}</h1>
              {user.headline && <p className="text-white/80 mt-1">{user.headline}</p>}
              {user.bio && <p className="text-white/60 mt-2 text-sm max-w-lg">{user.bio}</p>}
              <div className="flex items-center gap-4 mt-4">
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors" data-testid="copy-link-btn">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button onClick={handleShareLinkedIn} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors" data-testid="share-linkedin-btn">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Courses', value: stats.courses_completed },
              { label: 'Certificates', value: stats.certificates_earned },
              { label: 'Badges', value: stats.badges_earned },
              { label: 'Enrolled', value: stats.courses_enrolled },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8" data-testid="public-profile-content">
        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Badges Earned ({badges.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm" data-testid={`profile-badge-${b.id}`}>
                  <span className="text-xl">{BADGE_ICONS[b.icon] || '🏅'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.title}</p>
                    <p className="text-[10px] text-gray-400">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" /> Certificates ({certificates.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map(c => (
                <Link key={c.id} to={`/academy/certificates/${c.id}`}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group" data-testid={`profile-cert-${c.id}`}>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600">{c.course_title || 'Course Certificate'}</p>
                    <p className="text-[11px] text-gray-400">Score: {c.quiz_score}% — {new Date(c.issued_at).toLocaleDateString()}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completed_courses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Completed Courses ({completed_courses.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completed_courses.map(c => (
                <Link key={c.id} to={`/academy/courses/${c.id}`}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all group" data-testid={`profile-course-${c.id}`}>
                  <div className="h-24 bg-violet-100 dark:bg-violet-900/30 relative overflow-hidden">
                    {c.thumbnail && <img src={c.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />}
                    <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-8 h-8 text-violet-300" /></div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-600">{c.title}</p>
                    <Badge variant="secondary" className="text-[9px] mt-1">{c.category}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Capstone Projects */}
        {capstone_projects?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-orange-500" /> Capstone Projects ({capstone_projects.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capstone_projects.map(p => (
                <div key={p.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-white">{p.title}</h3>
                  {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><Github className="w-3.5 h-3.5" /> Code</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><Globe className="w-3.5 h-3.5" /> Demo</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state if nothing to show */}
        {badges.length === 0 && certificates.length === 0 && completed_courses.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">This learner is just getting started!</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PublicProfile;
