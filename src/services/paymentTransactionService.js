
import { v4 as uuidv4 } from 'uuid';
import { generateBillingNotification } from '@/utils/notificationGenerators';

const TRANSACTION_KEY = 'munal_transactions';

const getTransactions = () => JSON.parse(localStorage.getItem(TRANSACTION_KEY) || '[]');
const saveTransactions = (txns) => localStorage.setItem(TRANSACTION_KEY, JSON.stringify(txns));

export const paymentTransactionService = {
  createTransaction: (invoiceId, gatewayId, amount, currency = 'USD', userId) => {
    const txns = getTransactions();
    const newTxn = {
      id: `txn_${uuidv4()}`,
      invoiceId,
      gatewayId,
      userId,
      amount,
      currency,
      status: 'pending',
      timestamp: new Date().toISOString(),
      logs: [{ status: 'initiated', timestamp: new Date().toISOString() }]
    };
    txns.unshift(newTxn);
    saveTransactions(txns);
    return newTxn;
  },

  updateTransactionStatus: (transactionId, status, gatewayResponse = null) => {
    const txns = getTransactions();
    const index = txns.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      txns[index].status = status;
      if (gatewayResponse) {
        txns[index].gatewayResponse = gatewayResponse;
      }
      txns[index].logs.push({ status, timestamp: new Date().toISOString() });
      saveTransactions(txns);
      
      // NOTIFICATION TRIGGER
      if (status === 'completed' || status === 'paid') {
         generateBillingNotification('invoice_paid', `Payment of $${txns[index].amount} successful.`);
      } else if (status === 'failed') {
         generateBillingNotification('payment_failed', `Payment of $${txns[index].amount} failed. Please update your payment method.`);
      }

      return { success: true, data: txns[index] };
    }
    return { success: false, message: 'Transaction not found' };
  },

  getTransactionHistory: (userId = null, filters = {}) => {
    let txns = getTransactions();
    
    if (userId) {
      txns = txns.filter(t => t.userId === userId);
    }
    
    if (filters.gatewayId) {
      txns = txns.filter(t => t.gatewayId === filters.gatewayId);
    }

    if (filters.status) {
      txns = txns.filter(t => t.status === filters.status);
    }

    return txns;
  },

  getTransactionDetails: (transactionId) => {
    const txns = getTransactions();
    return txns.find(t => t.id === transactionId);
  },

  generateReceipt: (transactionId) => {
    const txn = paymentTransactionService.getTransactionDetails(transactionId);
    if (!txn) return null;
    
    return {
      receiptId: `rcpt_${uuidv4().substring(0, 8)}`,
      transactionId: txn.id,
      amount: txn.amount,
      date: txn.timestamp,
      status: 'generated'
    };
  },
  
  // Helper for admin view to see logs
  getLogsForGateway: (gatewayId) => {
    const txns = getTransactions();
    // Simulate some logs if empty for demo
    if (txns.length === 0) {
      return Array.from({ length: 10 }, (_, i) => ({
        id: `txn_mock_${i}`,
        amount: (Math.random() * 100).toFixed(2),
        currency: 'USD',
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        userId: `user_${i}`,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        gatewayResponse: '{"status": "approved"}'
      }));
    }
    return txns.filter(t => t.gatewayId === gatewayId);
  }
};
