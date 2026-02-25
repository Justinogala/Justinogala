import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Download, Filter, Receipt, Calendar, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, Eye, FileText, Loader2 } from 'lucide-react';
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

const API_URL = import.meta.env.VITE_API_URL || '';

const AdminTransactionsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/transactions/all?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.package_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    revenue: transactions.filter(t => t.payment_status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0),
    pending: transactions.filter(t => t.payment_status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0),
    refunded: transactions.filter(t => t.payment_status === 'refunded').reduce((sum, t) => sum + (t.amount || 0), 0),
    failed: transactions.filter(t => t.payment_status === 'failed' || t.payment_status === 'expired').length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage all payment transactions ({total} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2" data-testid="export-btn">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
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
                placeholder="Search by ID, user email, or package..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      {transactions.length === 0 ? 'No transactions yet' : 'No transactions found matching your criteria'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50" data-testid={`txn-row-${txn.id}`}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {txn.id?.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{txn.user_id || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">{txn.user_email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(txn.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.package_name || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(txn.payment_status)}
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
                          {txn.payment_status === 'paid' && (
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
          )}
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
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="font-medium font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Session ID</p>
                  <p className="font-medium font-mono text-xs">{selectedTransaction.session_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium">{selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  {getStatusBadge(selectedTransaction.payment_status)}
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium text-lg">${(selectedTransaction.amount || 0).toFixed(2)} {selectedTransaction.currency?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Package</p>
                  <p className="font-medium">{selectedTransaction.package_name || '-'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-500 text-sm mb-2">Customer</p>
                <p className="font-medium">{selectedTransaction.user_id || 'Anonymous'}</p>
                <p className="text-sm text-gray-400">{selectedTransaction.user_email || '-'}</p>
              </div>
              
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm mb-2">Metadata</p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedTransaction.payment_status === 'paid' && (
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
