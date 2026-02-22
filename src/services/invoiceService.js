
import { jsPDF } from 'jspdf';
import { PAYMENT_CONFIG } from '@/config/paymentConfig';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const INVOICE_KEY = 'munal_invoices';

const getInvoices = () => {
  try {
    return JSON.parse(localStorage.getItem(INVOICE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const invoiceService = {
  generateInvoice: async (subscription, userDetails) => {
    await delay(500);
    const invoice = {
      id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      userId: subscription.userId,
      amount: subscription.amount,
      currency: 'USD',
      status: 'paid',
      date: new Date().toISOString(),
      pdfUrl: '#', // In real app, this would be a URL to stored PDF
      items: [
        { description: `Subscription - ${subscription.planId}`, amount: subscription.amount }
      ]
    };

    const invoices = getInvoices();
    invoices.push(invoice);
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
    return invoice;
  },

  getUserInvoices: async (userId) => {
    await delay(600);
    const invoices = getInvoices();
    return invoices.filter(i => i.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  downloadInvoicePDF: (invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('Munal AI', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Invoice', 150, 20);
    doc.text(`#${invoice.id}`, 150, 28);
    
    // Details
    doc.setTextColor(0);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 20, 50);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 58);
    
    // Items
    let y = 80;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, y-10, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Description', 25, y-3);
    doc.text('Amount', 160, y-3);
    
    y += 10;
    doc.setFont(undefined, 'normal');
    invoice.items.forEach(item => {
      doc.text(item.description, 25, y);
      doc.text(`$${item.amount.toFixed(2)}`, 160, y);
      y += 10;
    });
    
    // Total
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Total', 120, y);
    doc.text(`$${invoice.amount.toFixed(2)}`, 160, y);
    
    doc.save(`invoice_${invoice.id}.pdf`);
  }
};
