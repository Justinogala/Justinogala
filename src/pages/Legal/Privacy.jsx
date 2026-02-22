import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const Privacy = () => {
  return (
    <PageTransition>
      <Helmet><title>Privacy Policy - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Privacy Policy" subtitle="Last Updated: February 10, 2026" />

      <PageSection>
         <div className="max-w-3xl mx-auto prose prose-invert">
            <h3>1. Introduction</h3>
            <p>At EchoNote AI, we take your privacy seriously. This policy describes how we collect, use, and protect your personal data.</p>
            
            <h3>2. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or use our services to record meetings.</p>
            
            <h3>3. How We Use Your Information</h3>
            <p>We use your information to provide, maintain, and improve our services, including processing audio recordings to generate transcripts and summaries.</p>
            
            <h3>4. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h3>5. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@echonote.ai.</p>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Privacy;