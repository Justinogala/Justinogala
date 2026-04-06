import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MetricsCard from '@/components/admin/MetricsCard';
import ComplianceScoreWidget from '@/components/admin/ComplianceScoreWidget';
import UserGrowthChart from '@/components/admin/UserGrowthChart';
import RevenueChart from '@/components/admin/RevenueChart';
import QuickActionsSection from '@/components/admin/QuickActionsSection';
import AdminAPIStatus from '@/components/admin/AdminAPIStatus';
import AdminIntegrationStatus from '@/components/admin/AdminIntegrationStatus';
import APIDocumentationSection from '@/components/admin/APIDocumentationSection';
import PaymentGatewayWidget from '@/components/admin/payment/PaymentGatewayWidget';
import { Users, CreditCard, Activity, Ticket, ArrowRight, Settings, FileText, Database, Package } from 'lucide-react';
import { adminBillingDataService } from '@/services/adminBillingDataService';
import { Button } from '@/components/ui/button';

const ModernAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await adminBillingDataService.getBillingStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Overview of your platform performance and system health.
          </p>
        </div>
        <Link to="/admin/system-updates" data-testid="dashboard-publish-version-btn">
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 gap-2">
            <Package className="w-4 h-4" />
            Publish Version
          </Button>
        </Link>
      </motion.div>

      {/* Security Compliance Score */}
      <motion.div variants={item}>
        <ComplianceScoreWidget />
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard 
          title="Total Revenue" 
          value={`$${stats?.totalRevenue.toLocaleString() || '0'}`}
          trend="up" 
          trendValue="12.5%" 
          icon={CreditCard}
          loading={loading}
          className="border-l-4 border-l-green-500"
        />
        <MetricsCard 
          title="Active Users" 
          value={stats?.activeSubscriptions || '0'}
          trend="up" 
          trendValue="8.2%" 
          icon={Users}
          loading={loading}
          className="border-l-4 border-l-blue-500"
        />
        <AdminAPIStatus />
        <AdminIntegrationStatus />
      </motion.div>

      {/* Quick Access Card for User Management */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold">User Management</h3>
            </div>
            <p className="text-violet-100 mb-6 text-sm">
              Manage user accounts, roles, permissions, and subscription plans efficiently.
            </p>
            <Link to="/admin/users">
              <Button variant="secondary" className="w-full justify-between bg-white text-violet-700 hover:bg-violet-50 border-none">
                Manage Users
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Content & Reports</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Review system reports, analytics summaries, and generated content.
            </p>
          </div>
          <Link to="/admin/reports">
            <Button variant="outline" className="w-full justify-between">
              View Reports
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

         <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Settings</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Configure global settings, API integrations, and payment gateways.
            </p>
          </div>
          <Link to="/admin/settings">
            <Button variant="outline" className="w-full justify-between">
              Configure
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserGrowthChart />
        </div>
        <div className="space-y-6">
          <PaymentGatewayWidget />
          <RevenueChart />
        </div>
      </motion.div>

      {/* Quick Actions & Recent Activity */}
      <motion.div variants={item}>
        <QuickActionsSection />
      </motion.div>

      {/* API & Developer Section */}
      <motion.div variants={item} className="grid grid-cols-1">
         <APIDocumentationSection />
      </motion.div>
    </motion.div>
  );
};

export default ModernAdminDashboard;