import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { 
  Stamp,
  FileCheck,
  Ban,
  Scale,
  BookOpen,
  AlertTriangle,
  Globe,
  Mail,
  ChevronDown,
  ChevronUp,
  List,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const trademarkSections = [
  {
    id: 'ownership',
    icon: Stamp,
    title: 'Trademark Ownership',
    summary: 'Munal, Munal AI, and associated logos are trademarks of Munal AI Inc. All trademarks are protected under applicable intellectual property laws.',
    fullContent: `The following trademarks, service marks, and trade names are owned by Munal AI Inc. and are protected under Canadian, United States, and international trademark laws:

- Munal (word mark)
- Munal AI (word mark)
- The Munal "M" Logo (design mark)
- The Munal AI gradient icon (design mark)
- "Your AI Meeting Companion" (tagline)
- "Smarter Meetings, Better Outcomes" (tagline)

These marks are registered or pending registration with the Canadian Intellectual Property Office (CIPO) and the United States Patent and Trademark Office (USPTO). Use of these marks without prior written authorization from Munal AI Inc. is strictly prohibited.

All trademarks not owned by Munal AI Inc. that appear on the Munal AI website or in our materials are the property of their respective owners. Their inclusion does not imply any affiliation with, or endorsement by, Munal AI Inc.`
  },
  {
    id: 'permitted-use',
    icon: FileCheck,
    title: 'Permitted Uses',
    summary: 'You may reference Munal AI trademarks for informational, editorial, or descriptive purposes provided you follow our usage guidelines.',
    fullContent: `Munal AI Inc. permits limited use of Munal AI trademarks under the following conditions:

- Descriptive Reference: You may use "Munal" or "Munal AI" in plain text to truthfully refer to or describe Munal AI products and services. For example: "This application integrates with Munal AI for meeting transcription."

- Editorial Use: Journalists, bloggers, and reviewers may use our trademarks in articles, reviews, and commentary about Munal AI, provided the usage is truthful, non-misleading, and does not imply sponsorship or endorsement.

- Academic & Research: Researchers and educators may reference our trademarks in academic papers, presentations, and educational materials.

- Partner & Integration References: Approved partners and integration developers may reference Munal AI trademarks in their documentation, provided they have executed a partnership or integration agreement.

In all permitted uses, you must:
  1. Use the trademark as an adjective followed by a generic noun (e.g., "Munal AI platform," not just "Munal").
  2. Not alter the trademark in any way (no abbreviations, translations, or modifications).
  3. Include an appropriate trademark attribution notice.
  4. Not use the trademark in a way that suggests Munal AI Inc. sponsors or endorses your product or service.`
  },
  {
    id: 'prohibited-use',
    icon: Ban,
    title: 'Prohibited Uses',
    summary: 'You may not use Munal AI trademarks in ways that could confuse customers, imply false endorsement, or damage the reputation of the brand.',
    fullContent: `The following uses of Munal AI trademarks are expressly prohibited without prior written consent from Munal AI Inc.:

- Company or Product Names: You may not incorporate "Munal," "Munal AI," or any confusingly similar variation into your own company name, product name, service name, domain name, or social media handle.

- Logos and Design Marks: You may not reproduce, modify, or use the Munal AI logos or design marks without explicit written authorization. This includes creating derivative works based on our logos.

- Misleading Association: You may not use our trademarks in any manner that suggests partnership, sponsorship, endorsement, or affiliation with Munal AI Inc. unless such a relationship exists and is documented.

- Domain Names: Registering domain names that include "Munal" or "Munal AI" (e.g., munal-tools.com, munalai-alternative.com) is prohibited.

- App Store Listings: You may not use our trademarks in the title, subtitle, or keyword fields of app store listings without authorization.

- Merchandise: Creating merchandise (t-shirts, stickers, promotional items) bearing Munal AI trademarks without written permission is prohibited.

- Disparagement: You may not use our trademarks in any manner that is derogatory, defamatory, obscene, or otherwise objectionable, or that damages the goodwill associated with our marks.`
  },
  {
    id: 'logo-guidelines',
    icon: BookOpen,
    title: 'Logo & Brand Guidelines',
    summary: 'When authorized to use the Munal AI logo, strict spacing, sizing, and color rules must be followed to maintain brand integrity.',
    fullContent: `If you have received written authorization to use the Munal AI logo, the following guidelines must be observed:

- Clear Space: Maintain a minimum clear space around the logo equal to the height of the "M" in the Munal wordmark. No other visual elements should intrude into this space.

- Minimum Size: The logo should not be reproduced at a width smaller than 80 pixels for digital use or 20mm for print.

- Color Versions: Use only the approved color versions of the logo:
  • Full color on light backgrounds (gradient violet-to-purple "M" icon with dark wordmark)
  • White version on dark backgrounds
  • Single-color black version for monochrome contexts

- Do Not:
  • Rotate, skew, or distort the logo
  • Change the colors or gradient of the logo
  • Add drop shadows, outlines, or other effects
  • Place the logo on busy or low-contrast backgrounds
  • Animate the logo without written approval
  • Separate the "M" icon from the wordmark unless specifically authorized

For press or media use, approved logo files and brand assets are available on our Press page. Contact press@munal.ai for additional formats or use cases.`
  },
  {
    id: 'third-party',
    icon: Globe,
    title: 'Third-Party Trademarks',
    summary: 'All third-party trademarks, logos, and brand names appearing on the Munal AI website belong to their respective owners and are used for identification purposes only.',
    fullContent: `Munal AI integrates with and references numerous third-party products and services. All third-party trademarks, service marks, trade names, logos, and brand names are the property of their respective owners. Their use on the Munal AI website and in our materials is for identification and informational purposes only and does not imply endorsement.

Third-party marks referenced include, but are not limited to:

- Microsoft, Microsoft Teams, Microsoft 365, Outlook — trademarks of Microsoft Corporation
- Google, Google Calendar, Google Meet, Google Workspace — trademarks of Google LLC
- Zoom, Zoom Workplace — trademarks of Zoom Video Communications, Inc.
- Slack — trademark of Salesforce, Inc.
- Apple, Safari, macOS — trademarks of Apple Inc.
- Stripe — trademark of Stripe, Inc.

Munal AI Inc. is not affiliated with, sponsored by, or endorsed by any of these companies unless explicitly stated in a partnership announcement. If you are a trademark owner and believe your mark is being used improperly on our platform, please contact us at legal@munal.ai.`
  },
  {
    id: 'enforcement',
    icon: Scale,
    title: 'Enforcement & Reporting',
    summary: 'Munal AI Inc. actively monitors and enforces its trademark rights. If you encounter unauthorized use of Munal AI trademarks, please report it to our legal team.',
    fullContent: `Munal AI Inc. takes the protection of its intellectual property seriously and actively monitors for unauthorized use of its trademarks:

- Monitoring: We use automated tools and periodic manual reviews to identify unauthorized use of Munal AI trademarks across the internet, including websites, social media, app stores, and domain registrations.

- Cease & Desist: If unauthorized use is identified, Munal AI Inc. will issue a cease-and-desist notice requesting immediate removal or correction of the infringing use.

- Legal Action: Continued unauthorized use after notification may result in legal proceedings under applicable trademark laws, including claims for injunctive relief, damages, and recovery of legal fees.

- UDRP: For domain name disputes, Munal AI Inc. may file complaints under the Uniform Domain-Name Dispute-Resolution Policy (UDRP) with an approved dispute resolution provider.

Reporting Trademark Misuse:
If you encounter what you believe to be unauthorized or improper use of Munal AI trademarks, we appreciate your help. Please report it to:

  Email: legal@munal.ai
  Subject line: "Trademark Concern — [Brief Description]"
  Include: The URL or location of the suspected misuse, a screenshot if possible, and a brief description of the concern.

We review all reports and take appropriate action in a timely manner. We may follow up with you for additional information if needed.`
  },
  {
    id: 'open-source',
    icon: AlertTriangle,
    title: 'Open Source & Community Projects',
    summary: 'Community projects and open-source integrations must follow specific naming conventions and may not use Munal AI trademarks without permission.',
    fullContent: `We support and encourage the open-source and developer community. However, the use of Munal AI trademarks in open-source or community projects is subject to the following rules:

- Naming: Open-source projects that integrate with or extend Munal AI should use descriptive names that do not include "Munal" or "Munal AI" as part of the project name. Instead, use phrases like "for Munal AI" or "compatible with Munal AI."
  • Acceptable: "Meeting Notes Exporter for Munal AI"
  • Not Acceptable: "Munal Exporter" or "MunalConnect"

- README & Documentation: You may reference Munal AI trademarks in your project's README, documentation, and descriptions to explain the project's purpose and compatibility.

- Logos: Do not include the Munal AI logo in your project's repository, assets, or distribution without explicit written authorization.

- Not Official: Community projects must clearly state that they are not official Munal AI products and are not endorsed by Munal AI Inc., unless such endorsement has been formally granted.

For questions about using Munal AI trademarks in open-source or community projects, contact devrel@munal.ai before publishing.`
  }
];

const Trademarks = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('ownership');

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    setActiveSection(id);
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Trademarks - Munal AI</title>
        <meta name="description" content="Munal AI trademark usage guidelines. Learn about permitted and prohibited uses of the Munal brand, logos, and trademarks." />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Stamp className="w-4 h-4 text-slate-300" />
            <span className="text-slate-200 text-sm font-medium">Intellectual Property</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="trademarks-title">Trademarks</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Guidelines for the proper use of Munal AI trademarks, logos, and brand assets owned by Munal AI Inc.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
                  <List className="w-5 h-5" />
                  <span>Sections</span>
                </div>
                <nav className="space-y-1">
                  {trademarkSections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        activeSection === section.id
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-l-2 border-slate-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                      data-testid={`trademark-nav-${section.id}`}
                    >
                      {index + 1}. {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 max-w-3xl">
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                This page sets forth the guidelines for use of Munal AI Inc. trademarks, including the Munal and Munal AI names, logos, and associated brand elements. These guidelines protect both the integrity of our brand and the trust of our users and partners.
              </p>

              {/* Quick Reference Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acceptable
                    </p>
                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <li>&ldquo;Compatible with Munal AI&rdquo;</li>
                      <li>&ldquo;Integrates with the Munal AI platform&rdquo;</li>
                      <li>&ldquo;Reviewed: Munal AI Transcription&rdquo;</li>
                      <li>&ldquo;Built for the Munal AI ecosystem&rdquo;</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Not Acceptable
                    </p>
                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <li>&ldquo;MunalConnect&rdquo; (product name)</li>
                      <li>&ldquo;Powered by Munal&rdquo; (implies endorsement)</li>
                      <li>&ldquo;munal-tools.com&rdquo; (domain registration)</li>
                      <li>Using modified Munal logos</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {trademarkSections.map((section, index) => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections[section.id];

                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-slate-400 dark:border-slate-600 overflow-hidden scroll-mt-24"
                      data-testid={`trademark-section-${section.id}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {index + 1}. {section.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {section.summary}
                            </p>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {section.fullContent.split('\n\n').map((p, i) => (
                                    <p key={i} className="text-gray-600 dark:text-gray-400 mb-3 last:mb-0 whitespace-pre-line text-sm">
                                      {p}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => toggleSection(section.id)}
                              className="mt-3 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                              {isExpanded ? 'Show Less' : 'Read Full Section'}
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact */}
              <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trademark Inquiries</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      For questions about trademark usage, brand asset requests, partnership guidelines, or to report misuse, please contact our legal team:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        General: <a href="mailto:legal@munal.ai" className="text-slate-700 dark:text-slate-300 hover:underline font-medium">legal@munal.ai</a>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Press & Media: <a href="mailto:press@munal.ai" className="text-slate-700 dark:text-slate-300 hover:underline font-medium">press@munal.ai</a>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Developer Relations: <a href="mailto:devrel@munal.ai" className="text-slate-700 dark:text-slate-300 hover:underline font-medium">devrel@munal.ai</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribution notice */}
              <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-center">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  &copy; {new Date().getFullYear()} Munal AI Inc. All rights reserved. Munal, Munal AI, and the Munal logo are trademarks of Munal AI Inc.
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

export default Trademarks;
