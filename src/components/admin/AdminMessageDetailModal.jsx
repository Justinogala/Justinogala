
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, 
  Archive, 
  Mail, 
  MailOpen, 
  Flag, 
  Reply, 
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import MessageStatusBadge from './MessageStatusBadge';
import AdminMessageReplyForm from './AdminMessageReplyForm';

const AdminMessageDetailModal = ({ 
  isOpen, 
  onClose, 
  message, 
  onAction 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  if (!message) return null;

  const handleReplySend = async (content) => {
    const success = await onAction.reply(message.id, content);
    if (success) {
      setShowReplyForm(false);
      // Optional: don't close modal to let admin see the updated thread
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setShowReplyForm(false);
      onClose(open);
    }}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {message.subject}
              </DialogTitle>
              <div className="flex items-center gap-3">
                 <MessageStatusBadge status={message.status} isFlagged={message.isFlagged} />
                 <span className="text-xs text-gray-400 flex items-center">
                   <Calendar className="w-3 h-3 mr-1" />
                   {format(new Date(message.createdAt), 'PPpp')}
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback className="bg-violet-100 text-violet-700">
                {message.senderName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {message.senderName}
                <span className="text-xs font-normal text-gray-500">&lt;{message.senderEmail}&gt;</span>
              </h4>
              <p className="text-xs text-gray-500">User ID: {message.senderId}</p>
            </div>
          </div>
        </div>

        {/* Content & History */}
        <ScrollArea className="flex-1 p-6">
           <div className="space-y-6">
             {/* Original Message */}
             <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
               <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
             </div>

             {/* Replies */}
             {message.replies && message.replies.length > 0 && (
               <>
                 <div className="relative py-4">
                   <Separator className="absolute top-1/2" />
                   <span className="relative bg-white dark:bg-slate-950 px-2 text-xs text-gray-400 font-medium left-1/2 -translate-x-1/2">
                     Conversation History
                   </span>
                 </div>
                 
                 <div className="space-y-4">
                   {message.replies.map((reply) => (
                     <div key={reply.id} className="flex gap-3">
                       <Avatar className="h-8 w-8 mt-1">
                         <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">A</AvatarFallback>
                       </Avatar>
                       <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 flex-1 border border-indigo-100 dark:border-indigo-900/30">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Admin Response</span>
                           <span className="text-[10px] text-gray-400">
                             {format(new Date(reply.createdAt), 'PP p')}
                           </span>
                         </div>
                         <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </>
             )}

             {showReplyForm && (
               <AdminMessageReplyForm 
                 onSend={handleReplySend}
                 onCancel={() => setShowReplyForm(false)}
               />
             )}
           </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center gap-2">
           <div className="flex gap-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => onAction.toggleFlag(message.id)}
               className={message.isFlagged ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""}
             >
               <Flag className={`w-4 h-4 mr-2 ${message.isFlagged ? "fill-yellow-600" : ""}`} />
               {message.isFlagged ? "Unflag" : "Flag"}
             </Button>

             {message.status === 'archived' ? (
               <Button variant="outline" size="sm" onClick={() => onAction.markAsRead(message.id)}>
                 <Archive className="w-4 h-4 mr-2" /> Unarchive
               </Button>
             ) : (
               <Button variant="outline" size="sm" onClick={() => onAction.archive(message.id)}>
                 <Archive className="w-4 h-4 mr-2" /> Archive
               </Button>
             )}
           </div>

           <div className="flex gap-2">
             {!showReplyForm && (
                <Button onClick={() => setShowReplyForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Reply className="w-4 h-4 mr-2" /> Reply
                </Button>
             )}
             
             {message.status !== 'read' && !showReplyForm && (
               <Button variant="outline" onClick={() => onAction.markAsRead(message.id)}>
                 <MailOpen className="w-4 h-4 mr-2" /> Mark Read
               </Button>
             )}
           </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default AdminMessageDetailModal;
