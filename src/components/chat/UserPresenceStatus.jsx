import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Check, Clock, Circle, MinusCircle, Eye, EyeOff, 
  ChevronRight, X, Pencil
} from 'lucide-react';

const STATUS_OPTIONS = [
  { key: 'available', label: 'Available', icon: Check, color: 'bg-emerald-500', desc: 'Others see you as active' },
  { key: 'busy', label: 'Busy', icon: MinusCircle, color: 'bg-red-500', desc: 'Notifications silenced' },
  { key: 'do_not_disturb', label: 'Do not disturb', icon: MinusCircle, color: 'bg-red-600', desc: 'Suppress notifications' },
  { key: 'be_right_back', label: 'Be right back', icon: Clock, color: 'bg-amber-500', desc: 'Temporarily away' },
  { key: 'away', label: 'Away', icon: Clock, color: 'bg-amber-400', desc: 'Show as away' },
  { key: 'appear_offline', label: 'Appear offline', icon: EyeOff, color: 'bg-gray-400', desc: 'Others see you as offline' },
];

const DURATION_OPTIONS = [
  { key: '30_minutes', label: '30 minutes' },
  { key: '1_hour', label: '1 hour' },
  { key: '2_hours', label: '2 hours' },
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This week' },
  { key: 'custom', label: 'Custom...' },
];

const getStatusColor = (statusType) => {
  const option = STATUS_OPTIONS.find(s => s.key === statusType);
  return option?.color || 'bg-emerald-500';
};

const getStatusLabel = (statusType) => {
  const option = STATUS_OPTIONS.find(s => s.key === statusType);
  return option?.label || 'Available';
};

const UserPresenceStatus = ({ compact = false }) => {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState('available');
  const [statusMessage, setStatusMessage] = useState('');
  const [clearAfter, setClearAfter] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  const [showDuration, setShowDuration] = useState(false);

  // Fetch on mount
  useEffect(() => {
    const doFetch = async () => {
      if (!user?.id) return;
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/chat/presence/status/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.presence) {
            setCurrentStatus(data.presence.status_type || 'available');
            setStatusMessage(data.presence.status_message || '');
            setClearAfter(data.presence.clear_after);
          }
        }
      } catch (err) {
        console.error('Error fetching presence:', err);
      }
    };
    doFetch();
  }, [user]);

  const updateStatus = async (statusType, message, duration) => {
    if (!user?.id) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/chat/presence/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          status_type: statusType,
          status_message: message || statusMessage,
          clear_after: duration || clearAfter,
        }),
      });
      if (res.ok) {
        setCurrentStatus(statusType);
        if (message !== undefined) setStatusMessage(message);
        if (duration !== undefined) setClearAfter(duration);
      }
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  };

  const handleStatusSelect = (statusKey) => {
    updateStatus(statusKey, undefined, undefined);
  };

  const handleSaveMessage = () => {
    updateStatus(currentStatus, tempMessage, clearAfter);
    setStatusMessage(tempMessage);
    setEditingMessage(false);
  };

  const handleClearMessage = () => {
    updateStatus(currentStatus, '', null);
    setStatusMessage('');
    setClearAfter(null);
    setEditingMessage(false);
  };

  const handleDurationSelect = (durationKey) => {
    updateStatus(currentStatus, statusMessage, durationKey);
    setShowDuration(false);
  };

  const currentOption = STATUS_OPTIONS.find(s => s.key === currentStatus) || STATUS_OPTIONS[0];
  const StatusIcon = currentOption.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 h-8 px-2 rounded-lg",
            compact && "h-7 px-1.5"
          )}
          data-testid="user-presence-status-btn"
        >
          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", currentOption.color)} />
          {!compact && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              {statusMessage || currentOption.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72 p-0" data-testid="presence-status-dropdown">
        {/* User Info Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900", currentOption.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentOption.label}</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
          {editingMessage ? (
            <div className="space-y-2">
              <Input
                value={tempMessage}
                onChange={(e) => setTempMessage(e.target.value)}
                placeholder="What's your status?"
                className="h-8 text-xs"
                maxLength={200}
                autoFocus
                data-testid="status-message-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveMessage();
                  if (e.key === 'Escape') setEditingMessage(false);
                }}
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDuration(!showDuration)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  data-testid="clear-after-toggle"
                >
                  <Clock className="w-3 h-3" />
                  Clear after: {clearAfter ? DURATION_OPTIONS.find(d => d.key === clearAfter)?.label || clearAfter : 'Never'}
                  <ChevronRight className="w-3 h-3" />
                </button>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingMessage(false)}>Cancel</Button>
                  <Button size="sm" className="h-6 text-xs px-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveMessage} data-testid="save-status-message-btn">Done</Button>
                </div>
              </div>
              {showDuration && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-1.5 space-y-0.5">
                  {DURATION_OPTIONS.filter(d => d.key !== 'custom').map((dur) => (
                    <button
                      key={dur.key}
                      onClick={() => handleDurationSelect(dur.key)}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors",
                        clearAfter === dur.key && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      )}
                      data-testid={`duration-option-${dur.key}`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setTempMessage(statusMessage); setEditingMessage(true); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              data-testid="edit-status-message-btn"
            >
              <Pencil className="w-3 h-3" />
              {statusMessage ? (
                <span className="truncate flex-1 text-left">{statusMessage}</span>
              ) : (
                <span className="text-gray-400">Set a status message</span>
              )}
            </button>
          )}
          {statusMessage && !editingMessage && (
            <button
              onClick={handleClearMessage}
              className="mt-1 text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1 px-2"
              data-testid="clear-status-message-btn"
            >
              <X className="w-3 h-3" /> Clear status message
            </button>
          )}
        </div>

        {/* Status Options */}
        <div className="p-1.5">
          <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-wider px-2 py-1">
            Status
          </DropdownMenuLabel>
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.key}
                onClick={() => handleStatusSelect(option.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                  currentStatus === option.key 
                    ? "bg-indigo-50 dark:bg-indigo-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-slate-800"
                )}
                data-testid={`status-option-${option.key}`}
              >
                <span className={cn("w-3 h-3 rounded-full flex-shrink-0", option.color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStatus === option.key ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {option.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{option.desc}</p>
                </div>
                {currentStatus === option.key && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        {/* Reset */}
        <div className="p-1.5">
          <button
            onClick={() => { handleStatusSelect('available'); handleClearMessage(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            data-testid="reset-status-btn"
          >
            <Circle className="w-3 h-3" /> Reset status
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { getStatusColor, getStatusLabel, STATUS_OPTIONS };
export default UserPresenceStatus;
