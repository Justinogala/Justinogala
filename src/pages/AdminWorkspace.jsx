import React, { useState, useEffect } from 'react';
import { Layout, Users, HardDrive, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WorkspaceCard from '@/components/shared/WorkspaceCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getWorkspaceMetrics, getWorkspaces } from '@/services/adminService';
import CreateWorkspaceModal from '@/components/admin/modals/CreateWorkspaceModal';
import ExportDataModal from '@/components/admin/modals/ExportDataModal';

const AdminWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalWorkspaces: 0,
    totalMembers: 0,
    storageUsed: '0 GB'
  });
  const [workspaces, setWorkspaces] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch workspaces list
      const wsData = await getWorkspaces();
      setWorkspaces(wsData);
      
      // Calculate real metrics or use mock metrics call if available
      // For now, simple aggregation
      const totalWS = wsData.length;
      const totalMem = wsData.reduce((acc, curr) => acc + (curr.members || 1), 0);
      
      setMetrics({
        totalWorkspaces: totalWS,
        totalMembers: totalMem,
        storageUsed: '124 GB' // Mock for now
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Workspaces</h1>
          <p className="text-gray-500">Manage all organization workspaces</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Create Workspace
          </Button>
        </div>
      </div>

      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadData}
      />

      <ExportDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        initialType="Workspaces"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
           <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
             <Layout className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Total Workspaces</p>
             <h3 className="text-2xl font-bold">{metrics.totalWorkspaces}</h3>
           </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
           <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
             <Users className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Total Members</p>
             <h3 className="text-2xl font-bold">{metrics.totalMembers}</h3>
           </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
           <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
             <HardDrive className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Storage Used</p>
             <h3 className="text-2xl font-bold">{metrics.storageUsed}</h3>
           </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
         <Input placeholder="Search workspaces..." className="max-w-sm" />
         <Button variant="outline">Filter</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws, i) => (
          <WorkspaceCard 
            key={ws.id || i} 
            workspace={{
              id: ws.id,
              name: ws.name,
              plan: ws.plan,
              members: ws.members || 1,
              storage: `${ws.storage || 0} GB`,
              storagePercent: Math.min(Math.random() * 80, 100) // Mock percent for visual
            }} 
          />
        ))}
        {workspaces.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No workspaces found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkspace;