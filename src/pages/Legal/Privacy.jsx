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
    summary: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.',
    fullContent: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes:

• Account Information: When you register for an account, we collect your name, email address, password, and optionally your profile picture and phone number.

• Organization Information: If you create or join an organization, we collect the organization name, domain, and team member details you provide.

• Meeting Data: We collect meeting recordings, transcriptions, summaries, and notes that you create using our services. This content belongs to you and is stored securely.

• Document Data: Files you upload to our Document Hub (PDFs, Word documents, signatures, converted files) are stored on our servers to provide our services.

• Usage Information: We automatically collect information about how you interact with our services, including the features you use, the actions you take, and the time and duration of your activities.

• Device Information: We collect information about the device you use to access our services, including hardware model, operating system, unique device identifiers, and mobile network information.

• Mobile App Data: When using our mobile app, we may collect additional information including device tokens for push notifications, camera access for document scanning, and local storage data for offline functionality.

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

• Push Notifications: To send you timely notifications about meetings, workspace updates, and important alerts through our mobile app.

• Security: To detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities, and to protect the rights and property of Munal AI and others.

• Two-Factor Authentication: To verify your identity and protect your account using email-based verification codes.

• Legal Compliance: To comply with legal obligations and respond to lawful requests from public authorities.`
  },
  {
    id: 'information-sharing',
    icon: Share2,
    title: 'Information Sharing',
    summary: 'We do not sell your personal information. We share information only in limited circumstances with your consent or as required by law.',
    fullContent: `We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes. We may share your information in the following limited circumstances:

• With Your Consent: We may share information when you give us explicit permission to do so.

• Within Your Organization: If you are part of an organization on Munal AI, workspace content and meeting data may be shared with other members of your organization based on permissions set by your administrators.

• Service Providers: We share information with third-party service providers who perform services on our behalf, such as AI processing (OpenAI), email delivery (Resend), hosting, and data storage. These providers are contractually obligated to protect your information.

• Business Transfers: If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.

• Legal Requirements: We may disclose information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).

• Aggregated Data: We may share aggregated, non-personally identifiable information publicly and with our partners. This data cannot be used to identify you personally.`
  },
  {
    id: 'data-security',
    icon: Shield,
    title: 'Data Security',
    summary: 'We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, or destruction.',
    fullContent: `We take the security of your personal information seriously and implement appropriate technical and organizational measures to protect it:

• Encryption: All data transmitted between your device and our servers is encrypted using HTTPS/TLS. Data at rest is encrypted using industry-standard encryption.

• Two-Factor Authentication: We offer and encourage two-factor authentication (2FA) for all accounts, with mandatory 2FA for administrator accounts.

• Access Controls: We implement role-based access controls (Admin, Manager, User) to ensure that only authorized personnel can access appropriate information.

• Session Management: We implement secure session handling with automatic expiry and the ability to manage active sessions.

• Infrastructure Security: Our services are hosted on secure cloud infrastructure with regular security monitoring.

• Mobile Security: Our mobile apps enforce HTTPS-only connections and implement certificate pinning for secure communication.

• Incident Response: We have established procedures for detecting, reporting, and responding to security incidents. In the event of a data breach, we will notify affected users in accordance with applicable laws.

While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`
  },
  {
    id: 'cookies-tracking',
    icon: Cookie,
    title: 'Cookies and Tracking Technologies',
    summary: 'We use cookies and similar tracking technologies to collect information about your browsing activities and to personalize your experience.',
    fullContent: `We use cookies and similar tracking technologies to collect and use personal information about you:

• Essential Cookies: These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you, such as logging in or filling in forms.

• Performance Cookies: These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.

• Functional Cookies: These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.

• Mobile App Storage: Our mobile apps use local storage and secure device storage to maintain your session and cache frequently accessed data for better performance.

You can control and manage cookies in your browser settings or through our cookie preferences panel. You can also manage notification preferences for our mobile app through your device settings.`
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: 'Your Rights and Choices',
    summary: 'You have the right to access, correct, delete, or export your personal data. You can also opt out of certain data collection and marketing communications.',
    fullContent: `Depending on your location, you may have certain rights regarding your personal information:

• Access: You have the right to request a copy of the personal information we hold about you.

• Correction: You have the right to request that we correct any inaccurate or incomplete personal information.

• Deletion: You have the right to request that we delete your personal information, subject to certain exceptions provided by law. You can delete your account through Settings.

• Data Portability: You have the right to export your meeting data, documents, and notes in standard formats.

• Push Notification Opt-Out: You can disable push notifications at any time through your device settings or within the Munal AI app settings.

• Camera & Microphone: You can revoke camera and microphone permissions at any time through your device settings.

• Opt-Out: You can opt out of receiving promotional emails by clicking the "unsubscribe" link in any email.

• Withdraw Consent: Where we rely on your consent to process your personal information, you have the right to withdraw that consent at any time.

To exercise any of these rights, please contact us at privacy@munal.ai. We will respond to your request within 30 days.`
  },
  {
    id: 'data-retention',
    icon: Lock,
    title: 'Data Retention',
    summary: 'We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy.',
    fullContent: `We retain your personal information for as long as necessary to fulfill the purposes for which it was collected:

• Account Data: We retain your account information for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except as required by law.

• Meeting Data: Recordings, transcriptions, and notes are retained according to your account settings and plan.

• Document Data: Files uploaded to Document Hub, converted files, and e-signatures are retained until you delete them or your account is closed.

• Conversion History: File conversion records are retained for 90 days to enable re-downloads, then automatically purged.

• Device Tokens: Mobile push notification tokens are retained while your account is active and removed upon logout or account deletion.

• Usage Data: We retain usage data for up to 24 months for analytics purposes, after which it is anonymized or deleted.

You can request deletion of your data at any time by contacting us or through your account settings.`
  },
  {
    id: 'international-transfers',
    icon: Globe,
    title: 'International Data Transfers',
    summary: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.',
    fullContent: `Munal AI processes and stores information on secure cloud infrastructure. Your information may be transferred to, and processed in, countries other than the country in which you reside:

• Transfer Mechanisms: When we transfer personal information internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or equivalent mechanisms.

• AI Processing: Meeting transcription and AI features are processed through our AI service providers, which may involve international data transfer. All transfers are encrypted and governed by data processing agreements.

• By using our services, you consent to the transfer of your information as described in this policy. We will take steps to ensure that your information receives an adequate level of protection in the jurisdictions in which we process it.`
  },
  {
    id: 'policy-updates',
    icon: Bell,
    title: 'Changes to This Policy',
    summary: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through our services.',
    fullContent: `We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements:

• Notification: If we make material changes to this policy, we will notify you by email or through a notification in our app prior to the change becoming effective.

• Review: We encourage you to periodically review this page for the latest information on our privacy practices.

• Material Changes: Material changes include any changes that affect the way we collect, use, or share your personal information.

• Effective Date: The "Last Updated" date at the top of this policy indicates when the policy was last revised.

If you disagree with any changes to this policy, you should stop using our services and delete your account.

For questions about this policy, please contact us at privacy@munal.ai.`
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
                Your privacy is important to us. This Privacy Policy explains how Munal AI (&ldquo;Munal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your personal information when you use Munal AI services, including our web application and mobile apps.
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
                    Email: <a href="mailto:privacy@munal.ai" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacy@munal.ai</a>
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
