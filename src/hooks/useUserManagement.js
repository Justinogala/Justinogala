
import { useState, useCallback, useEffect } from 'react';
import { adminUserDataService } from '@/services/adminUserDataService';
import { userDataSyncService } from '@/services/userDataSyncService';
import { useToast } from '@/components/ui/use-toast';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUserDataService.getAllUsers();
      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Subscribe to external changes
  useEffect(() => {
    const unsubscribe = userDataSyncService.subscribe((e) => {
      const { action, userId, data } = e.detail;
      setUsers(prevUsers => {
        if (action === 'create') {
          // Check if already exists to prevent dupes from local state updates
          if (prevUsers.find(u => u.id === userId)) return prevUsers;
          return [data, ...prevUsers];
        } else if (action === 'update') {
          return prevUsers.map(u => u.id === userId ? { ...u, ...data } : u);
        } else if (action === 'delete') {
          return prevUsers.filter(u => u.id !== userId);
        }
        return prevUsers;
      });
    });
    
    // Initial fetch
    fetchUsers();
    
    return () => unsubscribe();
  }, [fetchUsers]);

  const addUser = useCallback(async (userData) => {
    setLoading(true);
    try {
      const newUser = await adminUserDataService.createUser(userData);
      // State is updated via subscription usually, but we can optimistically update or rely on sync
      // The sync service will trigger the update
      toast({
        title: "Success",
        description: `User ${newUser.name} created successfully.`,
        variant: "success",
      });
      return true;
    } catch (err) {
      console.error("Failed to add user:", err);
      setError("Failed to create user.");
      toast({
        title: "Error",
        description: err.message || "Failed to create user.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateUser = useCallback(async (id, updates) => {
    try {
      await adminUserDataService.updateUser(id, updates);
      // State updated via sync listener
      toast({
        title: "Success",
        description: "User updated successfully.",
        variant: "success",
      });
      return true;
    } catch (err) {
      console.error("Failed to update user:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deleteUser = useCallback(async (id) => {
    try {
      await adminUserDataService.deleteUser(id);
      // State updated via sync listener
      toast({
        title: "Success",
        description: "User deleted successfully.",
        variant: "success",
      });
      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  };
};
