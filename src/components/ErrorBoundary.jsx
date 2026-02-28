import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw, Wifi } from 'lucide-react';

// Helper to detect chunk loading errors
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

// Storage key to track reload attempts
const RELOAD_ATTEMPT_KEY = 'chunk_reload_attempt';
const RELOAD_TIMESTAMP_KEY = 'chunk_reload_timestamp';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a chunk loading error
    const isChunk = isChunkLoadError(error);
    return { hasError: true, error, isChunkError: isChunk };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // If it's a chunk loading error, attempt auto-reload
    if (isChunkLoadError(error)) {
      this.handleChunkLoadError();
    }
  }

  handleChunkLoadError = () => {
    const lastAttempt = sessionStorage.getItem(RELOAD_ATTEMPT_KEY);
    const lastTimestamp = sessionStorage.getItem(RELOAD_TIMESTAMP_KEY);
    const now = Date.now();
    
    // Prevent infinite reload loops - only auto-reload once per 30 seconds
    if (lastAttempt && lastTimestamp) {
      const timeSinceLastAttempt = now - parseInt(lastTimestamp, 10);
      if (timeSinceLastAttempt < 30000) {
        console.log('Skipping auto-reload, attempted recently');
        return;
      }
    }
    
    // Mark that we're attempting a reload
    sessionStorage.setItem(RELOAD_ATTEMPT_KEY, 'true');
    sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, now.toString());
    
    console.log('Chunk load error detected, performing hard reload...');
    
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).then(() => {
        window.location.reload(true);
      });
    } else {
      window.location.reload(true);
    }
  };

  handleReset = () => {
    // Clear the reload attempt flag
    sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
    sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
    
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
    
    // For chunk errors, do a hard reload to clear cache
    if (this.state.isChunkError) {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).then(() => {
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
    sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError, error } = this.state;
      
      // Special UI for chunk loading errors
      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                  <Wifi className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Update Available
                </h2>
                
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  A new version of the app is available. Please reload to get the latest updates.
                </p>

                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-left border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This happens when the app is updated while you have it open. 
                    Reloading will fix this automatically.
                  </p>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                  <Button 
                    onClick={this.handleReset}
                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reload Now
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400">
                  Error Code: CHUNK_LOAD_FAILED
                </p>
              </div>
            </div>
          </div>
        );
      }
      
      // Standard error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-slate-900 rounded-lg text-left overflow-auto max-h-40">
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                    {error.toString()}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
                <Button 
                  onClick={this.handleReset}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-400">
                Error Code: UI_CRASH_HANDLER
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;