
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import IntegrationList from '@/components/IntegrationList';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const IntegrationSettingsPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Integrations - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary">Integrations</h1>
            <p className="text-muted-foreground mt-2">
              Connect your favorite tools to streamline your workflow and boost productivity.
            </p>
          </div>

          <Card className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
            <CardContent className="flex items-start gap-4 p-6">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-full">
                  <Info className="w-5 h-5" />
               </div>
               <div>
                 <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">Why connect?</h4>
                 <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                   Integrations allow Munal to automatically sync meeting notes, send summaries to your team chat, and backup recordings to your preferred cloud storage provider.
                 </p>
               </div>
            </CardContent>
          </Card>

          <IntegrationList />
        </main>
      </div>
    </PageTransition>
  );
};

export default IntegrationSettingsPage;
