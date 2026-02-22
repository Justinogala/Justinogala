
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { CreditCard, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export const paymentUIService = {
  // Formatting
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  formatDate: (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM dd, yyyy');
  },

  formatDateTime: (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  },

  getStatusColor: (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'succeeded':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'failed':
      case 'declined':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'overdue':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  },

  getStatusIcon: (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
      case 'overdue':
        return AlertCircle;
      default:
        return DollarSign;
    }
  },

  getPaymentMethodIcon: (brand) => {
    return CreditCard;
  },

  // Filtering
  filterPayments: (payments, filters) => {
    if (!payments) return [];
    
    return payments.filter(payment => {
      if (filters.status && filters.status !== 'all' && payment.status.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      if (filters.gatewayId && filters.gatewayId !== 'all' && payment.gatewayId !== filters.gatewayId) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const idMatch = payment.id.toLowerCase().includes(searchLower);
        const invoiceMatch = payment.invoiceId?.toLowerCase().includes(searchLower);
        if (!idMatch && !invoiceMatch) return false;
      }
      if (filters.dateRange?.from) {
        const paymentDate = new Date(payment.timestamp);
        if (paymentDate < new Date(filters.dateRange.from)) return false;
      }
      if (filters.dateRange?.to) {
        const paymentDate = new Date(payment.timestamp);
        const endDate = new Date(filters.dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        if (paymentDate >= endDate) return false;
      }
      return true;
    });
  },

  sortPayments: (payments, sortBy, sortOrder = 'desc') => {
    return [...payments].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'amount':
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'date':
        default:
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  calculateStats: (payments) => {
    const totalPaid = payments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const failedCount = payments.filter(p => p.status === 'failed').length;

    const avgPayment = payments.length > 0 
      ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length 
      : 0;

    return {
      totalPaid,
      pendingAmount,
      failedCount,
      avgPayment
    };
  },

  exportToCSV: (payments) => {
    const headers = ['Transaction ID', 'Invoice ID', 'Date', 'Amount', 'Currency', 'Status', 'Gateway'];
    const rows = payments.map(p => [
      p.id,
      p.invoiceId,
      new Date(p.timestamp).toLocaleDateString(),
      p.amount,
      p.currency,
      p.status,
      p.gatewayId
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToPDF: (payments) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Munal AI Payment History Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    let yPos = 40;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Date", 14, yPos);
    doc.text("Description", 50, yPos);
    doc.text("Amount", 140, yPos);
    doc.text("Status", 170, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'normal');

    payments.forEach(p => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(new Date(p.timestamp).toLocaleDateString(), 14, yPos);
      doc.text(`Invoice #${p.invoiceId} (${p.gatewayId})`, 50, yPos);
      doc.text(`${p.amount} ${p.currency}`, 140, yPos);
      doc.text(p.status, 170, yPos);
      yPos += 10;
    });

    doc.save(`payment_report_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  getMockPaymentMethods: () => [
    { id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/24', isDefault: true },
    { id: 'pm_2', type: 'card', brand: 'Mastercard', last4: '8899', expiry: '08/25', isDefault: false },
    { id: 'pm_3', type: 'paypal', email: 'user@example.com', isDefault: false }
  ]
};
