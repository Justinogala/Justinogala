/**
 * Capacitor native platform initialization.
 * This file sets up native features (splash screen, status bar, push notifications,
 * keyboard handling) when running as a native mobile app.
 * Safe to import on web — all calls are no-ops when Capacitor is not available.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

export async function initNativeApp() {
  if (!isNative) return;

  // Splash Screen — hide after app is ready
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.hide();

  // Status Bar
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  if (platform === 'android') {
    await StatusBar.setBackgroundColor({ color: '#1a1025' });
  }

  // Keyboard — adjust viewport on iOS
  if (platform === 'ios') {
    const { Keyboard } = await import('@capacitor/keyboard');
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  }

  // App — handle back button on Android
  if (platform === 'android') {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }
}

/**
 * Register for push notifications.
 * Call this after user has logged in.
 */
export async function registerPushNotifications(onTokenReceived) {
  if (!isNative) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');
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
    });
  }

  return permission;
}

/**
 * Take a photo using the device camera.
 */
export async function takePhoto() {
  if (!isNative) return null;

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });

  return image;
}

/**
 * Pick a photo from the gallery.
 */
export async function pickPhoto() {
  if (!isNative) return null;

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
  });

  return image;
}
