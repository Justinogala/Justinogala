
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User, Users } from 'lucide-react';

const RoleBadge = ({ role }) => {
  const normalizedRole = role?.toLowerCase() || 'member';
  
  const getRoleConfig = (role) => {
    switch(role) {
      case 'admin':
        return {
          variant: 'default',
          icon: Shield,
          className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700"
        };
      case 'premium':
      case 'pro':
        return {
          variant: 'secondary',
          icon: Crown,
          className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
        };
      case 'member':
        return {
          variant: 'outline',
          icon: Users,
          className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
        };
      default: // free
        return {
          variant: 'outline',
          icon: User,
          className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
        };
    }
  };

  const config = getRoleConfig(normalizedRole);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`gap-1.5 py-1 px-2.5 capitalize ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      {normalizedRole}
    </Badge>
  );
};

export default RoleBadge;
