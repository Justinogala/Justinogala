import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Save, Eye, EyeOff, CreditCard, CheckCircle, XCircle, 
  AlertCircle, DollarSign, Package, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { getApiUrl, API_URL } from '@/lib/api';

const AdminStripeSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const [config, setConfig] = useState({
    configured: false,
    api_key: '',
    api_key_preview: null,
    prices: {
      pro: '',
      business: '',
      enterprise: ''
    }
  });

  useEffect(() => {
    loadSettings();
    loadTransactions();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stripe-settings`);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          configured: data.configured,
          api_key: '',
          api_key_preview: data.api_key_preview,
          prices: data.prices || { pro: '', business: '', enterprise: '' }
        });
      }
    } catch (error) {
      console.error('Error loading Stripe settings:', error);
      toast({ variant: 'destructive', title: 'Failed to load settings' });
    }
    setLoading(false);
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-transactions?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    setLoadingTransactions(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (config.api_key) payload.api_key = config.api_key;
      if (config.prices.pro) payload.pro_price_id = config.prices.pro;
      if (config.prices.business) payload.business_price_id = config.prices.business;
      if (config.prices.enterprise) payload.enterprise_price_id = config.prices.enterprise;

      const res = await fetch(`${API_URL}/api/admin/stripe-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: 'Settings saved', description: 'Stripe configuration updated successfully.' });
        loadSettings(); // Reload to get masked key
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    }
    setSaving(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>;
      case 'pending':
      case 'initiated':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stripe Settings</h1>
        <p className="text-muted-foreground mt-1">Configure Stripe for subscription payments.</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* API Key Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                    Stripe API Key
                  </CardTitle>
                  <CardDescription>
                    Enter your Stripe Secret Key from the Stripe Dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                    {config.configured ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">API Key Configured</p>
                          <p className="text-xs text-gray-500">Current key: {config.api_key_preview}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-700 dark:text-red-400">Not Configured</p>
                          <p className="text-xs text-gray-500">Payments are disabled</p>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
                      </>
                    )}
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <Label>{config.configured ? 'Update API Key' : 'Enter API Key'}</Label>
                    <div className="relative">
                      <Input
                        type={showKey ? 'text' : 'password'}
                        placeholder="sk_live_..."
                        value={config.api_key}
                        onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{' '}
                      <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                        Stripe Dashboard <ArrowUpRight className="w-3 h-3 inline" />
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Price IDs Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-fuchsia-500" />
                    Subscription Price IDs
                  </CardTitle>
                  <CardDescription>
                    Enter the Stripe Price IDs for each subscription plan. Create products in Stripe Dashboard first.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pro Plan */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Pro Plan
                      <Badge variant="outline" className="text-xs">$19/month</Badge>
                    </Label>
                    <Input
                      placeholder="price_xxxxxxxxxxxxx"
                      value={config.prices.pro}
                      onChange={(e) => setConfig({
                        ...config,
                        prices: { ...config.prices, pro: e.target.value }
                      })}
                    />
                  </div>

                  {/* Business Plan */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Business Plan
                      <Badge variant="outline" className="text-xs">$39/month</Badge>
                    </Label>
                    <Input
                      placeholder="price_xxxxxxxxxxxxx"
                      value={config.prices.business}
                      onChange={(e) => setConfig({
                        ...config,
                        prices: { ...config.prices, business: e.target.value }
                      })}
                    />
                  </div>

                  {/* Enterprise Plan */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Enterprise Plan
                      <Badge variant="outline" className="text-xs">$79/month</Badge>
                    </Label>
                    <Input
                      placeholder="price_xxxxxxxxxxxxx"
                      value={config.prices.enterprise}
                      onChange={(e) => setConfig({
                        ...config,
                        prices: { ...config.prices, enterprise: e.target.value }
                      })}
                    />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save All Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-300 mb-2">How to set up Stripe</p>
                      <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                        <li>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">dashboard.stripe.com</a></li>
                        <li>Create 3 Products: Pro, Business, Enterprise (recurring monthly)</li>
                        <li>Copy each product's Price ID (starts with price_)</li>
                        <li>Get your Secret API Key from Developers → API keys</li>
                        <li>Paste them above and save</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.configured ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span>Stripe API</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {config.configured ? 'Connected' : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.prices.pro ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span>Pro Price ID</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {config.prices.pro ? 'Set' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.prices.business ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span>Business Price ID</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {config.prices.business ? 'Set' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.prices.enterprise ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span>Enterprise Price ID</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {config.prices.enterprise ? 'Set' : 'Missing'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>View recent payment transactions</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadTransactions} disabled={loadingTransactions}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Session ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 text-sm">{formatDate(tx.created_at)}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="capitalize">{tx.plan_id}</Badge>
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {tx.user_email || tx.user_id || '-'}
                          </td>
                          <td className="py-3">{getStatusBadge(tx.payment_status)}</td>
                          <td className="py-3 text-xs text-muted-foreground font-mono">
                            {tx.session_id?.slice(0, 20)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStripeSettingsPage;
