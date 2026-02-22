
import React, { useState } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { persistentSettingsService } from '@/services/persistentSettingsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Database } from 'lucide-react';

const AdminSettingsPersistenceTest = () => {
  const { loadSettings, saveSettings } = useAdminSettings();
  const [localStorageDump, setLocalStorageDump] = useState({});
  const [testValue, setTestValue] = useState('');

  const refreshDump = () => {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('admin_settings_')) {
        dump[key] = localStorage.getItem(key);
      }
    }
    setLocalStorageDump(dump);
  };

  React.useEffect(() => {
    refreshDump();
  }, []);

  const handleTestSave = () => {
    saveSettings('test', 'demo_key', { value: testValue, time: Date.now() });
    refreshDump();
    setTestValue('');
  };

  const handleClear = () => {
    if (confirm('Clear all test settings?')) {
      persistentSettingsService.clearCategory('test');
      refreshDump();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Database className="w-6 h-6" /> Persistence Debugger
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Test Operation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-2">
               <input 
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 placeholder="Enter test value"
                 value={testValue}
                 onChange={(e) => setTestValue(e.target.value)}
               />
               <Button onClick={handleTestSave}>Save</Button>
             </div>
             <Button variant="outline" onClick={refreshDump} className="w-full">
               <RefreshCw className="w-4 h-4 mr-2" /> Refresh Storage View
             </Button>
             <Button variant="destructive" onClick={handleClear} className="w-full">
               <Trash2 className="w-4 h-4 mr-2" /> Clear Test Category
             </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>LocalStorage Dump</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono overflow-auto h-[400px]">
              {Object.keys(localStorageDump).length === 0 ? (
                <span className="text-slate-500">// No admin settings found in localStorage</span>
              ) : (
                Object.entries(localStorageDump).map(([key, val]) => (
                  <div key={key} className="mb-4 break-all">
                    <span className="text-green-400">{key}</span>: <br/>
                    <span className="text-blue-300">{val}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsPersistenceTest;
