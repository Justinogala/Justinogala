
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const AnalyticsDashboardPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Analytics Dashboard - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Real-time insights into system performance and user engagement.</p>
            </div>
            <Link to="/admin/reports">
               <Button variant="outline" className="flex items-center gap-2">
                 <FileText className="w-4 h-4" /> Manage Reports
               </Button>
            </Link>
          </div>

          <AnalyticsDashboard />
        </main>
      </div>
    </PageTransition>
  );
};

export default AnalyticsDashboardPage;
