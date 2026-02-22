
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { paymentTransactionService } from '@/services/paymentTransactionService';
import { paymentUIService } from '@/services/paymentUIService';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';
import PaymentReceiptModal from '@/components/payment/PaymentReceiptModal';

const UserPaymentHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all', gatewayId: 'all' });
  const [stats, setStats] = useState({ totalPaid: 0, pendingAmount: 0, failedCount: 0 });
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      const all = paymentTransactionService.getTransactionHistory();
      setTransactions(all);
      setFilteredTransactions(all);
      setStats(paymentUIService.calculateStats(all));
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    const result = paymentUIService.filterPayments(transactions, filters);
    setFilteredTransactions(result);
  }, [filters, transactions]);

  const handleViewReceipt = (txn) => {
    setSelectedTxn(txn);
    setIsReceiptOpen(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <Helmet>
        <title>Payment History | Munal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
          <p className="text-gray-500 mt-2">View and manage all your past transactions.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => paymentUIService.exportToCSV(filteredTransactions)}>
             <Download className="w-4 h-4 mr-2" /> Export CSV
           </Button>
           <Button variant="outline" onClick={() => paymentUIService.exportToPDF(filteredTransactions)}>
             <Download className="w-4 h-4 mr-2" /> Export PDF
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
            <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
              {paymentUIService.formatCurrency(stats.totalPaid)}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Pending Amount</p>
            <h3 className="text-2xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">
              {paymentUIService.formatCurrency(stats.pendingAmount)}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Failed Transactions</p>
            <h3 className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
              {stats.failedCount}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search Invoice # or Transaction ID..." 
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <Select 
            value={filters.status} 
            onValueChange={(val) => setFilters({...filters, status: val})}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.gatewayId} 
            onValueChange={(val) => setFilters({...filters, gatewayId: val})}
          >
            <SelectTrigger className="w-full md:w-[180px]">
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
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      No transactions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => handleViewReceipt(txn)}>
                      <TableCell className="font-medium">
                        {paymentUIService.formatDate(txn.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-medium">Invoice #{txn.invoiceId}</span>
                           <span className="text-xs text-gray-400 font-mono">{txn.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {paymentUIService.formatCurrency(txn.amount, txn.currency)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={txn.status} />
                      </TableCell>
                      <TableCell className="capitalize text-gray-600 dark:text-gray-400">
                        {txn.gatewayId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewReceipt(txn); }}>
                          View Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <PaymentReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTxn}
      />
    </div>
  );
};

export default UserPaymentHistoryPage;
