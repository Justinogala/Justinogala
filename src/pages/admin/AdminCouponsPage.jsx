import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Copy, Tag, Percent, Calendar, Users, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const AdminCouponsPage = () => {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    discount: '',
    minPurchase: '',
    maxUses: '',
    expiryDate: ''
  });

  const [coupons, setCoupons] = useState([
    {
      id: 'coup_1',
      code: 'WELCOME20',
      type: 'percentage',
      discount: 20,
      minPurchase: 50,
      maxUses: 1000,
      usedCount: 342,
      expiryDate: '2025-03-31',
      isActive: true
    },
    {
      id: 'coup_2',
      code: 'ANNUAL50',
      type: 'fixed',
      discount: 50,
      minPurchase: 200,
      maxUses: 500,
      usedCount: 128,
      expiryDate: '2025-02-28',
      isActive: true
    },
    {
      id: 'coup_3',
      code: 'HOLIDAY30',
      type: 'percentage',
      discount: 30,
      minPurchase: 100,
      maxUses: 200,
      usedCount: 200,
      expiryDate: '2024-12-31',
      isActive: false
    },
    {
      id: 'coup_4',
      code: 'VIP100',
      type: 'fixed',
      discount: 100,
      minPurchase: 500,
      maxUses: 50,
      usedCount: 12,
      expiryDate: '2025-12-31',
      isActive: true
    }
  ]);

  const handleToggleActive = (couponId) => {
    setCoupons(prev => prev.map(c => 
      c.id === couponId ? { ...c, isActive: !c.isActive } : c
    ));
    toast({ title: "Coupon status updated" });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const handleDelete = (couponId) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      toast({ title: "Coupon deleted" });
    }
  };

  const handleCreateCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount) {
      toast({ variant: "destructive", title: "Please fill in required fields" });
      return;
    }
    
    const coupon = {
      id: `coup_${Date.now()}`,
      ...newCoupon,
      discount: parseFloat(newCoupon.discount),
      minPurchase: parseFloat(newCoupon.minPurchase) || 0,
      maxUses: parseInt(newCoupon.maxUses) || 9999,
      usedCount: 0,
      isActive: true
    };
    
    setCoupons(prev => [coupon, ...prev]);
    setCreateDialogOpen(false);
    setNewCoupon({ code: '', type: 'percentage', discount: '', minPurchase: '', maxUses: '', expiryDate: '' });
    toast({ title: "Coupon created successfully" });
  };

  const totalSavings = coupons.reduce((sum, c) => {
    const avgDiscount = c.type === 'percentage' ? (c.minPurchase * c.discount / 100) : c.discount;
    return sum + (avgDiscount * c.usedCount);
  }, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-coupons-page">
      <Helmet><title>Coupon Management | Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupon Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" data-testid="create-coupon-btn">
          <Plus className="w-4 h-4" /> Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Coupons</p>
            <p className="text-2xl font-bold text-green-600">{coupons.filter(c => c.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Redemptions</p>
            <p className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.usedCount, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Savings Given</p>
            <p className="text-2xl font-bold text-amber-600">${totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Expired Coupons</p>
            <p className="text-2xl font-bold text-gray-400">{coupons.filter(c => !c.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. Purchase</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id} data-testid={`coupon-row-${coupon.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm font-medium">
                        {coupon.code}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={coupon.type === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}>
                      {coupon.type === 'percentage' ? <Percent className="w-3 h-3 mr-1" /> : <Tag className="w-3 h-3 mr-1" />}
                      {coupon.type === 'percentage' ? `${coupon.discount}%` : `$${coupon.discount}`}
                    </Badge>
                  </TableCell>
                  <TableCell>${coupon.minPurchase}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{coupon.usedCount} / {coupon.maxUses}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={coupon.isActive} 
                      onCheckedChange={() => handleToggleActive(coupon.id)}
                      data-testid={`toggle-coupon-${coupon.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(coupon.id)}
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

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>Create a new discount coupon for your users</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input 
                placeholder="e.g., SUMMER25"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                className="font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select 
                  value={newCoupon.type} 
                  onValueChange={(val) => setNewCoupon({...newCoupon, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input 
                  type="number"
                  placeholder={newCoupon.type === 'percentage' ? '20' : '50'}
                  value={newCoupon.discount}
                  onChange={(e) => setNewCoupon({...newCoupon, discount: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. Purchase ($)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newCoupon.minPurchase}
                  onChange={(e) => setNewCoupon({...newCoupon, minPurchase: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input 
                  type="number"
                  placeholder="Unlimited"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({...newCoupon, maxUses: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input 
                type="date"
                value={newCoupon.expiryDate}
                onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponsPage;
