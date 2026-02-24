import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Check, Star, Zap, Crown, MoreVertical, Eye, EyeOff } from 'lucide-react';
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

const AdminPlansPage = () => {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [plans, setPlans] = useState([
    {
      id: 'plan_free',
      name: 'Free',
      icon: 'Zap',
      priceMonthly: 0,
      priceAnnual: 0,
      features: ['5 meetings/month', '1 GB storage', '30 min transcription'],
      isActive: true,
      isPopular: false,
      subscribers: 1250
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      icon: 'Star',
      priceMonthly: 29,
      priceAnnual: 290,
      features: ['100 meetings/month', '10 GB storage', '500 min transcription', 'Priority support'],
      isActive: true,
      isPopular: true,
      subscribers: 480
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      icon: 'Crown',
      priceMonthly: 99,
      priceAnnual: 990,
      features: ['Unlimited meetings', '100 GB storage', 'Unlimited transcription', '24/7 support', 'SSO'],
      isActive: true,
      isPopular: false,
      subscribers: 85
    }
  ]);

  const handleToggleActive = (planId) => {
    setPlans(prev => prev.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
    toast({ title: "Plan status updated" });
  };

  const handleTogglePopular = (planId) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      isPopular: p.id === planId ? !p.isPopular : false
    })));
    toast({ title: "Popular plan updated" });
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleDelete = (planId) => {
    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast({ title: "Plan deleted successfully" });
    }
  };

  const handleSavePlan = () => {
    toast({ title: "Plan saved successfully" });
    setEditDialogOpen(false);
    setSelectedPlan(null);
  };

  const getIconComponent = (iconName) => {
    const icons = { Zap, Star, Crown };
    const IconComponent = icons[iconName] || Zap;
    return <IconComponent className="w-5 h-5" />;
  };

  const totalMRR = plans.reduce((sum, p) => sum + (p.priceMonthly * p.subscribers), 0);
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscribers, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-plans-page">
      <Helmet><title>Subscription Plans | Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage pricing plans and features</p>
        </div>
        <Button className="gap-2" data-testid="add-plan-btn">
          <Plus className="w-4 h-4" /> Add Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total MRR</p>
            <p className="text-2xl font-bold text-green-600">${totalMRR.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Subscribers</p>
            <p className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Plans</p>
            <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Annual</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Popular</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} data-testid={`plan-row-${plan.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {getIconComponent(plan.icon)}
                      </div>
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-xs text-gray-400">{plan.features.length} features</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${plan.priceMonthly}</TableCell>
                  <TableCell className="font-medium">${plan.priceAnnual}</TableCell>
                  <TableCell>{plan.subscribers.toLocaleString()}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={plan.isActive} 
                      onCheckedChange={() => handleToggleActive(plan.id)}
                      data-testid={`toggle-active-${plan.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {plan.isPopular ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Star className="w-3 h-3 mr-1" /> Popular
                      </Badge>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTogglePopular(plan.id)}
                        className="text-gray-400 hover:text-amber-500"
                      >
                        Set Popular
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details and pricing</DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input defaultValue={selectedPlan.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price ($)</Label>
                  <Input type="number" defaultValue={selectedPlan.priceMonthly} />
                </div>
                <div className="space-y-2">
                  <Label>Annual Price ($)</Label>
                  <Input type="number" defaultValue={selectedPlan.priceAnnual} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea 
                  rows={5}
                  defaultValue={selectedPlan.features.join('\n')} 
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlansPage;
