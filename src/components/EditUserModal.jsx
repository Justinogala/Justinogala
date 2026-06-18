import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, Eye, EyeOff, KeyRound, ChevronDown, ChevronRight,
  LayoutDashboard, Users, Building2, MessageSquare, 
  Clock, CreditCard, Settings, LifeBuoy, Mail, Shield, Phone
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+1', country: 'CA', iso: 'ca' },
  { code: '+1', country: 'US', iso: 'us' },
  { code: '+254', country: 'KE', iso: 'ke' },
  { code: '+256', country: 'UG', iso: 'ug' },
  { code: '+255', country: 'TZ', iso: 'tz' },
  { code: '+250', country: 'RW', iso: 'rw' },
  { code: '+44', country: 'GB', iso: 'gb' },
  { code: '+91', country: 'IN', iso: 'in' },
  { code: '+61', country: 'AU', iso: 'au' },
  { code: '+49', country: 'DE', iso: 'de' },
  { code: '+33', country: 'FR', iso: 'fr' },
  { code: '+234', country: 'NG', iso: 'ng' },
  { code: '+27', country: 'ZA', iso: 'za' },
  { code: '+971', country: 'AE', iso: 'ae' },
  { code: '+65', country: 'SG', iso: 'sg' },
];
const flagUrl = (iso) => `https://flagcdn.com/w40/${iso}.png`;

// Permission categories with their labels and icons
const PERMISSION_CATEGORIES = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  users: { label: 'User Management', icon: Users, color: 'text-indigo-500' },
  workspaces: { label: 'Workspace Management', icon: Building2, color: 'text-violet-500' },
  chat_moderation: { label: 'Chat Moderation', icon: MessageSquare, color: 'text-pink-500' },
  shifts: { label: 'Shift Management', icon: Clock, color: 'text-orange-500' },
  billing: { label: 'Billing & Payments', icon: CreditCard, color: 'text-green-500' },
  settings: { label: 'Settings', icon: Settings, color: 'text-gray-500' },
  support: { label: 'Support Tickets', icon: LifeBuoy, color: 'text-cyan-500' },
  messages: { label: 'Messages & Broadcasts', icon: Mail, color: 'text-rose-500' }
};

// Permission labels
const PERMISSION_LABELS = {
  view: 'View',
  analytics: 'View Analytics',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  manage: 'Manage',
  suspend: 'Suspend',
  flag: 'Flag Content',
  export: 'Export Data',
  override: 'Override',
  refunds: 'Issue Refunds',
  modify: 'Modify',
  security: 'Security Settings',
  respond: 'Respond',
  send: 'Send Messages',
  broadcast: 'Send Broadcasts'
};

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  Admin: {
    dashboard: { view: true, analytics: true },
    users: { view: true, create: true, edit: true, delete: true },
    workspaces: { view: true, manage: true, suspend: true, delete: true },
    chat_moderation: { view: true, flag: true, delete: true, export: true },
    shifts: { view: true, manage: true, override: true, export: true },
    billing: { view: true, manage: true, refunds: true },
    settings: { view: true, modify: true, security: true },
    support: { view: true, respond: true },
    messages: { view: true, send: true, broadcast: true }
  },
  Manager: {
    dashboard: { view: true, analytics: true },
    users: { view: true, create: false, edit: false, delete: false },
    workspaces: { view: true, manage: true, suspend: false, delete: false },
    chat_moderation: { view: true, flag: true, delete: false, export: false },
    shifts: { view: true, manage: true, override: false, export: true },
    billing: { view: true, manage: false, refunds: false },
    settings: { view: true, modify: false, security: false },
    support: { view: true, respond: true },
    messages: { view: true, send: true, broadcast: false }
  },
  User: {
    dashboard: { view: false, analytics: false },
    users: { view: false, create: false, edit: false, delete: false },
    workspaces: { view: false, manage: false, suspend: false, delete: false },
    chat_moderation: { view: false, flag: false, delete: false, export: false },
    shifts: { view: false, manage: false, override: false, export: false },
    billing: { view: false, manage: false, refunds: false },
    settings: { view: false, modify: false, security: false },
    support: { view: false, respond: false },
    messages: { view: false, send: false, broadcast: false }
  }
};

