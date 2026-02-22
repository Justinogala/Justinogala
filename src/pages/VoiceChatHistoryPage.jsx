
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { voiceChatHistoryService } from '@/services/VoiceChatHistoryService';
import HistoryStats from '@/components/voice/HistoryStats';
import SearchBar from '@/components/voice/SearchBar';
import SortOptions from '@/components/voice/SortOptions';
import HistoryList from '@/components/voice/HistoryList';
import DeleteConfirmation from '@/components/voice/DeleteConfirmation';
import ClearAllConfirmation from '@/components/voice/ClearAllConfirmation';
import PageTransition from '@/components/PageTransition';

const VoiceChatHistoryPage = ({ onStartNew, onViewDetail }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalDuration: 0,
    mostFrequentContact: 'None'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const updateData = () => {
      setHistory(voiceChatHistoryService.getHistory());
      setStats(voiceChatHistoryService.getStats());
    };

    updateData();
    const unsubscribe = voiceChatHistoryService.subscribe(updateData);
    return () => unsubscribe();
  }, []);

  const handleDelete = () => {
    if (deleteId) {
      voiceChatHistoryService.deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  const handleClearAll = () => {
    voiceChatHistoryService.clearAllHistory();
  };

  const filteredAndSortedHistory = history
    .filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        (item.userName && item.userName.toLowerCase().includes(query)) ||
        (item.transcript && item.transcript.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'duration_desc':
          return b.duration - a.duration;
        case 'duration_asc':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

  return (
    <PageTransition>
      <div className="space-y-6">
        <Helmet>
          <title>Voice Chat History | Munal</title>
        </Helmet>

        <HistoryStats stats={stats} />

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SortOptions value={sortBy} onChange={setSortBy} />
            <ClearAllConfirmation onConfirm={handleClearAll} />
          </div>
        </div>

        <HistoryList
          items={filteredAndSortedHistory}
          onDelete={(item) => setDeleteId(item.id)}
          onView={onViewDetail}
          onStartNew={onStartNew}
        />

        <DeleteConfirmation
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
};

export default VoiceChatHistoryPage;
