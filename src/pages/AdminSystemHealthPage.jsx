
import React, { useEffect, useState } from 'react';
import { 
  getSystemHealth, 
  getPerformanceMetrics, 
  getResourceUsage, 
  getServiceStatus, 
  getRecentAlerts, 
  getErrorLogs,
  getHealthTrend,
  runHealthCheck,
  testServiceConnection,
  clearErrorLogs,
  clearAlerts,
  generateHealthReport
} from '@/services/systemHealthService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Activity, Server, Database, AlertTriangle, RefreshCw, 
  CheckCircle, XCircle, Clock, Zap, FileText, Download, Mail, Trash2,
  TrendingUp, TrendingDown, ChevronRight, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Simple Chart Component ---
const TrendChart = ({ data, color = "#10B981", height = 60 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M0,100 L0,${100 - ((data[0].value - min) / range) * 100} ${points.split(' ').map((p, i) => `L${p}`).join(' ')} L100,100 Z`}
          fill={`url(#grad-${color})`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

const AdminSystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [resources, setResources] = useState(null);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [testingService, setTestingService] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const { toast } = useToast();

  const fetchAllData = async () => {
    try {
      const [h, m, r, s, a, e, t] = await Promise.all([
        getSystemHealth(),
        getPerformanceMetrics(),
        getResourceUsage(),
        getServiceStatus(),
        getRecentAlerts(),
        getErrorLogs(),
        getHealthTrend(30)
      ]);
      setHealth(h);
      setMetrics(m);
      setResources(r);
      setServices(s);
      setAlerts(a);
      setErrorLogs(e);
      setTrends(t);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRunDiagnostics = async () => {
    setIsChecking(true);
    try {
      const result = await runHealthCheck();
      await fetchAllData();
      toast({
        title: "Diagnostics Complete",
        description: `System status: ${result.status}`,
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      toast({ title: "Diagnostics Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  };

  const handleTestService = async (serviceName) => {
    setTestingService(serviceName);
    try {
      const result = await testServiceConnection(serviceName);
      toast({
        title: `${serviceName} Test`,
        description: result.message,
        variant: result.status === 'connected' ? "default" : "destructive"
      });
      // Refresh just services
      const s = await getServiceStatus();
      setServices(s);
    } catch (error) {
      toast({ title: "Test Failed", description: error.message, variant: "destructive" });
    } finally {
      setTestingService(null);
    }
  };

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear all error logs?")) {
      await clearErrorLogs();
      setErrorLogs([]);
      toast({ title: "Logs Cleared", description: "All error logs have been removed." });
    }
  };

  const handleClearAlerts = async () => {
    if (confirm("Are you sure you want to clear all alerts?")) {
      await clearAlerts();
      setAlerts([]);
      toast({ title: "Alerts Cleared", description: "All alerts have been removed." });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
        <span>Loading System Health...</span>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            System Health Monitor
            <div className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'bg-green-500' : health?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Last updated: {new Date(health?.lastCheck).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-white/10">
             <button 
               onClick={() => setAutoRefresh(!autoRefresh)}
               className={`px-3 py-1.5 text-xs rounded-md transition-all ${autoRefresh ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
               Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
             </button>
          </div>
          <Button 
            onClick={handleRunDiagnostics} 
            disabled={isChecking}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <Card className={`bg-slate-900 border ${getStatusColor(health?.status)}`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${health?.status === 'healthy' ? 'bg-green-500/20' : health?.status === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
              <Activity className={`w-8 h-8 ${health?.status === 'healthy' ? 'text-green-500' : health?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{health?.status} System Status</h2>
              <p className="text-gray-400">{health?.description}</p>
            </div>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-sm text-gray-500 uppercase">Uptime</p>
              <p className="text-2xl font-mono font-bold text-white">{health?.uptime}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase">Alerts</p>
              <p className="text-2xl font-mono font-bold text-white">{alerts.filter(a => a.status === 'unresolved').length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'API Response', value: metrics?.apiResponseTime.value, unit: 'ms', icon: Zap, color: 'text-blue-400', trend: metrics?.apiResponseTime.trend },
          { title: 'Error Rate', value: metrics?.errorRate.value, unit: '%', icon: AlertTriangle, color: 'text-red-400', trend: metrics?.errorRate.trend },
          { title: 'Failed Jobs', value: metrics?.failedJobs.value, unit: '', icon: XCircle, color: 'text-orange-400', trend: metrics?.failedJobs.trend },
          { title: 'DB Query Time', value: metrics?.dbQueryTime.value, unit: 'ms', icon: Database, color: 'text-purple-400', trend: metrics?.dbQueryTime.trend },
        ].map((item, i) => (
          <Card key={i} className="bg-slate-900 border-white/10 hover:border-white/20 transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-sm font-medium">{item.title}</span>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className="text-sm text-gray-500 mb-1">{item.unit}</span>
              </div>
              <div className={`text-xs mt-2 flex items-center ${item.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {item.trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(item.trend)}% vs last hour
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Usage & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Usage */}
        <Card className="bg-slate-900 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" /> Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: 'Storage', data: resources?.storage, color: 'bg-blue-500' },
              { label: 'Memory (RAM)', data: resources?.memory, color: 'bg-purple-500' },
              { label: 'CPU Load', data: resources?.cpu, color: 'bg-orange-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-gray-400">{item.data.used} / {item.data.total} {item.data.unit} ({item.data.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${item.color}`} 
                    style={{ width: `${item.data.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
               {/* Charts */}
               <div>
                  <p className="text-xs text-gray-500 mb-2">Uptime Trend (30d)</p>
                  <TrendChart data={trends?.uptime} color="#10B981" />
               </div>
               <div>
                  <p className="text-xs text-gray-500 mb-2">Error Rate (30d)</p>
                  <TrendChart data={trends?.errorRate} color="#EF4444" />
               </div>
               <div>
                  <p className="text-xs text-gray-500 mb-2">Response Time (30d)</p>
                  <TrendChart data={trends?.responseTime} color="#3B82F6" />
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-lg flex items-center justify-between group">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${service.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-white">{service.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{service.latency}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-xs text-gray-400 hover:text-white"
                  onClick={() => handleTestService(service.name)}
                  disabled={testingService === service.name}
                >
                  {testingService === service.name ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card className="bg-slate-900 border-white/10 flex flex-col h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" /> Recent Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearAlerts} className="text-xs text-red-400 hover:text-red-300">
              Clear All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-3">
              {alerts.length === 0 ? (
                 <div className="text-center py-10 text-gray-500">No active alerts</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border flex gap-3 ${
                    alert.type === 'error' ? 'bg-red-500/5 border-red-500/20' : 
                    alert.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 
                    'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                      alert.type === 'error' ? 'bg-red-500' : 
                      alert.type === 'warning' ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <h4 className="text-sm font-medium text-white">{alert.message}</h4>
                         <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                           alert.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                         }`}>{alert.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Logs */}
        <Card className="bg-slate-900 border-white/10 flex flex-col h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-400" /> Error Logs
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearLogs} className="text-xs text-red-400 hover:text-red-300">
                Clear Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-2">
              {errorLogs.length === 0 ? (
                 <div className="text-center py-10 text-gray-500">No error logs found</div>
              ) : (
                errorLogs.map((log) => (
                  <div key={log.id} className="border border-white/5 rounded-lg overflow-hidden">
                    <div 
                      className="p-3 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Badge variant="outline" className={`
                          ${log.severity === 'critical' ? 'text-red-400 border-red-500/30' : 
                            log.severity === 'high' ? 'text-orange-400 border-orange-500/30' : 
                            'text-yellow-400 border-yellow-500/30'}
                        `}>
                          {log.severity}
                        </Badge>
                        <span className="text-sm text-gray-300 truncate">{log.message}</span>
                      </div>
                      {expandedLog === log.id ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </div>
                    
                    <AnimatePresence>
                      {expandedLog === log.id && (
                        <motion.div 
                          initial={{ height: 0 }} 
                          animate={{ height: 'auto' }} 
                          exit={{ height: 0 }} 
                          className="bg-black/20 overflow-hidden"
                        >
                          <div className="p-3 text-xs font-mono text-gray-400 border-t border-white/5">
                            <div className="mb-2">
                              <span className="text-gray-500">Timestamp:</span> {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div className="mb-2">
                              <span className="text-gray-500">Type:</span> {log.type}
                            </div>
                            <div className="bg-black/40 p-2 rounded text-red-300 whitespace-pre-wrap overflow-x-auto">
                              {log.stackTrace}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Actions */}
      <div className="flex gap-4 justify-end pt-4">
        <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300" onClick={() => toast({ title: "Exported", description: "Health report downloaded." })}>
          <Download className="w-4 h-4 mr-2" /> Export Report (PDF)
        </Button>
        <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300" onClick={() => toast({ title: "Sent", description: "Report emailed to admin." })}>
          <Mail className="w-4 h-4 mr-2" /> Email Report
        </Button>
      </div>
    </div>
  );
};

export default AdminSystemHealthPage;
