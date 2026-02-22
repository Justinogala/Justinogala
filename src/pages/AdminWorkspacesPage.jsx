
import React, { useState, useEffect } from 'react';
import AdminTable from '@/components/AdminTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MoreHorizontal, Trash2, Edit, StopCircle, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import { getWorkspaces, deleteWorkspace, updateWorkspace } from '@/services/adminService';
import { useToast } from '@/components/ui/use-toast';

const AdminWorkspacesPage = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await getWorkspaces();
      // Sort by created date descending (newest first)
      const sortedData = [...data].sort((a, b) => new Date(b.created) - new Date(a.created));
      setWorkspaces(sortedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this workspace? This cannot be undone.")) {
      try {
        await deleteWorkspace(id);
        toast({ title: "Success", description: "Workspace deleted" });
        fetchWorkspaces();
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleStatusChange = async (workspace) => {
    try {
      const newStatus = workspace.status === 'active' ? 'suspended' : 'active';
      await updateWorkspace(workspace.id, { status: newStatus });
      toast({ title: "Success", description: `Workspace ${newStatus}` });
      fetchWorkspaces();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(filter.toLowerCase()) || 
    w.owner.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Pagination logic (client-side for now as getWorkspaces returns all)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredWorkspaces.length / itemsPerPage);
  const paginatedWorkspaces = filteredWorkspaces.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const columns = [
    { key: 'name', label: 'Workspace', render: (w) => (
      <div>
        <div className="font-semibold text-white">{w.name}</div>
        <div className="text-xs text-gray-500 truncate max-w-[200px]">{w.description}</div>
      </div>
    )},
    { key: 'owner', label: 'Owner', render: (w) => <span className="text-sm text-gray-400">{w.owner}</span> },
    { key: 'plan', label: 'Plan', render: (w) => <Badge variant="outline" className="uppercase text-xs">{w.plan}</Badge> },
    { key: 'stats', label: 'Stats', render: (w) => (
      <div className="flex gap-3 text-xs text-gray-400">
        <span>{w.members} Members</span>
        <span>•</span>
        <span>{w.meetings} Meetings</span>
      </div>
    )},
    { key: 'storage', label: 'Storage', render: (w) => `${w.storage || 0} GB` },
    { key: 'created', label: 'Created', render: (w) => <span className="text-xs text-gray-500">{new Date(w.created).toLocaleDateString()}</span> },
    { key: 'status', label: 'Status', render: (w) => (
      <Badge className={w.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
        {w.status}
      </Badge>
    )},
    { key: 'actions', label: '', render: (w) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-gray-200">
          <DropdownMenuItem onClick={() => toast({description: "Edit functionality coming soon"})}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange(w)}>
            <StopCircle className="mr-2 h-4 w-4" /> {w.status === 'active' ? 'Suspend' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(w.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  ];

  const totalStorage = workspaces.reduce((acc, curr) => acc + (Number(curr.storage) || 0), 0).toFixed(1);
  const totalMembers = workspaces.reduce((acc, curr) => acc + (Number(curr.members) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspace Management</h1>
          <p className="text-gray-400 text-sm">Oversee all team workspaces and storage usage.</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <p className="text-gray-400 text-xs uppercase">Total Workspaces</p>
          <p className="text-2xl font-bold text-white">{workspaces.length}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <p className="text-gray-400 text-xs uppercase">Total Storage Used</p>
          <p className="text-2xl font-bold text-indigo-400">{totalStorage} GB</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
          <p className="text-gray-400 text-xs uppercase">Total Members</p>
          <p className="text-2xl font-bold text-green-400">{totalMembers}</p>
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={paginatedWorkspaces}
        isLoading={loading}
        onSearch={setFilter}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
      />

      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  );
};

export default AdminWorkspacesPage;
