
import { notificationService } from '@/services/notificationService';

// This utility ensures that when a contact form is submitted,
// proper notifications are dispatched so the admin interface can update in real-time.

export const triggerContactFormSync = (messageData) => {
  // In a real backend environment, this would use WebSockets or Server-Sent Events.
  // Since we are using localStorage as a mock database, the 'storage' event listener
  // in useAdminMessages hook (if implemented) or adminMessageService handles the data sync.
  
  // This function explicitly creates the notification event.
  
  try {
    notificationService.createNotification({
      type: 'system',
      title: 'New Contact Form Submission',
      message: `New message from ${messageData.name}: ${messageData.subject}`,
      actionUrl: '/admin/messages',
      icon: 'Mail',
      color: 'bg-blue-500'
    });
    
    // Dispatch a custom event for any listening components in the current window
    window.dispatchEvent(new CustomEvent('munal-contact-message-received', { 
      detail: messageData 
    }));
    
    return true;
  } catch (error) {
    console.error("Failed to sync contact form message:", error);
    return false;
  }
};
