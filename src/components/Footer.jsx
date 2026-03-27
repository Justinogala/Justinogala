import React from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-[13px] leading-loose text-[#505050] dark:text-gray-400 hover:underline transition-colors duration-150"
  >
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="bg-[#f2f2f2] dark:bg-slate-950" data-testid="footer">

      {/* Main Footer Links */}
      <div className="max-w-[1600px] mx-auto px-8 lg:px-12 pt-14 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6">

          {/* Product */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-product-heading">Product</h4>
            <div className="flex flex-col">
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
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-usecases-heading">Use Cases</h4>
            <div className="flex flex-col">
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
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-resources-heading">Resources</h4>
            <div className="flex flex-col">
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
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-company-heading">Company</h4>
            <div className="flex flex-col">
              <FooterLink to="/company/about">About Us</FooterLink>
              <FooterLink to="/company/careers">Careers</FooterLink>
              <FooterLink to="/company/press">Press</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-legal-heading">Legal</h4>
            <div className="flex flex-col">
              <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/legal/terms">Terms of Service</FooterLink>
              <FooterLink to="/legal/cookies">Cookie Policy</FooterLink>
              <FooterLink to="/legal/security">Security</FooterLink>
            </div>
          </div>

          {/* Developer */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#333] dark:text-white mb-4" data-testid="footer-developer-heading">Developer</h4>
            <div className="flex flex-col">
              <FooterLink to="/resources/api">API Reference</FooterLink>
              <FooterLink to="/resources/docs">SDK & Docs</FooterLink>
              <FooterLink to="/resources/community">Developer Community</FooterLink>
              <FooterLink to="/support">Developer Support</FooterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#d2d2d2] dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Left — Theme + Division label */}
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <ThemeSwitcher />
              <span className="text-[11px] text-[#767676] dark:text-gray-500">
                Munal AI is a division of Jiffix Inc.
              </span>
            </div>

            {/* Right — Legal links + Copyright */}
            <div className="flex items-center gap-5 flex-wrap justify-center md:justify-end">
              <Link to="/contact" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-contact-link">Contact Munal</Link>
              <Link to="/legal/privacy" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-privacy-link">Privacy</Link>
              <Link to="/legal/cookies" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-cookies-link">Manage cookies</Link>
              <Link to="/legal/terms" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-terms-link">Terms of use</Link>
              <Link to="/legal/security" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-security-link">Trademarks</Link>
              <span className="text-[11px] text-[#767676] dark:text-gray-500" data-testid="footer-copyright">
                &copy; Munal AI {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
