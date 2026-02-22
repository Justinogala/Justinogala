
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Download, Trash2, Loader2 } from 'lucide-react';

const DangerZoneSection = () => {
  const { deleteAccount, exportUserData, loading } = useUserSettings();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  
  const handleDelete = async () => {
    const success = await deleteAccount(confirmEmail);
    if (success) {
      setDeleteDialogOpen(false);
      // In a real app, you would redirect to logout/home here
    }
  };

  const isEmailMatch = user?.email && confirmEmail === user.email;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download a copy of your personal data, including profile details and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your data will be compiled into a JSON file and emailed to you. This process may take a few minutes depending on the amount of data.
          </p>
          <Button variant="outline" onClick={exportUserData} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export My Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/30 shadow-sm bg-red-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Deleting your account is permanent. All your data, including transcripts, summaries, and settings will be wiped immediately. You cannot undo this action.
          </p>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Delete Account?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Type <span className="font-mono font-bold text-foreground">{user?.email}</span> to confirm:</Label>
                  <Input 
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={user?.email}
                    className="border-red-200 focus-visible:ring-red-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={!isEmailMatch || loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default DangerZoneSection;
