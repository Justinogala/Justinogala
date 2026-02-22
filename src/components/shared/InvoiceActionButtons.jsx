
import React, { useState } from 'react';
import { 
  Eye, 
  Download, 
  Mail, 
  CheckCircle, 
  MoreVertical,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { invoiceActionService } from '@/services/invoiceActionService';
import { useToast } from '@/components/ui/use-toast';
import InvoiceDetailModal from '@/components/admin/InvoiceDetailModal';

const InvoiceActionButtons = ({ invoice, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { toast } = useToast();
  
  const isPaid = invoice.status?.toLowerCase() === 'paid';
  
  const handleAction = async (actionFn, actionName) => {
    setLoading(true);
    try {
      const result = await actionFn(invoice);
      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "success" });
        if (onActionComplete) onActionComplete(result.data);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <MoreVertical className="h-4 w-4 text-slate-500" />
              )}
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setShowDetail(true)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleAction(invoiceActionService.downloadInvoice, 'download')}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleAction(invoiceActionService.sendInvoice, 'send')}>
              <Mail className="mr-2 h-4 w-4" /> {invoice.status === 'sent' ? 'Resend Email' : 'Send Email'}
            </DropdownMenuItem>
            
            {!isPaid && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleAction(invoiceActionService.markAsPaid, 'markPaid')}
                  className="text-green-600 dark:text-green-400 focus:text-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAction(invoiceActionService.markAsOverdue, 'markOverdue')}
                  className="text-orange-600 dark:text-orange-400"
                >
                  <AlertCircle className="mr-2 h-4 w-4" /> Mark Overdue
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <InvoiceDetailModal 
        isOpen={showDetail} 
        onClose={() => setShowDetail(false)} 
        invoice={invoice}
        onUpdate={(data) => {
          if (onActionComplete) onActionComplete(data);
        }}
      />
    </>
  );
};

export default InvoiceActionButtons;
