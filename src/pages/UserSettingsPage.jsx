
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Shield, AlertTriangle, Music, Lock, Download, HardDrive } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import AccountSettingsSection from '@/components/settings/AccountSettingsSection';
import NotificationsSettingsSection from '@/components/settings/NotificationsSettingsSection';
import PrivacySettingsSection from '@/components/settings/PrivacySettingsSection';
import DangerZoneSection from '@/components/settings/DangerZoneSection';
import CallRingtoneSettings from '@/components/video/CallRingtoneSettings';
import UserTwoFactorSetup from '@/components/UserTwoFactorSetup';
import SoftwareUpdateSection from '@/components/settings/SoftwareUpdateSection';
import StorageManagementSection from '@/components/settings/StorageManagementSection';
import { useAuth } from '@/context/AuthContext';

const UserSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useAuth();

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-violet-50/30 dark:bg-slate-950 pb-12">
        <Helmet>
          <title>Settings - Munal</title>
          <meta name="description" content="Manage your account settings, notifications, and privacy." />
        </Helmet>
        
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
            <p className="text-violet-600 dark:text-violet-400 font-medium">Manage your account settings and preferences.</p>
          </div>

          <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap w-full justify-start mb-8 p-1 bg-white/50 dark:bg-slate-900/50 border border-violet-100 dark:border-violet-900/30 rounded-xl h-auto gap-1 backdrop-blur-sm">
              <TabsTrigger 
                value="account" 
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
              >
                <User className="w-4 h-4 mr-2 hidden sm:inline" />
                Account
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
              >
                <Bell className="w-4 h-4 mr-2 hidden sm:inline" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="ringtone"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
              >
                <Music className="w-4 h-4 mr-2 hidden sm:inline" />
                Sound
              </TabsTrigger>
              <TabsTrigger 
                value="privacy"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
              >
                <Shield className="w-4 h-4 mr-2 hidden sm:inline" />
                Privacy
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
              >
                <Lock className="w-4 h-4 mr-2 hidden sm:inline" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="storage"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
                data-testid="storage-tab"
              >
                <HardDrive className="w-4 h-4 mr-2 hidden sm:inline" />
                Storage
              </TabsTrigger>
              <TabsTrigger 
                value="danger"
                className="data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950/20 data-[state=active]:text-red-600 hover:text-red-500 transition-all rounded-lg px-4 py-2"
              >
                <AlertTriangle className="w-4 h-4 mr-2 hidden sm:inline" />
                Danger
              </TabsTrigger>
              <TabsTrigger 
                value="update"
                className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 rounded-lg px-4 py-2 transition-all hover:text-violet-600"
                data-testid="update-tab"
              >
                <Download className="w-4 h-4 mr-2 hidden sm:inline" />
                Update
              </TabsTrigger>
            </TabsList>
            
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              className="bg-white dark:bg-slate-900/50 rounded-xl border border-violet-100 dark:border-violet-900/30 p-6 shadow-xl shadow-violet-500/5"
            >
              <TabsContent value="account" className="mt-0 focus-visible:outline-none">
                <AccountSettingsSection />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
                <NotificationsSettingsSection />
              </TabsContent>

              <TabsContent value="ringtone" className="mt-0 focus-visible:outline-none">
                <CallRingtoneSettings />
              </TabsContent>

              <TabsContent value="privacy" className="mt-0 focus-visible:outline-none">
                <PrivacySettingsSection />
              </TabsContent>

              <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                <UserTwoFactorSetup user={user} />
              </TabsContent>

              <TabsContent value="storage" className="mt-0 focus-visible:outline-none">
                <StorageManagementSection />
              </TabsContent>

              <TabsContent value="danger" className="mt-0 focus-visible:outline-none">
                <DangerZoneSection />
              </TabsContent>

              <TabsContent value="update" className="mt-0 focus-visible:outline-none">
                <SoftwareUpdateSection />
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserSettingsPage;
