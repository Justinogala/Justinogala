
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkspaceCard from '@/components/shared/WorkspaceCard';
import MemberTable from '@/components/shared/MemberTable';
import StorageUsageChart from '@/components/shared/StorageUsageChart';
import ActivityLog from '@/components/shared/ActivityLog';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserWorkspace = () => {
  const [activeWorkspace, setActiveWorkspace] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Workspaces</h1>
              <p className="text-gray-500">Manage your teams and shared resources</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Workspace
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar List */}
            <div className="lg:col-span-1 space-y-4">
               {[1, 2].map(id => (
                 <div 
                   key={id} 
                   onClick={() => setActiveWorkspace(id)}
                   className={`cursor-pointer transition-all ${activeWorkspace === id ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}
                 >
                   <WorkspaceCard 
                     workspace={{
                       id,
                       name: id === 1 ? "Engineering Team" : "Product Design",
                       plan: id === 1 ? "Team" : "Pro",
                       members: id === 1 ? 12 : 5,
                       storage: id === 1 ? "45 GB" : "12 GB",
                       storagePercent: id === 1 ? 45 : 20
                     }}
                   />
                 </div>
               ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Workspace Settings</h2>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" /> General Settings
                  </Button>
                </div>

                <Tabs defaultValue="members">
                  <TabsList className="mb-4">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="storage">Storage</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="members">
                     <div className="flex justify-end mb-4">
                       <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Invite Member</Button>
                     </div>
                     <MemberTable 
                       members={[
                         { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'owner', joinedAt: '2023-01-15' },
                         { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'member', joinedAt: '2023-02-20' },
                       ]}
                       onRemove={() => {}}
                       onRoleChange={() => {}}
                     />
                  </TabsContent>
                  
                  <TabsContent value="storage">
                    <div className="py-4 space-y-6">
                      <div className="flex gap-8 items-center justify-center">
                        <StorageUsageChart used={45} total={100} type="circle" />
                        <div className="space-y-2">
                           <p className="font-medium">Total Storage: 100 GB</p>
                           <p className="text-sm text-gray-500">Recordings: 35 GB</p>
                           <p className="text-sm text-gray-500">Transcripts: 10 GB</p>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">Upgrade Storage</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity">
                    <ActivityLog 
                      logs={[
                        { id: 1, user: 'Alice', action: 'Created meeting "Q4 Planning"', timestamp: '2023-11-05T10:00:00' },
                        { id: 2, user: 'Bob', action: 'Uploaded file "specs.pdf"', timestamp: '2023-11-04T14:30:00' },
                      ]} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserWorkspace;
