
import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { exportData } from '@/services/adminService';
import { Download, FileDown, Loader2, Database } from 'lucide-react';

const ExportDataModal = ({ isOpen, onClose, initialType = 'All Data' }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataType, setDataType] = useState(initialType);
  const [format, setFormat] = useState('CSV');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportData(dataType, format);
      
      toast({
        title: "Export Ready",
        description: `${result.message} (${result.size}) ready for download.`,
      });
      
      onClose();
    } catch (error) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Export Data" maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-start gap-3 border border-indigo-100 dark:border-indigo-900/30">
          <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div className="text-sm text-indigo-900 dark:text-indigo-200">
            <p className="font-semibold">Export Wizard</p>
            <p className="opacity-90">Select the data you wish to export from the system. Large exports may take a few moments.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataType">Data to Export</Label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-800 dark:bg-slate-950"
            >
              <option>All Data</option>
              <option>Users</option>
              <option>Billing</option>
              <option>Workspaces</option>
              <option>Meetings</option>
              <option>Audit Logs</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-800 dark:bg-slate-950"
            >
              <option>CSV</option>
              <option>Excel</option>
              <option>JSON</option>
              <option>PDF</option>
            </select>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
              <Label htmlFor="headers" className="font-normal cursor-pointer">Include Headers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
              <Label htmlFor="metadata" className="font-normal cursor-pointer">Include Metadata (Timestamps, IDs)</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleExport} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {loading ? 'Processing...' : 'Export Data'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ExportDataModal;
