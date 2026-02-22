
import React from 'react';
import { format } from 'date-fns';
import { Download, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import InvoiceActionButtons from '@/components/shared/InvoiceActionButtons';
import { Card } from '@/components/ui/card';

const BillingHistoryTable = ({ history, onUpdate }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-gray-50 dark:bg-slate-900/50">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No billing history available from Munal AI.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <Badge variant="success" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> PAID</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> OVERDUE</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>;
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {history.map((invoice) => (
          <Card key={invoice.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-mono text-gray-500 block mb-1">#{invoice.id.substring(0, 8)}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">{format(new Date(invoice.date), 'MMM dd, yyyy')}</h4>
              </div>
              {getStatusBadge(invoice.status)}
            </div>
            
            <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 dark:border-gray-800 mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">${Number(invoice.amount).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 truncate max-w-[120px]">{invoice.description}</span>
              <InvoiceActionButtons invoice={invoice} onActionComplete={onUpdate} />
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-900">
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {format(new Date(invoice.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-gray-500">{invoice.id}</span>
                    <span className="text-sm truncate max-w-[150px]">{invoice.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{invoice.userName}</span>
                    <span className="text-xs text-gray-500">{invoice.userEmail}</span>
                  </div>
                </TableCell>
                <TableCell>
                  ${Number(invoice.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(invoice.status)}
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActionButtons invoice={invoice} onActionComplete={onUpdate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default BillingHistoryTable;
