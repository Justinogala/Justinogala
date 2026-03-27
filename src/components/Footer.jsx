import React from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Github, Twitter, Linkedin, Slack, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { contactConfig } from '@/config/contactConfig';

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors duration-300 block py-1",
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
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 pt-16 pb-8" data-testid="footer">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-5">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300">
                M
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Munal</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              AI-powered meeting companion for modern teams. Capture, analyze, and collaborate seamlessly.
            </p>
            <div className="flex space-x-3">
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

          {/* Product */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-0.5">
              <FooterLink to="/features/overview">Features Overview</FooterLink>
              <FooterLink to="/features/transcriptions">AI Transcriptions</FooterLink>
              <FooterLink to="/features/meetings">Meetings</FooterLink>
              <FooterLink to="/features/chat-messaging">Chat & Messaging</FooterLink>
              <FooterLink to="/features/esignature">eSignature</FooterLink>
              <FooterLink to="/features/shifts">Shift Management</FooterLink>
              <FooterLink to="/features/calendar-integration">Calendar Sync</FooterLink>
              <FooterLink to="/features/analytics">Analytics</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Use Cases</h4>
            <ul className="space-y-0.5">
              <FooterLink to="/use-cases/healthcare">Healthcare</FooterLink>
              <FooterLink to="/use-cases/education">Education</FooterLink>
              <FooterLink to="/use-cases/government">Government</FooterLink>
              <FooterLink to="/use-cases/legal">Legal & Compliance</FooterLink>
              <FooterLink to="/use-cases/finance">Finance</FooterLink>
              <FooterLink to="/use-cases/sales">Sales Teams</FooterLink>
              <FooterLink to="/use-cases/engineering">Engineering</FooterLink>
              <FooterLink to="/use-cases">All Use Cases</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Resources</h4>
            <ul className="space-y-0.5">
              <FooterLink to="/resources/blog">Blog & Insights</FooterLink>
              <FooterLink to="/resources/docs">Documentation</FooterLink>
              <FooterLink to="/resources/api">API Reference</FooterLink>
              <FooterLink to="/resources/community">Community</FooterLink>
              <FooterLink to="/support">Support Center</FooterLink>
              <FooterLink to="/resources">All Resources</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-0.5">
              <FooterLink to="/company/about">About Us</FooterLink>
              <FooterLink to="/company/careers">Careers</FooterLink>
              <FooterLink to="/company/press">Press</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>

            <h4 className="font-bold text-gray-900 dark:text-white mb-3 mt-6 text-sm">Legal</h4>
            <ul className="space-y-0.5">
              <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/legal/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-8 mb-8">
          <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-500" />
              {contactConfig.address}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-500" />
              {contactConfig.phone}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-500" />
              {contactConfig.email}
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Munal. All rights reserved.
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
