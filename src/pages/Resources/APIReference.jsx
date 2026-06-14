import React, { useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Search, Code, Key, Copy, Check,
  FileText, Users, Video, Calendar, MessageSquare,
  Shield, HardDrive, Settings, Building, ChevronDown, ChevronUp,
  Lock, Globe, AlertTriangle, Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { API_CATEGORIES, METHOD_COLORS, ERROR_CODES, RATE_LIMITS, API_BASE } from '@/data/apiReferenceContent';

const ICON_MAP = { Shield, MessageSquare, Video, Building, FileText, Calendar, HardDrive, Users, Settings };

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function EndpointCard({ ep }) {
  const [expanded, setExpanded] = useState(false);
  const mc = METHOD_COLORS[ep.method] || '';
  const curlExample = `curl -X ${ep.method} ${API_BASE}${ep.path.replace('{id}', 'abc123').replace('{file_id}', 'file_123')} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"${ep.params?.filter(p => p.required && p.type !== 'file').length ? ` \\\n  -d '${JSON.stringify(Object.fromEntries(ep.params.filter(p => p.required && p.type !== 'file').map(p => [p.name, p.type === 'boolean' ? true : p.type === 'array' ? [] : `<${p.name}>`])))}'` : ''}`;

  return (
    <div className="border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 transition-all" data-testid={`endpoint-${ep.method}-${ep.path.replace(/\//g, '-')}`}>
      <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center gap-3 p-4 text-left">
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border", mc, "w-14 text-center flex-shrink-0")}>{ep.method}</span>
        <code className="text-sm font-mono text-gray-900 dark:text-white flex-shrink-0">{ep.path}</code>
        <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate hidden sm:block">{ep.title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ep.auth && <Lock className="w-3.5 h-3.5 text-amber-500" title="Requires auth" />}
          {ep.adminOnly && <Shield className="w-3.5 h-3.5 text-red-500" title="Admin only" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-slate-800 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{ep.desc}</p>

          {ep.auth && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              {ep.adminOnly ? 'Requires admin authentication' : 'Requires authentication (Bearer token)'}
            </div>
          )}

          {ep.params?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-2">Parameters</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Required</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                        <td className="px-3 py-2 font-mono text-violet-600 dark:text-violet-400">{p.name}</td>
                        <td className="px-3 py-2 text-gray-500">{p.type}</td>
                        <td className="px-3 py-2">{p.required ? <span className="text-red-500 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Code example */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Example Request</h4>
              <CopyButton text={curlExample} />
            </div>
            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-300 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              <span className="text-slate-500">$</span> {curlExample}
            </pre>
          </div>

          {ep.response && (
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-1.5">Response</h4>
              <pre className="bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-300 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-gray-200 dark:border-slate-800">
                {ep.response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const APIReference = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSidebar, setExpandedSidebar] = useState({});
  const contentRef = useRef(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return API_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return API_CATEGORIES.map(cat => ({
      ...cat,
      endpoints: cat.endpoints.filter(ep =>
        ep.path.toLowerCase().includes(q) || ep.title.toLowerCase().includes(q) || ep.desc.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q)
      )
    })).filter(cat => cat.endpoints.length > 0);
  }, [searchQuery]);

  const totalEndpoints = API_CATEGORIES.reduce((sum, c) => sum + c.endpoints.length, 0);

  const scrollToCategory = (id) => {
    setActiveCategory(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>API Reference — Munal AI</title></Helmet>
        <Header />

        {/* Sticky breadcrumb */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Link to="/" className="hover:text-violet-600 transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4 mx-1.5" />
              <span className="font-medium text-gray-900 dark:text-white">API Reference</span>
            </nav>
          </div>
        </div>

        <div className="flex-grow flex">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 hidden lg:block sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search API..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white dark:bg-slate-800" data-testid="api-search" />
              </div>

              {/* Quick links */}
              <div className="mb-4 space-y-0.5">
                <button onClick={() => { setActiveCategory(null); window.scrollTo(0, 0); }}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium">Overview</button>
                <button onClick={() => scrollToCategory('auth-guide')}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">Authentication</button>
                <button onClick={() => scrollToCategory('errors')}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">Errors & Rate Limits</button>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Endpoints</p>
                {API_CATEGORIES.map(cat => {
                  const Icon = ICON_MAP[cat.icon] || Code;
                  return (
                    <button key={cat.id} onClick={() => scrollToCategory(cat.id)}
                      className={cn("w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        activeCategory === cat.id
                          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}>
                      <Icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                      <span className="flex-1 truncate">{cat.title}</span>
                      <span className="text-[10px] text-gray-400">{cat.endpoints.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0" ref={contentRef}>
            {/* Hero */}
            <section className="py-14 px-4 sm:px-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
              <div className="max-w-4xl mx-auto">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-medium mb-4">REST API v1</div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Munal AI <span className="text-violet-400">API Reference</span></h1>
                <p className="text-base text-slate-400 mb-6 max-w-2xl">Build custom integrations with our REST API. Meetings, transcriptions, AI chat, documents, analytics — everything is programmable.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { v: `${totalEndpoints}+`, l: 'Endpoints' }, { v: '9', l: 'Categories' },
                    { v: '99.99%', l: 'Uptime SLA' }, { v: '<100ms', l: 'Avg Latency' },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xl font-bold text-violet-400">{s.v}</div>
                      <div className="text-xs text-slate-500">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-mono">Base URL</span>
                    <CopyButton text={API_BASE} />
                  </div>
                  <code className="text-sm font-mono text-emerald-400">{API_BASE}</code>
                </div>
              </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-12">
              {/* Auth guide */}
              <section id="cat-auth-guide">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Key className="w-5 h-5 text-violet-500" /> Authentication</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-6">
                  <p>All authenticated endpoints require a <strong className="text-gray-900 dark:text-white">Bearer token</strong> in the Authorization header. Obtain a token via the <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">POST /v1/auth/login</code> endpoint.</p>
                  <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300">
                    <span className="text-slate-500">$</span>{' '}curl {API_BASE}/v1/meetings \{'\n'}
                    {'  '}-H <span className="text-emerald-400">"Authorization: Bearer eyJhbG..."</span> \{'\n'}
                    {'  '}-H <span className="text-emerald-400">"Content-Type: application/json"</span>
                  </div>
                  <p>Tokens expire after 24 hours. For 2FA-enabled accounts, the login endpoint returns <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">requires_2fa: true</code> — submit the code via <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">POST /v1/auth/verify-2fa</code> to receive the token.</p>
                </div>
              </section>

              {/* Endpoint categories */}
              {filteredCategories.map(cat => {
                const Icon = ICON_MAP[cat.icon] || Code;
                return (
                  <section key={cat.id} id={`cat-${cat.id}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-violet-500" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat.title}</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{cat.desc}</p>
                    <div className="space-y-2">
                      {cat.endpoints.map((ep, i) => <EndpointCard key={i} ep={ep} />)}
                    </div>
                  </section>
                );
              })}

              {/* Errors & Rate Limits */}
              <section id="cat-errors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Errors</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">The API uses standard HTTP status codes. Error responses include a <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">detail</code> field with a human-readable message.</p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 mb-8">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Code</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Title</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERROR_CODES.map((e, i) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                          <td className="px-4 py-2.5 font-mono font-bold text-gray-900 dark:text-white">{e.code}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{e.title}</td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{e.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Rate Limits</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Rate limits are applied per API key. When exceeded, the API returns <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">429 Too Many Requests</code> with a <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">Retry-After</code> header.</p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Plan</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Rate Limit</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Burst</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RATE_LIMITS.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                          <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.tier}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-gray-300">{r.requests}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-gray-300">{r.burst}</td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SDKs */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-violet-500" /> Official SDKs</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { lang: 'JavaScript / TypeScript', ver: 'v2.4.0', cmd: 'npm install @munal/sdk', desc: 'Full SDK with TypeScript definitions and async/await' },
                    { lang: 'Python', ver: 'v2.3.1', cmd: 'pip install munal-sdk', desc: 'Pythonic client with async support via httpx' },
                    { lang: 'Ruby', ver: 'v1.8.0', cmd: 'gem install munal', desc: 'Ruby gem with Rails integration helpers' },
                    { lang: 'Go', ver: 'v1.5.2', cmd: 'go get github.com/munal/munal-go', desc: 'Lightweight Go client with context support' },
                  ].map((sdk, i) => (
                    <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{sdk.lang}</h3>
                        <span className="text-xs font-mono text-violet-600 dark:text-violet-400">{sdk.ver}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{sdk.desc}</p>
                      <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5">
                        <code className="text-xs font-mono text-emerald-400 flex-1">{sdk.cmd}</code>
                        <CopyButton text={sdk.cmd} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <section className="text-center p-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white">
                <h2 className="text-2xl font-bold mb-3">Ready to Build?</h2>
                <p className="text-violet-100 mb-6">Get your API key and start integrating Munal into your workflows today.</p>
                <div className="flex gap-3 justify-center">
                  <Link to="/signup" className="px-6 py-2.5 bg-white text-violet-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm">Get Started Free</Link>
                  <Link to="/resources/docs" className="px-6 py-2.5 border border-white/50 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-sm">Read the Docs</Link>
                </div>
              </section>
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default APIReference;
