import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, Loader2 } from 'lucide-react';
import { messagingService } from '@/services/messagingService';
import { useAuth } from '@/context/AuthContext';

const ForwardMessageDialog = ({ isOpen, onClose, onForward, message }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      handleSearch('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const results = await messagingService.searchUsers(query);
      // Filter out current user
      setUsers(results.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const handleConfirm = () => {
    // In real app, we might need conversation IDs, but here passing user IDs might trigger creating new convs
    // For simplicity, let's assume we map user IDs to direct conversation IDs or create them
    // This is handled by the caller or MessageMenuService
    onForward(selectedUsers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-4 text-sm text-slate-600 dark:text-slate-300 italic truncate">
          "{message?.content}"
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search people..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[200px] -mr-4 pr-4">
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-4">No users found</div>
            ) : (
              users.map(u => (
                <div 
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(u.id) 
                      ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  {selectedUsers.includes(u.id) && (
                    <div className="w-2 h-2 rounded-full bg-violet-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedUsers.length === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" /> 
            Forward {selectedUsers.length > 0 && `(${selectedUsers.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;