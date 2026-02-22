
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Github, Twitter, Linkedin, Slack, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { contactConfig } from '@/config/contactConfig';

// Sub-component for individual footer links
const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors duration-300 block py-1.5",
        "text-gray-500 dark:text-gray-400",
        "hover:text-violet-600 dark:hover:text-violet-400"
      )}
    >
      {children}
    </Link>
  </li>
);

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Company Info */}
          <div className="space-y-6 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300">
                M
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
                Munal
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Empowering modern teams to capture every moment, analyze insights, and collaborate seamlessly.
            </p>
            <div className="flex space-x-4">
              {[Github, Twitter, Linkedin, Slack].map((Icon, idx) => (
                <a 
                  key={idx}
                  href="#" 
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Features Column 1 */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Features</h4>
            <ul className="space-y-1">
              <FooterLink to="/features/overview">Overview</FooterLink>
              <FooterLink to="/features/meetings">Meetings</FooterLink>
              <FooterLink to="/features/transcriptions">Transcriptions</FooterLink>
              <FooterLink to="/features/video-conferencing">Video Conferencing</FooterLink>
              <FooterLink to="/features/search">Smart Search</FooterLink>
              <FooterLink to="/features/chat-messaging">Chat & Messaging</FooterLink>
            </ul>
          </div>

           {/* Features Column 2 */}
           <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 md:invisible md:h-0">More Features</h4>
            <ul className="space-y-1 md:mt-12">
              <FooterLink to="/features/teams">Teams</FooterLink>
              <FooterLink to="/features/file-management">File Management</FooterLink>
              <FooterLink to="/features/analytics">Analytics</FooterLink>
              <FooterLink to="/features/voice-chat">Voice Chat</FooterLink>
              <FooterLink to="/features/calendar-integration">Calendar Sync</FooterLink>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
            <ul className="space-y-1">
              <FooterLink to="/company/about">About Us</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
              <FooterLink to="/resources/blog">Blog</FooterLink>
              <FooterLink to="/company/careers">Careers</FooterLink>
              <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/legal/terms">Terms of Service</FooterLink>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-violet-500 shrink-0" />
                <span>{contactConfig.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-violet-500 shrink-0" />
                <span>{contactConfig.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-violet-500 shrink-0" />
                <span>{contactConfig.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Munal. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
