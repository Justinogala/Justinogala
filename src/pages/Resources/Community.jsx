
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MessageSquare, Slack } from 'lucide-react';

const Community = () => {
  return (
    <PageTransition>
      <Helmet><title>Community - EchoNote AI</title></Helmet>
      <Header />
      
      <PageHero title="Join the Community" subtitle="Connect with thousands of EchoNote users, share workflows, and get help." />

      <PageSection>
         <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="p-6 hover:shadow-lg transition-all">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Slack className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">Slack Community</h3>
               <p className="text-text-secondary mb-4">Chat with other users and the EchoNote team in real-time.</p>
               <a href="#" className="text-accent font-medium hover:underline">Join Slack →</a>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <MessageSquare className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">Discussion Forums</h3>
               <p className="text-text-secondary mb-4">Post questions, feature requests, and share your tips.</p>
               <a href="#" className="text-accent font-medium hover:underline">Visit Forums →</a>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all">
               <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                  <Users className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">User Groups</h3>
               <p className="text-text-secondary mb-4">Find local meetups and virtual events happening near you.</p>
               <a href="#" className="text-accent font-medium hover:underline">Find Groups →</a>
            </Card>
         </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default Community;
