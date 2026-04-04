/**
 * Capacitor native platform initialization.
 * @capacitor/core is installed as a frontend dependency.
 * Plugin imports use runtime string construction to prevent Vite static analysis.
 * On web, initNativeApp() is a fast no-op.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// Helper: runtime string prevents Vite from analyzing these imports
const cap = (plugin) => `@capacitor/${plugin}`;

export async function initNativeApp() {
  if (!isNative) return;

  try {
    const { SplashScreen } = await import(cap('splash-screen'));
    await SplashScreen.hide();
  } catch { /* not installed */ }

  try {
    const { StatusBar, Style } = await import(cap('status-bar'));
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#1a1025' });
    }
  } catch { /* not installed */ }

  if (platform === 'ios') {
    try {
      const { Keyboard } = await import(cap('keyboard'));
      Keyboard.addListener('keyboardWillShow', () => document.body.classList.add('keyboard-open'));
      Keyboard.addListener('keyboardWillHide', () => document.body.classList.remove('keyboard-open'));
    } catch { /* not installed */ }
  }

  if (platform === 'android') {
    try {
      const { App } = await import(cap('app'));
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });
    } catch { /* not installed */ }
  }
}

export async function registerPushNotifications(onTokenReceived) {
  if (!isNative) return null;
  try {
    const { PushNotifications } = await import(cap('push-notifications'));
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();
      PushNotifications.addListener('registration', (token) => {
        if (onTokenReceived) onTokenReceived(token.value);
      });
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification);
      });
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push action:', action);
        // Navigate to the URL if present
        if (action.notification?.data?.url) {
          window.location.href = action.notification.data.url;
        }
      });
    }
    return permission;
  } catch {
    return null;
  }
}

/**
 * Register device token with backend for FCM push notifications.
 * Call after login when user ID is available.
 */
export async function registerDeviceWithBackend(userId, apiUrl) {
  if (!isNative) return;
  try {
    await registerPushNotifications(async (token) => {
      try {
        await fetch(`${apiUrl}/api/push/register-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            token,
            platform,
            device_name: `${platform} device`,
          }),
        });
      } catch {
        // Silent fail — push registration is non-critical
      }
    });
  } catch {
    // Silent fail
  }
}

export async function takePhoto() {
  if (!isNative) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import(cap('camera'));
    return await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Camera });
  } catch {
    return null;
  }
}

export async function pickPhoto() {
  if (!isNative) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import(cap('camera'));
    return await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Photos });
  } catch {
    return null;
  }
}
