
import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createWorkspace, getAllUsers } from '@/services/adminService';
import { Loader2, Layout, Lock, Globe, Shield } from 'lucide-react';

const CreateWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerEmail: '',
    plan: 'free',
    storageLimit: 100,
    privacy: 'private'
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch users for dropdown
      getAllUsers({ status: 'active' }, 1, 100).then(res => setUsers(res.users));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createWorkspace(formData);
      toast({
        title: "Workspace Created",
        description: `Workspace "${formData.name}" has been successfully set up.`,
      });
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setFormData({
        name: '', description: '', ownerEmail: '', plan: 'free', storageLimit: 100, privacy: 'private'
      });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create New Workspace" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Workspace Name *</Label>
          <div className="relative">
            <Layout className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              id="name" name="name" 
              value={formData.name} onChange={handleChange} 
              className="pl-9" placeholder="e.g. Design Team" required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description" name="description"
            value={formData.description} onChange={handleChange}
            placeholder="What is this workspace for?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Owner *</Label>
            <select
              id="ownerEmail" name="ownerEmail"
              value={formData.ownerEmail} onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-800 dark:bg-slate-950"
              required
            >
              <option value="">Select an owner...</option>
              {users.map(u => (
                <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Initial Plan</Label>
            <select
              id="plan" name="plan"
              value={formData.plan} onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-800 dark:bg-slate-950"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
            <Input 
              id="storageLimit" name="storageLimit" type="number"
              value={formData.storageLimit} onChange={handleChange} 
              min="10" max="1000"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Privacy Setting</Label>
          <div className="grid grid-cols-3 gap-4">
             {['public', 'private', 'restricted'].map((type) => (
               <label key={type} className={`
                 cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors
                 ${formData.privacy === type ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800'}
               `}>
                 <input 
                   type="radio" name="privacy" value={type} 
                   checked={formData.privacy === type} onChange={handleChange} 
                   className="sr-only" 
                 />
                 {type === 'public' && <Globe className="h-5 w-5" />}
                 {type === 'private' && <Lock className="h-5 w-5" />}
                 {type === 'restricted' && <Shield className="h-5 w-5" />}
                 <span className="capitalize text-sm font-medium">{type}</span>
               </label>
             ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default CreateWorkspaceModal;
