
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTable from '@/components/AdminTable';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AdminIntegrationLogs = () => {
  const { getIntegrationLogs } = useAdminSettings();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getIntegrationLogs();
      setLogs(data);
    };
    fetchLogs();
  }, [getIntegrationLogs]);

  const columns = [
    { key: 'timestamp', label: 'Time', render: (row) => new Date(row.timestamp).toLocaleString() },
    { key: 'integration', label: 'Integration' },
    { key: 'action', label: 'Action' },
    { key: 'user', label: 'User' },
    { key: 'status', label: 'Status', render: (row) => (
        <Badge variant={row.status === 'Success' ? 'default' : 'destructive'}>{row.status}</Badge>
      ) 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar className="w-64 hidden lg:flex" />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <Helmet><title>Integration Logs | Admin</title></Helmet>
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold">Integration Activity Logs</h1>
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

export default AdminIntegrationLogs;
