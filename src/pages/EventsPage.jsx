import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Search, Ticket, ArrowRight, Sparkles, Globe, Building, Monitor, ChevronDown, Loader2, Filter, GraduationCap, Trophy, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const API_BASE = window.location.origin;

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'past', label: 'Past' },
];

const CATEGORIES = ['All', 'AI', 'Cloud', 'Cybersecurity', 'DevOps', 'Software Engineering', 'Product Management', 'Data Science'];
const EVENT_FORMATS = [
  'All', 'Live Events', 'Workshops', 'Webinars', 'Conferences', 'Bootcamps', 'Courses',
  'Certifications', 'Networking', 'Hackathons', 'Startup Pitch Days', 'AI Competitions',
  'Job Fair', 'Mentor Sessions', 'Office Hours', 'Community Meetups'
];

const typeIcon = (t) => {
  if (t === 'Virtual') return <Monitor className="w-3 h-3" />;
  if (t === 'Hybrid') return <Globe className="w-3 h-3" />;
  return <Building className="w-3 h-3" />;
};

const typeColor = (t) => {
  if (t === 'Virtual') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (t === 'Hybrid') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
};

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const EventCard = ({ event, isPast }) => {
  const navigate = useNavigate();
  const seatsLeft = event.seats - (event.registered || 0);
  const isFull = seatsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/events/${event.id}`)}
      data-testid={`event-card-${event.id}`}
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-violet-300 dark:text-violet-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1", typeColor(event.event_type))}>
            {typeIcon(event.event_type)} {event.event_format || event.event_type}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-gray-700 dark:bg-gray-800/90 dark:text-gray-300">{event.category}</span>
        </div>
        {event.price && event.price !== 'Free' && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">{event.price}</span>
        )}
        {event.price === 'Free' && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400 text-black">Free</span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2.5">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(event.date)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {event.title}
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3 truncate">
          <MapPin className="w-3 h-3 shrink-0" /> {event.location}
        </p>

        {/* Speakers */}
        {event.speakers?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex -space-x-2">
              {event.speakers.slice(0, 3).map((s, i) => (
                <img key={i} src={s.avatar} alt={s.name} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 object-cover" />
              ))}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {event.speakers.map(s => s.name).join(', ')}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.registered || 0} registered</span>
          {!isPast && <span>{isFull ? <Badge variant="destructive" className="text-[10px] h-5">Full</Badge> : `${seatsLeft} seats left`}</span>}
          {isPast && <span>{event.registered || 0} attended</span>}
        </div>

        {/* CTA */}
        {isPast ? (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
            View Event
          </Button>
        ) : event.status === 'cancelled' ? (
          <Button variant="outline" size="sm" className="w-full text-xs" disabled>Cancelled</Button>
        ) : isFull ? (
          <Button variant="outline" size="sm" className="w-full text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">Waitlist</Button>
        ) : (
          <Button size="sm" className="w-full text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
            Apply to Attend <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [category, setCategory] = useState('All');
  const [eventType, setEventType] = useState('All');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [featuredPrograms, setFeaturedPrograms] = useState([]);
  const [pastHighlights, setPastHighlights] = useState([]);
  const [hostOpen, setHostOpen] = useState(false);
  const [hostForm, setHostForm] = useState({ name: '', email: '', event_title: '', description: '', preferred_date: '', event_format: '', expected_attendees: '' });
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostSubmitted, setHostSubmitted] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, limit: '50', offset: '0' });
      if (category !== 'All') params.set('category', category);
      if (eventType !== 'All') params.set('event_type', eventType);
      if (search) params.set('search', search);
      const res = await fetch(`${API_BASE}/api/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
      }
    } catch (err) { console.error('Failed to fetch events:', err); }
    finally { setLoading(false); }
  }, [tab, category, eventType, search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Fetch featured programs & past highlights
  useEffect(() => {
    fetch(`${API_BASE}/api/events?tab=past&limit=4`).then(r => r.ok ? r.json() : null).then(d => d && setPastHighlights(d.events || []));
    fetch(`${API_BASE}/api/events?tab=upcoming&limit=50`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.events) {
        const programs = d.events.filter(e =>
          ['Workshops', 'Bootcamps', 'Courses', 'Certifications'].includes(e.event_format)
        ).slice(0, 4);
        setFeaturedPrograms(programs.length > 0 ? programs : d.events.slice(0, 4));
      }
    });
  }, []);

  // Fetch AI recommendations for logged-in users
  useEffect(() => {
    let token = null;
    try { token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { /* not logged in */ }
    if (!token) return;
    setRecLoading(true);
    fetch(`${API_BASE}/api/events/ai/recommendations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: [], industry: '', experience_level: '', preferred_formats: [] })
    }).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.recommendations) setRecommendations(d.recommendations);
    }).catch(() => {}).finally(() => setRecLoading(false));
  }, []);

  const isPast = tab === 'past';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Helmet>
        <title>Academy & Events | Munal AI</title>
        <meta name="description" content="Munal AI Academy & Events — Live events, workshops, bootcamps, hackathons, courses, certifications, and more." />
      </Helmet>

      {/* Site Header */}
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden text-white min-h-[520px] flex items-center">
        <img src="https://images.pexels.com/photos/9275222/pexels-photo-9275222.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-violet-950/85 to-slate-950/90" />
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/10">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-sm text-violet-200">One Unified Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
              Munal AI <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">Academy & Events</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
              Live events, workshops, bootcamps, hackathons, courses, certifications, networking, and more — all in one place for AI experts, developers, and innovators.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-10 max-w-3xl mx-auto">
              {['Workshops', 'Bootcamps', 'Hackathons', 'Courses', 'Certifications', 'Networking', 'AI Competitions', 'Mentor Sessions'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/10 text-violet-200 border border-white/10">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 gap-2" onClick={() => document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                <Ticket className="w-4 h-4" /> Explore All
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 gap-2" onClick={() => setHostOpen(true)} data-testid="host-event-btn">
                <Sparkles className="w-4 h-4" /> Host an Event
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Programs & Courses */}
      {featuredPrograms.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-10" data-testid="featured-programs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Programs & Courses</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-violet-600 gap-1" onClick={() => { setEventType('Courses'); setTab('upcoming'); document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredPrograms.map((prog, i) => (
              <Link
                key={prog.id}
                to={`/events/${prog.id}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-violet-500/5 transition-all"
                data-testid={`featured-program-${i}`}
              >
                <div className="relative h-32 bg-gradient-to-br from-violet-100 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 overflow-hidden">
                  {prog.banner ? <img src={prog.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-violet-300" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500 text-white">{prog.event_format || prog.event_type}</span>
                  {prog.price === 'Free' && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400 text-black">Free</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors mb-1.5">{prog.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(prog.date)}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {prog.registered || 0}/{prog.seats}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Event Highlights */}
      {pastHighlights.length > 0 && (
        <section className="bg-gray-50 dark:bg-slate-900/50 py-10" data-testid="past-highlights">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Event Highlights</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-violet-600 gap-1" onClick={() => { setTab('past'); document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>
                View All Past <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pastHighlights.map((ev, i) => (
                <Link key={ev.id} to={`/events/${ev.id}`} className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-lg transition-all" data-testid={`past-highlight-${i}`}>
                  <div className="flex items-start gap-3">
                    {ev.banner ? (
                      <img src={ev.banner} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-violet-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors">{ev.title}</h3>
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(ev.date)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="secondary" className="text-[9px] h-4">{ev.category}</Badge>
                        <span className="text-[10px] text-gray-400">{ev.registered || 0} attended</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Stats */}
      <section className="max-w-7xl mx-auto px-6 py-8" data-testid="category-stats">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'AI', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
            { label: 'Cloud', icon: Globe, color: 'from-blue-500 to-cyan-500' },
            { label: 'Cybersecurity', icon: Monitor, color: 'from-red-500 to-orange-500' },
            { label: 'DevOps', icon: Building, color: 'from-green-500 to-emerald-500' },
            { label: 'Data Science', icon: Star, color: 'from-amber-500 to-yellow-500' },
            { label: 'Software Engineering', icon: Monitor, color: 'from-indigo-500 to-blue-500' },
            { label: 'Product Management', icon: Users, color: 'from-pink-500 to-rose-500' },
            { label: 'Workshops', icon: GraduationCap, color: 'from-teal-500 to-cyan-500' },
          ].map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              onClick={() => { setCategory(label === 'Workshops' ? 'All' : label); if (label === 'Workshops') setEventType('Workshops'); else setEventType('All'); document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all"
              data-testid={`category-${label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-3">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", tab === t.id ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800")}>
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search events, speakers..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64 h-9 text-sm rounded-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" data-testid="events-search" />
              </div>
            </div>
          </div>
          {/* Category + Format chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", category === c ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" : "text-gray-500 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600")}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {EVENT_FORMATS.map(t => (
              <button key={t} onClick={() => setEventType(t)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", eventType === t ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700" : "text-gray-500 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      {recommendations.length > 0 && tab === 'upcoming' && (
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended for You</h2>
            <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">AI-Powered</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recommendations.slice(0, 5).map(event => (
              <EventCard key={`rec-${event.id}`} event={event} isPast={false} />
            ))}
          </div>
        </section>
      )}

      {/* Events Grid */}
      <section id="events-grid" className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tab === 'upcoming' ? 'Upcoming' : tab === 'ongoing' ? 'Ongoing' : 'Past'} Events
            <span className="text-sm font-normal text-gray-400 ml-2">({total})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No events found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event.id} event={event} isPast={isPast} />
            ))}
          </div>
        )}
      </section>

      {/* Host an Event Dialog */}
      <Dialog open={hostOpen} onOpenChange={(v) => { setHostOpen(v); if (!v) setHostSubmitted(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Host an Event</DialogTitle>
            <DialogDescription>Submit your event proposal for Munal AI Academy & Events.</DialogDescription>
          </DialogHeader>
          {hostSubmitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Proposal Submitted!</h3>
              <p className="text-sm text-gray-500 mb-4">Our team will review your event proposal and get back to you within 48 hours.</p>
              <Button onClick={() => { setHostOpen(false); setHostSubmitted(false); }} className="bg-violet-600 hover:bg-violet-700">Done</Button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!hostForm.name || !hostForm.email || !hostForm.event_title) { toast({ variant: 'destructive', title: 'Please fill required fields.' }); return; }
              setHostSubmitting(true);
              try {
                const res = await fetch(`${API_BASE}/api/events/host-proposal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hostForm) });
                if (res.ok) { setHostSubmitted(true); toast({ title: 'Proposal submitted!' }); }
                else { const d = await res.json(); toast({ variant: 'destructive', title: d.detail || 'Failed' }); }
              } catch { toast({ variant: 'destructive', title: 'Network error' }); }
              finally { setHostSubmitting(false); }
            }} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Your Name *</label><Input value={hostForm.name} onChange={e => setHostForm(p => ({...p, name: e.target.value}))} required data-testid="host-name" /></div>
                <div><label className="text-xs font-medium mb-1 block">Email *</label><Input type="email" value={hostForm.email} onChange={e => setHostForm(p => ({...p, email: e.target.value}))} required data-testid="host-email" /></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Event Title *</label><Input value={hostForm.event_title} onChange={e => setHostForm(p => ({...p, event_title: e.target.value}))} required data-testid="host-event-title" /></div>
              <div><label className="text-xs font-medium mb-1 block">Description</label><Textarea value={hostForm.description} onChange={e => setHostForm(p => ({...p, description: e.target.value}))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Preferred Date</label><Input type="date" value={hostForm.preferred_date} onChange={e => setHostForm(p => ({...p, preferred_date: e.target.value}))} /></div>
                <div><label className="text-xs font-medium mb-1 block">Event Format</label><Input value={hostForm.event_format} onChange={e => setHostForm(p => ({...p, event_format: e.target.value}))} placeholder="Workshop, Webinar..." /></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Expected Attendees</label><Input value={hostForm.expected_attendees} onChange={e => setHostForm(p => ({...p, expected_attendees: e.target.value}))} placeholder="50-100" /></div>
              <Button type="submit" disabled={hostSubmitting} className="w-full bg-violet-600 hover:bg-violet-700" data-testid="host-submit">
                {hostSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Submit Proposal
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EventsPage;
