
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Book, MessageCircle, Mail, ExternalLink, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';

const HelpPage = () => {
  const supportUrl = "https://munal.ai/support-tickets";

  const handleExternalNavigation = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <Helmet>
        <title>Help & Support | Munal AI</title>
        <meta name="description" content="Find answers, browse documentation, or contact our support team." />
      </Helmet>

      {/* Hero Section */}
      <div className="text-center py-16 px-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Search our knowledge base or reach out to our team of experts for personalized assistance.
          </p>
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <Input 
              className="pl-12 h-14 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-0 rounded-2xl shadow-lg focus:ring-2 focus:ring-white/20 text-lg" 
              placeholder="Search for articles, guides, or FAQs..." 
            />
          </div>
        </motion.div>
      </div>

      {/* Primary Action Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
              <LifeBuoy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Need direct assistance?</h2>
              <p className="text-slate-500 dark:text-slate-400">Our dedicated support team is ready to help with any technical issues or inquiries.</p>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={() => handleExternalNavigation(supportUrl)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            Contact Us <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Grid Options */}
      <div className="grid md:grid-cols-3 gap-8">
        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Card className="h-full border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-2">
                <Book className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Comprehensive guides, API references, and tutorials for developers and advanced users.
              </p>
              <Button variant="ghost" className="px-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-transparent group">
                Browse Docs <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Card className="h-full border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader>
               <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2">
                <MessageCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Community Forum</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Connect with other users, share best practices, and participate in feature discussions.
              </p>
               <Button variant="ghost" className="px-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-transparent group">
                Visit Forum <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
          <Card className="h-full border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader>
               <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Submit a Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Track your existing support requests or start a new conversation with our technicians.
              </p>
               <Button 
                variant="ghost" 
                onClick={() => handleExternalNavigation(supportUrl)}
                className="px-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-transparent group"
              >
                Go to Support <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpPage;
