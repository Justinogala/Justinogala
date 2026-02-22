
import { generateInvoicePDF } from '@/utils/invoicePDFGenerator';

const EMAIL_LOG_KEY = 'munal_sent_emails';

const getEmailLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

export const invoiceEmailService = {
  sendInvoiceEmail: async (invoiceId, recipientEmail, message, invoiceData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic Validation
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return { success: false, message: 'Invalid recipient email address.' };
    }

    try {
      // Simulate PDF attachment generation
      const pdfBlob = generateInvoicePDF(invoiceData).output('blob');
      
      const emailRecord = {
        id: `email_${Date.now()}`,
        invoiceId,
        recipient: recipientEmail,
        message,
        sentAt: new Date().toISOString(),
        hasAttachment: !!pdfBlob
      };

      const logs = getEmailLogs();
      logs.push(emailRecord);
      localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(logs));

      return { 
        success: true, 
        message: `Invoice sent to ${recipientEmail}`,
        data: emailRecord
      };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, message: 'Failed to send email service.' };
    }
  },

  getEmailHistory: (invoiceId) => {
    const logs = getEmailLogs();
    return logs.filter(log => log.invoiceId === invoiceId);
  }
};
