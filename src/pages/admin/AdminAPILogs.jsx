
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTable from '@/components/AdminTable';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AdminAPILogs = () => {
  const { getApiLogs } = useAdminSettings();
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // In a real app this would be paginated from backend
    setLogs(getApiLogs());
  }, [getApiLogs]);

  const columns = [
    { key: 'timestamp', label: 'Time', render: (row) => new Date(row.timestamp).toLocaleString() },
    { key: 'api', label: 'API Provider' },
    { key: 'action', label: 'Action' },
    { key: 'user', label: 'User' },
    { key: 'status', label: 'Status', render: (row) => (
        <Badge variant={row.status === 'Success' ? 'default' : 'destructive'}>{row.status}</Badge>
      ) 
    },
    { key: 'error', label: 'Details', render: (row) => row.error || row.detail || '-' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar className="w-64 hidden lg:flex" />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <Helmet><title>API Logs | Admin</title></Helmet>
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold">API Activity Logs</h1>
             <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
          <AdminTable 
            columns={columns} 
            data={logs} 
            isLoading={false}
            pagination={{ page: 1, totalPages: 1 }}
            onPageChange={() => {}}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminAPILogs;
