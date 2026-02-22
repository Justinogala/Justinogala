
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, User, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supportTicketService } from '@/services/supportTicketService';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const UserSupportTicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const bottomRef = useRef(null);
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when responses change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.responses]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const data = await supportTicketService.getTicketById(ticketId);
      if (!data) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ticket not found' });
        navigate('/support-tickets');
        return;
      }
      setTicket(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load ticket details' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const updatedTicket = await supportTicketService.addResponse(ticketId, {
        authorId: user?.id,
        authorName: user?.name || 'User',
        content: replyText,
        isAdmin: false
      });
      setTicket(updatedTicket);
      setReplyText('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!ticket) return null;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <Helmet>
        <title>{ticket.title} | Support - Munal</title>
      </Helmet>

      <Button variant="ghost" onClick={() => navigate('/support-tickets')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ticket.title}</h1>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <span className="font-mono">#{ticket.id}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge className={
                  ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                  ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                  'bg-gray-100 text-gray-700'
                }>
                  {ticket.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" /> Activity
            </h3>

            {ticket.responses.length === 0 ? (
              <p className="text-center text-gray-400 italic py-8">No responses yet. We'll get back to you soon.</p>
            ) : (
              ticket.responses.map((response) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${response.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                    {response.isAdmin ? (
                      <div className="bg-indigo-600 w-full h-full flex items-center justify-center text-white">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    ) : (
                      <AvatarImage src={user?.avatar} />
                    )}
                    <AvatarFallback>{response.authorName?.[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[80%] ${response.isAdmin ? 'mr-auto' : 'ml-auto'}`}>
                    <div className={`p-4 rounded-2xl ${
                      response.isAdmin 
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none' 
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{response.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${response.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <span className="font-medium">{response.authorName}</span>
                      <span>•</span>
                      <span>{new Date(response.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Type your reply here..." 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSendReply} disabled={!replyText.trim() || sending} className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="w-4 h-4 mr-2" /> 
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ticket Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block">Category</span>
                <span className="font-medium">{ticket.category}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Priority</span>
                <span className="font-medium flex items-center gap-2">
                  {ticket.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Created</span>
                <span className="font-medium">{new Date(ticket.createdDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Last Updated</span>
                <span className="font-medium">{new Date(ticket.updatedDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserSupportTicketDetailPage;
