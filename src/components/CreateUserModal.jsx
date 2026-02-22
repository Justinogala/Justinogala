
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSecurePassword } from '@/services/passwordGeneratorService';
import { Copy, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CreateUserModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: 'free',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword(12);
    setFormData({ ...formData, password: pwd });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    toast({ description: "Password copied to clipboard" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({ title: "Validation Error", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
      // Reset
      setFormData({ name: '', email: '', plan: 'free', password: '' });
      toast({ title: "Success", description: "User account created successfully." });
    } catch (error) {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Full Name" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="John Doe"
          required 
        />
        <Input 
          label="Email Address" 
          type="email"
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="john@example.com"
          required 
        />
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">Subscription Plan</label>
          <select 
            className="w-full h-10 rounded-md border border-white/20 bg-slate-900 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.plan}
            onChange={(e) => setFormData({...formData, plan: e.target.value})}
          >
            <option value="free">Free (60 mins/mo)</option>
            <option value="pro">Pro (300 mins/mo)</option>
            <option value="business">Business (1000 mins/mo)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">Password</label>
          <div className="flex gap-2 relative">
            <Input 
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="font-mono pr-10"
              placeholder="Secure Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-14 top-2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Button type="button" variant="outline" onClick={handleGeneratePassword} title="Generate">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {formData.password && (
            <div className="flex items-center justify-between text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-500/20">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3" />
                <span>Password ready</span>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-6 text-green-400 hover:text-green-300 hover:bg-green-900/40" onClick={handleCopyPassword}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
