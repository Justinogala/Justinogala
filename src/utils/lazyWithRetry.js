/**
 * Lazy import with retry logic for chunk loading failures
 * This helps handle cache issues when new deployments happen
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Helper to detect chunk loading errors
 */
const isChunkLoadError = (error) => {
  if (!error) return false;
  const errorMessage = error.message || error.toString();
  return (
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Loading CSS chunk') ||
    errorMessage.includes('ChunkLoadError') ||
    errorMessage.includes('Importing a module script failed') ||
    (error.name === 'ChunkLoadError')
  );
};

/**
 * Lazy import with automatic retry on chunk loading failures
 * @param {Function} importFn - The dynamic import function
 * @param {string} moduleName - Name for logging purposes
 * @returns {Promise} - React lazy compatible promise
 */
export const lazyWithRetry = (importFn, moduleName = 'unknown') => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const tryImport = () => {
      importFn()
        .then(resolve)
        .catch((error) => {
          if (isChunkLoadError(error) && retryCount < MAX_RETRIES) {
            retryCount++;
            console.warn(`[LazyLoad] Retry ${retryCount}/${MAX_RETRIES} for ${moduleName}`);
            
            // Clear caches before retry
            if ('caches' in window && retryCount === MAX_RETRIES) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            
            setTimeout(tryImport, RETRY_DELAY * retryCount);
          } else if (isChunkLoadError(error)) {
            // All retries failed, trigger page reload
            console.error(`[LazyLoad] All retries failed for ${moduleName}, reloading page`);
            
            // Store info for after reload
            sessionStorage.setItem('chunk_load_failed', moduleName);
            
            // Hard reload to get fresh assets
            window.location.reload(true);
          } else {
            // Not a chunk loading error, reject normally
            reject(error);
          }
        });
    };

    tryImport();
  });
};

/**
 * React.lazy wrapper with retry logic
 * @param {Function} importFn - The dynamic import function
 * @param {string} moduleName - Optional name for logging
 */
export const lazyRetry = (importFn, moduleName) => {
  return React.lazy(() => lazyWithRetry(importFn, moduleName));
};

// Need to import React for lazy
import React from 'react';

export default lazyRetry;
