import React from 'react';
import AdminVersionManager from '@/components/settings/AdminVersionManager';

const AdminSystemUpdatesPage = () => {
  return (
    <div className="space-y-6" data-testid="admin-system-updates-page">
      <AdminVersionManager />
    </div>
  );
};

export default AdminSystemUpdatesPage;
