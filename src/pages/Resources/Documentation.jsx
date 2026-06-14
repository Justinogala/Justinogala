import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, Search, BookOpen, Zap, Shield, Settings,
  Users, FileText, Rocket, ChevronDown, ChevronUp, Database,
  ArrowLeft, Menu, X, Clock, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DOC_SECTIONS, ALL_ARTICLES } from '@/data/documentationContent';

const ICON_MAP = { Rocket, Zap, Shield, Database, FileText, Settings, Users, BookOpen };

const Documentation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeArticleId = searchParams.get('article') || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Public sections only (no isAdmin)
  const publicSections = useMemo(() => DOC_SECTIONS.filter(s => !s.isAdmin), []);

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return ALL_ARTICLES.find(a => a.id === activeArticleId && !a.isAdmin);
  }, [activeArticleId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_ARTICLES.filter(a => !a.isAdmin && (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.sectionTitle.toLowerCase().includes(q)
    ));
  }, [searchQuery]);

  // Auto-expand section containing active article
  useEffect(() => {
    if (activeArticle) {
      setExpandedSections(prev => ({ ...prev, [activeArticle.sectionId]: true }));
      setSidebarOpen(false);
    }
  }, [activeArticle]);

  const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const navigateTo = (articleId) => {
    setSearchParams({ article: articleId });
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>{activeArticle ? `${activeArticle.title} — Munal AI Docs` : 'Documentation — Munal AI'}</title></Helmet>
        <Header />

        {/* Breadcrumb */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 min-w-0">
              <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex-shrink-0">Home</Link>
              <ChevronRight className="w-4 h-4 mx-1.5 flex-shrink-0" />
              {activeArticle ? (
                <>
                  <button onClick={() => setSearchParams({})} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex-shrink-0">Docs</button>
                  <ChevronRight className="w-4 h-4 mx-1.5 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-white truncate">{activeArticle.title}</span>
                </>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">Documentation</span>
              )}
            </nav>
            <button onClick={() => setSidebarOpen(p => !p)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex-grow flex">
          {/* Sidebar */}
          <aside className={cn(
            "w-72 flex-shrink-0 border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-y-auto",
            "fixed lg:sticky top-[57px] bottom-0 z-20 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                  data-testid="docs-search"
                />
              </div>

              {/* Search results */}
              {searchQuery.trim() && (
                <div className="mb-4 space-y-1">
                  <p className="text-xs text-gray-400 px-2 mb-2">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                  {searchResults.slice(0, 15).map(r => (
                    <button key={r.id} onClick={() => navigateTo(r.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group">
                      <div className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">{r.title}</div>
                      <div className="text-xs text-gray-400 truncate">{r.sectionTitle}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation */}
              {!searchQuery.trim() && publicSections.map(section => {
                const Icon = ICON_MAP[section.icon] || BookOpen;
                const isExpanded = expandedSections[section.id];
                return (
                  <div key={section.id} className="mb-1">
                    <button onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`sidebar-section-${section.id}`}>
                      <Icon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <span className="flex-1 text-left">{section.title}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700 space-y-0.5 mt-1 mb-2">
                        {section.articles.map(article => (
                          <button key={article.id} onClick={() => navigateTo(article.id)}
                            className={cn(
                              "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                              activeArticleId === article.id
                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}
                            data-testid={`sidebar-article-${article.id}`}>
                            {article.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeArticle ? (
              /* Article View */
              <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
                <button onClick={() => setSearchParams({})} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 mb-6 transition-colors" data-testid="back-to-docs">
                  <ArrowLeft className="w-4 h-4" /> Back to all docs
                </button>
                <div className="mb-6">
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-1.5 uppercase tracking-wide">{activeArticle.sectionTitle}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeArticle.title}</h1>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime} read</span>
                  </div>
                </div>
                <article className="docs-article text-sm leading-relaxed text-gray-700 dark:text-gray-300" data-testid="article-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({children}) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-bold text-gray-900 dark:text-white mt-6 mb-2">{children}</h3>,
                      h4: ({children}) => <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-4 mb-1.5">{children}</h4>,
                      p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="mb-3 pl-5 space-y-1 list-disc marker:text-violet-400">{children}</ul>,
                      ol: ({children}) => <ol className="mb-3 pl-5 space-y-1 list-decimal marker:text-violet-400">{children}</ol>,
                      li: ({children}) => <li className="leading-relaxed">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                      code: ({children, className}) => {
                        if (className) return <code className={cn("block bg-gray-50 dark:bg-slate-800 rounded-lg p-4 text-xs font-mono overflow-x-auto my-3", className)}>{children}</code>;
                        return <code className="bg-gray-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                      },
                      a: ({href, children}) => <a href={href} className="text-violet-600 dark:text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                      hr: () => <hr className="my-6 border-gray-200 dark:border-slate-700" />,
                      table: ({children}) => (
                        <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                          <table className="w-full text-xs">{children}</table>
                        </div>
                      ),
                      thead: ({children}) => <thead className="bg-gray-50 dark:bg-slate-800">{children}</thead>,
                      th: ({children}) => <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700">{children}</th>,
                      td: ({children}) => <td className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400">{children}</td>,
                      tr: ({children}) => <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">{children}</tr>,
                      blockquote: ({children}) => <blockquote className="border-l-3 border-violet-400 pl-4 my-4 text-gray-500 dark:text-gray-400 italic">{children}</blockquote>,
                    }}
                  >
                    {activeArticle.content}
                  </ReactMarkdown>
                </article>

                {/* Article navigation */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      const pubArticles = ALL_ARTICLES.filter(a => !a.isAdmin);
                      const idx = pubArticles.findIndex(a => a.id === activeArticleId);
                      const prev = idx > 0 ? pubArticles[idx - 1] : null;
                      const next = idx < pubArticles.length - 1 ? pubArticles[idx + 1] : null;
                      return (
                        <>
                          {prev ? (
                            <button onClick={() => navigateTo(prev.id)} className="text-left p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group">
                              <div className="text-xs text-gray-400 mb-1">Previous</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">{prev.title}</div>
                            </button>
                          ) : <div />}
                          {next && (
                            <button onClick={() => navigateTo(next.id)} className="text-right p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group">
                              <div className="text-xs text-gray-400 mb-1">Next</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">{next.title}</div>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              /* Landing / Index View */
              <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
                <div className="text-center mb-14">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-4">Documentation Center</div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Munal AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">Documentation</span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Everything you need to set up, configure, and master Munal AI. Comprehensive guides for users, administrators, and developers.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
                  {[
                    { value: ALL_ARTICLES.filter(a => !a.isAdmin).length + '+', label: 'Articles' },
                    { value: publicSections.length, label: 'Categories' },
                    { value: 'Weekly', label: 'Updates' },
                    { value: '24/7', label: 'Support' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Section Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {publicSections.map(section => {
                    const Icon = ICON_MAP[section.icon] || BookOpen;
                    return (
                      <button key={section.id}
                        onClick={() => { toggleSection(section.id); navigateTo(section.articles[0]?.id); }}
                        className="text-left p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-700 transition-all group"
                        data-testid={`doc-category-${section.id}`}>
                        <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{section.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{section.articles.length} articles</p>
                        <ul className="space-y-1">
                          {section.articles.slice(0, 3).map(a => (
                            <li key={a.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                              <ChevronRight className="w-3 h-3 text-gray-300" />{a.title}
                            </li>
                          ))}
                          {section.articles.length > 3 && <li className="text-sm text-violet-500 font-medium">+{section.articles.length - 3} more</li>}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="mt-16 text-center p-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white">
                  <h2 className="text-2xl font-bold mb-3">Can't find what you need?</h2>
                  <p className="text-violet-100 mb-6">Our support team is here to help.</p>
                  <Link to="/contact" className="inline-flex items-center px-6 py-2.5 bg-white text-violet-600 font-medium rounded-lg hover:bg-gray-100 transition-colors" data-testid="docs-contact-support">
                    Contact Support <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Documentation;
