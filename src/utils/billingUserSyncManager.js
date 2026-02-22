
import { invoiceGenerationService } from '@/services/invoiceGenerationService';
import { invoiceDataService } from '@/services/invoiceDataService';
import { userDataSyncService } from '@/services/userDataSyncService';

/**
 * Manages synchronization between User operations and Billing data.
 * This ensures that when a user is created/updated, their billing info is kept in sync.
 */
class BillingUserSyncManager {
  constructor() {
    this.isListening = false;
  }

  /**
   * Initialize listeners for user sync events
   */
  init() {
    if (this.isListening) return;
    
    userDataSyncService.subscribe(this.handleUserSyncEvent.bind(this));
    this.isListening = true;
    console.log('[BillingUserSyncManager] Initialized');
  }

  async handleUserSyncEvent(event) {
    const { action, userId, data } = event.detail;
    
    console.log(`[BillingUserSyncManager] Processing ${action} for ${userId}`);

    try {
      switch (action) {
        case 'create':
          // Generate initial invoice for new user
          if (data) {
            await invoiceGenerationService.generateInitialInvoice(data);
            console.log('[BillingUserSyncManager] Generated initial invoice');
          }
          break;
          
        case 'update':
          // If plan changed, maybe generate new invoice or update pending ones
          // For now, we just ensure user details in invoices are synced by invoiceDataService.getAllInvoices() 
          // which pulls fresh user data dynamically.
          // Optionally, we could explicitly update open invoices if email/name changed.
          break;
          
        case 'delete':
          // Optionally archive invoices or mark user as deleted
          // Current implementation in invoiceDataService keeps invoices even if user deleted
          break;
      }
    } catch (error) {
      console.error('[BillingUserSyncManager] Sync failed:', error);
    }
  }

  // Manual triggers for UI components to call if needed
  async syncUserBilling(user) {
    await invoiceGenerationService.generateInitialInvoice(user);
  }
}

export const billingUserSyncManager = new BillingUserSyncManager();
