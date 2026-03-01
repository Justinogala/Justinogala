import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Check, Star, Zap, Crown, MoreVertical, Eye, EyeOff, Loader2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminPlansPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({
    total_mrr: 0,
    total_active: 0,
    plan_stats: {}
  });

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_annual: 0,
    features: '',
    is_active: true,
    is_popular: false
  });

  // Fetch plans and stats
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch plans
      const plansRes = await fetch(`${API_URL}/api/payments/plans`);
      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      // Fetch subscription stats
      const statsRes = await fetch(`${API_URL}/api/payments/admin/subscriptions`);
      const statsData = await statsRes.json();
      setSubscriptionStats({
        total_mrr: statsData.total_mrr || 0,
        total_active: statsData.total_active || 0,
        plan_stats: statsData.plan_stats || {}
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({ variant: 'destructive', title: 'Failed to load plans' });
    }
    setLoading(false);
  };

  const handleToggleActive = async (plan) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active })
      });
      
      if (res.ok) {
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, is_active: !p.is_active } : p
        ));
        toast({ title: "Plan status updated" });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update plan' });
    }
  };

  const handleTogglePopular = async (plan) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_popular: !plan.is_popular })
      });
      
      if (res.ok) {
        // If setting as popular, update all plans
        if (!plan.is_popular) {
          setPlans(prev => prev.map(p => ({
            ...p,
            is_popular: p.id === plan.id
          })));
        } else {
          setPlans(prev => prev.map(p => 
            p.id === plan.id ? { ...p, is_popular: false } : p
          ));
        }
        toast({ title: "Popular plan updated" });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update plan' });
    }
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_annual: plan.price_annual,
      features: plan.features?.join('\n') || '',
      is_active: plan.is_active,
      is_popular: plan.is_popular
    });
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_annual: 0,
      features: '',
      is_active: true,
      is_popular: false
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Are you sure you want to delete the ${plan.name} plan? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/payments/plans/${plan.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setPlans(prev => prev.filter(p => p.id !== plan.id));
        toast({ title: "Plan deleted successfully" });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete plan' });
    }
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price_monthly: parseFloat(formData.price_monthly),
        price_annual: parseFloat(formData.price_annual),
        features: formData.features.split('\n').filter(f => f.trim()),
        is_active: formData.is_active,
        is_popular: formData.is_popular
      };

      let res;
      if (selectedPlan) {
        // Update existing plan
        res = await fetch(`${API_URL}/api/payments/plans/${selectedPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });
      } else {
        // Create new plan
        res = await fetch(`${API_URL}/api/payments/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (selectedPlan) {
          setPlans(prev => prev.map(p => p.id === selectedPlan.id ? data.plan : p));
        } else {
          setPlans(prev => [...prev, data.plan]);
        }
        toast({ title: selectedPlan ? "Plan updated successfully" : "Plan created successfully" });
        setEditDialogOpen(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save plan' });
    }
    setSaving(false);
  };

  const getIconComponent = (planName) => {
    const icons = { 'Free': Zap, 'Pro': Star, 'Enterprise': Crown };
    const IconComponent = icons[planName] || Zap;
    return <IconComponent className="w-5 h-5" />;
  };

  const totalMRR = plans.reduce((sum, p) => sum + (p.price_monthly * (subscriptionStats.plan_stats[p.id] || 0)), 0);
  const totalSubscribers = Object.values(subscriptionStats.plan_stats).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-plans-page">
      <Helmet><title>Manage Plans | Admin</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage pricing plans and features</p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalMRR.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Subscribers</p>
                <p className="text-2xl font-bold">{totalSubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Plans</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Revenue/User</p>
                <p className="text-2xl font-bold">${totalSubscribers > 0 ? (totalMRR / totalSubscribers).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        {getIconComponent(plan.name)}
                      </div>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        {plan.is_popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${plan.price_monthly}/mo</p>
                      <p className="text-xs text-gray-500">${plan.price_annual}/yr</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.features?.length || 0} features
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{subscriptionStats.plan_stats[plan.id] || 0}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-green-600">
                      ${(plan.price_monthly * (subscriptionStats.plan_stats[plan.id] || 0)).toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={() => handleToggleActive(plan)}
                      />
                      <span className={plan.is_active ? 'text-green-600' : 'text-gray-400'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePopular(plan)}>
                          <Star className="w-4 h-4 mr-2" />
                          {plan.is_popular ? 'Unmark Popular' : 'Mark as Popular'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(plan)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? 'Update the plan details below' : 'Enter the details for the new plan'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pro"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price ($)</Label>
                <Input 
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Price ($)</Label>
                <Input 
                  type="number"
                  value={formData.price_annual}
                  onChange={(e) => setFormData({ ...formData, price_annual: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea 
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="100 meetings per month&#10;10 GB storage&#10;Priority support"
                rows={6}
              />
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_popular}
                  onCheckedChange={(v) => setFormData({ ...formData, is_popular: v })}
                />
                <Label>Mark as Popular</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={saving || !formData.name}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlansPage;
