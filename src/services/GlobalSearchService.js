
import { meetingService } from './meetingService';
import { transcriptionHistoryService } from './transcriptionHistoryService';

const SEARCH_HISTORY_KEY = 'munal_search_history';

export const GlobalSearchService = {
  /**
   * Perform a global search across meetings and transcriptions
   * @param {string} query - The search query
   * @param {string} userId - Current user ID (optional, for filtering)
   */
  search: async (query, userId) => {
    if (!query || query.trim().length < 2) return { meetings: [], transcriptions: [] };

    const normalizedQuery = query.toLowerCase().trim();
    const results = {
      meetings: [],
      transcriptions: []
    };

    try {
      // 1. Search Meetings
      // Try to get meetings from service, fallback to empty array if fails
      let allMeetings = [];
      try {
        // Assuming meetingService.getMeetings returns a promise or data
        // If it requires a userId, we pass it.
        const meetingsData = await meetingService.getMeetings(userId); 
        allMeetings = Array.isArray(meetingsData) ? meetingsData : [];
      } catch (err) {
        console.warn('Failed to fetch meetings for search', err);
        // Fallback: Try reading from localStorage if service fails
        const localEvents = localStorage.getItem('calendar_events');
        if (localEvents) {
          allMeetings = JSON.parse(localEvents).filter(e => e.type === 'meeting');
        }
      }

      results.meetings = allMeetings.filter(meeting => {
        const titleMatch = (meeting.title || meeting.summary || '').toLowerCase().includes(normalizedQuery);
        const descMatch = (meeting.description || '').toLowerCase().includes(normalizedQuery);
        const locationMatch = (meeting.location || '').toLowerCase().includes(normalizedQuery);
        return titleMatch || descMatch || locationMatch;
      }).slice(0, 5); // Limit to 5

      // 2. Search Transcriptions
      let allTranscriptions = [];
      try {
        // transcriptionHistoryService usually exposes getTranscriptions which might be sync or async
        // We'll await it just in case
        const transData = await transcriptionHistoryService.getTranscriptions();
        allTranscriptions = Array.isArray(transData) ? transData : [];
      } catch (err) {
        console.warn('Failed to fetch transcriptions for search', err);
         // Fallback
         const localTrans = localStorage.getItem('transcription_history');
         if (localTrans) {
           allTranscriptions = JSON.parse(localTrans);
         }
      }

      results.transcriptions = allTranscriptions.filter(item => {
        const titleMatch = (item.title || item.fileName || '').toLowerCase().includes(normalizedQuery);
        const textMatch = (item.transcribedText || item.text || '').toLowerCase().includes(normalizedQuery);
        return titleMatch || textMatch;
      }).slice(0, 5); // Limit to 5

      return results;

    } catch (error) {
      console.error('Global search error:', error);
      return { meetings: [], transcriptions: [] };
    }
  },

  getRecentSearches: () => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      return [];
    }
  },

  addRecentSearch: (term) => {
    if (!term || !term.trim()) return;
    try {
      const history = GlobalSearchService.getRecentSearches();
      // Remove duplicates and keep only last 10
      const newHistory = [
        { term: term.trim(), timestamp: new Date().toISOString() },
        ...history.filter(item => item.term.toLowerCase() !== term.trim().toLowerCase())
      ].slice(0, 10);
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  },

  clearHistory: () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }
};
