
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Send, Mail, User, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { contactFormService } from '@/services/contactFormService';
import ContactFormConfirmation from '@/components/ContactFormConfirmation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ContactFormPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await contactFormService.submitContactForm(formData);
      
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Message Sent",
          description: "We've received your message and will get back to you soon.",
          variant: "success"
        });
      } else {
        // Validation failed or other error
        if (response.error === 'Validation failed') {
           const validation = contactFormService.validateContactForm(formData);
           setErrors(validation.errors);
        }
        
        toast({
          title: "Error",
          description: response.error || "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setIsSuccess(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Helmet>
        <title>Contact Us - Munal AI</title>
        <meta name="description" content="Get in touch with the Munal AI team for support, sales, or general inquiries." />
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-purple-600/10 dark:from-violet-900/20 dark:to-purple-900/20 -z-10" />
          <div className="container mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Get in Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Have questions about Munal AI? We're here to help. Send us a message and we'll respond as soon as possible.
            </motion.p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {isSuccess ? (
              <ContactFormConfirmation onReset={handleReset} data={formData} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact Info Sidebar */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-violet-600 text-white rounded-2xl p-8 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                    <p className="text-violet-100 mb-8">
                      Fill out the form and our team will get back to you within 24 hours.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <Mail className="w-6 h-6 text-violet-200 mt-1" />
                        <div>
                          <h4 className="font-semibold">Email</h4>
                          <p className="text-violet-100">support@munal.ai</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <MessageSquare className="w-6 h-6 text-violet-200 mt-1" />
                        <div>
                          <h4 className="font-semibold">Live Chat</h4>
                          <p className="text-violet-100">Available Mon-Fri 9am-6pm EST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12">
                     <div className="flex gap-4">
                       {/* Social icons placeholders */}
                       <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer flex items-center justify-center">
                         <span className="sr-only">Twitter</span>
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer flex items-center justify-center">
                         <span className="sr-only">LinkedIn</span>
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                       </div>
                     </div>
                  </div>
                </motion.div>

                {/* Form */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-800"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="name" 
                            name="name" 
                            placeholder="John Doe" 
                            className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            value={formData.name}
                            onChange={handleChange}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" /> {errors.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="john@example.com" 
                            className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" /> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                      <Input 
                        id="subject" 
                        name="subject" 
                        placeholder="How can we help?" 
                        className={errors.subject ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        value={formData.subject}
                        onChange={handleChange}
                      />
                      {errors.subject && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" /> {errors.subject}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        placeholder="Tell us more about your inquiry..." 
                        rows={6}
                        className={`resize-none ${errors.message ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        value={formData.message}
                        onChange={handleChange}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" /> {errors.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto px-8 bg-violet-600 hover:bg-violet-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactFormPage;
