
import { notificationService } from '@/services/notificationService';

export const generateTranscriptionNotification = (transcriptionTitle, transcriptionId) => {
  return notificationService.createNotification({
    type: 'transcription',
    title: 'Transcription Completed',
    message: `"${transcriptionTitle}" is ready for review.`,
    actionUrl: `/transcriptions/${transcriptionId}`,
    icon: 'FileText',
    color: 'blue'
  });
};

export const generateBillingNotification = (type, details) => {
  let title = 'Billing Update';
  let message = details;
  let color = 'orange';

  if (type === 'payment_failed') {
    title = 'Payment Failed';
    color = 'red';
  } else if (type === 'invoice_paid') {
    title = 'Payment Successful';
    color = 'green';
  } else if (type === 'subscription_renewed') {
    title = 'Subscription Renewed';
    color = 'green';
  }

  return notificationService.createNotification({
    type: 'billing',
    title,
    message,
    actionUrl: '/billing',
    icon: 'CreditCard',
    color
  });
};

export const generateSystemNotification = (title, message) => {
  return notificationService.createNotification({
    type: 'system',
    title,
    message,
    actionUrl: null,
    icon: 'AlertCircle',
    color: 'gray'
  });
};

export const generateAccountNotification = (type, details) => {
  return notificationService.createNotification({
    type: 'account',
    title: type === 'security' ? 'Security Alert' : 'Account Update',
    message: details,
    actionUrl: '/profile',
    icon: 'User',
    color: 'purple'
  });
};

export const generatePlanLimitNotification = (limitType, usage, limit) => {
  const percent = Math.round((usage / limit) * 100);
  return notificationService.createNotification({
    type: 'plan_limit',
    title: 'Usage Limit Warning',
    message: `You have used ${percent}% of your ${limitType} limit (${usage}/${limit}). Upgrade to avoid interruption.`,
    actionUrl: '/billing',
    icon: 'AlertTriangle',
    color: 'red'
  });
};
