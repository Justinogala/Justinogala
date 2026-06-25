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
              <FooterLink to="/events">Academy & Events</FooterLink>
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
              <FooterLink to="/legal/cookies">Manage Cookies</FooterLink>
              <FooterLink to="/legal/trademarks">Trademarks</FooterLink>
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

            {/* Left — Privacy Choices + Theme + Division label */}
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <Link to="/legal/cookies" className="inline-flex items-center gap-1.5 group" data-testid="footer-privacy-choices">
                <svg width="16" height="16" viewBox="0 0 30 14" className="flex-shrink-0" aria-hidden="true">
                  <rect x="0" y="0" width="30" height="14" rx="7" fill="#2B6CB0" />
                  <circle cx="7" cy="7" r="5" fill="white" />
                  <path d="M5.5 7L6.5 8L8.5 6" stroke="#2B6CB0" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="23" cy="7" r="5" fill="white" />
                  <path d="M21.5 5.5L24.5 8.5M24.5 5.5L21.5 8.5" stroke="#2B6CB0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] text-[#767676] dark:text-gray-500 group-hover:underline">Your Privacy Choices</span>
              </Link>
              <ThemeSwitcher />
              <span className="text-[11px] text-[#767676] dark:text-gray-500">
                Munal AI
              </span>

              {/* Social Media Links */}
              <div className="flex items-center gap-2 ml-2" data-testid="footer-social-links">
                <a href="https://www.facebook.com/1062556010283848" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] dark:text-gray-500 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-all duration-200" aria-label="Facebook" data-testid="footer-facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/justinogala1/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] dark:text-gray-500 hover:bg-[#E4405F]/10 hover:text-[#E4405F] transition-all duration-200" aria-label="Instagram" data-testid="footer-instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://x.com/justinoo2001" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] dark:text-gray-500 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all duration-200" aria-label="X (Twitter)" data-testid="footer-twitter">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/112948994" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] dark:text-gray-500 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-all duration-200" aria-label="LinkedIn" data-testid="footer-linkedin">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://munal.ai/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] dark:text-gray-500 hover:bg-violet-500/10 hover:text-violet-600 transition-all duration-200" aria-label="Website" data-testid="footer-website">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </a>
              </div>
            </div>

            {/* Right — Legal links + Copyright */}
            <div className="flex items-center gap-5 flex-wrap justify-center md:justify-end">
              <Link to="/contact" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-contact-link">Contact Munal</Link>
              <Link to="/legal/privacy" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-privacy-link">Privacy</Link>
              <Link to="/legal/cookies" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-cookies-link">Manage cookies</Link>
              <Link to="/legal/terms" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-terms-link">Terms of use</Link>
              <Link to="/legal/trademarks" className="text-[11px] text-[#767676] dark:text-gray-500 hover:underline transition-colors" data-testid="footer-trademarks-link">Trademarks</Link>
              <span className="text-[11px] text-[#767676] dark:text-gray-500" data-testid="footer-copyright">
                &copy; Munal AI&trade; {new Date().getFullYear()} | Powered by Jiffix Inc.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
