import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Download, Filter, Receipt, Calendar, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, Eye, FileText, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminTransactionsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Mock transactions data
  const [transactions] = useState([
    {
      id: 'txn_admin_001',
      invoiceId: 'INV-2025-001',
      date: '2025-01-15T10:30:00',
      user: { name: 'John Doe', email: 'john@example.com' },
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'completed',
      gateway: 'stripe',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    },
    {
      id: 'txn_admin_002',
      invoiceId: 'INV-2025-002',
      date: '2025-01-14T15:45:00',
      user: { name: 'Jane Smith', email: 'jane@company.com' },
      description: 'Enterprise Plan - Annual',
      amount: 990.00,
      currency: 'USD',
      status: 'completed',
      gateway: 'stripe',
      paymentMethod: 'Mastercard ****8888',
      type: 'subscription'
    },
    {
      id: 'txn_admin_003',
      invoiceId: 'INV-2025-003',
      date: '2025-01-13T09:15:00',
      user: { name: 'Bob Wilson', email: 'bob@startup.io' },
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'pending',
      gateway: 'paypal',
      paymentMethod: 'PayPal',
      type: 'subscription'
    },
    {
      id: 'txn_admin_004',
      invoiceId: 'INV-2025-004',
      date: '2025-01-12T14:20:00',
      user: { name: 'Alice Johnson', email: 'alice@corp.com' },
      description: 'Storage Add-on 10GB',
      amount: 19.99,
      currency: 'USD',
      status: 'completed',
      gateway: 'stripe',
      paymentMethod: 'Visa ****1234',
      type: 'addon'
    },
    {
      id: 'txn_admin_005',
      invoiceId: 'INV-2025-005',
      date: '2025-01-11T11:00:00',
      user: { name: 'Charlie Brown', email: 'charlie@test.com' },
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'failed',
      gateway: 'stripe',
      paymentMethod: 'Visa ****5678',
      type: 'subscription'
    },
    {
      id: 'txn_admin_006',
      invoiceId: 'INV-2025-006',
      date: '2025-01-10T16:30:00',
      user: { name: 'Diana Prince', email: 'diana@hero.com' },
      description: 'Enterprise Plan - Monthly',
      amount: 99.00,
      currency: 'USD',
      status: 'refunded',
      gateway: 'stripe',
      paymentMethod: 'Amex ****9999',
      type: 'subscription'
    }
  ]);

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesGateway = gatewayFilter === 'all' || txn.gateway === gatewayFilter;
    return matchesSearch && matchesStatus && matchesGateway;
  });

  // Calculate stats
  const stats = {
    revenue: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    refunded: transactions.filter(t => t.status === 'refunded').reduce((sum, t) => sum + t.amount, 0),
    failed: transactions.filter(t => t.status === 'failed').length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (txn) => {
    setSelectedTransaction(txn);
    setDetailsOpen(true);
  };

  const handleRefund = (txnId) => {
    toast({
      title: "Refund initiated",
      description: `Processing refund for transaction ${txnId}...`
    });
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Preparing transaction report for download..."
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" data-testid="admin-transactions-page">
      <Helmet><title>Transactions | Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage all payment transactions</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2" data-testid="export-btn">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">${stats.pending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Refunded</p>
            <p className="text-2xl font-bold text-gray-500">${stats.refunded.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Failed Transactions</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by invoice, user name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="gateway-filter">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    No transactions found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50" data-testid={`txn-row-${txn.id}`}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {txn.invoiceId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{txn.user.name}</p>
                        <p className="text-xs text-gray-400">{txn.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(txn.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${txn.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{txn.gateway}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(txn.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(txn)}
                          data-testid={`view-${txn.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {txn.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRefund(txn.id)}
                            className="text-amber-600 hover:text-amber-700"
                            data-testid={`refund-${txn.id}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice ID</p>
                  <p className="font-medium font-mono">{selectedTransaction.invoiceId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="font-medium font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium">{new Date(selectedTransaction.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium text-lg">${selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gateway</p>
                  <p className="font-medium capitalize">{selectedTransaction.gateway}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-500 text-sm mb-2">Customer</p>
                <p className="font-medium">{selectedTransaction.user.name}</p>
                <p className="text-sm text-gray-400">{selectedTransaction.user.email}</p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-500 text-sm">Description</p>
                <p className="font-medium">{selectedTransaction.description}</p>
                <p className="text-sm text-gray-400 mt-1">Payment: {selectedTransaction.paymentMethod}</p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedTransaction.status === 'completed' && (
                  <Button variant="outline" onClick={() => handleRefund(selectedTransaction.id)} className="text-amber-600">
                    <RefreshCw className="w-4 h-4 mr-2" /> Issue Refund
                  </Button>
                )}
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" /> View Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionsPage;
