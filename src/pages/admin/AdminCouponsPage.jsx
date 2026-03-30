import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Copy, Tag, Percent, Calendar, Users, 
  MoreVertical, CheckCircle, XCircle, RefreshCw, Loader2, DollarSign,
  Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

import { getApiUrl, API_URL } from '@/lib/api';

const AdminCouponsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    description: '',
    max_uses: '',
    max_uses_per_user: '1',
    min_order_amount: '',
    valid_until: '',
    applicable_plans: [],
    is_active: true
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('is_active', statusFilter === 'active');
      }
      
      const response = await fetch(`${API_URL}/api/admin/coupons?${params}`);
      if (!response.ok) throw new Error('Failed to fetch coupons');
      
      const data = await response.json();
      setCoupons(data.coupons || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({ title: "Error", description: "Failed to load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      description: '',
      max_uses: '',
      max_uses_per_user: '1',
      min_order_amount: '',
      valid_until: '',
      applicable_plans: [],
      is_active: true
    });
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          description: formData.description || null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
          valid_until: formData.valid_until || null,
          applicable_plans: formData.applicable_plans,
          is_active: formData.is_active
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create coupon');
      }
      
      toast({ title: "Success", description: "Coupon created successfully" });
      setCreateDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCoupon) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/${selectedCoupon.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          description: formData.description || null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
          valid_until: formData.valid_until || null,
          is_active: formData.is_active
        })
      });
      
      if (!response.ok) throw new Error('Failed to update coupon');
      
      toast({ title: "Success", description: "Coupon updated successfully" });
      setEditDialogOpen(false);
      setSelectedCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete coupon ${code}? This cannot be undone.`)) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/${code}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete coupon');
      
      toast({ title: "Success", description: "Coupon deleted" });
      fetchCoupons();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggle = async (code, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/coupons/${code}/toggle`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to toggle status');
      
      toast({ title: "Success", description: `Coupon ${currentStatus ? 'deactivated' : 'activated'}` });
      fetchCoupons();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Coupon code ${code} copied to clipboard` });
  };

  const openEditDialog = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      description: coupon.description || '',
      max_uses: coupon.max_uses?.toString() || '',
      max_uses_per_user: coupon.max_uses_per_user?.toString() || '1',
      min_order_amount: coupon.min_order_amount?.toString() || '',
      valid_until: coupon.valid_until?.split('T')[0] || '',
      applicable_plans: coupon.applicable_plans || [],
      is_active: coupon.is_active
    });
    setEditDialogOpen(true);
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    totalUsed: coupons.reduce((sum, c) => sum + (c.times_used || 0), 0)
  };

  return (
    <>
      <Helmet><title>Coupons - Admin</title></Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Coupons
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage discount codes and promotions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchCoupons} className="">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Coupons', value: stats.total, icon: Tag, color: 'from-blue-500 to-cyan-500' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
            { label: 'Total Uses', value: stats.totalUsed, icon: Users, color: 'from-violet-500 to-purple-500' }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", stat.color)}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Coupons</CardTitle>
            <CardDescription>{filteredCoupons.length} coupon(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="ml-3 text-gray-400">Loading coupons...</span>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Tag className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">No coupons found</p>
                <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="mt-4 ">
                  Create your first coupon
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.code}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded">
                            {coupon.code}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(coupon.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={coupon.discount_type === 'percentage' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}>
                          {coupon.discount_type === 'percentage' ? (
                            <><Percent className="w-3 h-3 mr-1" />{coupon.discount_value}%</>
                          ) : (
                            <><DollarSign className="w-3 h-3 mr-1" />${coupon.discount_value}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{coupon.times_used || 0}</span>
                        {coupon.max_uses && <span className="text-gray-400">/{coupon.max_uses}</span>}
                      </TableCell>
                      <TableCell>
                        {coupon.valid_until ? (
                          <span className="text-gray-700">{new Date(coupon.valid_until).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-gray-500">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => handleToggle(coupon.code, coupon.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopy(coupon.code)}>
                              <Copy className="w-4 h-4 mr-2" /> Copy Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(coupon.code)} className="text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); setSelectedCoupon(null); resetForm(); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update coupon details' : 'Create a new discount coupon'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono"
                disabled={editDialogOpen}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Discount Type</Label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger className="">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Discount Value *</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className=""
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-700">Description</Label>
              <Input
                placeholder="e.g., Summer sale discount"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className=""
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Max Total Uses</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Uses Per User</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  className=""
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Min. Order Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className=""
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Label className="text-gray-700">Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); }} className="">
              Cancel
            </Button>
            <Button onClick={editDialogOpen ? handleUpdate : handleCreate} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editDialogOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCouponsPage;
