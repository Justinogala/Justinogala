
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';

const APIReference = () => {
  return (
    <PageTransition>
      <Helmet><title>API Reference - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="API Reference" subtitle="Build custom integrations with our powerful REST API.">
         <div className="flex justify-center mt-6">
            <Button>Get API Key</Button>
         </div>
      </PageHero>

      <PageSection>
        <div className="max-w-4xl mx-auto">
           <div className="prose prose-invert max-w-none">
              <h3 className="text-2xl font-bold text-text-primary mb-4">Authentication</h3>
              <p className="text-text-secondary mb-4">Authenticate your requests using the <code className="bg-bg-secondary p-1 rounded">Authorization</code> header with your API key.</p>
              
              <div className="bg-slate-900 rounded-lg p-4 mb-8 border border-slate-700">
                 <pre className="text-sm text-blue-300 font-mono overflow-x-auto">
{`curl https://api.echonote.ai/v1/meetings \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                 </pre>
              </div>

              <h3 className="text-2xl font-bold text-text-primary mb-4">Endpoints</h3>
              <div className="space-y-4">
                 <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase">GET</span>
                       <code className="text-text-primary">/v1/meetings</code>
                    </div>
                    <p className="text-text-secondary text-sm">List all meetings for the authenticated user.</p>
                 </div>
                 <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold uppercase">POST</span>
                       <code className="text-text-primary">/v1/upload</code>
                    </div>
                    <p className="text-text-secondary text-sm">Upload an audio file for processing.</p>
                 </div>
              </div>
           </div>
        </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default APIReference;
