
import { v4 as uuidv4 } from 'uuid';

const MOCK_ACTION_ITEMS = [
  {
    id: '1',
    text: "Draft the technical specifications for the Smart Summary feature",
    assignee: "Alex",
    deadline: "2024-03-20",
    priority: "High",
    completed: false
  },
  {
    id: '2',
    text: "Review mobile responsiveness metrics",
    assignee: "Sarah",
    deadline: "2024-03-18",
    priority: "Medium",
    completed: true
  },
  {
    id: '3',
    text: "Update the marketing deck with new Q3 timelines",
    assignee: "Mike",
    deadline: "2024-03-25",
    priority: "Low",
    completed: false
  }
];

export const actionItemsService = {
  extractActionItems: async (transcriptionText) => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1800));

    // In a real implementation, this would send text to an LLM to extract tasks.
    // For this demo, we return mock data.
    return MOCK_ACTION_ITEMS.map(item => ({ ...item, id: uuidv4() }));
  },

  createActionItem: (item) => {
    return {
      id: uuidv4(),
      text: item.text,
      assignee: item.assignee || 'Unassigned',
      deadline: item.deadline || null,
      priority: item.priority || 'Medium',
      completed: false,
      createdAt: new Date().toISOString()
    };
  },

  updateActionItem: (items, updatedItem) => {
    return items.map(item => item.id === updatedItem.id ? updatedItem : item);
  },

  deleteActionItem: (items, itemId) => {
    return items.filter(item => item.id !== itemId);
  },

  toggleComplete: (items, itemId) => {
    return items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
  }
};
