
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import FeatureCard from '@/components/shared/FeatureCard';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Shield, Lock, FileText, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Security = () => {
  return (
    <PageTransition>
      <Helmet><title>Security - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Security First" subtitle="We protect your data with enterprise-grade security and compliance." />

      <PageSection>
         <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
               <h2 className="text-3xl font-bold text-text-primary">Compliance You Can Trust</h2>
               <p className="text-text-secondary text-lg">EchoNote is SOC 2 Type II compliant and adheres to GDPR and CCPA regulations. Your data is your data.</p>
               <Button className="gap-2">
                  <FileText className="w-4 h-4" /> Download Security Report
               </Button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border">
               <img src="https://images.unsplash.com/photo-1654588830920-92085849e384" alt="Security Dashboard" className="w-full" />
            </div>
         </div>

         <div className="grid md:grid-cols-4 gap-6">
            <FeatureCard icon={Lock} title="Encryption" description="AES-256 encryption at rest and TLS 1.3 in transit." />
            <FeatureCard icon={Shield} title="Access Control" description="Role-based access control (RBAC) and SSO enforcement." />
            <FeatureCard icon={Server} title="Data Residency" description="Choose where your data is stored: US, EU, or APAC." />
            <FeatureCard icon={FileText} title="Audit Logs" description="Comprehensive logs of every action taken in your workspace." />
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Security;
