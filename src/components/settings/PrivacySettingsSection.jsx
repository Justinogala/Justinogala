
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Shield, Users, Eye, FileText, PieChart, Loader2 } from 'lucide-react';

const PrivacySettingsSection = () => {
  const { privacySettings, updatePrivacySettings, loading } = useUserSettings();
  const [localSettings, setLocalSettings] = useState(privacySettings);

  useEffect(() => {
    setLocalSettings(privacySettings);
  }, [privacySettings]);

  const handleToggle = (key) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updatePrivacySettings(localSettings);
  };

  const PrivacyItem = ({ icon: Icon, title, description, checked, onCheckedChange }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded-lg mt-1">
          <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-1">
          <Label className="text-base font-medium cursor-pointer" onClick={() => onCheckedChange(!checked)}>
            {title}
          </Label>
          <p className="text-sm text-muted-foreground max-w-lg">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Privacy & Security
        </CardTitle>
        <CardDescription>
          Manage your data visibility and sharing preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PrivacyItem
          icon={Eye}
          title="Profile Visibility"
          description="Allow other users in your workspace to find you by email and view your basic profile information."
          checked={localSettings.profileVisibility}
          onCheckedChange={() => handleToggle('profileVisibility')}
        />
        <PrivacyItem
          icon={Users}
          title="Auto-Share Meetings"
          description="Automatically share meeting notes with all participants who are also workspace members."
          checked={localSettings.meetingSharing}
          onCheckedChange={() => handleToggle('meetingSharing')}
        />
        <PrivacyItem
          icon={FileText}
          title="Transcript Sharing"
          description="Allow anyone with the link to view the full transcript of your public meetings."
          checked={localSettings.transcriptSharing}
          onCheckedChange={() => handleToggle('transcriptSharing')}
        />
        <PrivacyItem
          icon={PieChart}
          title="Data Analytics"
          description="Allow Munal to use anonymized meeting data to improve transcription accuracy and features."
          checked={localSettings.dataAnalytics}
          onCheckedChange={() => handleToggle('dataAnalytics')}
        />
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4">
        <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Privacy Settings"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrivacySettingsSection;