const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    plan: 'Free',
    status: 'Active',
    phone: '',
    country_code: '+1',
  });
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS.User);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const role = user.role || 'User';
      // Parse phone - if stored as +254712345678, extract country code
      let phoneNum = user.phone || '';
      let cc = user.country_code || '+1';
      if (phoneNum && !user.country_code) {
        const match = COUNTRY_CODES.find(c => phoneNum.startsWith(c.code));
        if (match) { cc = match.code; phoneNum = phoneNum.slice(match.code.length); }
      } else if (phoneNum && user.country_code) {
        phoneNum = phoneNum.startsWith(user.country_code) ? phoneNum.slice(user.country_code.length) : phoneNum;
      }
      setFormData({
        name: user.name || user.full_name || '',
        email: user.email || '',
        role: role,
        plan: user.plan || 'Free',
        status: user.status || 'Active',
        phone: phoneNum,
        country_code: cc,
      });
      // Set permissions from user or defaults
      setPermissions(user.permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.User);
      setShowPermissions(role !== 'User');
      // Reset password fields
      setNewPassword('');
      setShowPasswordSection(false);
      setExpandedCategories({});
    }
  }, [user]);

  // Update permissions when role changes
  useEffect(() => {
    if (formData.role !== user?.role) {
      // Role changed, apply default permissions for new role
      setPermissions(DEFAULT_PERMISSIONS[formData.role] || DEFAULT_PERMISSIONS.User);
    }
    setShowPermissions(formData.role !== 'User');
  }, [formData.role, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (category, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value
      }
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleAllInCategory = (category, value) => {
    const categoryPerms = permissions[category];
    const updatedPerms = {};
    Object.keys(categoryPerms).forEach(key => {
      updatedPerms[key] = value;
    });
    setPermissions(prev => ({
      ...prev,
      [category]: updatedPerms
    }));
  };

  const selectAllPermissions = () => {
    const allOn = {};
    Object.keys(permissions).forEach(category => {
      allOn[category] = {};
      Object.keys(permissions[category]).forEach(perm => {
        allOn[category][perm] = true;
      });
    });
    setPermissions(allOn);
  };

  const deselectAllPermissions = () => {
    const allOff = {};
    Object.keys(permissions).forEach(category => {
      allOff[category] = {};
      Object.keys(permissions[category]).forEach(perm => {
        allOff[category][perm] = false;
      });
    });
    setPermissions(allOff);
  };

  const getCategoryPermissionCount = (category) => {
    const perms = permissions[category];
    if (!perms) return { enabled: 0, total: 0 };
    const total = Object.keys(perms).length;
    const enabled = Object.values(perms).filter(Boolean).length;
    return { enabled, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      const updateData = { 
        ...formData,
        phone: formData.phone ? `${formData.country_code}${formData.phone}` : null,
        permissions: formData.role !== 'User' ? permissions : null
      };
      
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
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email Address</Label>
            <Input 
              value={formData.email} 
              onChange={(e) => handleChange(e)}
              name="email"
              className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              data-testid="edit-user-email-input"
            />
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</Label>
            <Input 
              name="name"
              value={formData.name} 
              onChange={handleChange}
              className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              data-testid="edit-user-name-input"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={formData.country_code} onValueChange={(val) => handleSelectChange('country_code', val)}>
                <SelectTrigger className="w-[120px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" data-testid="edit-user-country-code">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <img src={flagUrl((COUNTRY_CODES.find(c => c.code === formData.country_code) || COUNTRY_CODES[0]).iso)} alt="" className="w-4 h-auto rounded-sm" />
                      {formData.country_code}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c, i) => (
                    <SelectItem key={`${c.code}-${c.country}-${i}`} value={c.code}>
                      <span className="flex items-center gap-2">
                        <img src={flagUrl(c.iso)} alt={c.country} className="w-4 h-auto rounded-sm" />
                        {c.country} {c.code}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="712 345 678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  data-testid="edit-user-phone-input"
                />
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 h-auto py-1 px-2"
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
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to keep current password
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Plan</Label>
              <Select 
                value={formData.plan}
                onValueChange={(val) => handleSelectChange('plan', val)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
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
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</Label>
               <Select 
                value={formData.status}
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
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
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Role</Label>
             <Select 
              value={formData.role}
              onValueChange={(val) => handleSelectChange('role', val)}
            >
              <SelectTrigger className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" data-testid="edit-user-role-select">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions Section - Only for Admin/Manager */}
          {showPermissions && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Admin Privileges
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllPermissions}
                    className="text-xs h-6 px-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-500/10"
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllPermissions}
                    className="text-xs h-6 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    None
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Customize admin access for this {formData.role.toLowerCase()}.
              </p>

              <div className="space-y-2 mt-3">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, config]) => {
                  const Icon = config.icon;
                  const { enabled, total } = getCategoryPermissionCount(category);
                  const isExpanded = expandedCategories[category];
                  
                  return (
                    <Collapsible
                      key={category}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                            data-testid={`edit-permission-category-${category}`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${config.color}`} />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                {enabled}/{total}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAllInCategory(category, enabled < total);
                                }}
                                className="text-xs h-6 px-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              >
                                {enabled === total ? 'None' : 'All'}
                              </Button>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-3 pt-0 grid grid-cols-2 gap-3">
                            {permissions[category] && Object.entries(permissions[category]).map(([perm, value]) => (
                              <div 
                                key={perm} 
                                className="flex items-center justify-between py-2"
                              >
                                <Label 
                                  htmlFor={`edit-${category}-${perm}`}
                                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                                >
                                  {PERMISSION_LABELS[perm] || perm}
                                </Label>
                                <Switch
                                  id={`edit-${category}-${perm}`}
                                  checked={value}
                                  onCheckedChange={(checked) => handlePermissionChange(category, perm, checked)}
                                  data-testid={`edit-permission-${category}-${perm}`}
                                />
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3 border-t border-gray-200 dark:border-white/10">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" disabled={loading} data-testid="edit-user-submit-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default EditUserModal;
