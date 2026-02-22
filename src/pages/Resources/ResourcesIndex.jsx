
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Book, Code, FileText, MessageSquare } from 'lucide-react';

const ResourcesIndex = () => {
  const resources = [
    { title: 'Documentation', icon: Book, desc: 'Guides, tutorials, and configuration details.', link: '/resources/docs' },
    { title: 'API Reference', icon: Code, desc: 'Complete API documentation for developers.', link: '/resources/api' },
    { title: 'Blog', icon: FileText, desc: 'Latest news, tips, and industry insights.', link: '/resources/blog' },
    { title: 'Community', icon: MessageSquare, desc: 'Connect with other users and get help.', link: '/resources/community' },
  ];

  return (
    <PageTransition>
      <Helmet><title>Resources - EchoNote AI</title></Helmet>
      <Header />
      <PageHero 
        title="Resources & Support" 
        subtitle="Everything you need to succeed with EchoNote AI."
      />
      
      <PageSection>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {resources.map((item, i) => (
            <Link key={i} to={item.link}>
              <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 border-border">
                <CardContent className="p-8 flex items-start gap-6">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-text-secondary">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default ResourcesIndex;
