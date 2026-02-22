
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, HardDrive, Clock, Activity, Shield, Trash2, Key, User } from 'lucide-react';
import UserActivityModal from './UserActivityModal';
import ResetPasswordModal from './ResetPasswordModal';

const UserDetailsModal = ({ isOpen, onClose, user, onEdit, onSuspend, onDelete }) => {
  const [showActivity, setShowActivity] = useState(false);
  const [showReset, setShowReset] = useState(false);

  if (!user) return null;

  // Format dates gracefully
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const isSuspended = user.status === 'Suspended' || user.status === 'suspended';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile" className="max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : <User />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user.name || 'No Name'}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                  <Mail className="w-3 h-3" /> {user.email}
                </div>
                <div className="flex gap-2 mt-2">
                   <Badge className={!isSuspended ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {user.status || 'Active'}
                  </Badge>
                  <Badge variant="outline" className="text-purple-300 border-purple-500/30 capitalize">
                    {user.plan || 'Free'} Plan
                  </Badge>
                  <Badge variant="outline" className="text-blue-300 border-blue-500/30 capitalize">
                    {user.role || 'User'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>ID: {user.id ? user.id.slice(0, 8) : '...'}...</p>
              <p>Joined: {formatDate(user.joinedDate || user.createdAt)}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3" /> Last Active
              </div>
              <p className="text-lg font-bold text-white">
                {user.lastActive ? formatDate(user.lastActive) : 'Never'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                <HardDrive className="w-3 h-3" /> Storage Used
              </div>
              <p className="text-2xl font-bold text-white">0 <span className="text-sm text-gray-500 font-normal">MB</span></p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-white/10">
             <h4 className="text-sm font-medium text-white mb-3">Management Actions</h4>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowActivity(true)} className="bg-transparent text-gray-300 border-white/10 hover:bg-white/5">
                  <Activity className="w-3 h-3 mr-2" /> Activity
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowReset(true)} className="bg-transparent text-gray-300 border-white/10 hover:bg-white/5">
                  <Key className="w-3 h-3 mr-2" /> Reset Pwd
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={!isSuspended ? "text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10" : "text-green-400 border-green-500/20 hover:bg-green-500/10"} 
                  onClick={() => onSuspend(user)}
                >
                  <Shield className="w-3 h-3 mr-2" /> {!isSuspended ? 'Suspend' : 'Activate'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(user.id)}>
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </Button>
             </div>
          </div>
          
          <div className="flex justify-end pt-2">
             <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>

      <UserActivityModal 
        isOpen={showActivity} 
        onClose={() => setShowActivity(false)} 
        userId={user.id} 
        userName={user.name || user.email}
      />

      <ResetPasswordModal 
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        userId={user.id}
        userEmail={user.email}
      />
    </>
  );
};

export default UserDetailsModal;
