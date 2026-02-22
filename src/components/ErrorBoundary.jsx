import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
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

              {this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-slate-900 rounded-lg text-left overflow-auto max-h-40">
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                    {this.state.error.toString()}
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