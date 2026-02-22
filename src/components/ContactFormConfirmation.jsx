
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ContactFormConfirmation = ({ onReset, data }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-2xl mx-auto border border-violet-100 dark:border-violet-900/30"
    >
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Message Sent!</h2>
      
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
        Thank you for contacting us, <span className="font-semibold text-gray-900 dark:text-white">{data.name}</span>. 
        We have received your message regarding "<span className="italic">{data.subject}</span>" and will get back to you shortly.
      </p>
      
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-8 text-sm text-violet-700 dark:text-violet-300">
        Estimated response time: <span className="font-semibold">24-48 hours</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Send Another Message
        </Button>
        <Button asChild className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default ContactFormConfirmation;
