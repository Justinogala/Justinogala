
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  Mail, 
  MailOpen, 
  Flag, 
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Globe
} from 'lucide-react';

import { useAdminMessages } from '@/hooks/useAdminMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

import MessageStatusBadge from '@/components/admin/MessageStatusBadge';
import AdminMessageDetailModal from '@/components/admin/AdminMessageDetailModal';

const AdminMessagesPage = () => {
  const { 
    messages, 
    loading, 
    pagination, 
    filters, 
    setFilters, 
    setPage, 
    refresh,
    actions 
  } = useAdminMessages();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
    if (message.status === 'unread') {
      actions.markAsRead(message.id);
    }
  };

  const handleDetailAction = {
    markAsRead: (id) => actions.markAsRead(id),
    markAsUnread: (id) => actions.markAsUnread(id),
    archive: (id) => {
      actions.archiveMessage(id);
      setIsDetailModalOpen(false);
    },
    delete: (id) => {
      if (window.confirm("Are you sure you want to delete this message?")) {
        actions.deleteMessage(id);
        setIsDetailModalOpen(false);
      }
    },
    toggleFlag: (id) => actions.toggleFlag(id),
    reply: (id, content) => actions.replyToMessage(id, content)
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6 pb-20">
      <Helmet>
        <title>Messages - Admin | Munal AI</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Inbox className="w-8 h-8 text-violet-600" />
            Messages
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user inquiries and support tickets.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, subject, or content..." 
            className="pl-9 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-800"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Select 
            value={filters.status} 
            onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
          >
            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-slate-950">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-950">
            <TableRow>
              <TableHead className="w-[250px]">Sender</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <TableRow key={i}>
                   <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                   <TableCell><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div></TableCell>
                   <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                   <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                   <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                 </TableRow>
               ))
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                      <Inbox className="w-12 h-12" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No messages found</h3>
                    <p className="max-w-sm mt-2 text-sm">
                      We couldn't find any messages matching your current filters. Try adjusting your search or status filter.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => setFilters({ search: '', status: 'all' })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow 
                  key={message.id} 
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                    message.status === 'unread' ? 'bg-violet-50/30 dark:bg-violet-900/10' : ''
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700">
                          {message.senderName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className={`font-medium flex items-center gap-2 ${message.status === 'unread' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {message.senderName}
                          {message.source === 'contact_form' && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-0.5">
                              <Globe className="w-3 h-3" />
                              WEB
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">
                          {message.senderEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-md">
                      <div className={`text-sm ${message.status === 'unread' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} truncate`}>
                        {message.subject}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {message.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MessageStatusBadge status={message.status} isFlagged={message.isFlagged} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-slate-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => actions.toggleFlag(message.id)}>
                          <Flag className="w-4 h-4 mr-2" />
                          {message.isFlagged ? 'Unflag' : 'Flag'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => message.status === 'read' ? actions.markAsUnread(message.id) : actions.markAsRead(message.id)}>
                          {message.status === 'read' ? (
                            <><Mail className="w-4 h-4 mr-2" /> Mark Unread</>
                          ) : (
                            <><MailOpen className="w-4 h-4 mr-2" /> Mark Read</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => actions.archiveMessage(message.id)}>
                          <Archive className="w-4 h-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                          onClick={() => {
                             if(window.confirm('Delete message?')) actions.deleteMessage(message.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950/50">
             <div className="text-sm text-gray-500">
               Showing page {pagination.page} of {pagination.totalPages}
             </div>
             <div className="flex gap-2">
               <Button 
                 variant="outline" 
                 size="sm" 
                 disabled={pagination.page <= 1}
                 onClick={() => setPage(pagination.page - 1)}
               >
                 <ChevronLeft className="w-4 h-4 mr-1" /> Previous
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 disabled={pagination.page >= pagination.totalPages}
                 onClick={() => setPage(pagination.page + 1)}
               >
                 Next <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
             </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AdminMessageDetailModal 
        isOpen={isDetailModalOpen}
        onClose={setIsDetailModalOpen}
        message={selectedMessage}
        onAction={handleDetailAction}
      />
    </div>
  );
};

export default AdminMessagesPage;
