
import { useState, useEffect, useCallback } from 'react';
import { supportTicketService } from '@/services/supportTicketService';
import { useAuth } from '@/context/AuthContext';

export const useSupportTickets = (isAdmin = false) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTickets = useCallback(async () => {
    if (!user && !isAdmin) return;
    try {
      setLoading(true);
      const data = isAdmin 
        ? await supportTicketService.getAllTickets()
        : await supportTicketService.getTickets(user.id);
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchTickets();
    // Simulate real-time subscription with polling
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const createTicket = async (data) => {
    const result = await supportTicketService.createTicket({ ...data, user_id: user.id });
    await fetchTickets();
    return result;
  };

  const updateStatus = async (id, status) => {
    await supportTicketService.updateTicketStatus(id, status);
    await fetchTickets();
  };

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateStatus,
    refreshTickets: fetchTickets
  };
};
