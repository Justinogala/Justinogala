import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Search, Code, Key, ArrowRight, Copy,
  FileText, Users, Mic, Video, Calendar, MessageSquare,
  Shield, BarChart, Upload, Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const endpoints = [
  { method: 'GET', path: '/v1/meetings', desc: 'List all meetings for the authenticated user', category: 'Meetings', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { method: 'POST', path: '/v1/meetings', desc: 'Create a new meeting record', category: 'Meetings', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { method: 'GET', path: '/v1/transcriptions/{id}', desc: 'Retrieve a transcription by ID', category: 'Transcriptions', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { method: 'POST', path: '/v1/upload', desc: 'Upload audio/video for AI processing', category: 'Media', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { method: 'GET', path: '/v1/users', desc: 'List workspace members with roles', category: 'Users', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { method: 'POST', path: '/v1/messages', desc: 'Send a message in a channel', category: 'Messaging', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { method: 'GET', path: '/v1/calendar/events', desc: 'Fetch synced calendar events', category: 'Calendar', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { method: 'DELETE', path: '/v1/meetings/{id}', desc: 'Delete a meeting and its data', category: 'Meetings', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  { method: 'PUT', path: '/v1/users/{id}/role', desc: 'Update a user role or permissions', category: 'Users', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { method: 'GET', path: '/v1/analytics/summary', desc: 'Retrieve workspace analytics summary', category: 'Analytics', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
];

const sdks = [
  { icon: Code, title: 'JavaScript / TypeScript', version: 'v2.4.0', desc: 'Full SDK with TypeScript definitions and async/await support.' },
  { icon: Code, title: 'Python', version: 'v2.3.1', desc: 'Pythonic client with async support via httpx.' },
  { icon: Code, title: 'Ruby', version: 'v1.8.0', desc: 'Ruby gem with Rails integration helpers.' },
  { icon: Code, title: 'Go', version: 'v1.5.2', desc: 'Lightweight Go client with context support.' },
];

const APIReference = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEndpoints = endpoints.filter(ep =>
    ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ep.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ep.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>API Reference - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="api-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">API Reference</span>
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
                    REST API v1
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Munal
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> API Reference</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Build custom integrations with our powerful REST API. Meetings, transcriptions, users, analytics — everything is programmable.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Search endpoints..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                        data-testid="api-search"
                      />
                    </div>
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 shrink-0" data-testid="api-get-key">
                      <Key className="w-4 h-4 mr-2" /> Get API Key
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-slate-900 p-6 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="text-xs text-slate-500 ml-2 font-mono">terminal</span>
                    </div>
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto leading-relaxed">
{`curl https://api.munal.ai/v1/meetings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

{
  "meetings": [
    {
      "id": "mtg_a1b2c3d4",
      "title": "Q1 Sales Review",
      "date": "2026-03-25T14:00:00Z",
      "status": "transcribed",
      "participants": 8,
      "duration_min": 45
    }
  ],
  "total": 142,
  "page": 1
}`}
                    </pre>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-10 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '10+', label: 'Endpoints' },
                  { value: '4', label: 'Official SDKs' },
                  { value: '99.99%', label: 'API uptime' },
                  { value: '<100ms', label: 'Avg response' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Endpoints</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">All available API endpoints with methods and descriptions.</p>
                <div className="space-y-3">
                  {filteredEndpoints.map((ep, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }}>
                      <Card className="hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`endpoint-${idx}`}>
                        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase font-mono ${ep.color} shrink-0 w-16 text-center`}>{ep.method}</span>
                          <code className="text-sm font-mono text-gray-900 dark:text-white font-medium shrink-0">{ep.path}</code>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">{ep.desc}</p>
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">{ep.category}</span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SDKs */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Official SDKs</h2>
                <p className="text-gray-600 dark:text-gray-400">Get started quickly with our client libraries.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {sdks.map((sdk, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`sdk-card-${idx}`}>
                      <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
                          <sdk.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">{sdk.title}</h3>
                        <span className="text-xs text-violet-600 dark:text-violet-400 font-mono">{sdk.version}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{sdk.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">Ready to Build?</h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">Get your API key and start integrating Munal into your workflows today.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/signup')} data-testid="api-cta-signup">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 px-8 h-12 text-lg" onClick={() => navigate('/resources/docs')}>
                  Read the Docs
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

export default APIReference;
