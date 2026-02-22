
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Send, CheckCircle, Trash2, Calendar, User, Mail, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { invoiceActionService } from '@/services/invoiceActionService';
import { useToast } from '@/components/ui/use-toast';

const InvoiceDetailModal = ({ invoice, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();

  if (!invoice) return null;

  const handleAction = async (actionFn, successMessage) => {
    const result = await actionFn(invoice);
    if (result.success) {
      toast({ title: "Success", description: result.message, variant: "success" });
      if (onUpdate && result.data) onUpdate(result.data);
      if (successMessage === 'Invoice deleted') onClose();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">Munal AI Invoice {invoice.id}</DialogTitle>
              <DialogDescription>
                Created on {format(new Date(invoice.date), 'MMMM dd, yyyy')}
              </DialogDescription>
            </div>
            <Badge className={`
              ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
              ${invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : ''}
              ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {invoice.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-500">Bill To</h4>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{invoice.userName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-gray-400" />
                {invoice.userEmail}
              </div>
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm font-medium text-gray-500">Munal AI Billing</h4>
              <div className="flex items-center justify-end gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                <CreditCard className="h-4 w-4 text-gray-400" />
                {invoice.amount > 0 ? 'Card ending 4242' : 'No payment needed'}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Line Items</h4>
            <div className="space-y-2">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span className="font-medium">${Number(item.amount).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm">
                  <span>{invoice.description || 'Service Fee'}</span>
                  <span className="font-medium">${Number(invoice.amount).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">${Number(invoice.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
           <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => handleAction(invoiceActionService.downloadInvoice, 'PDF Downloaded')}>
               <Download className="mr-2 h-4 w-4" /> Download
             </Button>
             <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => handleAction(invoiceActionService.sendInvoice, 'Email Sent')}>
               <Send className="mr-2 h-4 w-4" /> Email
             </Button>
           </div>
           <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
             {invoice.status !== 'paid' && (
               <Button 
                 variant="outline" 
                 className="flex-1 sm:flex-none text-green-600 hover:text-green-700 hover:bg-green-50"
                 onClick={() => handleAction(invoiceActionService.markAsPaid, 'Marked as Paid')}
               >
                 <CheckCircle className="mr-2 h-4 w-4" /> Paid
               </Button>
             )}
             <Button 
               variant="outline" 
               className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
               onClick={() => {
                 if(window.confirm('Delete this invoice?')) handleAction(invoiceActionService.deleteInvoice, 'Invoice deleted');
               }}
             >
               <Trash2 className="mr-2 h-4 w-4" /> Delete
             </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;
