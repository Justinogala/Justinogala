
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
import { Loader2 } from 'lucide-react';

const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    plan: 'Free',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'User',
        plan: user.plan || 'Free',
        status: user.status || 'Active'
      });
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
    setLoading(true);
    try {
      await onUpdate(user.id, formData);
      onClose();
    } catch (error) {
      // Error handling is mostly done in useUserManagement but extra safety here
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email - Read Only */}
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
