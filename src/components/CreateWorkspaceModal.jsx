
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createWorkspace } from '@/services/workspaceService';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const CreateWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan: 'Team'
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Workspace name is required';
    else if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    else if (formData.name.length > 50) newErrors.name = 'Name must be less than 50 characters';
    
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description max 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const newWs = await createWorkspace(user.id, formData.name, formData.description, formData.plan);
      
      toast({ 
        title: 'Success', 
        description: 'Workspace created successfully!',
        action: <Check className="w-5 h-5 text-green-500" />
      });
      
      await refreshWorkspaces();
      if (onSuccess) onSuccess();
      onClose();
      setFormData({ name: '', description: '', plan: 'Team' });
      navigate(`/workspace/${newWs.id}/manage`);
      
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create workspace.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Workspace</h2>
              <p className="text-sm text-gray-500">Collaborate with your team in a shared space</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className={errors.name ? 'text-red-500' : ''}>Workspace Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Acme Engineering" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: null});
                  }}
                  className={`bg-gray-50 dark:bg-slate-800 rounded-xl ${errors.name ? 'border-red-500 ring-red-500/20' : ''}`}
                />
                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of this workspace..." 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-50 dark:bg-slate-800 resize-none rounded-xl"
                />
                <div className="flex justify-end text-xs text-gray-400">
                  {formData.description.length}/200
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Select Plan</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['Team', 'Pro', 'Enterprise'].map((plan) => (
                    <div 
                      key={plan}
                      onClick={() => setFormData({...formData, plan})}
                      className={`cursor-pointer border rounded-xl p-4 text-center transition-all ${
                        formData.plan === plan 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-slate-900' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-sm font-bold">{plan}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px] rounded-xl shadow-lg shadow-indigo-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create Workspace'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;
