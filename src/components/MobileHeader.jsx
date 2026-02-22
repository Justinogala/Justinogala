
import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const MobileHeader = ({ title, showBack = false, actions, showSearch = false, className }) => {
  const navigate = useNavigate();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-violet-100 dark:border-violet-900/30 h-[56px] flex items-center px-4 pt-[env(safe-area-inset-top)] transition-all shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-start min-w-[40px]">
        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="-ml-2 h-10 w-10 text-gray-600 dark:text-gray-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {showSearch ? (
          <div className="w-full max-w-[240px] relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
            <Input 
              className="h-9 pl-9 bg-violet-50 dark:bg-slate-800 border-violet-100 dark:border-violet-800 focus:border-violet-500 focus:ring-violet-500/20 text-sm" 
              placeholder="Search..." 
            />
          </div>
        ) : (
          <h1 className="text-base font-semibold truncate max-w-[200px] text-gray-900 dark:text-white">{title}</h1>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 min-w-[40px]">
        {actions}
      </div>
    </header>
  );
};

export default MobileHeader;
