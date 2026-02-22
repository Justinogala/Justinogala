
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
import { Users, TrendingUp, Code, Heart, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';

const UseCasesIndex = () => {
  const cases = [
    { title: 'Sales Teams', icon: TrendingUp, desc: 'Close more deals with automated CRM entry and coaching.', link: '/use-cases/sales' },
    { title: 'Customer Success', icon: Heart, desc: 'Track sentiment and ensure no customer request is lost.', link: '/use-cases/customer-success' },
    { title: 'Product Teams', icon: Users, desc: 'Turn user feedback into roadmap features instantly.', link: '/use-cases/product' },
    { title: 'Engineering', icon: Code, desc: 'Capture technical requirements and architectural decisions.', link: '/use-cases/engineering' },
    { title: 'HR & Recruiting', icon: Briefcase, desc: 'Focus on the candidate, not note-taking during interviews.', link: '/use-cases/hr' },
    { title: 'Education', icon: GraduationCap, desc: 'Transcribe lectures and create study guides automatically.', link: '#' },
  ];

  return (
    <PageTransition>
      <Helmet><title>Use Cases - EchoNote AI</title></Helmet>
      <Header />
      <PageHero 
        title="Solutions for Every Team" 
        subtitle="Discover how EchoNote AI transforms workflows across your entire organization."
      />
      
      <PageSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((item, i) => (
            <Link key={i} to={item.link}>
              <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 group border-border">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
                  <p className="text-text-secondary mb-6">{item.desc}</p>
                  <div className="flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </PageSection>

      <CTASection title="Find your use case" primaryAction="Explore Features" primaryLink="/product/features" />
      <Footer />
    </PageTransition>
  );
};

export default UseCasesIndex;
