
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { paymentTransactionService } from '@/services/paymentTransactionService';

const PaymentGatewayTransactionLogsModal = ({ isOpen, onClose, gateway }) => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && gateway) {
      setLogs(paymentTransactionService.getLogsForGateway(gateway.id));
    }
  }, [isOpen, gateway]);

  const filteredLogs = logs.filter(log => 
    log.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !gateway) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div>
              <h2 className="text-xl font-bold dark:text-white">Transaction Logs</h2>
              <p className="text-sm text-slate-500">Viewing logs for {gateway.name}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/30">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search transaction ID..." 
                className="pl-9 bg-white dark:bg-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <Button variant="outline" onClick={() => setLogs(paymentTransactionService.getLogsForGateway(gateway.id))}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="overflow-auto flex-1 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">No logs found</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">${log.amount} {log.currency}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'completed' ? 'default' : 'destructive'} className={log.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono max-w-xs truncate">
                        {typeof log.gatewayResponse === 'string' ? log.gatewayResponse : JSON.stringify(log.gatewayResponse)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentGatewayTransactionLogsModal;
