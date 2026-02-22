
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileTabBar = ({ items, className }) => {
  // items: [{ icon: Icon, label: string, to: string }]

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border flex justify-around items-center h-[56px] pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {items.slice(0, 5).map((item, index) => (
        <NavLink
          key={index}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-accent/10 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileTabBar;
