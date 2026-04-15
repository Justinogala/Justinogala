
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, Save, X, User as UserIcon } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const UserProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.name || '',
    avatar_url: user?.avatar_url || user?.avatar || '',
    workplace_id: user?.workplace_id || 'default'
  });

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select an image file (JPEG, PNG, WebP, or GIF).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Image must be under 5 MB.' });
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/users/${user.id}/avatar`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setFormData(prev => ({ ...prev, avatar_url: data.avatar_url }));
      toast({ title: 'Photo uploaded', description: 'Your profile picture has been updated.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setIsEditing(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || user?.name || '',
      avatar_url: user?.avatar_url || user?.avatar || '',
      workplace_id: user?.workplace_id || 'default'
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="bg-transparent">
        <Helmet><title>My Profile - Munal</title></Helmet>
        
        <div className="container mx-auto py-2 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Profile Settings</h1>
              <p className="text-violet-600 dark:text-violet-400 mt-1 font-medium">Manage your personal information and preferences.</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="default" className="w-fit">
                Edit Profile
              </Button>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Sidebar Card */}
            <Card variant="purple" className="md:col-span-1 border-violet-100 dark:border-violet-900/30 h-fit">
              <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-20 rounded-full"></div>
                  <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-900 shadow-xl shadow-violet-500/10 relative z-10">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 dark:from-violet-900 dark:to-purple-900 dark:text-violet-300">
                      {(user.full_name || user.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div
                      data-testid="avatar-upload-overlay"
                      onClick={handleAvatarClick}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px] z-20"
                    >
                      {isUploading ? (
                        <Loader2 className="text-white w-8 h-8 animate-spin" />
                      ) : (
                        <Camera className="text-white w-8 h-8" />
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="avatar-file-input"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {user.full_name || user.name || 'User'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>
                
                <div className="w-full flex flex-col gap-2">
                  <div className="px-4 py-2 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-xs text-violet-700 dark:text-violet-300 font-bold uppercase tracking-wider border border-violet-100 dark:border-violet-800">
                    {user.role || 'Member'}
                  </div>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-gray-500 border border-gray-100 dark:border-gray-800">
                    Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Form Card */}
            <Card variant="purple" className="md:col-span-2 border-violet-100 dark:border-violet-900/30">
              <CardHeader className="pb-4 border-b border-violet-50 dark:border-violet-900/20">
                <CardTitle className="text-xl text-gray-900 dark:text-white">Account Information</CardTitle>
                <CardDescription className="text-violet-500/80">Update your personal details and workspace preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</Label>
                    <Input 
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      disabled={!isEditing}
                      className="h-11 rounded-xl focus:ring-violet-500/20"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</Label>
                    <div className="relative">
                      <Input 
                        value={user.email} 
                        disabled 
                        className="h-11 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-gray-500" 
                      />
                    </div>
                    <p className="text-[11px] text-violet-600/70 dark:text-violet-400/70 font-medium">Email cannot be changed directly for security reasons.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Primary Workplace</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-gray-900 dark:text-white"
                      disabled={!isEditing}
                      value={formData.workplace_id}
                      onChange={e => setFormData({...formData, workplace_id: e.target.value})}
                    >
                      <option value="default">Personal Workspace</option>
                      <option value="wp_123">Engineering Team</option>
                      <option value="wp_456">Product Team</option>
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-6 border-t border-violet-50 dark:border-violet-900/20 mt-8">
                    <Button variant="ghost" onClick={handleCancel} disabled={isLoading} className="rounded-xl px-6 text-gray-500 hover:text-violet-600">
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} variant="default" className="rounded-xl px-8">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserProfilePage;
