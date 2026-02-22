
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

import ModernMeetingsDashboard from '@/components/meetings/ModernMeetingsDashboard';
import MeetingScheduler from '@/components/meetings/MeetingScheduler';
import MeetingHistorySection from '@/components/meetings/MeetingHistorySection';

const MeetingsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const handleJoinMeeting = (meetingId) => {
    navigate(`/meeting/${meetingId}/live`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <Helmet>
        <title>Meetings | Munal AI</title>
        <meta name="description" content="Manage your video conferences, schedule meetings, and view history." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          
          {/* Navigation Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <TabsTrigger value="dashboard" className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                History
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
                <ModernMeetingsDashboard 
                  onScheduleClick={() => setActiveTab('schedule')}
                  onJoinClick={handleJoinMeeting}
                />
              </TabsContent>

              <TabsContent value="schedule" className="m-0 focus-visible:outline-none">
                <MeetingScheduler 
                  onSchedule={(data) => {
                    console.log('Scheduled', data);
                    setActiveTab('dashboard');
                  }}
                  onCancel={() => setActiveTab('dashboard')}
                />
              </TabsContent>

              <TabsContent value="history" className="m-0 focus-visible:outline-none">
                <MeetingHistorySection />
              </TabsContent>
            </motion.div>
          </AnimatePresence>

        </Tabs>
      </div>
    </div>
  );
};

export default MeetingsPage;
