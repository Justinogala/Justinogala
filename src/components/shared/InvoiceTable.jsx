
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import InvoiceActionButtons from './InvoiceActionButtons';
import { Card } from '@/components/ui/card';

const InvoiceTable = ({ invoices = [], onAction }) => {
  const EmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      <div className="flex flex-col items-center justify-center gap-2">
        <FileText className="h-8 w-8 opacity-20" />
        <p>No invoices found</p>
      </div>
    </div>
  );

  if (!invoices.length) return <EmptyState />;

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {invoices.map((invoice, i) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-gray-500">#{invoice.id.substring(0, 8)}</span>
                  <span className="font-medium text-sm">{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                <Badge 
                  variant="outline"
                  className={`
                    ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                    ${invoice.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                  `}
                >
                  {invoice.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-lg font-bold">${Number(invoice.amount).toFixed(2)}</span>
                <InvoiceActionButtons 
                  invoice={invoice} 
                  onAction={onAction} 
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50">
                <TableHead className="w-[120px]">Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, i) => (
                <motion.tr 
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <TableCell className="font-medium font-mono text-xs">{invoice.id}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(invoice.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`
                        ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                        ${invoice.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                      `}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceActionButtons 
                      invoice={invoice} 
                      onAction={onAction} 
                    />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default InvoiceTable;
