
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import WorkspaceCard from '@/components/shared/WorkspaceCard';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';
import { Helmet } from 'react-helmet';

const WorkspacesPage = () => {
  const navigate = useNavigate();
  const { workspaces, loading } = useWorkspace();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user && ['admin', 'super_admin', 'manager'].includes((user.role || '').toLowerCase());

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 lg:p-10 font-sans">
        <Helmet>
          <title>Workspaces | Munal</title>
        </Helmet>

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div>
               <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">My Workspaces</h1>
               <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                 Manage your teams, projects, and shared resources in one place.
               </p>
             </div>
             {isAdmin && (
               <Button 
                 onClick={() => setIsModalOpen(true)} 
                 className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
                 data-testid="create-workspace-btn"
               >
                 <Plus className="mr-2 h-5 w-5" /> Create Workspace
               </Button>
             )}
          </div>

          {/* Filters & Search */}
          <div className="flex gap-4">
             <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <Input 
                 placeholder="Search workspaces..." 
                 className="pl-10 h-11 bg-white dark:bg-slate-900 rounded-xl border-gray-200 dark:border-gray-800"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>

          {/* Grid */}
          {loading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
             </div>
          ) : filteredWorkspaces.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {isAdmin ? 'No workspaces found' : 'No workspaces assigned'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {isAdmin ? 'Get started by creating your first team workspace.' : 'Contact your admin to be added to a workspace.'}
                </p>
                {isAdmin && <Button onClick={() => setIsModalOpen(true)} variant="outline">Create Workspace</Button>}
             </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkspaces.map((ws) => (
                <div key={ws.id} className="h-full">
                  <WorkspaceCard workspace={ws} />
                </div>
              ))}
            </div>
          )}
        </div>

        <CreateWorkspaceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </PageTransition>
  );
};

export default WorkspacesPage;
