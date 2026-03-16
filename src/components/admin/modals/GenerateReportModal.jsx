
import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { generateReport } from '@/services/adminService';
import { FileText, Calendar, Mail, Loader2, Download, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const GenerateReportModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'User Activity',
    startDate: '',
    endDate: '',
    format: 'PDF',
    recipients: '',
    isScheduled: false,
    frequency: 'Weekly',
    time: '09:00'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast({ title: "Error", description: "Please select a date range.", variant: "destructive" });
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({ title: "Error", description: "End date must be after start date.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (formData.type === 'IR / SOR Reports') {
        // IR/SOR uses its own dedicated export endpoint
        const fmt = formData.format === 'Excel' ? 'excel' : 'pdf';
        const params = new URLSearchParams();
        if (formData.startDate) params.set('start_date', formData.startDate);
        if (formData.endDate) params.set('end_date', formData.endDate);

        const res = await fetch(`${API_URL}/api/reports/export/${fmt}?${params}`);
        if (!res.ok) throw new Error('Failed to generate report');
        const blob = await res.blob();
        const ext = fmt === 'excel' ? 'xlsx' : 'pdf';
        _downloadBlob(blob, `ir_sor_reports_${formData.startDate}_${formData.endDate}.${ext}`);
      } else {
        // All other reports use the admin reports generate endpoint
        const params = new URLSearchParams({
          type: formData.type,
          format: formData.format === 'CSV' ? 'Excel' : formData.format,
          start_date: formData.startDate,
          end_date: formData.endDate,
        });

        const res = await fetch(`${API_URL}/api/admin/reports/generate?${params}`);
        if (!res.ok) throw new Error('Failed to generate report');
        const blob = await res.blob();
        const safeName = formData.type.toLowerCase().replace(/\s+/g, '_').replace('&', 'and');
        const ext = formData.format === 'Excel' ? 'xlsx' : formData.format === 'CSV' ? 'xlsx' : 'pdf';
        _downloadBlob(blob, `${safeName}_${formData.startDate}_${formData.endDate}.${ext}`);
      }

      // Save record to local list for display
      await generateReport({
        ...formData,
        size: 'Generated',
        downloadUrl: 'generated',
      });

      toast({ title: "Report downloaded", description: `Your ${formData.type} report (${formData.format}) has been generated.` });
      if (onSuccess) onSuccess();
      onClose();
      setFormData({ type: 'User Activity', startDate: '', endDate: '', format: 'PDF', recipients: '', isScheduled: false, frequency: 'Weekly', time: '09:00' });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const _downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const isIRSOR = formData.type === 'IR / SOR Reports';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Generate Report" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Report Type</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                id="type" name="type" value={formData.type} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-indigo-500"
              >
                <option>User Activity</option>
                <option>Meeting Summary</option>
                <option>System Performance</option>
                <option>Security Audit</option>
                <option>Storage Usage</option>
                <option>Revenue &amp; Billing</option>
                <option>Subscriptions</option>
                <option>IR / SOR Reports</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <div className="relative">
              <Download className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                id="format" name="format" value={formData.format} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-indigo-500"
              >
                <option>PDF</option>
                {!isIRSOR && <option>CSV</option>}
                <option>Excel</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="pl-9" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="pl-9" required />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-sm p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{isIRSOR ? 'This will generate a real IR / SOR report from incident data and download it immediately.' : 'This will generate a report from real-time database records and download it immediately.'}</span>
        </div>

        {!isIRSOR && (
          <>
            <div className="space-y-2">
              <Label htmlFor="recipients">Email Recipients (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input id="recipients" name="recipients" placeholder="email@example.com, another@example.com" value={formData.recipients} onChange={handleChange} className="pl-9" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="isScheduled" checked={formData.isScheduled} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isScheduled: checked }))} />
                <Label htmlFor="isScheduled" className="font-semibold cursor-pointer">Schedule this report</Label>
              </div>
              {formData.isScheduled && (
                <div className="grid grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-gray-800 dark:bg-slate-950"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} className="h-9" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700" data-testid="generate-report-submit-btn">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Download className="mr-2 h-4 w-4" />Generate &amp; Download</>)}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default GenerateReportModal;
