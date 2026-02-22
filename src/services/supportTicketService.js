
import { v4 as uuidv4 } from 'uuid';

const TICKETS_KEY = 'munal_support_tickets';

// Mock Data Initialization
const MOCK_TICKETS = [
  {
    id: 'T-1001',
    userId: 'user-1',
    userName: 'John Doe',
    title: 'Audio upload failing on Safari',
    description: 'When I try to upload an MP3 file using Safari browser, it gets stuck at 99%.',
    category: 'Technical',
    priority: 'High',
    status: 'Open',
    createdDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    assignedTo: null,
    responses: [
      {
        id: 'r-1',
        authorId: 'user-1',
        authorName: 'John Doe',
        content: 'I have tried clearing cache but it persists.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        isAdmin: false
      }
    ]
  },
  {
    id: 'T-1002',
    userId: 'user-1',
    userName: 'John Doe',
    title: 'Billing question regarding Enterprise plan',
    description: 'I would like to know if the Enterprise plan includes API access.',
    category: 'Billing',
    priority: 'Medium',
    status: 'In Progress',
    createdDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    assignedTo: 'admin-1',
    responses: [
      {
        id: 'r-2',
        authorId: 'admin-1',
        authorName: 'Sarah Support',
        content: 'Hi John, checking with our sales team.',
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        isAdmin: true
      }
    ]
  },
  {
    id: 'T-1003',
    userId: 'user-2',
    userName: 'Alice Smith',
    title: 'Feature Request: Dark Mode export',
    description: 'Can we get PDF exports that respect the dark mode theme?',
    category: 'Feature Request',
    priority: 'Low',
    status: 'Resolved',
    createdDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    assignedTo: 'admin-2',
    responses: []
  }
];

const initializeData = () => {
  const existing = localStorage.getItem(TICKETS_KEY);
  if (!existing) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(MOCK_TICKETS));
  }
};

initializeData();

export const supportTicketService = {
  // --- Create ---
  createTicket: async (ticketData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    
    const newTicket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`, // Simple ID generation
      userId: ticketData.userId || 'user-1', // Default to generic user if not provided
      userName: ticketData.userName || 'Current User',
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'Open',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      assignedTo: null,
      responses: []
    };

    tickets.unshift(newTicket);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    return newTicket;
  },

  // --- Read ---
  getAllTickets: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
  },

  getUserTickets: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const allTickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    // In a real app, filtering would happen on server. 
    // For mock, we'll return all if userId matches, or the mock ones if using the default mock user
    return allTickets.filter(t => t.userId === userId || (!t.userId && userId === 'user-1'));
  },

  getTicketById: async (ticketId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    return tickets.find(t => t.id === ticketId);
  },

  // --- Update ---
  updateTicketStatus: async (ticketId, status) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    const index = tickets.findIndex(t => t.id === ticketId);
    
    if (index !== -1) {
      tickets[index].status = status;
      tickets[index].updatedDate = new Date().toISOString();
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      return tickets[index];
    }
    throw new Error('Ticket not found');
  },

  assignTicket: async (ticketId, adminId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    const index = tickets.findIndex(t => t.id === ticketId);
    
    if (index !== -1) {
      tickets[index].assignedTo = adminId;
      tickets[index].updatedDate = new Date().toISOString();
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      return tickets[index];
    }
    throw new Error('Ticket not found');
  },

  addResponse: async (ticketId, responseData) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    const index = tickets.findIndex(t => t.id === ticketId);
    
    if (index !== -1) {
      const newResponse = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...responseData
      };
      
      tickets[index].responses.push(newResponse);
      tickets[index].updatedDate = new Date().toISOString();
      
      // Auto-update status if admin replies to an Open ticket
      if (responseData.isAdmin && tickets[index].status === 'Open') {
        tickets[index].status = 'In Progress';
      }

      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      return tickets[index];
    }
    throw new Error('Ticket not found');
  }
};
