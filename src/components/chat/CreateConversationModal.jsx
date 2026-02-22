
import React, { useState, useEffect } from 'react';
import { Search, User, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { demoUsers } from '@/data/demoUsers';
import { messagingService } from '@/services/messagingService';

const CreateConversationModal = ({ isOpen, onClose, onCreateConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      setError(null);
    }
  }, [isOpen]);

  // Filter users based on search query
  const filteredUsers = demoUsers.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Call the service directly as requested by the task requirements
      // Also supports the prop if provided for parent updates
      const conversation = await messagingService.createConversation(selectedUser.id);
      
      if (onCreateConversation) {
        await onCreateConversation(conversation);
      }
      
      onClose();
    } catch (err) {
      setError('Failed to create conversation. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border-violet-100 dark:border-violet-800 shadow-2xl">
        {/* Header with Gradient */}
        <DialogHeader className="p-6 pb-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-950">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400 shadow-sm ring-4 ring-white dark:ring-slate-900">
              <User className="w-5 h-5" />
            </span>
            New Message
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13 pl-1">
            Start a new conversation with a team member.
          </p>
        </DialogHeader>

        {/* Search Area */}
        <div className="p-4 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="relative group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
            <Input 
              placeholder="Search people by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-xl"
            />
          </div>
        </div>

        {/* User List */}
        <ScrollArea className="h-[350px]">
          {filteredUsers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <Search className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs">Try searching for a different name</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredUsers.map(user => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 border text-left group relative",
                      isSelected
                        ? "bg-violet-50 border-violet-200 shadow-sm dark:bg-violet-900/30 dark:border-violet-800"
                        : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-900/50"
                    )}
                  >
                    {/* Selection Indicator */}
                    <div className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 transform",
                      isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    )}>
                      <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <div className="relative">
                      <Avatar className={cn(
                        "h-12 w-12 border-2 transition-all duration-200",
                        isSelected 
                          ? "border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900" 
                          : "border-white dark:border-slate-800 group-hover:border-violet-100 dark:group-hover:border-slate-700"
                      )}>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className={cn(
                          "text-sm font-semibold transition-colors",
                          isSelected 
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-100" 
                            : `${user.avatarColor} text-white opacity-90`
                        )}>
                          {user.initials || user.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-transform",
                        user.status === 'active' || user.online ? "bg-emerald-500" : "bg-gray-300",
                        isSelected && "scale-90"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-baseline">
                        <p className={cn(
                          "font-semibold text-sm truncate transition-colors",
                          isSelected ? "text-violet-900 dark:text-violet-100" : "text-gray-900 dark:text-gray-100"
                        )}>
                          {user.name}
                        </p>
                        {user.role && (
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 tracking-wider",
                            user.role === 'admin' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                            user.role === 'premium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                          )}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate mt-0.5 transition-colors",
                        isSelected ? "text-violet-600 dark:text-violet-300" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {user.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-xs text-gray-400 px-2 hidden sm:block">
              {selectedUser ? '1 user selected' : 'Select a user to chat'}
            </div>
            <div className="flex gap-3 ml-auto">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!selectedUser || isLoading}
                className={cn(
                  "min-w-[140px] transition-all duration-300 shadow-lg",
                  !selectedUser 
                    ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-slate-800 dark:text-slate-500 shadow-none" 
                    : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-violet-500/25 hover:shadow-violet-500/40"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Start Chat'
                )}
              </Button>
            </div>
          </div>
          {error && (
            <p className="w-full text-center text-xs text-red-500 mt-3 font-medium bg-red-50 dark:bg-red-900/20 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConversationModal;
