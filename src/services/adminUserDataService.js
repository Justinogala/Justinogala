
import { userDataSyncService } from './userDataSyncService';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'munal_users';
const ACTIVITY_KEY = 'munal_user_activity';

// Helper to get users from storage
const getLocalUsers = () => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading users", e);
    return [];
  }
};

// Helper to save users to storage
const setLocalUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const adminUserDataService = {
  getAllUsers: async () => {
    // Simulate network delay slightly for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalUsers();
  },

  getUserById: async (id) => {
    const users = getLocalUsers();
    return users.find(u => u.id === id);
  },

  createUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = getLocalUsers();
    
    // Validate email uniqueness
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: uuidv4(),
      joinedDate: new Date().toISOString(), // Standardize key as joinedDate
      createdAt: new Date().toISOString(),  // Keep createdAt for compatibility
      lastActive: new Date().toISOString(),
      avatar: "", 
      ...userData,
      // Ensure essential fields exist
      role: userData.role || 'User',
      status: userData.status || 'Active',
      plan: userData.plan || 'Free'
    };

    const updatedUsers = [newUser, ...users];
    setLocalUsers(updatedUsers);
    
    userDataSyncService.notifyChange('create', newUser.id, newUser);
    return newUser;
  },

  updateUser: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const users = getLocalUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updates.email && updates.email !== users[index].email) {
      if (users.some(u => u.id !== id && u.email.toLowerCase() === updates.email.toLowerCase())) {
        throw new Error('Email is already in use by another user');
      }
    }

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    setLocalUsers(users);

    userDataSyncService.notifyChange('update', id, updatedUser);
    return updatedUser;
  },

  deleteUser: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const users = getLocalUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    
    if (users.length === filteredUsers.length) {
      throw new Error('User not found');
    }

    setLocalUsers(filteredUsers);
    userDataSyncService.notifyChange('delete', id, null);
    return true;
  },

  suspendUser: async (id) => {
    return adminUserDataService.updateUser(id, { status: 'Suspended' });
  },

  activateUser: async (id) => {
    return adminUserDataService.updateUser(id, { status: 'Active' });
  },

  searchUsers: async (query) => {
    const users = getLocalUsers();
    if (!query) return users;
    
    const lowerQuery = query.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(lowerQuery)) || 
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    );
  }
};
