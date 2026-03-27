import React from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { cn } from '@/lib/utils';

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
  >
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800" data-testid="footer">

      {/* Main Footer Links — Microsoft style horizontal rows */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-10 gap-x-8">

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-5">Product</h4>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/features/overview">Features Overview</FooterLink>
              <FooterLink to="/features/transcriptions">AI Transcriptions</FooterLink>
              <FooterLink to="/features/meetings">Meetings</FooterLink>
              <FooterLink to="/features/chat-messaging">Chat & Messaging</FooterLink>
              <FooterLink to="/features/esignature">eSignature</FooterLink>
              <FooterLink to="/features/shifts">Shift Management</FooterLink>
              <FooterLink to="/features/calendar-integration">Calendar Sync</FooterLink>
              <FooterLink to="/features/analytics">Analytics</FooterLink>
              <FooterLink to="/pricing">Pricing</FooterLink>
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-5">Use Cases</h4>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/use-cases/healthcare">Healthcare</FooterLink>
              <FooterLink to="/use-cases/education">Education</FooterLink>
              <FooterLink to="/use-cases/government">Government</FooterLink>
              <FooterLink to="/use-cases/legal">Legal & Compliance</FooterLink>
              <FooterLink to="/use-cases/finance">Finance</FooterLink>
              <FooterLink to="/use-cases/sales">Sales Teams</FooterLink>
              <FooterLink to="/use-cases/engineering">Engineering</FooterLink>
              <FooterLink to="/use-cases">All Use Cases</FooterLink>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-5">Resources</h4>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/resources/blog">Blog & Insights</FooterLink>
              <FooterLink to="/resources/docs">Documentation</FooterLink>
              <FooterLink to="/resources/api">API Reference</FooterLink>
              <FooterLink to="/resources/community">Community</FooterLink>
              <FooterLink to="/support">Support Center</FooterLink>
              <FooterLink to="/resources">All Resources</FooterLink>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-5">Company</h4>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/company/about">About Us</FooterLink>
              <FooterLink to="/company/careers">Careers</FooterLink>
              <FooterLink to="/company/press">Press</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white mb-5">Legal</h4>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/legal/terms">Terms of Service</FooterLink>
              <FooterLink to="/legal/cookies">Cookie Policy</FooterLink>
              <FooterLink to="/legal/security">Security</FooterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar — Microsoft style */}
      <div className="border-t border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Left — Logo + Copyright */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  M
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Munal</span>
              </Link>
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Munal Technologies Inc. All rights reserved.
              </span>
            </div>

            {/* Right — Theme + Legal links */}
            <div className="flex items-center gap-5">
              <Link to="/legal/privacy" className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Terms</Link>
              <Link to="/legal/cookies" className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cookies</Link>
              <Link to="/contact" className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Contact</Link>
              <div className="border-l border-gray-200 dark:border-slate-700 pl-4">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
