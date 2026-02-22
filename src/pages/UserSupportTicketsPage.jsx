
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { supportTicketService } from '@/services/supportTicketService';
import LoadingSpinner from '@/components/LoadingSpinner';

const UserSupportTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  
  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    title: '',
    category: 'Technical',
    priority: 'Medium',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportTicketService.getUserTickets(user?.id);
      setTickets(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tickets' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description) {
      toast({ variant: 'destructive', title: 'Required fields missing' });
      return;
    }

    try {
      setSubmitting(true);
      await supportTicketService.createTicket({
        ...newTicket,
        userId: user?.id,
        userName: user?.name
      });
      toast({ title: 'Success', description: 'Ticket created successfully' });
      setNewTicket({ title: '', category: 'Technical', priority: 'Medium', description: '' });
      setActiveTab('list');
      fetchTickets();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create ticket' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'High' || priority === 'Urgent') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      <Helmet>
        <title>Support Tickets | Munal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-8 h-8 text-indigo-600" />
            Support Tickets
          </h1>
          <p className="text-gray-500 mt-2">Track your support requests and get help from our team.</p>
        </div>
        <Button onClick={() => setActiveTab('create')} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Ticket
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">My Tickets</TabsTrigger>
          <TabsTrigger value="create">Create New Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search tickets by ID or title..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tickets found</h3>
              <p className="text-gray-500 mt-1">You haven't created any support tickets yet.</p>
              <Button onClick={() => setActiveTab('create')} variant="link" className="mt-2 text-indigo-600">
                Create your first ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/support-tickets/${ticket.id}`)}
                  className="group cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">#{ticket.id}</span>
                            <Badge className={getStatusColor(ticket.status)} variant="secondary">
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {ticket.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(ticket.priority)}
                            <span>{ticket.priority} Priority</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(ticket.createdDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleCreateTicket} className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ticket Title</label>
                  <Input 
                    placeholder="Brief summary of the issue" 
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={newTicket.category} 
                      onValueChange={(val) => setNewTicket({...newTicket, category: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical Issue</SelectItem>
                        <SelectItem value="Billing">Billing & Account</SelectItem>
                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newTicket.priority} 
                      onValueChange={(val) => setNewTicket({...newTicket, priority: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Please describe the issue in detail..." 
                    rows={6}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Submit Ticket'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSupportTicketsPage;
