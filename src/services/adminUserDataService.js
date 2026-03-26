
import { userDataSyncService } from './userDataSyncService';

import { getApiUrl, API_URL } from '@/lib/api';

export const adminUserDataService = {
  getAllUsers: async () => {
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${apiUrl}/api/users`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.users || []);
    } catch (error) {
      console.error('Error fetching users from API:', error);
      return [];
    }
  },

  getUserById: async (id) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  createUser: async (userData) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
      }
      
      const data = await response.json();
      const newUser = data.user;
      
      userDataSyncService.notifyChange('create', newUser.id, newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update user');
      }
      
      const data = await response.json();
      const updatedUser = data.user;
      
      userDataSyncService.notifyChange('update', id, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
      }
      
      userDataSyncService.notifyChange('delete', id, null);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  suspendUser: async (id) => {
    return adminUserDataService.updateUser(id, { status: 'Suspended' });
  },

  activateUser: async (id) => {
    return adminUserDataService.updateUser(id, { status: 'Active' });
  },

  searchUsers: async (query) => {
    const users = await adminUserDataService.getAllUsers();
    if (!query) return users;
    
    const lowerQuery = query.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(lowerQuery)) || 
      (u.email && u.email.toLowerCase().includes(lowerQuery))
    );
  }
};
