import React, { useState } from 'react';
import { Search, Phone, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const UserListSidebar = ({ users, selectedUser, onSelectUser }) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contacts</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search people..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-violet-500"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredUsers.map((user) => (
            <motion.button
              key={user.id}
              onClick={() => onSelectUser(user)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group",
                selectedUser?.id === user.id 
                  ? "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800" 
                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className={cn("text-white font-medium text-xs", user.color)}>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                  user.status === 'online' ? "bg-emerald-500" : 
                  user.status === 'busy' ? "bg-red-500" :
                  user.status === 'away' ? "bg-amber-500" : "bg-slate-400"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-sm truncate",
                  selectedUser?.id === user.id ? "text-violet-900 dark:text-violet-100" : "text-slate-900 dark:text-slate-100"
                )}>
                  {user.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              {selectedUser?.id === user.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserListSidebar;