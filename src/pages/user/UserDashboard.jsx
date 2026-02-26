import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, Users, HardDrive, Plus, FileText, Shield, Zap, Lock, 
  ArrowUpRight, Sparkles, TrendingUp, Clock, Calendar, Video, Mic,
  MessageSquare, Play, ChevronRight, Star, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

import NewMeetingModal from '@/components/user/NewMeetingModal';
import RecentFilesSection from '@/components/user/RecentFilesSection';
import MeetingListSection from '@/components/user/MeetingListSection';
import APIStatus from '@/components/APIStatus';
import UserPaymentDashboardWidget from '@/components/user/UserPaymentDashboardWidget';
import TranscriptionWidget from '@/components/TranscriptionWidget';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [refreshFilesTrigger, setRefreshFilesTrigger] = useState(0);
  const [refreshMeetingsTrigger, setRefreshMeetingsTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleMeetingSuccess = () => {
    setRefreshMeetingsTrigger(prev => prev + 1);
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const stats = [
    { label: 'Transcriptions', value: '24', change: '+12%', icon: FileText, gradient: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/25' },
    { label: 'Team Members', value: '8', change: '+2', icon: Users, gradient: 'from-emerald-500 to-green-500', shadowColor: 'shadow-emerald-500/25' },
    { label: 'Storage', value: '4.2 GB', change: '42%', icon: HardDrive, gradient: 'from-violet-500 to-purple-500', shadowColor: 'shadow-violet-500/25' },
    { label: 'Integrations', value: '3', change: 'Active', icon: Zap, gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/25' },
  ];

  const quickActions = [
    { label: 'New Meeting', icon: Video, gradient: 'from-violet-500 to-indigo-500', action: () => navigate('/meetings'), description: 'Start a meeting' },
    { label: 'Record', icon: Mic, gradient: 'from-rose-500 to-pink-500', action: () => navigate('/quick-record'), description: 'Screen or camera', badge: 'NEW' },
    { label: 'Transcribe', icon: FileText, gradient: 'from-blue-500 to-cyan-500', action: () => navigate('/transcriptions'), description: 'Audio to text' },
    { label: 'Chat', icon: MessageSquare, gradient: 'from-emerald-500 to-green-500', action: () => navigate('/workspace/chat'), description: 'Team messages' },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPlanInfo = () => {
    const plan = user?.plan || 'Free';
    if (plan === 'Enterprise') return { icon: Crown, color: 'from-amber-400 to-orange-500', label: 'Enterprise' };
    if (plan === 'Pro') return { icon: Sparkles, color: 'from-violet-400 to-purple-500', label: 'Pro' };
    return null;
  };

  const planInfo = getPlanInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <Helmet><title>Dashboard | Munal AI</title></Helmet>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div className="max-w-7xl mx-auto space-y-8" variants={container} initial="hidden" animate="show">
        
        {/* Header */}
        <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              {planInfo && (
                <span className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${planInfo.color} text-white text-xs font-bold shadow-lg flex items-center gap-1.5`}>
                  <planInfo.icon className="w-3.5 h-3.5" />
                  {planInfo.label}
                </span>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base lg:text-lg">
              You have <span className="font-semibold text-gray-800 dark:text-gray-200">3 meetings</span> scheduled today
            </p>
          </div>
          
          <div className="flex gap-3 w-full lg:w-auto">
            <Button 
              onClick={() => navigate('/meetings')} 
              size="lg"
              className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Meeting
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative group"
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
              <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h2>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  onClick={action.action}
                  className="relative group p-5 rounded-2xl bg-gray-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    {action.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                  <ArrowUpRight className="absolute bottom-4 right-4 w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <motion.div variants={item} className="lg:col-span-8 space-y-6">
            <MeetingListSection refreshTrigger={refreshMeetingsTrigger} />
            <RecentFilesSection refreshTrigger={refreshFilesTrigger} />
          </motion.div>

          {/* Right Column */}
          <motion.div variants={item} className="lg:col-span-4 space-y-6">
            <TranscriptionWidget />
            <UserPaymentDashboardWidget />
            
            {/* Security Card */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Security
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                  Secure
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-slate-800/50 group hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</p>
                      <p className="text-xs text-gray-500">Changed 30d ago</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-slate-800/50 group hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      <Shield className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">2FA Auth</p>
                      <p className="text-xs text-amber-600">Not enabled</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Enable</span>
                </div>
              </div>
            </div>

            <APIStatus />
          </motion.div>
        </div>
      </motion.div>

      <NewMeetingModal 
        isOpen={showNewMeetingModal} 
        onClose={() => setShowNewMeetingModal(false)}
        onSuccess={handleMeetingSuccess}
      />
    </div>
  );
};

export default UserDashboard;
