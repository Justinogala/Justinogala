
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Clock, ChevronRight, History, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Highlight = ({ text = '', highlight = '' }) => {
  if (!highlight || !text) return <span className="truncate">{text}</span>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span className="truncate">
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100 rounded px-0.5 font-medium">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const ResultItem = ({ icon: Icon, title, subtitle, timestamp, onClick, type, highlight }) => (
  <motion.button
    layout
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 group transition-all duration-200 border border-transparent hover:border-violet-100 dark:hover:border-violet-800/50 text-left"
  >
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100/50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-200">
      <Icon className="w-5 h-5" />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
          <Highlight text={title} highlight={highlight} />
        </h4>
        {type && (
          <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 text-gray-500">
            {type}
          </Badge>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
        <span>{timestamp}</span>
        {subtitle && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="truncate max-w-[150px] opacity-80">
              <Highlight text={subtitle} highlight={highlight} />
            </span>
          </>
        )}
      </p>
    </div>
    
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
  </motion.button>
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
  const hasResults = results.meetings.length > 0 || results.transcriptions.length > 0;
  const showHistory = !query && recentSearches.length > 0;

  const handleResultClick = (id, type, title) => {
    onAddToHistory(query || title); // Add search term or title to history
    onClose();
    if (type === 'meeting') {
      navigate(`/meeting/${id}`);
    } else {
      navigate(`/transcriptions/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-violet-100 dark:border-violet-800 rounded-2xl shadow-2xl shadow-violet-500/20 overflow-hidden z-[60]"
    >
      <ScrollArea className="max-h-[70vh] sm:max-h-[500px]">
        <div className="p-2">
          
          {/* Recent Searches */}
          {showHistory && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> Recent</span>
                <button 
                  onClick={onClearHistory}
                  className="hover:text-red-500 transition-colors flex items-center gap-1"
                >
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
                  <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Results Sections */}
          {query && !hasResults && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium">No results found</p>
              <p className="text-sm text-gray-500">We couldn't find anything matching "{query}"</p>
            </div>
          )}

          {hasResults && (
            <>
              {results.meetings.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider bg-violet-50/50 dark:bg-violet-900/10 rounded-md mb-1 mx-1">
                    Meetings ({results.meetings.length})
                  </div>
                  {results.meetings.map(meeting => (
                    <ResultItem
                      key={meeting.id}
                      icon={Calendar}
                      title={meeting.title || "Untitled Meeting"}
                      subtitle={meeting.location || meeting.summary?.substring(0, 50)}
                      timestamp={new Date(meeting.startTime || meeting.created_at || Date.now()).toLocaleDateString()}
                      type="Meeting"
                      highlight={query}
                      onClick={() => handleResultClick(meeting.id, 'meeting', meeting.title)}
                    />
                  ))}
                </div>
              )}

              {results.transcriptions.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider bg-pink-50/50 dark:bg-pink-900/10 rounded-md mb-1 mx-1">
                    Transcriptions ({results.transcriptions.length})
                  </div>
                  {results.transcriptions.map(trans => (
                    <ResultItem
                      key={trans.id}
                      icon={FileText}
                      title={trans.title || trans.fileName || "Untitled"}
                      subtitle={trans.transcribedText?.substring(0, 60)}
                      timestamp={new Date(trans.uploadDate || Date.now()).toLocaleDateString()}
                      type="Transcription"
                      highlight={query}
                      onClick={() => handleResultClick(trans.id, 'transcription', trans.title)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Hint */}
      {(hasResults || showHistory) && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex justify-between">
          <span>Press <kbd className="font-sans px-1 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">↵</kbd> to select</span>
          <span><kbd className="font-sans px-1 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">Esc</kbd> to close</span>
        </div>
      )}
    </motion.div>
  );
};

export default SearchResultsDropdown;
