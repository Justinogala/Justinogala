
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserTableRow from './UserTableRow';
import { Users, Mail, Shield, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const UserManagementTable = ({ users, onAction }) => {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No users found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  // Ensure user object has expected fields for display, defaulting if missing
  const normalizeUser = (user) => ({
    ...user,
    role: user.role || 'User',
    status: user.status || 'Active',
    plan: user.plan || 'Free',
    joinDate: user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A')
  });

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {users.map((user) => {
          const u = normalizeUser(user);
          return (
            <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{u.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="w-3 h-3" /> {u.email}
                    </div>
                  </div>
                </div>
                <Badge variant={u.status === 'Active' ? 'success' : 'secondary'}>{u.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4" /> {u.role}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" /> {u.joinDate}
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onAction('edit', u)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onAction('delete', u)}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="w-[250px] font-semibold text-gray-700 dark:text-gray-200">User</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Email</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Role</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Plan</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Joined</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={normalizeUser(user)} onAction={onAction} />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {users.length} users
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTable;
