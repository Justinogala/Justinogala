import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { 
  User, 
  CreditCard, 
  XCircle, 
  FileText, 
  Settings, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

const termsData = [
  {
    id: 'account-terms',
    icon: User,
    title: 'Account Terms',
    summary: 'You are responsible for maintaining the security of your account and password. Munal AI cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.',
    fullContent: `You must be 18 years or older to use this Service. You must be a human. Accounts registered by "bots" or other automated methods are not permitted.

You are responsible for maintaining the security of your account and password. Munal AI cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.

You are responsible for all Content posted and activity that occurs under your account (even when Content is posted by others who have accounts under your account).

One person or legal entity may not maintain more than one free account.

You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).

Two-Factor Authentication (2FA): We strongly recommend enabling 2FA on your account. Administrator accounts are required to verify 2FA on every login. Standard user accounts require 2FA verification once every 24 hours.`
  },
  {
    id: 'payment-refunds',
    icon: CreditCard,
    title: 'Payment, Refunds, Upgrading and Downgrading',
    summary: 'A valid credit card is required for paying accounts. The Service is billed in advance on a monthly or annual basis and is non-refundable.',
    fullContent: `A valid credit card is required for paying accounts. Free accounts are not required to provide credit card details.

The Service is billed in advance on a monthly or annual basis and is non-refundable. There will be no refunds or credits for partial months of service, upgrade/downgrade refunds, or refunds for months unused with an open account.

All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities, and you shall be responsible for payment of all such taxes, levies, or duties.

For any upgrade or downgrade in plan level, your credit card will automatically be charged the new rate on your next billing cycle.

Downgrading your Service may cause the loss of Content, features, or capacity of your Account. Munal AI does not accept any liability for such loss.`
  },
  {
    id: 'cancellation-termination',
    icon: XCircle,
    title: 'Cancellation and Termination',
    summary: 'You are solely responsible for properly canceling your account. An email or phone request to cancel your account is not considered cancellation.',
    fullContent: `You are solely responsible for properly canceling your account. An email or phone request to cancel your account is not considered cancellation. You can cancel your account at any time through the Settings page.

All of your Content will be deleted from the Service upon cancellation. This includes meeting data, documents, workspaces, and conversion history. This information cannot be recovered once your account is cancelled.

If you cancel the Service before the end of your current paid up period, your cancellation will take effect at the end of the billing cycle.

Munal AI, in its sole discretion, has the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time.

Such termination of the Service will result in the deactivation or deletion of your Account and the forfeiture and relinquishment of all Content in your Account.`
  },
  {
    id: 'copyright-content',
    icon: FileText,
    title: 'Copyright and Content Ownership',
    summary: 'We claim no intellectual property rights over the material you provide to the Service. Your profile and materials uploaded remain yours.',
    fullContent: `We claim no intellectual property rights over the material you provide to the Service. Your profile and materials uploaded remain yours. This includes meeting recordings, transcriptions, documents, and any other content you create.

Munal AI does not pre-screen Content, but reserves the right to remove any Content that violates these terms or is otherwise objectionable.

You retain ownership of all documents processed through our Document Hub, including PDFs, converted files, and electronically signed documents.

AI-generated content (summaries, transcriptions, action items) created from your data is considered your content and is subject to the same ownership rights.

The look and feel of the Service is copyright Munal AI. All rights reserved. You may not duplicate, copy, or reuse any portion of the HTML/CSS, JavaScript, or visual design elements without express written permission.`
  },
  {
    id: 'general-conditions',
    icon: Settings,
    title: 'General Conditions',
    summary: "Your use of the Service is at your sole risk. The service is provided on an 'as is' and 'as available' basis.",
    fullContent: `Your use of the Service is at your sole risk. The service is provided on an "as is" and "as available" basis.

Support for Munal AI services is available via email and in-app help.

You understand that Munal AI uses third-party vendors and hosting partners to provide the necessary hardware, software, networking, storage, and related technology required to run the Service.

You must not modify, adapt, or hack the Service or modify another website so as to falsely imply that it is associated with Munal AI.

You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without express written permission.

Mobile App: When using our mobile app, you agree to the additional terms imposed by the respective app stores (Google Play Store, Apple App Store). You are responsible for any data charges incurred while using the mobile app.

Verbal, physical, written, or other abuse of any Munal AI customer, employee, or representative will result in immediate account termination.`
  },
  {
    id: 'limitation-liability',
    icon: AlertTriangle,
    title: 'Limitation of Liability',
    summary: 'You expressly understand and agree that Munal AI shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages.',
    fullContent: `You expressly understand and agree that Munal AI shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses, resulting from:

- The use or the inability to use the service
- The cost of procurement of substitute goods and services
- Unauthorized access to or alteration of your transmissions or data
- Statements or conduct of any third party on the service
- AI-generated content that may be inaccurate or incomplete
- Loss of meeting recordings or transcriptions
- Any other matter relating to the service

The failure of Munal AI to exercise or enforce any right or provision of the Terms of Service shall not constitute a waiver of such right or provision.

These Terms of Service constitute the entire agreement between you and Munal AI and govern your use of the Service.

Questions about the Terms of Service should be sent to legal@munal.ai.`
  }
];

const Terms = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('account-terms');

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    setActiveSection(id);
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Terms of Service - Munal AI</title>
      </Helmet>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-indigo-100 text-lg">Last Updated: April 4, 2026</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Table of Contents - Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
                  <List className="w-5 h-5" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-1">
                  {termsData.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        activeSection === section.id
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {index + 1}. {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 max-w-3xl">
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                By accessing or using Munal AI services, including our web application and mobile apps, you agree to be bound by these terms. Please read them carefully.
              </p>

              <div className="space-y-4">
                {termsData.map((section, index) => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections[section.id];
                  
                  return (
                    <div 
                      key={section.id}
                      id={section.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-amber-400 overflow-hidden scroll-mt-24"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {index + 1}. {section.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {section.summary}
                            </p>
                            
                            {/* Expandable Content */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {section.fullContent.split('\n\n').map((paragraph, pIdx) => (
                                    <p key={pIdx} className="text-gray-600 dark:text-gray-400 mb-3 last:mb-0">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Read More Button */}
                            <button
                              onClick={() => toggleSection(section.id)}
                              className="mt-3 inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                              {isExpanded ? 'Show Less' : 'Read Full Section'}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact Section */}
              <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@munal.ai" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    legal@munal.ai
                  </a>
                </p>
              </div>
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default Terms;
