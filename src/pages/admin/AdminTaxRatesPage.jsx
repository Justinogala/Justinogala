import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Percent, Globe, MapPin, 
  MoreVertical, CheckCircle, XCircle, RefreshCw, Loader2,
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

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// Common countries for tax rates
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const AdminTaxRatesPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxRates, setTaxRates] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    country: '',
    state: '',
    description: '',
    is_inclusive: false,
    is_active: true
  });

  const fetchTaxRates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter !== 'all') {
        params.append('country', countryFilter);
      }
      
      const response = await fetch(`${API_URL}/api/admin/tax-rates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tax rates');
      
      const data = await response.json();
      setTaxRates(data.tax_rates || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      toast({ title: "Error", description: "Failed to load tax rates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [countryFilter, toast]);

  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  const resetForm = () => {
    setFormData({
      name: '',
      rate: '',
      country: '',
      state: '',
      description: '',
      is_inclusive: false,
      is_active: true
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.rate || !formData.country) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/tax-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rate: parseFloat(formData.rate),
          country: formData.country,
          state: formData.state || null,
          description: formData.description || null,
          is_inclusive: formData.is_inclusive,
          is_active: formData.is_active
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create tax rate');
      }
      
      toast({ title: "Success", description: "Tax rate created successfully" });
      setCreateDialogOpen(false);
      resetForm();
      fetchTaxRates();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTax) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/tax-rates/${selectedTax.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rate: parseFloat(formData.rate),
          country: formData.country,
          state: formData.state || null,
          description: formData.description || null,
          is_inclusive: formData.is_inclusive,
          is_active: formData.is_active
        })
      });
      
      if (!response.ok) throw new Error('Failed to update tax rate');
      
      toast({ title: "Success", description: "Tax rate updated successfully" });
      setEditDialogOpen(false);
      setSelectedTax(null);
      resetForm();
      fetchTaxRates();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete tax rate "${name}"? This cannot be undone.`)) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/tax-rates/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete tax rate');
      
      toast({ title: "Success", description: "Tax rate deleted" });
      fetchTaxRates();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tax-rates/${id}/toggle`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to toggle status');
      
      toast({ title: "Success", description: `Tax rate ${currentStatus ? 'deactivated' : 'activated'}` });
      fetchTaxRates();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (tax) => {
    setSelectedTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate.toString(),
      country: tax.country,
      state: tax.state || '',
      description: tax.description || '',
      is_inclusive: tax.is_inclusive,
      is_active: tax.is_active
    });
    setEditDialogOpen(true);
  };

  const getCountryName = (code) => {
    const country = COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

  const filteredTaxRates = taxRates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: taxRates.length,
    active: taxRates.filter(t => t.is_active).length,
    countries: new Set(taxRates.map(t => t.country)).size
  };

  return (
    <>
      <Helmet><title>Tax Rates - Admin</title></Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Tax Rates
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage tax rates by country and region</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTaxRates} className="border-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Tax Rate
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Rates', value: stats.total, icon: Percent, color: 'from-blue-500 to-cyan-500' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
            { label: 'Countries', value: stats.countries, icon: Globe, color: 'from-violet-500 to-purple-500' }
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", stat.color)}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tax rates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-800 border-gray-700"
                  />
                </div>
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-gray-700">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tax Rates Table */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">All Tax Rates</CardTitle>
            <CardDescription>{filteredTaxRates.length} rate(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="ml-3 text-gray-400">Loading tax rates...</span>
              </div>
            ) : filteredTaxRates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Percent className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">No tax rates found</p>
                <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="mt-4 border-gray-700">
                  Add your first tax rate
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Rate</TableHead>
                    <TableHead className="text-gray-400">Location</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxRates.map((tax) => (
                    <TableRow key={tax.id} className="border-gray-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="font-medium text-white">{tax.name}</div>
                        {tax.description && (
                          <p className="text-xs text-gray-500 mt-1">{tax.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/20 text-emerald-400 font-mono">
                          {tax.rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{getCountryName(tax.country)}</span>
                          {tax.state && (
                            <Badge variant="outline" className="text-xs border-gray-600">
                              {tax.state}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={tax.is_inclusive ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}>
                          {tax.is_inclusive ? 'Inclusive' : 'Exclusive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tax.is_active}
                          onCheckedChange={() => handleToggle(tax.id, tax.is_active)}
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
                            <DropdownMenuItem onClick={() => openEditDialog(tax)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(tax.id, tax.name)} className="text-red-400">
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
        if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); setSelectedTax(null); resetForm(); }
      }}>
        <DialogContent className="bg-slate-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editDialogOpen ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update tax rate details' : 'Create a new tax rate'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                placeholder="e.g., US Sales Tax"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-gray-700"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Rate (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 8.25"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="bg-slate-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Country *</Label>
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger className="bg-slate-800 border-gray-700">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">State/Province (Optional)</Label>
              <Input
                placeholder="e.g., CA, NY, ON"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="bg-slate-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Input
                placeholder="e.g., California state sales tax"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-gray-700"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-gray-700">
              <div>
                <Label className="text-gray-300">Tax Inclusive</Label>
                <p className="text-xs text-gray-500 mt-0.5">Tax is included in displayed prices</p>
              </div>
              <Switch
                checked={formData.is_inclusive}
                onCheckedChange={(checked) => setFormData({ ...formData, is_inclusive: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-gray-700">
              <Label className="text-gray-300">Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); }} className="border-gray-700">
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

export default AdminTaxRatesPage;
