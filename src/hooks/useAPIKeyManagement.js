
import { useContext } from 'react';
import { APIKeyManagementContext } from '@/context/APIKeyManagementContext';

export const useAPIKeyManagement = () => {
  const context = useContext(APIKeyManagementContext);
  
  if (!context) {
    throw new Error('useAPIKeyManagement must be used within an APIKeyManagementProvider');
  }
  
  return context;
};
