import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { 
  Database, 
  Share2, 
  Shield, 
  Cookie, 
  Eye, 
  Lock,
  UserCheck,
  Globe,
  Bell,
  ChevronDown,
  ChevronUp,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

const privacyData = [
  {
    id: 'information-collection',
    icon: Database,
    title: 'Information We Collect',
    summary: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
    fullContent: `We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes:

• Account Information: When you register for an account, we collect your name, email address, password, and optionally your profile picture and phone number.

• Payment Information: If you make a purchase, we collect payment card numbers, bank account information, and billing address. Payment processing is handled by our secure third-party payment processors.

• Meeting Data: We collect meeting recordings, transcriptions, and notes that you create using our services. This content belongs to you and is stored securely.

• Usage Information: We automatically collect information about how you interact with our services, including the features you use, the actions you take, and the time and duration of your activities.

• Device Information: We collect information about the device you use to access our services, including hardware model, operating system, unique device identifiers, and mobile network information.

• Log Information: We collect log files that record the time of access, pages viewed, IP address, and referring URL.`
  },
  {
    id: 'information-use',
    icon: Eye,
    title: 'How We Use Your Information',
    summary: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.',
    fullContent: `We use the information we collect for the following purposes:

• Provide Services: To provide, maintain, and improve our services, including to process transactions, send you related information, and provide customer support.

• Personalization: To personalize your experience and provide content and features that match your profile and interests.

• Communication: To send you technical notices, updates, security alerts, and support messages. We may also send promotional communications, which you can opt out of at any time.

• Analytics: To monitor and analyze trends, usage, and activities in connection with our services to improve user experience and service performance.

• AI Processing: To process your meeting recordings and generate transcriptions, summaries, and insights using our AI technology. This processing is done securely and your data is not used to train our AI models without your explicit consent.

• Security: To detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities, and to protect the rights and property of Jiffix and others.

• Legal Compliance: To comply with legal obligations and respond to lawful requests from public authorities.`
  },
  {
    id: 'information-sharing',
    icon: Share2,
    title: 'Information Sharing',
    summary: 'We do not sell your personal information. We share information only in limited circumstances with your consent or as required by law.',
    fullContent: `We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes. We may share your information in the following limited circumstances:

• With Your Consent: We may share information when you give us explicit permission to do so.

• Service Providers: We share information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting, customer service, and marketing assistance. These providers are contractually obligated to protect your information.

• Business Transfers: If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.

• Legal Requirements: We may disclose information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).

• Protection of Rights: We may disclose information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, situations involving potential threats to the safety of any person, or as evidence in litigation.

• Aggregated Data: We may share aggregated, non-personally identifiable information publicly and with our partners. This data cannot be used to identify you personally.`
  },
  {
    id: 'data-security',
    icon: Shield,
    title: 'Data Security',
    summary: 'We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, or destruction.',
    fullContent: `We take the security of your personal information seriously and implement appropriate technical and organizational measures to protect it:

• Encryption: All data transmitted between your device and our servers is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 encryption.

• Access Controls: We implement strict access controls to ensure that only authorized personnel can access your personal information, and only on a need-to-know basis.

• Infrastructure Security: Our services are hosted on secure cloud infrastructure with regular security audits, penetration testing, and vulnerability assessments.

• Employee Training: All employees undergo security awareness training and are bound by confidentiality obligations.

• Incident Response: We have established procedures for detecting, reporting, and responding to security incidents. In the event of a data breach, we will notify affected users in accordance with applicable laws.

• Data Backup: We maintain regular backups of your data to prevent loss and ensure business continuity.

• Compliance: We comply with industry standards including SOC 2 Type II and GDPR requirements.

While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`
  },
  {
    id: 'cookies-tracking',
    icon: Cookie,
    title: 'Cookies and Tracking Technologies',
    summary: 'We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize your experience.',
    fullContent: `We use cookies and similar tracking technologies to collect and use personal information about you. These technologies help us understand how you use our services and enable certain features:

• Essential Cookies: These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you, such as logging in or filling in forms.

• Performance Cookies: These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.

• Functional Cookies: These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.

• Targeting Cookies: These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.

• Analytics: We use Google Analytics and similar services to understand how visitors interact with our website. You can opt out of Google Analytics by installing the Google Analytics opt-out browser add-on.

You can control and manage cookies in your browser settings. Please note that removing or blocking cookies may impact your user experience and some features may not function properly.`
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: 'Your Rights and Choices',
    summary: 'You have the right to access, correct, delete, or export your personal data. You can also opt out of certain data collection and marketing communications.',
    fullContent: `Depending on your location, you may have certain rights regarding your personal information:

• Access: You have the right to request a copy of the personal information we hold about you.

• Correction: You have the right to request that we correct any inaccurate or incomplete personal information.

• Deletion: You have the right to request that we delete your personal information, subject to certain exceptions provided by law.

• Data Portability: You have the right to receive your personal information in a structured, commonly used, and machine-readable format, and to transmit that data to another controller.

• Opt-Out: You can opt out of receiving promotional emails by clicking the "unsubscribe" link in any email. You may also opt out of certain data collection by adjusting your account settings.

• Restrict Processing: You have the right to request that we restrict the processing of your personal information in certain circumstances.

• Object: You have the right to object to our processing of your personal information in certain circumstances.

• Withdraw Consent: Where we rely on your consent to process your personal information, you have the right to withdraw that consent at any time.

To exercise any of these rights, please contact us at privacy@jiffix.ca. We will respond to your request within 30 days.`
  },
  {
    id: 'data-retention',
    icon: Lock,
    title: 'Data Retention',
    summary: 'We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy.',
    fullContent: `We retain your personal information for as long as necessary to fulfill the purposes for which it was collected and to comply with our legal obligations:

• Account Data: We retain your account information for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except as required by law.

• Meeting Data: Recordings, transcriptions, and notes are retained according to your account settings. Free accounts have limited retention periods, while paid accounts can retain data indefinitely.

• Usage Data: We retain usage data for up to 24 months for analytics purposes, after which it is anonymized or deleted.

• Payment Records: We retain payment transaction records for 7 years to comply with accounting and tax regulations.

• Legal Hold: If we are involved in litigation or a government investigation, we may be required to retain your information beyond our standard retention periods.

• Backup Data: Backup copies may be retained for up to 90 days after deletion from our primary systems.

You can request deletion of your data at any time by contacting us or through your account settings.`
  },
  {
    id: 'international-transfers',
    icon: Globe,
    title: 'International Data Transfers',
    summary: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.',
    fullContent: `Jiffix is based in Canada, and we process and store information in Canada and other countries. Your information may be transferred to, and processed in, countries other than the country in which you reside:

• Transfer Mechanisms: When we transfer personal information outside of the European Economic Area (EEA), UK, or Switzerland, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.

• Privacy Shield: While the EU-US Privacy Shield framework is no longer valid for transfers, we have implemented alternative transfer mechanisms to ensure continued compliance.

• Data Localization: For certain enterprise customers, we offer data localization options to keep your data within specific geographic regions.

• Adequacy Decisions: We may rely on adequacy decisions issued by relevant authorities when transferring data to countries deemed to provide adequate protection.

• Your Consent: In some cases, we may transfer your data based on your explicit consent.

By using our services, you consent to the transfer of your information to Canada and other countries which may have different data protection rules than your country. We will take steps to ensure that your information receives an adequate level of protection in the jurisdictions in which we process it.`
  },
  {
    id: 'policy-updates',
    icon: Bell,
    title: 'Changes to This Policy',
    summary: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through our services.',
    fullContent: `We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors:

• Notification: If we make material changes to this policy, we will notify you by email (sent to the email address associated with your account) or by means of a notice on our website prior to the change becoming effective.

• Review: We encourage you to periodically review this page for the latest information on our privacy practices. Your continued use of our services after the effective date of the revised policy constitutes your acceptance of the changes.

• Version History: We maintain a version history of this policy, which you can request by contacting us.

• Material Changes: Material changes include any changes that affect the way we collect, use, or share your personal information, or changes to your rights under this policy.

• Effective Date: The "Last Updated" date at the top of this policy indicates when the policy was last revised.

If you disagree with any changes to this policy, you should stop using our services and delete your account. Your continued use of our services after the changes take effect constitutes your acceptance of the revised policy.

For questions about this policy, please contact us at privacy@jiffix.ca.`
  }
];

const Privacy = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('information-collection');

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
        <title>Privacy Policy - Munal AI</title>
      </Helmet>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-indigo-100 text-lg">Last Updated: March 3, 2026</p>
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
                  {privacyData.map((section, index) => (
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
                Your privacy is important to us. This Privacy Policy explains how Jiffix Inc. (&ldquo;Jiffix&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your personal information when you use Munal AI services.
              </p>

              <div className="space-y-4">
                {privacyData.map((section, index) => {
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
                                    <p key={pIdx} className="text-gray-600 dark:text-gray-400 mb-3 last:mb-0 whitespace-pre-line">
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us About Privacy</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  If you have any questions about this Privacy Policy or our data practices, please contact our Privacy Team:
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Email: <a href="mailto:privacy@jiffix.ca" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacy@jiffix.ca</a>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Address: Jiffix Inc., 123 Innovation Drive, Toronto, ON M5V 1A1, Canada
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default Privacy;
