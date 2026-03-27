import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Users, MessageSquare, Slack, Github, Twitter,
  Calendar, BookOpen, Award, Heart, Video, ArrowRight, Globe,
  Lightbulb, HelpCircle, Star, Mic
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const channels = [
  { icon: Slack, title: 'Slack Community', desc: 'Chat with 2,000+ members and the Munal team in real-time. Get help, share tips, and stay in the loop.', action: 'Join Slack', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: MessageSquare, title: 'Discussion Forums', desc: 'Post questions, propose features, and share your workflow automations with the community.', action: 'Visit Forums', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Github, title: 'GitHub Discussions', desc: 'Report bugs, request integrations, and contribute to Munal open-source plugins and templates.', action: 'Open GitHub', color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-gray-800' },
  { icon: Twitter, title: 'Follow on X', desc: 'Product announcements, tips, and behind-the-scenes from the team building Munal.', action: 'Follow Us', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
];

const events = [
  { title: 'Munal Meetup: AI in Healthcare', date: 'Apr 8, 2026', type: 'Virtual', icon: Video },
  { title: 'Community Office Hours', date: 'Every Thursday', type: 'Weekly', icon: HelpCircle },
  { title: 'Product Roadmap AMA', date: 'Apr 15, 2026', type: 'Virtual', icon: Lightbulb },
  { title: 'Munal User Conference 2026', date: 'Jun 12-13, 2026', type: 'New York', icon: Globe },
];

const spotlights = [
  { name: 'Dr. Amara Osei', role: 'CMO, MedVista Health', story: 'Built a custom compliance workflow using Munal that reduced documentation time by 60% across her entire clinical team.', avatar: 'A' },
  { name: 'Marcus Chen', role: 'Eng Manager, DataPipe', story: 'Created a searchable architecture decision log from 6 months of engineering meetings — now used by their entire org.', avatar: 'M' },
  { name: 'Priya Kapoor', role: 'Compliance, FinEdge Capital', story: 'Automated SEC audit reporting using Munal transcription exports, cutting quarterly prep from 3 weeks to 3 days.', avatar: 'P' },
];

const Community = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Community - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="community-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link to="/resources" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Resources</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Community</span>
              </nav>
            </div>
          </div>

          {/* Hero */}
          <section className="relative py-20 lg:py-28 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                    2,000+ Members Strong
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Join the Munal
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Community</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Connect with professionals across healthcare, education, government, legal, and finance who are transforming how their teams work with AI-powered tools.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25" data-testid="community-hero-cta">
                      Join the Community
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700" onClick={() => navigate('/resources/blog')}>
                      Read the Blog
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src="https://images.pexels.com/photos/3183130/pexels-photo-3183130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Munal community collaboration"
                    className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-10 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '2,000+', label: 'Active members' },
                  { value: '50+', label: 'Countries' },
                  { value: '500+', label: 'Shared workflows' },
                  { value: '24/7', label: 'Community support' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Channels */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Where to Connect</h2>
                <p className="text-gray-600 dark:text-gray-400">Pick your favorite platform and start collaborating with the Munal community.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {channels.map((ch, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }}>
                    <Card className="h-full border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl transition-all cursor-pointer group" data-testid={`channel-card-${idx}`}>
                      <CardContent className="p-8 text-center">
                        <div className={`w-14 h-14 rounded-2xl ${ch.bg} flex items-center justify-center ${ch.color} mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                          <ch.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{ch.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{ch.desc}</p>
                        <span className="inline-flex items-center text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all">
                          {ch.action} <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Events */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-2">Upcoming Events</h2>
                    <p className="text-gray-600 dark:text-gray-400">Workshops, AMAs, and meetups for the Munal community.</p>
                  </div>
                  <Button variant="outline" className="hidden md:flex border-gray-300 dark:border-gray-700">
                    <Calendar className="w-4 h-4 mr-2" /> View Calendar
                  </Button>
                </div>
                <div className="space-y-4">
                  {events.map((evt, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
                      <Card className="hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`event-card-${idx}`}>
                        <CardContent className="p-6 flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <evt.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{evt.title}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span>{evt.date}</span>
                              <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium">{evt.type}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 shrink-0 hidden sm:flex">
                            RSVP <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Community Spotlights */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Community Spotlights</h2>
                <p className="text-gray-600 dark:text-gray-400">Meet the power users building incredible workflows with Munal.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {spotlights.map((sp, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                    <Card className="h-full border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl transition-all" data-testid={`spotlight-card-${idx}`}>
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {sp.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{sp.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{sp.role}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{sp.story}</p>
                        <div className="flex items-center mt-5 text-yellow-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 mr-0.5" />)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contribute */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Ways to Contribute</h2>
                <p className="text-gray-600 dark:text-gray-400">The community thrives because of people like you.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  { icon: BookOpen, title: 'Write a Guide', desc: 'Share how you use Munal in your industry or workflow.' },
                  { icon: Mic, title: 'Speak at Events', desc: 'Present at meetups or host a workshop for the community.' },
                  { icon: Award, title: 'Beta Testing', desc: 'Get early access to new features and help shape the product.' },
                  { icon: Heart, title: 'Help Others', desc: 'Answer questions and mentor new members on Slack and forums.' },
                ].map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                    <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                Ready to Join?
              </h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                Thousands of professionals are already collaborating, learning, and growing together. Your seat is waiting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" data-testid="community-cta-join">
                  Join the Community
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 px-8 h-12 text-lg" onClick={() => navigate('/signup')}>
                  Sign Up Free
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Community;
