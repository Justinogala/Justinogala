import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
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
import { validateUserForm } from '@/utils/userFormValidation';
import { getApiUrl, API_URL } from '@/lib/api';

import { 
  Loader2, Eye, EyeOff, ChevronDown, ChevronRight,
  LayoutDashboard, Users, Building2, MessageSquare, 
  Clock, CreditCard, Settings, LifeBuoy, Mail, Shield
} from 'lucide-react';

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

const AddUserModal = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    plan: 'Free',
    status: 'Active',
    password: ''
  });
  
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS.User);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Update permissions when role changes
  useEffect(() => {
    setPermissions(DEFAULT_PERMISSIONS[formData.role] || DEFAULT_PERMISSIONS.User);
    setShowPermissions(formData.role !== 'User');
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
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
    const total = Object.keys(perms).length;
    const enabled = Object.values(perms).filter(Boolean).length;
    return { enabled, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateUserForm(formData);
    
    if (!formData.password || formData.password.length < 6) {
      validation.isValid = false;
      validation.errors.password = 'Password must be at least 6 characters';
    }
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Include permissions in the submission
      const submitData = {
        ...formData,
        permissions: formData.role !== 'User' ? permissions : null
      };
      
      const success = await onAddUser(submitData);
      if (success) {
        setFormData({
          name: '',
          email: '',
          role: 'User',
          plan: 'Free',
          status: 'Active',
          password: ''
        });
        setPermissions(DEFAULT_PERMISSIONS.User);
        setErrors({});
        setExpandedCategories({});
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Add New User</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Create a new user account with login credentials and permissions.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={`bg-white dark:bg-slate-950 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  data-testid="add-user-name-input"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-white dark:bg-slate-950 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  data-testid="add-user-email-input"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-white dark:bg-slate-950 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    data-testid="add-user-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{errors.password}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-950" data-testid="add-user-role-select">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-950" data-testid="add-user-status-select">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Plan Field */}
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subscription Plan
                </Label>
                <Select 
                  value={formData.plan} 
                  onValueChange={(value) => handleSelectChange('plan', value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-950" data-testid="add-user-plan-select">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions Section - Only for Admin/Manager */}
              {showPermissions && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-violet-500" />
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
                        className="text-xs h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAllPermissions}
                        className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Customize which admin features this {formData.role.toLowerCase()} can access.
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
                          <div className="rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <CollapsibleTrigger asChild>
                              <div 
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                data-testid={`permission-category-${category}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-4 h-4 ${config.color}`} />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {config.label}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
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
                                    className="text-xs h-6 px-2"
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
                              <div className="p-3 pt-0 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3">
                                {Object.entries(permissions[category] || {}).map(([perm, value]) => (
                                  <div 
                                    key={perm} 
                                    className="flex items-center justify-between py-2"
                                  >
                                    <Label 
                                      htmlFor={`${category}-${perm}`}
                                      className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                                    >
                                      {PERMISSION_LABELS[perm] || perm}
                                    </Label>
                                    <Switch
                                      id={`${category}-${perm}`}
                                      checked={value}
                                      onCheckedChange={(checked) => handlePermissionChange(category, perm, checked)}
                                      data-testid={`permission-${category}-${perm}`}
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
                disabled={isSubmitting}
                data-testid="add-user-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
