import api from './api';

const PUBLIC_VAPID_KEY_ENDPOINT = '/push/web/vapid-key';

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');

    // Get VAPID public key
    const { data } = await api.get(PUBLIC_VAPID_KEY_ENDPOINT);
    const publicKey = data.data.publicKey;

    if (!publicKey) {
      throw new Error('VAPID public key not found');
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send subscription to backend
    await api.post('/push/web/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    });

    console.log('Push notification subscription successful');
  } catch (error) {
    console.error('Error registering push notifications:', error);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
