
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Loader2, ArrowRight, ArrowLeft, 
  UserPlus, Sparkles, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createWorkspace } from '@/services/workspaceService';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const WORKSPACE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#1d4ed8', '#475569', '#0f172a',
];

const WORKSPACE_ICONS = [
  '🚀', '💼', '🎯', '⚡', '🏢', '🔬', '🎨', '📊',
  '🛠️', '🌐', '📱', '🤖', '💡', '🎓', '🏗️', '📈',
];

const STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Invite' },
];

const CreateWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '🚀',
  });
  const [inviteEmails, setInviteEmails] = useState(['']);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setStep(1);
    setFormData({ name: '', description: '', color: '#6366f1', icon: '🚀' });
    setInviteEmails(['']);
    setErrors({});
    setShowSuccess(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Workspace name is required';
    else if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    else if (formData.name.length > 50) newErrors.name = 'Name must be less than 50 characters';
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description max 200 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const addEmailField = () => setInviteEmails(prev => [...prev, '']);
  const updateEmail = (index, value) => setInviteEmails(prev => prev.map((e, i) => i === index ? value : e));
  const removeEmail = (index) => {
    if (inviteEmails.length === 1) setInviteEmails(['']);
    else setInviteEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const validEmails = inviteEmails.filter(e => e.trim() && e.includes('@'));
      const newWs = await createWorkspace(
        user.id, formData.name, formData.description, 
        'Free', formData.color, formData.icon, validEmails
      );
      
      setShowSuccess(true);
      setTimeout(async () => {
        toast({ title: 'Workspace created!', description: `${formData.name} is ready to go.` });
        await refreshWorkspaces();
        if (onSuccess) onSuccess();
        handleClose();
        navigate(`/workspace/${newWs.id}/manage`);
      }, 1500);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create workspace.' });
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
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-white/10"
          data-testid="create-workspace-modal"
        >
          {/* Success overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 bg-white dark:bg-slate-900 flex flex-col items-center justify-center rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
                >
                  <Check className="w-8 h-8 text-green-600" />
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-lg font-semibold text-gray-900 dark:text-white">Workspace Created!</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="text-sm text-gray-500 mt-1">Redirecting you now...</motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Workspace</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {step === 1 && 'Name and personalize your workspace'}
                {step === 2 && 'Invite your team members'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full -mt-1 -mr-2 h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step indicator */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      step >= s.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                    )}>
                      {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </div>
                    <span className={cn("text-xs font-medium transition-colors",
                      step >= s.id ? "text-gray-900 dark:text-white" : "text-gray-400"
                    )}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 rounded-full mx-1 transition-colors duration-300",
                      step > s.id ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-700"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 pb-2 min-h-[320px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="space-y-4">
                  <div className="flex items-center gap-4 pb-2">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm transition-colors"
                      style={{ backgroundColor: formData.color + '20', borderColor: formData.color, borderWidth: '2px' }}>
                      {formData.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-gray-500 mb-1.5 block">Icon</Label>
                      <div className="flex flex-wrap gap-1">
                        {WORKSPACE_ICONS.map(icon => (
                          <button key={icon} onClick={() => setFormData({...formData, icon})}
                            className={cn("w-7 h-7 rounded-md text-sm flex items-center justify-center transition-all hover:scale-110",
                              formData.icon === icon ? "bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-500" : "hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}>{icon}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Color</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {WORKSPACE_COLORS.map(color => (
                        <button key={color} onClick={() => setFormData({...formData, color})}
                          className={cn("w-6 h-6 rounded-full transition-all hover:scale-110",
                            formData.color === color && "ring-2 ring-offset-2 dark:ring-offset-slate-900"
                          )} style={{ backgroundColor: color, ringColor: color }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ws-name" className={cn("text-sm", errors.name && 'text-red-500')}>Workspace Name</Label>
                    <Input id="ws-name" placeholder="e.g. Acme Engineering" value={formData.name}
                      onChange={(e) => { setFormData({...formData, name: e.target.value}); if (errors.name) setErrors({...errors, name: null}); }}
                      className={cn("mt-1.5 h-10 rounded-lg bg-gray-50 dark:bg-slate-800", errors.name && 'border-red-500 focus-visible:ring-red-500/20')}
                      data-testid="workspace-name-input" />
                    {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                  </div>

                  <div>
                    <Label htmlFor="ws-desc" className="text-sm">Description (Optional)</Label>
                    <Textarea id="ws-desc" placeholder="What's this workspace for?" rows={2} value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="mt-1.5 resize-none rounded-lg bg-gray-50 dark:bg-slate-800 text-sm" />
                    <div className="flex justify-end text-xs text-gray-400 mt-1">{formData.description.length}/200</div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Invite members */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: formData.color + '20' }}>
                      <span className="text-lg">{formData.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{formData.name}</p>
                      {formData.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{formData.description}</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Invite Team Members</Label>
                      <span className="text-xs text-gray-400">Optional</span>
                    </div>
                    <div className="space-y-2">
                      {inviteEmails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input type="email" placeholder="colleague@company.com" value={email}
                            onChange={(e) => updateEmail(index, e.target.value)}
                            className="h-9 rounded-lg bg-gray-50 dark:bg-slate-800 text-sm"
                            data-testid={`invite-email-${index}`} />
                          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500"
                            onClick={() => removeEmail(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm"
                      className="mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 h-8 text-xs"
                      onClick={addEmailField}>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add another
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Members will receive access to the workspace immediately. You can manage roles and permissions later in workspace settings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-950/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={handleBack} className="h-9 text-sm rounded-lg" data-testid="step-back-btn">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="h-9 text-sm rounded-lg" disabled={loading}>Cancel</Button>
              {step === 1 ? (
                <Button onClick={handleNext} className="h-9 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 min-w-[100px]" data-testid="step-next-btn">
                  Next <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}
                  className="h-9 text-sm rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 min-w-[150px] shadow-lg shadow-indigo-500/20"
                  data-testid="create-workspace-submit-btn">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Create Workspace
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;
