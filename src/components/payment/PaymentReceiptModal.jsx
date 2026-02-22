
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, Share2, CheckCircle2 } from 'lucide-react';
import { paymentUIService } from '@/services/paymentUIService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '@/components/ui/use-toast';

const PaymentReceiptModal = ({ isOpen, onClose, transaction }) => {
  const receiptRef = useRef();
  const { toast } = useToast();

  if (!transaction) return null;

  const handleDownloadPDF = async () => {
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt_${transaction.id}.pdf`);
      
      toast({ title: "Success", description: "Receipt downloaded successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Munal AI - Transaction Receipt</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm" ref={receiptRef}>
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {paymentUIService.formatCurrency(transaction.amount, transaction.currency)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid successfully to Munal AI</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {paymentUIService.formatDateTime(transaction.timestamp)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white text-xs">
                {transaction.id}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice Number</span>
              <span className="font-medium text-gray-900 dark:text-white">
                #{transaction.invoiceId || 'N/A'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {transaction.gatewayId}
              </span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-dashed border-gray-300 dark:border-gray-700">
               <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                 <span>Total Paid</span>
                 <span>{paymentUIService.formatCurrency(transaction.amount, transaction.currency)}</span>
               </div>
            </div>
          </div>
          
          <div className="hidden print:block mt-8 text-center text-xs text-gray-400">
            Thank you for using Munal AI.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptModal;
