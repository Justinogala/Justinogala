
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    plan: 'Free',
    status: 'Active'
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.full_name || '',
        email: user.email || '',
        role: user.role || 'User',
        plan: user.plan || 'Free',
        status: user.status || 'Active'
      });
      // Reset password fields when user changes
      setNewPassword('');
      setShowPasswordSection(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password if provided
    if (showPasswordSection && newPassword && newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const updateData = { ...formData };
      
      // Only include password if user wants to reset it
      if (showPasswordSection && newPassword) {
        updateData.password = newPassword;
      }
      
      await onUpdate(user.id, updateData);
      
      if (showPasswordSection && newPassword) {
        toast({
          title: "Password Updated",
          description: "User's password has been reset successfully.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">Email Address</Label>
          <Input 
            value={formData.email} 
            onChange={(e) => handleChange(e)}
            name="email"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        
        {/* Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">Full Name</Label>
          <Input 
            name="name"
            value={formData.name} 
            onChange={handleChange}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Password Reset Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-200">Password</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-auto py-1 px-2"
            >
              <KeyRound className="w-3 h-3 mr-1" />
              {showPasswordSection ? 'Cancel Reset' : 'Reset Password'}
            </Button>
          </div>
          
          {showPasswordSection && (
            <div className="relative animate-in slide-in-from-top-2">
              <Input 
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to keep current password
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Plan */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">Plan</Label>
            <Select 
              value={formData.plan}
              onValueChange={(val) => handleSelectChange('plan', val)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">Status</Label>
             <Select 
              value={formData.status}
              onValueChange={(val) => handleSelectChange('status', val)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">Role</Label>
           <Select 
            value={formData.role}
            onValueChange={(val) => handleSelectChange('role', val)}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
