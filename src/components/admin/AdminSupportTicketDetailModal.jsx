
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supportTicketService } from '@/services/supportTicketService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const AdminSupportTicketDetailModal = ({ ticketId, onClose, onUpdate }) => {
  const { toast } = useToast();
  const bottomRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.responses]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await supportTicketService.getTicketById(ticketId);
      setTicket(data);
      setStatus(data.status);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await supportTicketService.updateTicketStatus(ticketId, newStatus);
      setStatus(newStatus);
      setTicket(updated);
      onUpdate && onUpdate(updated);
      toast({ title: 'Status updated', description: `Ticket marked as ${newStatus}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const updatedTicket = await supportTicketService.addResponse(ticketId, {
        authorId: 'admin-current', // In real app, get from auth context
        authorName: 'Admin Support',
        content: replyText,
        isAdmin: true
      });
      setTicket(updatedTicket);
      setReplyText('');
      onUpdate && onUpdate(updatedTicket);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply' });
    } finally {
      setSending(false);
    }
  };

  if (!ticketId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-slate-900">
            {loading ? (
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.title}</h2>
                  <Badge variant="outline">#{ticket.id}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{ticket.userName}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(ticket.createdDate).toLocaleDateString()}</span>
                  <span className="mx-1">•</span>
                  <Badge variant="secondary" className="text-xs">{ticket.priority}</Badge>
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main Content (Chat) */}
            <div className="flex-1 flex flex-col border-r border-gray-100 dark:border-gray-800">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-slate-950/30">
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-20 bg-gray-100 rounded animate-pulse ml-10"></div>
                  </div>
                ) : (
                  <>
                    {/* Original Issue */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Original Issue</p>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Timeline */}
                    <div className="relative space-y-6">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                      
                      {ticket.responses.map((response) => (
                        <div key={response.id} className="relative pl-10">
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                            response.isAdmin ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <span className="text-xs font-bold">{response.authorName?.[0]}</span>
                          </div>
                          <div className={`p-4 rounded-lg ${
                            response.isAdmin 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' 
                              : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700'
                          }`}>
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold text-sm">{response.authorName}</span>
                              <span className="text-xs text-gray-500">{new Date(response.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Type an internal note or reply to customer..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Reply will be visible to customer</span>
                    <Button onClick={handleSendReply} disabled={!replyText.trim() || sending} className="bg-indigo-600">
                      <Send className="w-4 h-4 mr-2" /> Send Response
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="w-80 bg-gray-50 dark:bg-slate-900 p-6 space-y-6 overflow-y-auto">
              {!loading && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"/> Open</div>
                        </SelectItem>
                        <SelectItem value="In Progress">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"/> In Progress</div>
                        </SelectItem>
                        <SelectItem value="Resolved">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/> Resolved</div>
                        </SelectItem>
                        <SelectItem value="Closed">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"/> Closed</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-gray-700 text-sm">
                      {ticket.category}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Info</label>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{ticket.userName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{ticket.userName}</p>
                          <p className="text-xs text-gray-500">ID: {ticket.userId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminSupportTicketDetailModal;
