import React from 'react';
import { User, Lock, Smartphone, Shield, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

const AdminProfile = () => {
  const { adminUser } = useAuth();

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-3xl mb-4 border-2 border-indigo-200 dark:border-indigo-500/30">
                  {adminUser?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <h2 className="text-xl font-bold">{adminUser?.username || 'Administrator'}</h2>
                <p className="text-sm text-gray-500">Super Admin</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  Privileged Access
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forms */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input defaultValue={adminUser?.username} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input defaultValue="admin@echonote.ai" />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and 2FA settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" />
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Secure your account with 2FA.</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                
                <Button className="mt-4">Update Security Settings</Button>
              </CardContent>
            </Card>

            <Card>
               <CardHeader>
                 <CardTitle>Active Sessions</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Smartphone className="w-5 h-5 text-gray-400" />
                           <div>
                              <p className="text-sm font-medium">Chrome on Windows</p>
                              <p className="text-xs text-gray-500">New York, USA • Current Session</p>
                           </div>
                        </div>
                        <span className="text-xs text-green-500 font-medium">Active Now</span>
                     </div>
                     <div className="flex items-center justify-between opacity-60">
                        <div className="flex items-center gap-3">
                           <Smartphone className="w-5 h-5 text-gray-400" />
                           <div>
                              <p className="text-sm font-medium">Safari on iPhone</p>
                              <p className="text-xs text-gray-500">London, UK • 2 hours ago</p>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">Revoke</Button>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminProfile;