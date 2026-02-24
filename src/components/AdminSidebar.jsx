
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Ticket, 
  MessageSquare, 
  LogOut,
  Settings,
  Zap,
  Key,
  Mic,
  ChevronDown,
  ChevronUp,
  Coins,
  Tag,
  Receipt,
  Percent,
  CreditCard as Gateway
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSidebar = ({ onClose }) => {
  const { adminLogout } = useAuth();
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const primaryLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  ];

  const managementLinks = [
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Ticket, label: 'Support Tickets', path: '/admin/support-tickets' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
  ];

  const paymentSubLinks = [
    { icon: Gateway, label: 'Payment Gateways', path: '/admin/payment-gateways' },
    { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
    { icon: Percent, label: 'Tax Rates', path: '/admin/tax-rates' },
    { icon: Receipt, label: 'Transactions', path: '/admin/transactions' },
  ];

  const configLinks = [
    { icon: Key, label: 'API Settings', path: '/admin/api-settings' },
    { icon: Mic, label: 'Transcription Settings', path: '/admin/transcription-settings' },
    { icon: Zap, label: 'Integrations', path: '/admin/integrations' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const NavItem = ({ link }) => (
    <NavLink
      to={link.path}
      onClick={onClose}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm md:text-base transition-all duration-200 group touch-target",
        isActive 
          ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      {({ isActive }) => (
        <>
          <link.icon className={cn(
            "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-white" : "text-slate-400 group-hover:text-white"
          )} />
          {link.label}
        </>
      )}
    </NavLink>
  );

  const SubNavItem = ({ link }) => (
    <NavLink
      to={link.path}
      onClick={onClose}
      className={({ isActive }) => cn(
        "flex items-center gap-3 pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200 group",
        isActive 
          ? "bg-amber-600/20 text-amber-400 font-medium" 
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      )}
    >
      {({ isActive }) => (
        <>
          <link.icon className={cn(
            "w-4 h-4",
            isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
          )} />
          {link.label}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 h-full">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-sm">AD</span>
          </div>
          <span className="tracking-tight">Admin Portal</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Dashboard Group */}
        <div className="space-y-1">
          {primaryLinks.map((link) => (
            <NavItem key={link.path} link={link} />
          ))}
        </div>

        {/* Management Group */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Management
          </p>
          {managementLinks.map((link) => (
            <NavItem key={link.path} link={link} />
          ))}
        </div>

        {/* Manage Payments Group */}
        <div className="space-y-1">
          <button
            onClick={() => setPaymentsOpen(!paymentsOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm md:text-base transition-all duration-200 group",
              paymentsOpen 
                ? "bg-amber-600/20 text-amber-400" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Coins className={cn(
                "w-5 h-5 transition-transform duration-200",
                paymentsOpen ? "text-amber-400" : "text-slate-400 group-hover:text-white"
              )} />
              <span className="font-medium">Manage Payments</span>
            </div>
            {paymentsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          <AnimatePresence>
            {paymentsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 py-1">
                  {paymentSubLinks.map((link) => (
                    <SubNavItem key={link.path} link={link} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Configuration Group */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Configuration
          </p>
          {configLinks.map((link) => (
            <NavItem key={link.path} link={link} />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 pb-safe">
        <button 
          onClick={adminLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200 group touch-target"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
