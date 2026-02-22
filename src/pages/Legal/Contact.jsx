
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { MapPin, Phone, Mail } from 'lucide-react';
import { contactConfig } from '@/config/contactConfig';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "We'll get back to you shortly!",
    });
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <PageTransition>
      <Helmet><title>Contact Us - EchoNote AI</title></Helmet>
      <Header />
      
      {/* Custom Hero with Animated Background */}
      <section className="relative py-20 md:py-32 overflow-hidden flex items-center justify-center text-center">
        <AnimatedHeroBackground 
          gradientFrom="from-green-500" 
          gradientTo="to-purple-600"
        />
        <div className="container relative z-10 px-4">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading text-text-primary">Get in Touch</h1>
           <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">We'd love to hear from you.</p>
        </div>
      </section>
      
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Contact Information Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Have questions about Munal? Reach out to us directly or fill out the form, and our team will get back to you within 24 hours.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Our Office</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {contactConfig.address}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactConfig.phone}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Mon-Fri from 9am to 6pm EST</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactConfig.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form Side */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Name</label>
                  <Input 
                     required 
                     placeholder="John Doe"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="bg-bg-secondary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Email</label>
                  <Input 
                     type="email" 
                     required 
                     placeholder="john@example.com"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className="bg-bg-secondary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Message</label>
                  <textarea 
                    className="w-full min-h-[150px] p-3 rounded-md bg-bg-secondary border border-border focus:ring-2 focus:ring-accent outline-none text-text-primary"
                    required
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white">Send Message</Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
      <Footer />
    </PageTransition>
  );
};

export default Contact;
