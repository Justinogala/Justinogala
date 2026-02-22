
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CTASection = ({ 
  title = "Ready to get started?", 
  description = "Join thousands of teams using EchoNote AI to transform their meetings.",
  primaryAction = "Start Free Trial",
  secondaryAction = "Schedule Demo",
  primaryLink = "/signup",
  secondaryLink = "/demo"
}) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.h2 
          className="text-3xl md:text-5xl font-bold font-heading mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        <motion.p 
          className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => navigate(primaryLink)} 
            className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50 border-0"
          >
            {primaryAction}
          </Button>
          <Button 
            onClick={() => navigate(secondaryLink)} 
            variant="outline" 
            className="h-14 px-8 text-lg text-white border-white hover:bg-white/10"
          >
            {secondaryAction}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
