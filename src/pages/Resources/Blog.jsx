
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const posts = [
    { title: "The Future of AI in Meetings", category: "Trends", date: "Feb 8, 2026", desc: "How LLMs are changing the way we collaborate and retain information." },
    { title: "5 Tips for Better Remote Standups", category: "Productivity", date: "Feb 5, 2026", desc: "Keep your daily syncs short, sweet, and actionable with these tips." },
    { title: "EchoNote 2.0 Release Notes", category: "Product", date: "Jan 28, 2026", desc: "Introducing advanced sentiment analysis and custom vocabulary." },
    { title: "Security Best Practices for AI", category: "Security", date: "Jan 15, 2026", desc: "How we protect your data while leveraging powerful AI models." },
  ];

  return (
    <PageTransition>
      <Helmet><title>Blog - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Blog & Insights" subtitle="Latest news, product updates, and productivity tips." />

      <PageSection>
         {/* Featured Post */}
         <div className="mb-16">
            <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group">
               <div className="grid md:grid-cols-2">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-64 md:h-auto" />
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                     <Badge className="w-fit mb-4">Featured</Badge>
                     <h2 className="text-3xl font-bold text-text-primary mb-4 group-hover:text-accent transition-colors">Why Manual Note Taking is Dying</h2>
                     <p className="text-text-secondary mb-6 text-lg">We analyzed 10,000 meetings and found that active listening beats scribbling every time.</p>
                     <span className="text-sm text-text-secondary">Feb 10, 2026 • 5 min read</span>
                  </div>
               </div>
            </Card>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {posts.map((post, i) => (
               <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline">{post.category}</Badge>
                        <span className="text-sm text-text-secondary">{post.date}</span>
                     </div>
                     <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">{post.title}</h3>
                     <p className="text-text-secondary">{post.desc}</p>
                  </CardContent>
               </Card>
            ))}
         </div>
      </PageSection>

      <CTASection title="Stay in the loop" description="Subscribe to our newsletter for the latest updates." primaryAction="Subscribe" primaryLink="#" />
      <Footer />
    </PageTransition>
  );
};

export default Blog;
