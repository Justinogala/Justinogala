
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/serviceWorker.js'; // We will need to move the file to public or configure build
      
      // For Vite dev, we might need a different approach or just check if in production
      // Typically in Vite, we use vite-plugin-pwa, but here we are manual.
      // We will place the serviceWorker.js in public/serviceWorker.js for simplicity in this environment.
      
      navigator.serviceWorker.register('/serviceWorker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content is available and will be used when all tabs for this page are closed.');
                  // Dispatch event to show update toast
                  window.dispatchEvent(new Event('sw-update-available'));
                } else {
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function requestBackgroundSync(tag) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((swRegistration) => {
      swRegistration.sync.register(tag)
        .then(() => {
          console.log(`Background sync registered for tag: ${tag}`);
        })
        .catch((err) => {
          console.log('Background sync failed:', err);
        });
    });
  }
}
