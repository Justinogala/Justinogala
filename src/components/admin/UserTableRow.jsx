
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';
import UserActionsMenu from './UserActionsMenu';

const UserTableRow = ({ user, onAction }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Normalize user data to handle different field names
  const userName = user.name || user.full_name || user.email?.split('@')[0] || 'Unknown';
  const userAvatar = user.avatarUrl || user.avatar;
  const userJoinDate = user.joinDate || user.joined_date || user.created_at || '-';
  const userPlan = user.plan || 'Free';
  const userRole = user.role || 'User';
  const userStatus = user.status || 'Active';

  return (
    <TableRow className="group hover:bg-violet-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 font-medium text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-500 dark:text-gray-400">
        {user.email}
      </TableCell>
      <TableCell>
        <RoleBadge role={userRole} />
      </TableCell>
      <TableCell>
        <StatusBadge status={userStatus} />
      </TableCell>
      <TableCell className="text-gray-600 dark:text-gray-300 font-medium text-sm">
        {userPlan}
      </TableCell>
      <TableCell className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
        {typeof userJoinDate === 'string' && userJoinDate.includes('T') 
          ? new Date(userJoinDate).toLocaleDateString() 
          : userJoinDate}
      </TableCell>
      <TableCell className="text-right">
        <UserActionsMenu user={user} onAction={onAction} />
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
