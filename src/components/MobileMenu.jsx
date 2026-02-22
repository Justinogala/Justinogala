
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileMenu = ({ isOpen, onClose, items }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-[280px] bg-background shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-lg text-primary">Munal</span>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {items.map((item, idx) => (
                  <li key={idx}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) => cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="w-5 h-5" />}
                        {item.label}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Munal Mobile v1.0.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
