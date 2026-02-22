
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { FileText, Download, Trash2, Mail, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';

import { reportGenerationService } from '@/services/reportGenerationService';

const ReportManagementPage = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form State
  const [reportType, setReportType] = useState('usage');
  const [dateRange, setDateRange] = useState('last_30_days');

  const fetchReports = () => {
    setLoading(true);
    const data = reportGenerationService.getAllReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await reportGenerationService.generateReport(reportType, dateRange);
      toast({ title: "Report Generated", description: "New report is now available." });
      fetchReports();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate report." });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report) => {
    try {
      reportGenerationService.exportToPDF(report);
      toast({ title: "Download Started", description: "Your PDF is being downloaded." });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Error", description: err.message });
    }
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this report?")) {
      reportGenerationService.deleteReport(id);
      fetchReports();
      toast({ title: "Deleted", description: "Report removed." });
    }
  };

  const handleEmail = async (id) => {
    toast({ title: "Sending...", description: "Emailing report..." });
    await reportGenerationService.emailReport(id, "admin@example.com");
    toast({ title: "Sent", description: "Report emailed successfully." });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Reports - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Report Management</h1>
          <p className="text-muted-foreground mb-8">Generate, view, and export system reports.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generation Form */}
            <Card className="lg:col-span-1 h-fit shadow-md border-indigo-500/20 border-t-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" /> Generate New Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium">Report Type</label>
                   <Select value={reportType} onValueChange={setReportType}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="usage">Usage Statistics</SelectItem>
                       <SelectItem value="transcription">Transcription Analysis</SelectItem>
                       <SelectItem value="financial">Financial & Revenue</SelectItem>
                     </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium">Date Range</label>
                   <Select value={dateRange} onValueChange={setDateRange}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                       <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                       <SelectItem value="last_90_days">Last Quarter</SelectItem>
                       <SelectItem value="year_to_date">Year to Date</SelectItem>
                     </SelectContent>
                   </Select>
                </div>

                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> Generated Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                   <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : reports.length === 0 ? (
                   <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/20">
                     <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                     <p>No reports generated yet.</p>
                   </div>
                ) : (
                   <div className="space-y-3">
                     {reports.map((report) => (
                       <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors gap-4">
                         <div className="flex-1">
                           <h4 className="font-semibold text-sm">{report.title}</h4>
                           <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                             <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded capitalize">{report.type}</span>
                             <span className="flex items-center">{format(new Date(report.generatedAt), 'MMM d, yyyy h:mm a')}</span>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleEmail(report.id)}>
                             <Mail className="w-4 h-4" />
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                             <Download className="w-4 h-4 mr-2" /> PDF
                           </Button>
                           <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(report.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ReportManagementPage;
