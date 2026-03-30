
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { validatePassword, validatePasswordMatch } from '@/utils/settingsValidation';
import { Loader2, User, Lock, Building, RotateCcw } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const AccountSettingsSection = () => {
  const { user } = useAuth();
  const { updatePassword, loading } = useUserSettings();
  const { toast } = useToast();
  const [tourResetting, setTourResetting] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [errors, setErrors] = useState({});

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    // Validate
    const passError = validatePassword(passwordForm.new);
    if (passError) newErrors.new = passError;
    
    const matchError = validatePasswordMatch(passwordForm.new, passwordForm.confirm);
    if (matchError) newErrors.confirm = matchError;
    
    if (!passwordForm.current) newErrors.current = "Current password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = await updatePassword(passwordForm.current, passwordForm.new);
    if (success) {
      setPasswordForm({ current: '', new: '', confirm: '' });
      setErrors({});
    }
  };

  return (
    <div className="space-y-6">
      {/* General Info Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            General Information
          </CardTitle>
          <CardDescription>
            Your basic account details. Contact support to update these.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                defaultValue={user?.user_metadata?.full_name || "John Doe"} 
                disabled 
                className="bg-gray-50 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                defaultValue={user?.email} 
                disabled 
                className="bg-gray-50 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  defaultValue="Primary Workspace" 
                  disabled 
                  className="pl-9 bg-gray-50 dark:bg-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input 
                defaultValue="Admin" 
                disabled 
                className="bg-gray-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            Change Password
          </CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                error={errors.current}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password"
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  error={errors.new}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  error={errors.confirm}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Platform Tour Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Platform Tour</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Replay the onboarding walkthrough to rediscover features.</p>
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
    </div>
  );
};

export default AccountSettingsSection;
