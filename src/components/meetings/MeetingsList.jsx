
import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, Grid, List as ListIcon, Plus, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MeetingCard from './MeetingCard';
import { motion, AnimatePresence } from 'framer-motion';

const MeetingsList = ({ 
  meetings = [], 
  onView, 
  onEdit, 
  onDelete, 
  onCreateNew,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterType, setFilterType] = useState('all'); 
  const [visibleCount, setVisibleCount] = useState(6);

  // Process and filter meetings
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    
    let result = [...meetings];

    // Filter
    if (filterType === 'favorites') {
      result = result.filter(m => m.isFavorite);
    } else if (filterType === 'recorded') {
      result = result.filter(m => m.hasRecording);
    } else if (filterType === 'upcoming') {
      result = result.filter(m => {
        if (!m.date) return false;
        const meetDate = new Date(`${m.date}T${m.time || '00:00'}`);
        return meetDate > new Date();
      });
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) || 
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.participants && Array.isArray(m.participants) && m.participants.some(p => 
          typeof p === 'string' ? p.toLowerCase().includes(q) : p.name.toLowerCase().includes(q)
        ))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Default dates if missing to avoid crashes, though data should be valid
      const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`) : new Date(0);
      const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`) : new Date(0);

      switch (sortBy) {
        case 'date-desc': return dateB - dateA; // Newest/Future first
        case 'date-asc': return dateA - dateB; // Oldest first
        case 'title-asc': return (a.title || '').localeCompare(b.title || '');
        case 'created-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default: return 0;
      }
    });

    return result;
  }, [meetings, searchQuery, sortBy, filterType]);

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search meetings..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(6); }}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setVisibleCount(6); }}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meetings</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
              <SelectItem value="recorded">Recorded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setVisibleCount(6); }}>
            <SelectTrigger className="w-[160px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="created-desc">Recently Created</SelectItem>
            </SelectContent>
          </Select>

          <div className="border-l border-slate-200 dark:border-slate-700 h-8 mx-1 hidden sm:block" />

          <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          
          <Button onClick={onCreateNew} className="bg-violet-600 hover:bg-violet-700 text-white ml-2 whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> New Meeting
          </Button>
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No meetings found</h3>
          <p className="text-slate-500 mb-6">Try adjusting your search or filters, or create a new meeting.</p>
          <Button onClick={onCreateNew} variant="outline">
            Schedule a Meeting
          </Button>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            <AnimatePresence>
              {filteredMeetings.slice(0, visibleCount).map((meeting) => (
                <motion.div
                  key={meeting.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <MeetingCard 
                    meeting={meeting}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filteredMeetings.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => setVisibleCount(prev => prev + 6)}
                variant="outline"
                className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-900/20"
                data-testid="view-more-meetings-btn"
              >
                View More ({filteredMeetings.length - visibleCount} remaining)
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MeetingsList;
