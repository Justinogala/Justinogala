
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Section
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text('INVOICE', 20, 20);
  
  // Company Logo/Branding Placeholder
  doc.setFillColor(243, 244, 246);
  doc.circle(180, 20, 10, 'F');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Munal AI', 168, 21);

  // Invoice Details
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text(`Invoice #: ${invoiceData.id}`, 20, 35);
  doc.text(`Date: ${format(new Date(invoiceData.date), 'MMM dd, yyyy')}`, 20, 40);
  doc.text(`Status: ${(invoiceData.status || 'Draft').toUpperCase()}`, 20, 45);

  // Bill To
  doc.text('Bill To:', 20, 60);
  doc.setFont(undefined, 'bold');
  doc.text(invoiceData.customerName || 'Valued Customer', 20, 65);
  doc.setFont(undefined, 'normal');
  doc.text(invoiceData.customerEmail || 'user@example.com', 20, 70);

  // Table Header
  const startY = 90;
  doc.setFillColor(249, 250, 251);
  doc.rect(20, startY, pageWidth - 40, 10, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.text('Description', 25, startY + 7);
  doc.text('Amount', pageWidth - 25, startY + 7, { align: 'right' });

  // Items
  let currentY = startY + 20;
  doc.setFont(undefined, 'normal');
  
  const items = invoiceData.items || [{ description: 'Service Fee', amount: invoiceData.amount }];
  
  items.forEach(item => {
    doc.text(item.description, 25, currentY);
    doc.text(`$${Number(item.amount).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    currentY += 10;
  });

  // Total
  doc.setDrawColor(229, 231, 235);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total', pageWidth - 60, currentY);
  doc.setTextColor(79, 70, 229);
  doc.text(`$${Number(invoiceData.amount).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Thank you for your business!', 20, 280);
  doc.text('Munal AI', 20, 285);

  return doc;
};
