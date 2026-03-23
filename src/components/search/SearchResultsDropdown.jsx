
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, Users, FileText, MessageSquare,
  ChevronRight, History, Trash2, Search, Globe, Lock, User,
  ArrowRight, Calendar, Video, Settings, Mic, BarChart3, PenTool,
  CheckCircle, Clock, Sparkles
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const ICON_MAP = {
  'layout-dashboard': LayoutDashboard,
  'briefcase': Briefcase,
  'calendar': Calendar,
  'message-square': MessageSquare,
  'message-circle': MessageSquare,
  'video': Video,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  'check-circle': CheckCircle,
  'pen-tool': PenTool,
  'settings': Settings,
  'user': User,
  'clock': Clock,
  'mic': Mic,
  'sparkles': Sparkles,
};

const Highlight = ({ text = '', highlight = '' }) => {
  if (!highlight || !text) return <span className="truncate">{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className="truncate">
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100 rounded px-0.5 font-medium">{part}</span>
        ) : part
      )}
    </span>
  );
};

const ResultItem = ({ icon: Icon, title, subtitle, badge, badgeColor, onClick, highlight }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 group transition-colors text-left"
    data-testid="search-result-item"
  >
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-100/50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          <Highlight text={title} highlight={highlight} />
        </h4>
        {badge && (
          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 flex-shrink-0", badgeColor)}>
            {badge}
          </Badge>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          <Highlight text={subtitle} highlight={highlight} />
        </p>
      )}
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const SectionHeader = ({ icon: Icon, label, count, color }) => (
  <div className={cn("px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-md mx-1 mb-0.5", color)}>
    <Icon className="w-3 h-3" /> {label} ({count})
  </div>
);

const SearchResultsDropdown = ({
  results,
  recentSearches,
  query,
  onClose,
  onSelectHistory,
  onClearHistory,
  onAddToHistory
}) => {
  const navigate = useNavigate();
  const { pages = [], workspaces = [], users = [], forms = [], messages = [] } = results;
  const hasResults = pages.length > 0 || workspaces.length > 0 || users.length > 0 || forms.length > 0 || messages.length > 0;
  const showHistory = !query && recentSearches.length > 0;

  const go = (path, label) => {
    onAddToHistory(query || label);
    onClose();
    navigate(path);
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-violet-100 dark:border-violet-800 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden z-[60]"
      data-testid="search-results-dropdown"
    >
      <ScrollArea className="max-h-[70vh] sm:max-h-[500px]">
        <div className="p-2">

          {/* Recent Searches */}
          {showHistory && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> Recent</span>
                <button onClick={onClearHistory} className="hover:text-red-500 transition-colors flex items-center gap-1">
                  Clear <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {recentSearches.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onSelectHistory(item.term)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-left transition-colors group"
                >
                  <History className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.term}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && !hasResults && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-sm">No results found</p>
              <p className="text-xs text-gray-500 mt-1">Nothing matching &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Quick Navigation (Pages) */}
          {pages.length > 0 && (
            <div className="mb-1">
              <SectionHeader icon={ArrowRight} label="Go to" count={pages.length} color="text-gray-500 bg-gray-50/80 dark:bg-slate-800/50" />
              {pages.map(item => {
                const NavIcon = ICON_MAP[item.icon] || LayoutDashboard;
                return (
                  <ResultItem
                    key={item.id}
                    icon={NavIcon}
                    title={item.title}
                    subtitle={item.path}
                    onClick={() => go(item.path, item.title)}
                    highlight={query}
                  />
                );
              })}
            </div>
          )}

          {/* Workspaces */}
          {workspaces.length > 0 && (
            <div className="mb-1">
              <SectionHeader icon={Briefcase} label="Workspaces" count={workspaces.length} color="text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20" />
              {workspaces.map(ws => (
                <ResultItem
                  key={ws.id}
                  icon={ws.scope === 'org' ? Globe : Lock}
                  title={ws.name}
                  subtitle={ws.description}
                  badge={ws.scope === 'org' ? 'Org' : 'Team'}
                  badgeColor="border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400"
                  onClick={() => go(`/workspace/${ws.id}`, ws.name)}
                  highlight={query}
                />
              ))}
            </div>
          )}

          {/* Users */}
          {users.length > 0 && (
            <div className="mb-1">
              <SectionHeader icon={Users} label="People" count={users.length} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20" />
              {users.map(u => (
                <ResultItem
                  key={u.id}
                  icon={User}
                  title={u.name}
                  subtitle={u.email}
                  badge={u.role}
                  badgeColor="border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                  onClick={() => go(`/workspace/chat`, u.name)}
                  highlight={query}
                />
              ))}
            </div>
          )}

          {/* Forms */}
          {forms.length > 0 && (
            <div className="mb-1">
              <SectionHeader icon={FileText} label="Forms" count={forms.length} color="text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20" />
              {forms.map(f => (
                <ResultItem
                  key={f.id}
                  icon={FileText}
                  title={f.name}
                  subtitle={f.description}
                  onClick={() => go(f.workspace_id ? `/workspace/${f.workspace_id}` : '/workspaces', f.name)}
                  highlight={query}
                />
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="mb-1">
              <SectionHeader icon={MessageSquare} label="Messages" count={messages.length} color="text-pink-600 dark:text-pink-400 bg-pink-50/80 dark:bg-pink-900/20" />
              {messages.map(m => (
                <ResultItem
                  key={m.id}
                  icon={MessageSquare}
                  title={m.content?.substring(0, 80) || 'Message'}
                  subtitle={m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                  onClick={() => go('/workspace/chat', m.content?.substring(0, 20))}
                  highlight={query}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {(hasResults || showHistory) && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex justify-between">
          <span>Click to navigate</span>
          <span><kbd className="font-sans px-1 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">Esc</kbd> to close</span>
        </div>
      )}
    </div>
  );
};

export default SearchResultsDropdown;
