import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Ticket, Share2, Globe, Building, Monitor, Check, Loader2, ChevronDown, ChevronUp, ExternalLink, Mail, Star, MessageSquare, Image, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const API_BASE = window.location.origin;

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const typeColor = (t) => {
  if (t === 'Virtual') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (t === 'Hybrid') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
};

const ApplicationModal = ({ open, onOpenChange, eventId, eventTitle }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', position: '', country: '', linkedin: '', portfolio: '', years_experience: '', industry: '', why_attend: '', accept_terms: false });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accept_terms) { toast({ variant: 'destructive', title: 'Please accept the terms.' }); return; }
    if (!form.first_name || !form.last_name || !form.email) { toast({ variant: 'destructive', title: 'Please fill required fields.' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      if (res.ok) { setSubmitted(true); toast({ title: 'Application submitted!' }); }
      else { const d = await res.json(); toast({ variant: 'destructive', title: d.detail || 'Failed to submit' }); }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Application Submitted</h3>
            <p className="text-sm text-gray-500 mb-6">Your application for <strong>{eventTitle}</strong> is under review. You'll receive an email confirmation shortly.</p>
            <Button onClick={() => onOpenChange(false)} className="bg-violet-600 hover:bg-violet-700">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Attend</DialogTitle>
          <DialogDescription>{eventTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">First Name *</label><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required data-testid="apply-first-name" /></div>
            <div><label className="text-xs font-medium mb-1 block">Last Name *</label><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required data-testid="apply-last-name" /></div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">Email *</label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required data-testid="apply-email" /></div>
          <div><label className="text-xs font-medium mb-1 block">Phone</label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Company</label><Input value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div><label className="text-xs font-medium mb-1 block">Position</label><Input value={form.position} onChange={e => set('position', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Country</label><Input value={form.country} onChange={e => set('country', e.target.value)} /></div>
            <div><label className="text-xs font-medium mb-1 block">Years Experience</label>
              <Select value={form.years_experience} onValueChange={v => set('years_experience', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{['0-1', '2-4', '5-9', '10+'].map(y => <SelectItem key={y} value={y}>{y} years</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">LinkedIn</label><Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
          <div><label className="text-xs font-medium mb-1 block">Industry</label><Input value={form.industry} onChange={e => set('industry', e.target.value)} /></div>
          <div><label className="text-xs font-medium mb-1 block">Why do you want to attend?</label><Textarea value={form.why_attend} onChange={e => set('why_attend', e.target.value)} rows={3} /></div>
          <div className="flex items-start gap-2 pt-2">
            <Checkbox id="terms" checked={form.accept_terms} onCheckedChange={v => set('accept_terms', v)} className="mt-0.5 data-[state=checked]:bg-violet-600" data-testid="apply-accept-terms" />
            <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer">I accept the Terms of Service and Privacy Policy and agree to receive event communications.</label>
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700" data-testid="apply-submit">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ticket className="w-4 h-4 mr-2" />}
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});
  const [reviews, setReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [newReview, setNewReview] = useState({ name: '', email: '', rating: 5, comment: '' });
  const [newPost, setNewPost] = useState({ author_name: '', author_email: '', content: '' });
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${eventId}`);
        if (res.ok) setEvent(await res.json());
        else navigate('/events');
      } catch { navigate('/events'); }
      finally { setLoading(false); }
    })();
  }, [eventId, navigate]);

  useEffect(() => {
    if (!eventId) return;
    fetch(`${API_BASE}/api/events/${eventId}/reviews`).then(r => r.ok ? r.json() : null).then(d => d && setReviews(d.reviews || []));
    fetch(`${API_BASE}/api/events/${eventId}/discussions`).then(r => r.ok ? r.json() : null).then(d => d && setDiscussions(d.posts || []));
  }, [eventId]);

  const submitReview = async () => {
    if (!newReview.name || !newReview.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newReview) });
      if (res.ok) { const d = await res.json(); setReviews(prev => [d.review, ...prev]); setNewReview({ name: '', email: '', rating: 5, comment: '' }); toast({ title: 'Review submitted!' }); }
      else { const d = await res.json(); toast({ variant: 'destructive', title: d.detail || 'Failed' }); }
    } catch { toast({ variant: 'destructive', title: 'Failed to submit' }); }
  };

  const submitPost = async () => {
    if (!newPost.content) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/discussions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPost) });
      if (res.ok) { const d = await res.json(); setDiscussions(prev => [d.post, ...prev]); setNewPost({ author_name: '', author_email: '', content: '' }); toast({ title: 'Post added!' }); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!event) return null;

  const isPast = event.status === 'completed' || new Date(event.date) < new Date();
  const seatsLeft = event.seats - (event.registered || 0);
  const isFull = seatsLeft <= 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Helmet><title>{event.title} | Munal AI Events</title></Helmet>

      <Header />

      {/* Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-6 left-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="text-white/80 hover:text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex gap-2 mb-3">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", typeColor(event.event_type))}>{event.event_type}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">{event.category}</span>
            {event.price === 'Free' ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-400 text-black">Free</span> : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-black">{event.price}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                { icon: Clock, label: 'Time', value: event.time || formatTime(event.date) },
                { icon: MapPin, label: 'Location', value: event.location },
                { icon: Users, label: 'Capacity', value: `${event.registered || 0} / ${event.seats}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <Icon className="w-4 h-4 text-violet-500 mb-2" />
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 line-clamp-2">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About This Event</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{event.description}</p>
            </div>

            {/* Agenda */}
            {event.agenda?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Agenda</h2>
                <div className="space-y-2">
                  {event.agenda.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                      <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {event.speakers?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                      <img src={s.avatar} alt={s.name} className="w-14 h-14 rounded-full object-cover border-2 border-violet-200 dark:border-violet-800" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {event.faqs?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">FAQs</h2>
                <div className="space-y-2">
                  {event.faqs.map((faq, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <button onClick={() => setFaqOpen(p => ({ ...p, [i]: !p[i] }))} className="w-full flex items-center justify-between p-4 text-left">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{faq.q}</span>
                        {faqOpen[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {faqOpen[i] && <div className="px-4 pb-4 text-sm text-gray-500">{faq.a}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Reviews ({reviews.length})</h2>
              {reviews.length > 0 && (
                <div className="space-y-3 mb-4">
                  {reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{r.name}</span>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300")} />)}</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Your name" value={newReview.name} onChange={e => setNewReview(p => ({...p, name: e.target.value}))} className="text-sm" />
                  <Input placeholder="Email" type="email" value={newReview.email} onChange={e => setNewReview(p => ({...p, email: e.target.value}))} className="text-sm" />
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setNewReview(p => ({...p, rating: s}))} className="p-0.5">
                      <Star className={cn("w-5 h-5 transition-colors", s <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-gray-300 hover:text-amber-300")} />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Write your review..." value={newReview.comment} onChange={e => setNewReview(p => ({...p, comment: e.target.value}))} rows={2} className="text-sm" />
                <Button onClick={submitReview} size="sm" className="bg-violet-600 hover:bg-violet-700">Submit Review</Button>
              </div>
            </div>

            {/* Community Discussion */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-violet-500" /> Discussion ({discussions.length})</h2>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Your name" value={newPost.author_name} onChange={e => setNewPost(p => ({...p, author_name: e.target.value}))} className="text-sm" />
                  <Input placeholder="Email" type="email" value={newPost.author_email} onChange={e => setNewPost(p => ({...p, author_email: e.target.value}))} className="text-sm" />
                </div>
                <Textarea placeholder="Join the conversation..." value={newPost.content} onChange={e => setNewPost(p => ({...p, content: e.target.value}))} rows={2} className="text-sm" />
                <Button onClick={submitPost} size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1"><Send className="w-3 h-3" /> Post</Button>
              </div>
              {discussions.length > 0 && (
                <div className="space-y-3">
                  {discussions.map(post => (
                    <div key={post.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{post.author_name || 'Anonymous'}</span>
                        <span className="text-xs text-gray-400">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{post.content}</p>
                      {post.replies?.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-violet-200 dark:border-violet-800 space-y-2">
                          {post.replies.map(reply => (
                            <div key={reply.id} className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{reply.author_name}</span>
                              <span className="text-gray-400 text-xs ml-2">{reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ''}</span>
                              <p className="text-gray-500">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Registration Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-lg shadow-gray-100/50 dark:shadow-none">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Registration</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-medium text-gray-900 dark:text-white">{event.price || 'Free'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Duration</span><span className="font-medium">{event.duration}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Registered</span><span className="font-medium">{event.registered || 0} / {event.seats}</span></div>
                  {!isPast && <div className="flex justify-between text-sm"><span className="text-gray-500">Seats Left</span><span className={cn("font-medium", isFull ? "text-red-500" : "text-green-600")}>{isFull ? 'Full' : seatsLeft}</span></div>}
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, ((event.registered || 0) / event.seats) * 100)}%` }} />
                  </div>
                </div>
                {!isPast ? (
                  <Button onClick={() => setApplyOpen(true)} disabled={isFull && event.status !== 'cancelled'} className="w-full bg-violet-600 hover:bg-violet-700 text-white" data-testid="apply-btn">
                    {isFull ? 'Join Waitlist' : 'Apply to Attend'}
                  </Button>
                ) : (
                  <Badge className="w-full justify-center py-2 bg-gray-100 text-gray-500 dark:bg-gray-800">Event Completed</Badge>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
                    <Share2 className="w-3 h-3" /> Share
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" asChild>
                    <a href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.title)}&dates=${event.date?.replace(/[-:]/g, '').replace('.000', '')}/${event.end_date?.replace(/[-:]/g, '').replace('.000', '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer">
                      <Calendar className="w-3 h-3" /> Add to Calendar
                    </a>
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ApplicationModal open={applyOpen} onOpenChange={setApplyOpen} eventId={eventId} eventTitle={event.title} />
      <Footer />
    </div>
  );
};

export default EventDetailPage;
