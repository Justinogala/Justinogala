
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const Terms = () => {
  return (
    <PageTransition>
      <Helmet><title>Terms of Service - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Terms of Service" subtitle="Last Updated: February 10, 2026" />

      <PageSection>
         <div className="max-w-3xl mx-auto prose prose-invert">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using EchoNote AI, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            
            <h3>2. Use License</h3>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on EchoNote AI's website for personal, non-commercial transitory viewing only.</p>
            
            <h3>3. Service Availability</h3>
            <p>We strive to keep the Service available 24/7, but we cannot guarantee uninterrupted access.</p>
            
            <h3>4. Limitation of Liability</h3>
            <p>In no event shall EchoNote AI be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on EchoNote AI's website.</p>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Terms;
