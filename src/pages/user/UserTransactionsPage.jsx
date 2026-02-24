import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Download, Filter, Receipt, Calendar, CreditCard, CheckCircle, Clock, XCircle, Eye, FileText } from 'lucide-react';
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

const UserTransactionsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Mock transactions data
  const [transactions] = useState([
    {
      id: 'txn_001',
      invoiceId: 'INV-2025-001',
      date: '2025-01-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    },
    {
      id: 'txn_002',
      invoiceId: 'INV-2024-012',
      date: '2024-12-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    },
    {
      id: 'txn_003',
      invoiceId: 'INV-2024-011',
      date: '2024-11-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    },
    {
      id: 'txn_004',
      invoiceId: 'INV-2024-010',
      date: '2024-10-20',
      description: 'Storage Add-on 5GB',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'Mastercard ****8888',
      type: 'addon'
    },
    {
      id: 'txn_005',
      invoiceId: 'INV-2024-009',
      date: '2024-10-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'failed',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    },
    {
      id: 'txn_006',
      invoiceId: 'INV-2024-008',
      date: '2024-09-15',
      description: 'Pro Plan - Monthly',
      amount: 29.00,
      currency: 'USD',
      status: 'refunded',
      paymentMethod: 'Visa ****4242',
      type: 'subscription'
    }
  ]);

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    thisMonth: transactions.filter(t => t.status === 'completed' && t.date.startsWith('2025-01')).reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pending').length
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
        return <Badge variant="secondary"><Receipt className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (txn) => {
    setSelectedTransaction(txn);
    setDetailsOpen(true);
  };

  const handleDownloadInvoice = (invoiceId) => {
    toast({
      title: "Downloading invoice",
      description: `Preparing ${invoiceId} for download...`
    });
  };

  const handleExportAll = () => {
    toast({
      title: "Export started",
      description: "Your transaction history is being prepared for download."
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="user-transactions-page">
      <Helmet><title>Transaction History | Munal</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View all your payments and invoices</p>
        </div>
        <Button variant="outline" onClick={handleExportAll} className="gap-2" data-testid="export-btn">
          <Download className="w-4 h-4" /> Export All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.thisMonth.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            </div>
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
                placeholder="Search by invoice ID or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No transactions found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50" data-testid={`transaction-row-${txn.id}`}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {txn.invoiceId}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(txn.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{txn.description}</p>
                        <p className="text-xs text-gray-400">{txn.paymentMethod}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${txn.amount.toFixed(2)}
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
                          data-testid={`view-details-${txn.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadInvoice(txn.invoiceId)}
                          data-testid={`download-invoice-${txn.id}`}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
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
        <DialogContent>
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
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
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
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-500 text-sm">Description</p>
                <p className="font-medium">{selectedTransaction.description}</p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleDownloadInvoice(selectedTransaction.invoiceId)}>
                  <Download className="w-4 h-4 mr-2" /> Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTransactionsPage;
