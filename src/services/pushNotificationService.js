
const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY_HERE'; // In a real app, this comes from env

export const pushNotificationService = {
  // Check if push is supported
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Request permission
  requestPermission: async () => {
    if (!pushNotificationService.isSupported()) return 'unsupported';
    
    const permission = await Notification.requestPermission();
    return permission;
  },

  // Subscribe to push
  subscribe: async () => {
    if (!pushNotificationService.isSupported()) return null;
    
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      // Note: In production you need a real VAPID key
      // For this demo, we simulate success if no key is present or handle the error gracefully
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      } catch (e) {
        console.warn('Push subscription failed (likely due to missing VAPID key)', e);
        return null;
      }
    }
    
    return subscription;
  },

  unsubscribe: async () => {
    if (!pushNotificationService.isSupported()) return false;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return true;
  }
};

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
