
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, DollarSign, CreditCard, FileText, Loader2, RefreshCw } from 'lucide-react';
import { invoiceDataService } from '@/services/invoiceDataService';
import BillingHistoryTable from '@/components/billing/BillingHistoryTable';
import { Button } from '@/components/ui/button';

const AdminBillingPage = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, activeInvoices: 0 });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const invoicesData = await invoiceDataService.getAllInvoices();
      setInvoices(invoicesData);
      
      const totalRevenue = invoicesData
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount), 0);
        
      const pendingAmount = invoicesData
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + Number(i.amount), 0);
        
      const activeInvoices = invoicesData.length;

      setStats({ totalRevenue, pendingAmount, activeInvoices });
    } catch (error) {
      console.error("Failed to load billing data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filter === 'all' || inv.status === filter;
    const matchesSearch = 
      (inv.userName && inv.userName.toLowerCase().includes(search.toLowerCase())) || 
      (inv.id && inv.id.includes(search)) ||
      (inv.userEmail && inv.userEmail.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Munal AI - Billing & Payments</h1>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Munal AI lifetime earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInvoices}</div>
            <p className="text-xs text-gray-500">Total processed by Munal AI</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="border-0 shadow-none bg-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search user, email or ID..." 
                  className="pl-8 bg-white dark:bg-slate-900"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <BillingHistoryTable history={filteredInvoices} onUpdate={loadData} />
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <div className="flex justify-center p-20 text-gray-500 border rounded-lg bg-white dark:bg-slate-900">
             Munal AI transaction logs coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBillingPage;
