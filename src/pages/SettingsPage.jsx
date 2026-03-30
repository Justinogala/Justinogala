
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Shield, User, RotateCcw } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tourResetting, setTourResetting] = useState(false);

  const restartTour = async () => {
    if (!user?.id) return;
    setTourResetting(true);
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/users/${user.id}/onboarding`, { method: 'DELETE' });
      localStorage.removeItem(`munal_onboarding_${user.id}`);
      toast({ title: 'Tour reset! Refresh the page to see the walkthrough again.' });
    } catch {
      toast({ title: 'Failed to reset tour', variant: 'destructive' });
    } finally {
      setTourResetting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Settings - Munal</title>
          <meta name="description" content="Manage your account settings and preferences." />
        </Helmet>
        
        {/* Header component is intentionally omitted here */}
        
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <User className="w-8 h-8 text-indigo-500" />
              Settings
            </h1>
            <p className="text-text-secondary">Manage your account preferences, notifications, and security configurations.</p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6 bg-bg-primary border border-border">
              <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30">
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30">
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and how others see you on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-text-primary">Full Name</Label>
                      <Input 
                        id="name" 
                        defaultValue="John Doe" 
                        className="bg-bg-primary text-gray-900 dark:text-gray-100 border-border" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-text-primary">Email Address</Label>
                      <Input 
                        id="email" 
                        defaultValue="john@example.com" 
                        disabled 
                        className="bg-bg-secondary text-gray-500 border-border cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                      onClick={() => {
                        // Success toast for implementation placeholder
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Restart Tour Card */}
              <Card className="border-border shadow-sm mt-6">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-semibold text-text-primary">Platform Tour</p>
                    <p className="text-sm text-text-secondary">Replay the onboarding walkthrough to rediscover features.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={restartTour}
                    disabled={tourResetting}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    data-testid="restart-tour-btn"
                  >
                    <RotateCcw className={`w-4 h-4 mr-1.5 ${tourResetting ? 'animate-spin' : ''}`} />
                    {tourResetting ? 'Resetting...' : 'Restart Tour'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how and when you want to receive updates from Munal.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-primary/50">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                           <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                         </div>
                         <div>
                           <p className="font-semibold text-text-primary">Email Notifications</p>
                           <p className="text-sm text-text-secondary">Receive daily summaries and meeting highlights via email.</p>
                         </div>
                       </div>
                       <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                         Enabled
                       </Button>
                     </div>
                     <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-primary/50">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                           <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                         </div>
                         <div>
                           <p className="font-semibold text-text-primary">Push Notifications</p>
                           <p className="text-sm text-text-secondary">Get real-time alerts for shared transcripts and comments.</p>
                         </div>
                       </div>
                       <Button variant="outline" size="sm" className="text-text-secondary">
                         Disabled
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Security & Access</CardTitle>
                  <CardDescription>Manage your authentication methods and secure your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-primary/50">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                           <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                         </div>
                         <div>
                           <p className="font-semibold text-text-primary">Two-Factor Authentication</p>
                           <p className="text-sm text-text-secondary">Secure your account with an additional verification step.</p>
                         </div>
                       </div>
                       <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                         Configure 2FA
                       </Button>
                     </div>
                     <div className="pt-4">
                       <Button variant="link" className="text-indigo-600 dark:text-indigo-400 p-0 h-auto">
                         Change Account Password
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default SettingsPage;
