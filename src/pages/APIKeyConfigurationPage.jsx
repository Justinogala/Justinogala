
import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Save, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';
import APIKeyValidator from '@/components/APIKeyValidator';
import { useAPIKeyManagement } from '@/hooks/useAPIKeyManagement';

const APIKeyConfigurationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { apiKey, saveKey, removeKey, isValid } = useAPIKeyManagement();

  const handleValidKey = (key) => {
    saveKey(key);
    toast({
      title: "Settings Saved",
      description: "Your AssemblyAI API key has been securely saved.",
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove your API key? You won't be able to transcribe files until you add it again.")) {
      removeKey();
      toast({
        title: "Key Removed",
        description: "API key has been removed from local storage.",
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <Helmet>
          <title>API Configuration | Munal</title>
        </Helmet>

        <div className="container mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Configuration</h1>
              <p className="text-gray-500">Manage your third-party service connections</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>AssemblyAI Settings</CardTitle>
              </div>
              <CardDescription>
                Configure your AssemblyAI API key to enable premium transcription features. 
                The key is stored locally in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Privacy Notice</p>
                  <p>Your API key is never sent to our servers. It is stored securely in your browser's local storage and sent directly to AssemblyAI when you request a transcription.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key
                </label>
                <APIKeyValidator 
                  initialValue={apiKey} 
                  onValid={handleValidKey}
                />
              </div>
            </CardContent>
            {isValid && (
              <CardFooter className="bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"/>
                  Key is configured and ready
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remove Key
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default APIKeyConfigurationPage;
