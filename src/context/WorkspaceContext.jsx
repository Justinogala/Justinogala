import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWorkspaces, getWorkspaceById } from '@/services/workspaceService';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load workspaces when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [isAuthenticated, user]);

  // Persist/Restore current workspace selection
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedId = localStorage.getItem('munal_current_workspace_id');
      if (savedId) {
        const saved = workspaces.find(w => w.id === savedId);
        if (saved) {
          setCurrentWorkspace(saved);
        } else {
          setCurrentWorkspace(workspaces[0]);
        }
      } else {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, currentWorkspace]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaces(user.id);
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to load workspaces", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspaceId) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('munal_current_workspace_id', workspaceId);
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      switchWorkspace,
      refreshWorkspaces,
      loading,
      error
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};