
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { invoiceDataService } from './invoiceDataService';

// Basic PDF generator if utility is not available or for direct control
const generatePDF = (invoice) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Company Info
  doc.setFontSize(10);
  doc.text('Munal AI', 20, 30);
  doc.text('123 AI Boulevard', 20, 35);
  doc.text('Tech City, TC 90210', 20, 40);
  doc.text('billing@munal.ai', 20, 45);

  // Invoice Details
  doc.text(`Invoice Number: ${invoice.id}`, 140, 30);
  doc.text(`Date: ${format(new Date(invoice.date), 'MMM dd, yyyy')}`, 140, 35);
  doc.text(`Due Date: ${format(new Date(invoice.dueDate || invoice.date), 'MMM dd, yyyy')}`, 140, 40);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 45);

  // Bill To
  doc.text('Bill To:', 20, 60);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.userName || 'Valued Customer', 20, 65);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.userEmail || '', 20, 70);

  // Line Items Header
  doc.line(20, 80, 190, 80);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 20, 85);
  doc.text('Amount', 170, 85);
  doc.line(20, 90, 190, 90);
  doc.setFont(undefined, 'normal');

  // Items
  let y = 100;
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      doc.text(item.description, 20, y);
      doc.text(`$${Number(item.amount).toFixed(2)}`, 170, y);
      y += 10;
    });
  } else {
    // Fallback if no explicit items
    doc.text(invoice.description || 'Service Fee', 20, y);
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 170, y);
    y += 10;
  }

  // Total
  doc.line(20, y + 5, 190, y + 5);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', 140, y + 15);
  doc.text(`$${Number(invoice.amount).toFixed(2)}`, 170, y + 15);

  return doc;
};

export const invoiceActionService = {
  downloadInvoice: async (invoice) => {
    try {
      const doc = generatePDF(invoice);
      doc.save(`invoice_${invoice.id}.pdf`);
      return { success: true, message: 'Invoice downloaded successfully' };
    } catch (error) {
      console.error('PDF generation failed:', error);
      return { success: false, message: 'Failed to generate PDF' };
    }
  },

  viewInvoice: async (id) => {
    try {
      const invoice = await invoiceDataService.getInvoiceById(id);
      if (!invoice) return { success: false, message: 'Invoice not found' };
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  sendInvoice: async (invoice) => {
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updated = await invoiceDataService.updateInvoice(invoice.id, { 
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sentAt: new Date().toISOString()
      });
      
      return { success: true, message: `Invoice sent to ${invoice.userEmail}` };
    } catch (error) {
      return { success: false, message: 'Failed to send invoice' };
    }
  },

  resendInvoice: async (invoice) => {
    return invoiceActionService.sendInvoice(invoice);
  },

  markAsPaid: async (invoice) => {
    try {
      const updated = await invoiceDataService.updateInvoice(invoice.id, { 
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      return { success: true, message: 'Invoice marked as paid', data: updated };
    } catch (error) {
      return { success: false, message: 'Failed to update invoice' };
    }
  },
  
  markAsOverdue: async (invoice) => {
    try {
      const updated = await invoiceDataService.updateInvoice(invoice.id, { 
        status: 'overdue'
      });
      return { success: true, message: 'Invoice marked as overdue', data: updated };
    } catch (error) {
      return { success: false, message: 'Failed to update invoice' };
    }
  },
  
  deleteInvoice: async (id) => {
    try {
      await invoiceDataService.deleteInvoice(id);
      return { success: true, message: 'Invoice deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete invoice' };
    }
  }
};
