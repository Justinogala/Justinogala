
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare as MessageSquareOff, Users } from 'lucide-react';
import RecentChatItem from './RecentChatItem';
import RecentChatSearch from './RecentChatSearch';
import RecentChatSort from './RecentChatSort';

const RecentChatList = ({ chats = [], onDelete, onArchive, onChatClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const filteredAndSortedChats = useMemo(() => {
    // Safe guard if chats is null
    if (!chats) return [];
    
    let result = [...chats];

    // Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(chat => 
        (chat.user?.name || '').toLowerCase().includes(lowerQuery) ||
        (chat.user?.email || '').toLowerCase().includes(lowerQuery)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'unread') {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      } else if (sortBy === 'alphabetical') {
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      } else {
        // Default: Most Recent (approximated by ID/Index order since we use 'relative' strings like "2 hours ago" in demo)
        // In a real app we'd parse timestamps. For now, keep original demo order.
        return 0; 
      }
    });

    return result;
  }, [chats, searchQuery, sortBy]);

  // Empty State - No chats loaded at all
  if (!chats || chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
        <p className="text-gray-500 max-w-sm mt-1">
          Wait for the user list to load or try refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <RecentChatSearch onSearch={setSearchQuery} />
        <RecentChatSort sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedChats.length > 0 ? (
            filteredAndSortedChats.map((chat) => (
              <RecentChatItem
                key={chat.id}
                chat={chat}
                onClick={() => onChatClick(chat.id)}
                onDelete={onDelete}
                onArchive={onArchive}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
               <MessageSquareOff className="w-10 h-10 text-gray-300 mb-2" />
               <p className="text-gray-500">No matches found for "{searchQuery}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* List Footer Stats */}
      <div className="text-center text-xs text-gray-400 mt-6 pb-2">
        Showing {filteredAndSortedChats.length} of {chats.length} conversations
      </div>
    </div>
  );
};

export default RecentChatList;
