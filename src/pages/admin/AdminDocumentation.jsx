import React, { useState, useMemo } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Search, BookOpen, ChevronDown, ChevronUp, ChevronRight, Clock, ArrowLeft, Settings, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DOC_SECTIONS, ALL_ARTICLES } from '@/data/documentationContent';

const AdminDocumentation = () => {
  const { adminUser } = useAdminAuth();
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({ 'admin-guide': true });

  const adminSections = useMemo(() => DOC_SECTIONS.filter(s => s.isAdmin), []);
  const adminArticles = useMemo(() => ALL_ARTICLES.filter(a => a.isAdmin), []);

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return adminArticles.find(a => a.id === activeArticleId);
  }, [activeArticleId, adminArticles]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return adminArticles.filter(a =>
      a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }, [searchQuery, adminArticles]);

  const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6" data-testid="admin-docs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-500" /> Admin Documentation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Internal guides for platform administrators</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search admin docs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm" data-testid="admin-docs-search" />
          </div>

          {searchQuery.trim() ? (
            <div className="space-y-1">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => { setActiveArticleId(r.id); setSearchQuery(''); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-700 dark:text-gray-300">
                  {r.title}
                </button>
              ))}
            </div>
          ) : (
            adminSections.map(section => (
              <div key={section.id}>
                <button onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800">
                  <Settings className="w-4 h-4 text-violet-500" />
                  <span className="flex-1 text-left">{section.title}</span>
                  {expandedSections[section.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {expandedSections[section.id] && (
                  <div className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700 space-y-0.5 mt-1">
                    {section.articles.map(a => (
                      <button key={a.id} onClick={() => setActiveArticleId(a.id)}
                        className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                          activeArticleId === a.id
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                        )}>
                        {a.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeArticle ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
              <button onClick={() => setActiveArticleId(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mb-2">{activeArticle.sectionTitle}</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeArticle.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Clock className="w-3.5 h-3.5" /> {activeArticle.readTime} read
              </div>
              <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-table:text-sm prose-th:bg-gray-50 dark:prose-th:bg-slate-800 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-table:border prose-th:border prose-td:border prose-code:bg-gray-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeArticle.content}</ReactMarkdown>
              </article>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {adminSections.flatMap(s => s.articles).map(a => (
                <button key={a.id} onClick={() => setActiveArticleId(a.id)}
                  className="text-left p-5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all group">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-1">{a.title}</h3>
                  <p className="text-xs text-gray-400">{a.readTime} read</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentation;
