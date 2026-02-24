import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Percent, Globe, MapPin, MoreVertical } from 'lucide-react';
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

const AdminTaxRatesPage = () => {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState({
    name: '',
    rate: '',
    country: '',
    region: '',
    type: 'vat'
  });

  const [taxRates, setTaxRates] = useState([
    {
      id: 'tax_1',
      name: 'US Sales Tax',
      rate: 8.25,
      country: 'United States',
      region: 'California',
      type: 'sales',
      isActive: true,
      appliedCount: 234
    },
    {
      id: 'tax_2',
      name: 'EU VAT Standard',
      rate: 20,
      country: 'European Union',
      region: 'All',
      type: 'vat',
      isActive: true,
      appliedCount: 567
    },
    {
      id: 'tax_3',
      name: 'UK VAT',
      rate: 20,
      country: 'United Kingdom',
      region: 'All',
      type: 'vat',
      isActive: true,
      appliedCount: 189
    },
    {
      id: 'tax_4',
      name: 'Canada GST',
      rate: 5,
      country: 'Canada',
      region: 'Federal',
      type: 'gst',
      isActive: true,
      appliedCount: 145
    },
    {
      id: 'tax_5',
      name: 'Australia GST',
      rate: 10,
      country: 'Australia',
      region: 'All',
      type: 'gst',
      isActive: false,
      appliedCount: 78
    }
  ]);

  const handleToggleActive = (taxId) => {
    setTaxRates(prev => prev.map(t => 
      t.id === taxId ? { ...t, isActive: !t.isActive } : t
    ));
    toast({ title: "Tax rate status updated" });
  };

  const handleDelete = (taxId) => {
    if (confirm('Are you sure you want to delete this tax rate?')) {
      setTaxRates(prev => prev.filter(t => t.id !== taxId));
      toast({ title: "Tax rate deleted" });
    }
  };

  const handleCreateTaxRate = () => {
    if (!newTaxRate.name || !newTaxRate.rate || !newTaxRate.country) {
      toast({ variant: "destructive", title: "Please fill in required fields" });
      return;
    }
    
    const taxRate = {
      id: `tax_${Date.now()}`,
      ...newTaxRate,
      rate: parseFloat(newTaxRate.rate),
      isActive: true,
      appliedCount: 0
    };
    
    setTaxRates(prev => [taxRate, ...prev]);
    setCreateDialogOpen(false);
    setNewTaxRate({ name: '', rate: '', country: '', region: '', type: 'vat' });
    toast({ title: "Tax rate created successfully" });
  };

  const getTaxTypeBadge = (type) => {
    const styles = {
      vat: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      gst: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return <Badge className={styles[type] || styles.vat}>{type.toUpperCase()}</Badge>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-tax-rates-page">
      <Helmet><title>Tax Rates | Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Rates</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure regional tax rates for billing</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" data-testid="create-tax-btn">
          <Plus className="w-4 h-4" /> Add Tax Rate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Tax Rates</p>
            <p className="text-2xl font-bold text-green-600">{taxRates.filter(t => t.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Countries Covered</p>
            <p className="text-2xl font-bold">{new Set(taxRates.map(t => t.country)).size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold">{taxRates.reduce((sum, t) => sum + t.appliedCount, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Rates Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((tax) => (
                <TableRow key={tax.id} data-testid={`tax-row-${tax.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{tax.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {tax.country}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getTaxTypeBadge(tax.type)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-lg">{tax.rate}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" /> {tax.region}
                    </div>
                  </TableCell>
                  <TableCell>{tax.appliedCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={tax.isActive} 
                      onCheckedChange={() => handleToggleActive(tax.id)}
                      data-testid={`toggle-tax-${tax.id}`}
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
                          onClick={() => handleDelete(tax.id)}
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

      {/* Create Tax Rate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tax Rate</DialogTitle>
            <DialogDescription>Configure a new tax rate for a region</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tax Name *</Label>
              <Input 
                placeholder="e.g., US Sales Tax"
                value={newTaxRate.name}
                onChange={(e) => setNewTaxRate({...newTaxRate, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Type</Label>
                <Select 
                  value={newTaxRate.type} 
                  onValueChange={(val) => setNewTaxRate({...newTaxRate, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vat">VAT</SelectItem>
                    <SelectItem value="sales">Sales Tax</SelectItem>
                    <SelectItem value="gst">GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate (%) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="20"
                  value={newTaxRate.rate}
                  onChange={(e) => setNewTaxRate({...newTaxRate, rate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input 
                  placeholder="e.g., United States"
                  value={newTaxRate.country}
                  onChange={(e) => setNewTaxRate({...newTaxRate, country: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Region/State</Label>
                <Input 
                  placeholder="e.g., California or All"
                  value={newTaxRate.region}
                  onChange={(e) => setNewTaxRate({...newTaxRate, region: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTaxRate}>Add Tax Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTaxRatesPage;
