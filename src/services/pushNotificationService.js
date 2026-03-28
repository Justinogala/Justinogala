
import { getApiUrl } from '@/lib/api';

const API = getApiUrl();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermission: () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
  },

  requestPermission: async () => {
    if (!pushNotificationService.isSupported()) return 'unsupported';
    return await Notification.requestPermission();
  },

  getVapidKey: async () => {
    try {
      const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (envKey) return envKey;
      const res = await fetch(`${API}/api/push/vapid-key`);
      if (res.ok) {
        const data = await res.json();
        return data.public_key;
      }
    } catch { /* silent */ }
    return null;
  },

  subscribe: async (userId) => {
    if (!pushNotificationService.isSupported()) return null;

    const permission = await pushNotificationService.requestPermission();
    if (permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidKey = await pushNotificationService.getVapidKey();
        if (!vapidKey) return null;

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      // Send subscription to backend
      await fetch(`${API}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription.toJSON(),
        }),
      });

      return subscription;
    } catch (e) {
      console.warn('Push subscription failed:', e);
      return null;
    }
  },

  unsubscribe: async (userId) => {
    if (!pushNotificationService.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch(`${API}/api/push/unsubscribe/${userId}`, { method: 'DELETE' });
      }
      return true;
    } catch {
      return false;
    }
  },

  isSubscribed: async () => {
    if (!pushNotificationService.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },
};
