
import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '@/services/adminService';
import AdminTable from '@/components/AdminTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getAuditLogs({ action: search }).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [search]);

  const columns = [
    { key: 'timestamp', label: 'Time', render: (l) => <span className="text-xs text-gray-400 font-mono">{new Date(l.timestamp).toLocaleString()}</span> },
    { key: 'action', label: 'Action', render: (l) => <span className="font-semibold text-white text-sm">{l.action}</span> },
    { key: 'targetType', label: 'Target', render: (l) => <Badge variant="secondary" className="text-xs">{l.targetType}</Badge> },
    { key: 'details', label: 'Details', render: (l) => <span className="text-sm text-gray-300">{l.details}</span> },
    { key: 'ip', label: 'IP Address', render: (l) => <span className="text-xs text-gray-500 font-mono">{l.ip}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
          <p className="text-gray-400 text-sm">Track all administrative actions and system events.</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" /> Export Logs
        </Button>
      </div>

      <AdminTable 
        columns={columns} 
        data={logs} 
        isLoading={loading}
        onSearch={setSearch}
        pagination={{ page: 1, totalPages: 1 }} // Simplified for mock
        onPageChange={() => {}}
      />
    </div>
  );
};

export default AdminAuditLogsPage;
