
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { invoiceActionService } from '@/services/invoiceActionService';

export const useInvoiceActions = (refreshCallback) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'delete', 'paid', 'view', 'edit', 'email'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const openModal = (type, invoice) => {
    setSelectedInvoice(invoice);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedInvoice(null);
  };

  const executeAction = async (actionType, invoice, payload = {}) => {
    setLoading(true);
    let result = { success: false, message: 'Unknown action' };

    try {
      switch (actionType) {
        case 'download':
          result = await invoiceActionService.downloadInvoicePDF(invoice);
          break;
        case 'print':
          result = await invoiceActionService.printInvoice(invoice);
          break;
        case 'duplicate':
          result = await invoiceActionService.duplicateInvoice(invoice.id);
          if (result.success && refreshCallback) refreshCallback();
          break;
        case 'delete':
          result = await invoiceActionService.deleteInvoice(invoice.id);
          if (result.success) {
            closeModal();
            if (refreshCallback) refreshCallback();
          }
          break;
        case 'markPaid':
          result = await invoiceActionService.markAsPaid(invoice.id);
          if (result.success) {
            closeModal();
            if (refreshCallback) refreshCallback();
          }
          break;
        case 'edit':
          result = await invoiceActionService.editInvoice(invoice.id, payload);
          if (result.success) {
            closeModal();
            if (refreshCallback) refreshCallback();
          }
          break;
        case 'email':
          result = await invoiceActionService.sendInvoiceEmail(invoice.id, payload.email, payload.message, invoice);
          if (result.success) closeModal();
          break;
        default:
          break;
      }

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          className: "bg-green-600 text-white border-none"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    activeModal,
    selectedInvoice,
    openModal,
    closeModal,
    executeAction
  };
};
