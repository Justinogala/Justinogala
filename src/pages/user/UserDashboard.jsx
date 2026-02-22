
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  HardDrive, 
  Plus, 
  FileText, 
  Shield,
  Zap,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Import local components
import NewMeetingModal from '@/components/user/NewMeetingModal';
import RecentFilesSection from '@/components/user/RecentFilesSection';
import MeetingListSection from '@/components/user/MeetingListSection';
import APIStatus from '@/components/APIStatus';
import UserPaymentDashboardWidget from '@/components/user/UserPaymentDashboardWidget';
import TranscriptionWidget from '@/components/TranscriptionWidget';
import StatsCard from '@/components/dashboard/StatsCard';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Modal State
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  
  // Triggers
  const [refreshFilesTrigger, setRefreshFilesTrigger] = useState(0);
  const [refreshMeetingsTrigger, setRefreshMeetingsTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Total Transcriptions', value: '24', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Team Members', value: '8', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Storage Used', value: '4.2 GB', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Apps Connected', value: '3', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const handleMeetingSuccess = () => {
    setRefreshMeetingsTrigger(prev => prev + 1);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-10 font-sans pb-20 sm:pb-16">
      <Helmet>
        <title>Dashboard | Munal</title>
      </Helmet>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        className="max-w-7xl mx-auto space-y-8 lg:space-y-12"
        variants={container}
        initial="hidden"
        animate="show"
      >
        
        {/* Modern Header Section */}
        <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-gray-200/50 dark:border-gray-800/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base md:text-lg">
              You have <span className="font-semibold text-gray-900 dark:text-white">3 meetings</span> scheduled for today.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              onClick={() => navigate('/meetings')} 
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 border-0 w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Meeting
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="h-28 md:h-32">
               <StatsCard {...stat} delay={index * 0.1} />
            </div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Main) */}
          <motion.div variants={item} className="lg:col-span-8 space-y-8 lg:space-y-12">
            
            {/* Quick Actions */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'New Meeting', icon: Plus, color: 'text-indigo-500', bg: 'bg-indigo-500/10', action: () => navigate('/meetings') },
                  { label: 'Transcriptions', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', action: () => navigate('/transcriptions') },
                  { label: 'Create Team', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10', action: () => navigate('/workspaces') },
                  { label: 'Analytics', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-500/10', action: () => navigate('/analytics') }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    className="flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group shadow-sm touch-target"
                  >
                    <div className={`p-3 rounded-full ${action.bg} mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`w-6 h-6 md:w-7 md:h-7 ${action.color}`} />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meetings Section */}
            <div className="min-h-[300px]">
              <MeetingListSection refreshTrigger={refreshMeetingsTrigger} />
            </div>

            {/* Activity/Files Section */}
            <div className="min-h-[300px]">
              <RecentFilesSection refreshTrigger={refreshFilesTrigger} />
            </div>

          </motion.div>

          {/* Right Column (Sidebar) */}
          <motion.div variants={item} className="lg:col-span-4 space-y-8 lg:space-y-12">
            
            {/* Transcriptions Widget */}
            <div className="h-[420px]">
              <TranscriptionWidget />
            </div>

            {/* Payment Widget */}
            <div className="h-[300px]">
               <UserPaymentDashboardWidget />
            </div>

            {/* Security Status */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" /> Security
                </h3>
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider">Secure</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-slate-900/30 border border-transparent hover:border-gray-200/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Password</p>
                      <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/profile')}>Update</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-slate-900/30 border border-transparent hover:border-gray-200/50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                       <Shield className="w-4 h-4 text-gray-500" />
                     </div>
                     <div>
                       <p className="text-sm font-semibold">2FA Auth</p>
                       <p className="text-xs text-gray-500">Not enabled</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600" onClick={() => navigate('/profile')}>Enable</Button>
                </div>
              </div>
            </div>

            {/* API Status */}
            <div className="pt-2">
               <APIStatus />
            </div>

          </motion.div>
        </div>
      </motion.div>

      {/* Inline Modals */}
      <NewMeetingModal 
        isOpen={showNewMeetingModal} 
        onClose={() => setShowNewMeetingModal(false)}
        onSuccess={handleMeetingSuccess}
      />
      
    </div>
  );
};

export default UserDashboard;
