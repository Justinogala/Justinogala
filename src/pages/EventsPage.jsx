import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Search, Ticket, ArrowRight, Sparkles, Globe, Building, Monitor, ChevronDown, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'past', label: 'Past' },
];

const CATEGORIES = ['All', 'AI', 'Cloud', 'Cybersecurity', 'DevOps', 'Software Engineering', 'Product Management', 'Data Science'];
const EVENT_TYPES = ['All', 'Virtual', 'Hybrid', 'In Person'];

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
      <div className="relative h-44 overflow-hidden">
        <img src={event.banner} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1", typeColor(event.event_type))}>
            {typeIcon(event.event_type)} {event.event_type}
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

  const isPast = tab === 'past';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Helmet>
        <title>Events | Munal AI</title>
        <meta name="description" content="Join AI experts, developers, and innovators at Munal AI events every month." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/10">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-sm text-violet-200">Powered by Munal AI</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
              Munal AI <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">Events</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join AI experts, developers, business leaders, startups, cloud architects, cybersecurity professionals, and innovators every month.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 gap-2" onClick={() => document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                <Ticket className="w-4 h-4" /> Explore Events
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 gap-2">
                <Sparkles className="w-4 h-4" /> Host an Event
              </Button>
            </div>
          </motion.div>
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
          {/* Category + Type chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", category === c ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" : "text-gray-500 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600")}>
                {c}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            {EVENT_TYPES.map(t => (
              <button key={t} onClick={() => setEventType(t)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1", eventType === t ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" : "text-gray-500 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600")}>
                {t !== 'All' && typeIcon(t)} {t}
              </button>
            ))}
          </div>
        </div>
      </section>

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

      <Footer />
    </div>
  );
};

export default EventsPage;
