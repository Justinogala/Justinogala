import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { 
  Cookie, 
  BarChart3, 
  Settings2, 
  Target, 
  ShieldCheck, 
  ToggleLeft,
  ToggleRight,
  Info,
  ChevronDown,
  ChevronUp,
  List,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const cookieCategories = [
  {
    id: 'essential',
    icon: ShieldCheck,
    title: 'Strictly Necessary Cookies',
    required: true,
    defaultOn: true,
    summary: 'These cookies are essential for the website to function properly. They enable core features like security, session management, and accessibility. You cannot disable these cookies.',
    fullContent: `Strictly necessary cookies are critical for the basic operation of Munal AI. Without them, the services you have asked for cannot be provided. These cookies include:

- Session Cookies: Maintain your login state and ensure secure access to your account. These expire when you close your browser or after a period of inactivity.

- Security Cookies: Protect against cross-site request forgery (CSRF) attacks and ensure the integrity of form submissions and API requests.

- Load Balancing Cookies: Distribute traffic across our servers to ensure consistent performance and prevent any single server from becoming overwhelmed.

- Cookie Consent Cookie: Remembers your cookie preferences so you are not asked to set them every time you visit.

- Authentication Tokens: Securely identify you after login so you can navigate between pages without re-entering credentials.

These cookies do not collect any personal information for marketing purposes and are exempt from consent requirements under most privacy regulations.`,
    examples: ['munal_session', 'csrf_token', 'cookie_consent', 'auth_token']
  },
  {
    id: 'performance',
    icon: BarChart3,
    title: 'Performance & Analytics Cookies',
    required: false,
    defaultOn: true,
    summary: 'These cookies help us understand how visitors interact with Munal AI by collecting anonymous usage data. They help us improve site performance and user experience.',
    fullContent: `Performance and analytics cookies collect information about how you use Munal AI. All information is aggregated and anonymized, meaning it cannot be used to identify you personally. These cookies help us:

- Page Views & Navigation: Track which pages are visited most frequently, how users navigate between pages, and where users encounter errors. This helps us prioritize improvements.

- Feature Usage: Understand which features are used most often, which workflows are completed successfully, and where users may need additional guidance.

- Load Times: Measure how long pages and features take to load across different devices, browsers, and network conditions so we can optimize performance.

- Error Reporting: Detect and diagnose technical issues, such as JavaScript errors or failed API calls, so our engineering team can fix them quickly.

- A/B Testing: Compare different versions of pages or features to determine which provides a better user experience.

We use privacy-focused analytics tools and ensure that no personally identifiable information (PII) is collected. IP addresses are anonymized before processing.`,
    examples: ['_ga', '_gid', '_munal_perf', 'mp_analytics']
  },
  {
    id: 'functional',
    icon: Settings2,
    title: 'Functional Cookies',
    required: false,
    defaultOn: true,
    summary: 'These cookies enable personalized features like remembering your language preference, theme settings, and display configurations to enhance your experience.',
    fullContent: `Functional cookies allow Munal AI to remember choices you have made and provide enhanced, personalized features. Without these cookies, certain conveniences may not be available:

- Theme Preferences: Remember whether you prefer light mode, dark mode, or system-default so the interface matches your preference on each visit.

- Language & Locale: Store your language and regional format preferences (date formats, number formats, currency) so content is displayed correctly.

- Layout Preferences: Remember dashboard configurations, sidebar collapse states, and other UI customizations you've made.

- Recent Activity: Track recently accessed meetings, documents, and workspaces so they appear in your quick-access panels.

- Notification Settings: Remember which in-app notification types you've chosen to see or dismiss.

- Accessibility Settings: Store preferences for font size, contrast, reduced motion, and screen reader optimizations.

These cookies typically expire after 12 months but are refreshed each time you visit. Disabling functional cookies means the site will work, but you may need to re-enter preferences on each visit.`,
    examples: ['munal_theme', 'munal_locale', 'munal_layout_prefs', 'munal_a11y']
  },
  {
    id: 'targeting',
    icon: Target,
    title: 'Targeting & Advertising Cookies',
    required: false,
    defaultOn: false,
    summary: 'These cookies may be set by our advertising partners to build a profile of your interests and show relevant content on other sites. Munal AI currently does not use advertising cookies.',
    fullContent: `Targeting and advertising cookies are used to deliver content and advertisements that are more relevant to you and your interests. Munal AI currently does not use third-party advertising cookies. However, we reserve the right to introduce them in the future with prior notice:

- Retargeting: If enabled, these cookies would allow us to show you Munal AI advertisements on other websites you visit, based on your previous interactions with our platform.

- Social Media Pixels: If enabled, these cookies would allow social media platforms (LinkedIn, Twitter/X, Facebook) to recognize your visit for the purpose of showing you relevant ads on their platforms.

- Attribution Tracking: These cookies help us understand which marketing channels (search, social, email, referral) led you to Munal AI, so we can invest in the channels that work best.

- Interest Profiling: Third-party cookies may build a profile of your interests based on your browsing behavior across multiple websites.

Currently, all targeting and advertising cookies are disabled by default. If we introduce advertising cookies in the future, you will be notified and given the option to opt out before any such cookies are set. Your choice to decline these cookies will not affect your ability to use Munal AI.`,
    examples: ['_fbp', '_li_track', 'tw_pixel']
  }
];

const ManageCookies = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('essential');
  const [cookiePrefs, setCookiePrefs] = useState({
    essential: true,
    performance: true,
    functional: true,
    targeting: false,
  });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    setActiveSection(id);
  };

  const toggleCookie = (id) => {
    if (id === 'essential') return;
    setCookiePrefs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const savePreferences = () => {
    localStorage.setItem('munal_cookie_prefs', JSON.stringify(cookiePrefs));
    const event = new CustomEvent('cookie-preferences-saved', { detail: cookiePrefs });
    window.dispatchEvent(event);
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Manage Cookies - Munal AI</title>
        <meta name="description" content="Control how Munal AI uses cookies. Manage your preferences for analytics, functional, and targeting cookies." />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Cookie className="w-4 h-4 text-amber-200" />
            <span className="text-amber-100 text-sm font-medium">Cookie Preferences</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="manage-cookies-title">Manage Cookies</h1>
          <p className="text-amber-100 text-lg max-w-2xl mx-auto">
            You are in control. Choose which cookies you allow Munal AI to use. Your preferences are saved locally and respected across all pages.
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
                  <span>Cookie Categories</span>
                </div>
                <nav className="space-y-1">
                  {cookieCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollToSection(cat.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                        activeSection === cat.id
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                      data-testid={`cookie-nav-${cat.id}`}
                    >
                      <span>{cat.title}</span>
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 ml-2",
                        cookiePrefs[cat.id] ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      )} />
                    </button>
                  ))}
                </nav>

                {/* Save button in sidebar */}
                <button
                  onClick={savePreferences}
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                  data-testid="save-cookie-prefs-sidebar"
                >
                  Save Preferences
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Cookies are small text files stored on your device when you visit a website. Munal AI uses cookies to ensure essential functionality, understand how you use our platform, and improve your experience. You can adjust your preferences below at any time.
                </p>
              </div>

              <div className="space-y-4">
                {cookieCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isExpanded = expandedSections[cat.id];
                  const isOn = cookiePrefs[cat.id];

                  return (
                    <div
                      key={cat.id}
                      id={cat.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-amber-400 overflow-hidden scroll-mt-24"
                      data-testid={`cookie-section-${cat.id}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {cat.title}
                              </h2>

                              {/* Toggle */}
                              <button
                                onClick={() => toggleCookie(cat.id)}
                                disabled={cat.required}
                                className={cn(
                                  "flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                  cat.required ? "cursor-not-allowed" : "cursor-pointer",
                                  isOn ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                                )}
                                data-testid={`cookie-toggle-${cat.id}`}
                              >
                                <span className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                  isOn ? "translate-x-6" : "translate-x-1"
                                )} />
                              </button>
                            </div>

                            {cat.required && (
                              <span className="inline-block text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full mb-2">
                                Always Active
                              </span>
                            )}

                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                              {cat.summary}
                            </p>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-4">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {cat.fullContent.split('\n\n').map((p, i) => (
                                    <p key={i} className="text-gray-600 dark:text-gray-400 mb-3 last:mb-0 whitespace-pre-line text-sm">
                                      {p}
                                    </p>
                                  ))}
                                </div>

                                {/* Example cookies */}
                                {cat.examples && (
                                  <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">Example Cookies</p>
                                    <div className="flex flex-wrap gap-2">
                                      {cat.examples.map((ex) => (
                                        <code key={ex} className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                          {ex}
                                        </code>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => toggleSection(cat.id)}
                              className="mt-3 inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 text-sm font-medium hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                            >
                              {isExpanded ? 'Show Less' : 'Read Full Details'}
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save + more info */}
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Save Your Preferences</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your choices are stored locally on your device and apply to this browser.
                  </p>
                </div>
                <button
                  onClick={savePreferences}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                  data-testid="save-cookie-prefs-main"
                >
                  Save Preferences
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How to Manage Cookies in Your Browser</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  In addition to the controls above, most web browsers allow you to manage cookies through their settings. Note that blocking all cookies may impact your experience on Munal AI and other websites.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                    { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
                    { name: 'Apple Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac' },
                    { name: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/manage-cookies-in-microsoft-edge' },
                  ].map((browser) => (
                    <a
                      key={browser.name}
                      href={browser.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {browser.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions About Cookies?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  If you have any questions about how Munal AI uses cookies, please contact our Privacy Team at{' '}
                  <a href="mailto:privacy@munal.ai" className="text-amber-700 dark:text-amber-400 hover:underline">privacy@munal.ai</a>.
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

export default ManageCookies;
