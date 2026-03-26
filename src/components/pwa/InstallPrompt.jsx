
import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const { isInstallable, isIOS, promptToInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    if (isInstallable || isIOS) {
      // Delay showing the prompt slightly so it's not intrusive immediately
      const timer = setTimeout(() => {
        // Check if user has dismissed it recently
        const dismissedAt = localStorage.getItem('munal_install_dismissed');
        if (!dismissedAt || (Date.now() - parseInt(dismissedAt)) > 7 * 24 * 60 * 60 * 1000) {
          setIsVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isIOS]);

  useEffect(() => {
    if (/Android/i.test(navigator.userAgent)) setPlatform('android');
    else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) setPlatform('ios');
    else setPlatform('desktop');
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('munal_install_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, show instructions
      alert('To install on iOS:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"');
    } else {
      const accepted = await promptToInstall();
      if (accepted) {
        setIsVisible(false);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-44 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[110]"
      >
        <Card className="p-4 shadow-xl border-violet-200 dark:border-violet-900 bg-white dark:bg-slate-900 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white shadow-lg">
              <span className="text-xl font-bold">M</span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">Install Munal App</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isIOS 
                  ? "Install specifically for iOS for a better experience." 
                  : "Get the full app experience with better performance and offline access."}
              </p>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleInstall}
                  className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex-1"
                >
                  {isIOS ? <Smartphone className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  {isIOS ? "How to Install" : "Install Now"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Maybe Later
                </Button>
              </div>
            </div>

            <button 
              onClick={handleDismiss}
              className="absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
