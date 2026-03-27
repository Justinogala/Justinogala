import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import {
  Shield,
  Lock,
  Server,
  Eye,
  AlertTriangle,
  Users,
  FileCheck,
  Globe,
  Database,
  Bell,
  ChevronDown,
  ChevronUp,
  List,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const securitySections = [
  {
    id: 'commitment',
    icon: Shield,
    title: 'Our Security Commitment',
    summary: 'Jiffix Inc. is committed to protecting the confidentiality, integrity, and availability of all data processed through the Munal AI platform.',
    fullContent: `Security is foundational to everything we build at Jiffix Inc. Munal AI is designed, developed, and operated with a security-first mindset. Our commitment extends across every layer of the platform:

- Security by Design: Security requirements are integrated into every phase of our software development lifecycle (SDLC), from architecture review through code review, testing, and deployment.

- Continuous Improvement: We continuously evaluate and improve our security posture through regular audits, penetration testing, vulnerability assessments, and threat modeling.

- Dedicated Security Team: Our security team monitors the platform around the clock and works closely with engineering, operations, and compliance to address emerging threats.

- Transparency: We believe in being transparent about our security practices. This page provides an overview of how we protect your data. For more detailed information, enterprise customers can request our full Security Whitepaper or SOC 2 Type II report.

- Shared Responsibility: While we secure the platform infrastructure and application layers, we also empower our customers with tools and best practices — such as role-based access control, password policies, and session management — to secure their own accounts and data.`
  },
  {
    id: 'encryption',
    icon: Lock,
    title: 'Encryption & Data Protection',
    summary: 'All data is encrypted both in transit and at rest using industry-standard cryptographic protocols. Sensitive fields receive additional field-level encryption.',
    fullContent: `Munal AI employs multiple layers of encryption to protect your data at every stage:

- Encryption in Transit: All data transmitted between your device and our servers is encrypted using TLS 1.3, the latest and most secure version of the Transport Layer Security protocol. This prevents eavesdropping, tampering, and man-in-the-middle attacks.

- Encryption at Rest: Data stored on our servers is encrypted using AES-256 encryption. Database volumes, backups, and snapshots are all encrypted at the storage level.

- Field-Level Encryption: Particularly sensitive data — such as audit log details, personally identifiable information (PII), and security-critical fields — is encrypted at the application level using Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256) before being written to the database.

- Key Management: Encryption keys are managed through a dedicated key management process with strict access controls. Keys are rotated on a regular schedule and are never stored alongside the data they protect.

- Password Security: User passwords are never stored in plaintext. They are hashed using bcrypt with unique salts, making offline brute-force attacks computationally infeasible. Password complexity, length, and expiry policies are configurable by administrators.

- Secure Deletion: When data is deleted by a user or through retention policies, we ensure it is securely purged from primary storage. Backup copies are purged according to our backup retention schedule (typically within 90 days).`
  },
  {
    id: 'infrastructure',
    icon: Server,
    title: 'Infrastructure Security',
    summary: 'Munal AI runs on hardened, containerized cloud infrastructure with network isolation, automated scaling, and continuous monitoring.',
    fullContent: `Our infrastructure is designed for resilience, isolation, and defense-in-depth:

- Cloud Hosting: Munal AI is hosted on enterprise-grade cloud infrastructure with SOC 2, ISO 27001, and CSA STAR certifications. Data centers feature physical security controls including biometric access, 24/7 surveillance, and environmental protections.

- Containerized Architecture: The application runs in isolated containers orchestrated by Kubernetes, ensuring process isolation, automatic scaling, and zero-downtime deployments. Each service runs in its own container with minimal privileges.

- Network Isolation: Backend services are deployed in private networks not directly accessible from the internet. All external traffic passes through load balancers and ingress controllers with DDoS protection and rate limiting.

- Firewall & Security Groups: Strict network security groups and firewall rules restrict traffic to only necessary ports and protocols. All inter-service communication is authenticated and encrypted.

- Automated Patching: Operating system and dependency updates are applied through automated pipelines. Critical security patches are deployed within 24 hours of release.

- Monitoring & Alerting: Infrastructure and application metrics are continuously monitored. Anomalous patterns — such as unusual traffic spikes, failed authentication attempts, or resource exhaustion — trigger automated alerts to our operations team.

- Backup & Disaster Recovery: Automated backups are performed daily with point-in-time recovery capabilities. Backups are encrypted and stored in a geographically separate region. Recovery procedures are tested quarterly.`
  },
  {
    id: 'access-control',
    icon: Users,
    title: 'Access Control & Authentication',
    summary: 'Granular role-based access control (RBAC) with organization scoping, JWT authentication, session management, and configurable security policies.',
    fullContent: `Munal AI provides comprehensive access control mechanisms to ensure only authorized users can access data and functionality:

- Role-Based Access Control (RBAC): The platform supports multiple roles including Super Admin, Admin, Manager, and Member. Each role has a defined set of permissions that control access to modules, data, and administrative functions. Permissions are enforced at both the API and user interface layers.

- Organization Scoping: Data and administrative actions are scoped to the user's organization. Admin and Manager users can only view and manage members within their own organization. Cross-organization data access is prevented at the database query level.

- JWT Authentication: User sessions are managed through JSON Web Tokens (JWT) using the HS256 algorithm. Tokens have a 24-hour expiration and are validated on every API request. Tokens are not stored server-side, reducing the attack surface.

- Session Management: Active sessions can be tracked and revoked by administrators. Configurable session timeout policies automatically terminate idle sessions after a specified period.

- Account Lockout: After a configurable number of failed login attempts, accounts are temporarily locked to prevent brute-force attacks. Lockout duration and threshold are configurable by administrators.

- Password Policies: Administrators can enforce minimum password length, complexity requirements (uppercase, lowercase, numbers, special characters), password expiry intervals, and password history to prevent reuse.

- API Rate Limiting: All API endpoints are protected by rate limiting to prevent abuse, credential stuffing, and denial-of-service attacks.`
  },
  {
    id: 'audit-logging',
    icon: Eye,
    title: 'Audit Logging & Monitoring',
    summary: 'Every significant action is recorded in encrypted, tamper-evident audit logs with full traceability for compliance and forensic analysis.',
    fullContent: `Comprehensive audit logging provides visibility into all platform activity:

- Action Logging: Every significant user and system action is recorded, including logins, data access, permission changes, administrative actions, and configuration modifications. Each log entry includes the user identity, action type, timestamp, IP address, and affected resource.

- Encrypted Audit Details: Sensitive details within audit log entries are encrypted using field-level encryption, ensuring that even database administrators cannot read the raw details without the encryption key.

- Permission Change Tracking: All changes to user roles, module permissions, and organizational assignments are logged with before-and-after snapshots, enabling full reconstruction of the permission history.

- Tamper Evidence: Audit logs are append-only and stored in a dedicated collection with restricted write access. Deletion or modification of audit records is not permitted through application interfaces.

- Retention: Audit logs are retained for a minimum of 12 months for standard accounts and up to 7 years for enterprise accounts, in accordance with applicable regulatory requirements.

- Export & Reporting: Administrators can export audit logs for external analysis, compliance audits, or integration with SIEM (Security Information and Event Management) systems.

- Real-Time Alerts: Critical security events — such as multiple failed login attempts, privilege escalation, or access from unusual locations — can trigger real-time notifications to administrators.`
  },
  {
    id: 'incident-response',
    icon: AlertTriangle,
    title: 'Incident Response',
    summary: 'Jiffix Inc. maintains a formal incident response plan with defined roles, escalation procedures, communication protocols, and post-incident review processes.',
    fullContent: `We are prepared to detect, respond to, and recover from security incidents swiftly and effectively:

- Incident Response Plan: Jiffix Inc. maintains a documented Incident Response Plan (IRP) that defines roles, responsibilities, escalation procedures, and communication protocols for security incidents.

- Detection: Our monitoring systems are configured to detect indicators of compromise, including unauthorized access attempts, data exfiltration patterns, malware signatures, and system anomalies.

- Classification: Incidents are classified by severity (Critical, High, Medium, Low) based on the potential impact to data confidentiality, integrity, and availability. Classification determines the response timeline and escalation path.

- Containment: Upon detection, the immediate priority is to contain the incident to prevent further damage. This may include isolating affected systems, revoking compromised credentials, or blocking malicious IP addresses.

- Investigation: A thorough investigation is conducted to determine the root cause, scope, and impact of the incident. Forensic evidence is preserved for analysis and potential legal proceedings.

- Notification: In the event of a data breach affecting personal information, Jiffix Inc. will notify affected users and relevant regulatory authorities within the timeframes required by applicable laws (typically 72 hours under GDPR, and as soon as feasible under PIPEDA).

- Recovery: Affected systems are restored to a known-good state using verified backups and clean deployments. Additional security controls may be implemented to prevent recurrence.

- Post-Incident Review: Every significant incident is followed by a post-incident review (PIR) to identify lessons learned, update procedures, and implement preventive measures.`
  },
  {
    id: 'compliance',
    icon: FileCheck,
    title: 'Compliance & Certifications',
    summary: 'Munal AI is designed to meet the requirements of major privacy and security frameworks including PIPEDA, GDPR, CCPA, and SOC 2 Type II.',
    fullContent: `Jiffix Inc. is committed to meeting and exceeding industry compliance standards:

- PIPEDA: As a Canadian company, Jiffix Inc. complies with the Personal Information Protection and Electronic Documents Act (PIPEDA), ensuring that personal information is collected, used, and disclosed in accordance with Canadian privacy law.

- Provincial Privacy Laws: We comply with applicable provincial privacy legislation, including Alberta's PIPA, British Columbia's PIPA, and Quebec's Law 25.

- GDPR: For users in the European Economic Area, Munal AI is designed to comply with the General Data Protection Regulation. We support data subject rights including access, rectification, erasure, portability, and restriction of processing.

- CCPA/CPRA: For California residents, we comply with the California Consumer Privacy Act and its successor, the California Privacy Rights Act. Users can exercise their rights through our privacy controls or by contacting our privacy team.

- SOC 2 Type II: Our infrastructure and security controls are audited annually against the SOC 2 Trust Services Criteria (Security, Availability, Confidentiality). Reports are available to enterprise customers under NDA.

- eSignature Compliance: Our electronic signature functionality complies with the Canadian Uniform Electronic Commerce Act (UECA), provincial Electronic Commerce Acts, and is designed to meet the standards of the US ESIGN Act and UETA.

- Data Residency: For organizations with data residency requirements, we offer options to keep data within specific geographic regions. Contact our sales team for details.`
  },
  {
    id: 'data-privacy',
    icon: Database,
    title: 'Data Privacy & Handling',
    summary: 'Your data belongs to you. We do not sell personal information, do not use customer data to train AI models without consent, and provide full data portability.',
    fullContent: `We believe your data is yours, and we treat it accordingly:

- Data Ownership: You retain full ownership of all data you input into Munal AI, including meeting recordings, transcriptions, notes, forms, and documents. We do not claim any intellectual property rights over your content.

- No Data Selling: Jiffix Inc. does not sell, rent, or trade personal information to third parties for marketing or advertising purposes. Period.

- AI Training: Your data is not used to train or improve our AI models without your explicit, informed consent. Meeting transcriptions, recordings, and notes are processed solely to provide the requested service.

- Data Minimization: We collect only the data necessary to provide our services. We do not collect or store data beyond what is required for the functionality you use.

- Data Portability: You can export your data at any time through the platform's export functionality or by contacting our support team. We provide data in standard, machine-readable formats.

- Data Deletion: You can request deletion of your account and associated data at any time. Upon deletion, personal data is removed from primary systems within 30 days. Backup copies are purged within 90 days.

- Sub-Processors: We use a limited number of third-party sub-processors to provide our services (e.g., cloud hosting, email delivery). All sub-processors are contractually bound to protect your data and are regularly reviewed for compliance.

- Data Processing Agreements: Enterprise customers can execute Data Processing Agreements (DPAs) that define the terms of data processing in accordance with applicable regulations.`
  },
  {
    id: 'vulnerability',
    icon: Globe,
    title: 'Vulnerability Management',
    summary: 'We maintain a proactive vulnerability management program including regular scanning, penetration testing, dependency auditing, and a responsible disclosure policy.',
    fullContent: `Proactive vulnerability management is a core part of our security program:

- Vulnerability Scanning: Automated vulnerability scans are performed weekly against our infrastructure and application. Identified vulnerabilities are triaged, prioritized, and remediated according to their severity.

- Penetration Testing: We engage independent third-party security firms to conduct penetration tests at least annually. Findings are remediated and retested to ensure effective resolution.

- Dependency Auditing: Third-party libraries and dependencies are continuously monitored for known vulnerabilities. Critical vulnerabilities in dependencies are patched or mitigated within 48 hours of disclosure.

- Secure Development Practices: Our development team follows secure coding guidelines based on OWASP Top 10 and SANS Top 25. Code reviews include security-focused review criteria, and automated static analysis tools scan for common vulnerability patterns.

- Responsible Disclosure: We welcome reports from security researchers who discover potential vulnerabilities in our platform. If you believe you have found a security vulnerability, please report it to security@jiffix.ca. We commit to acknowledging reports within 48 hours, providing regular status updates, and publicly crediting researchers (with permission) after remediation.

- Bug Bounty: Qualifying vulnerability reports may be eligible for our bug bounty program. Contact security@jiffix.ca for program details and scope.`
  },
  {
    id: 'updates',
    icon: Bell,
    title: 'Security Updates & Communication',
    summary: 'We communicate security updates transparently, notify affected users promptly, and maintain a security changelog for platform changes.',
    fullContent: `We keep our users informed about security matters:

- Security Advisories: When a security issue is identified that may affect our users, we publish a security advisory with details about the issue, affected versions, and recommended actions.

- Breach Notification: In the event of a confirmed data breach, we notify affected users by email within the timeframes required by applicable law. Notifications include a description of the incident, the types of data affected, and recommended protective actions.

- Platform Updates: Security patches and updates are deployed through our continuous deployment pipeline. Critical patches are deployed as soon as they are available and tested. We maintain a changelog of security-relevant platform changes.

- Status Page: Our public status page provides real-time information about platform availability and any ongoing incidents.

- Communication Channels: Security-related communications are delivered through official Jiffix Inc. email addresses (@jiffix.ca). We will never ask for your password or sensitive information via email.

Contact our security team:
  - General Security: security@jiffix.ca
  - Vulnerability Reports: security@jiffix.ca
  - Privacy Inquiries: privacy@jiffix.ca
  - Compliance Requests: legal@jiffix.ca`
  }
];

const SecurityPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('commitment');

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
        <title>Security - Munal AI</title>
        <meta name="description" content="Learn how Munal AI protects your data with encryption, access controls, compliance certifications, and proactive security practices." />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-emerald-200" />
            <span className="text-emerald-100 text-sm font-medium">Trust & Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="security-page-title">Security</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            How Jiffix Inc. protects your data, your privacy, and your trust across the Munal AI platform.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {['SOC 2 Type II', 'PIPEDA', 'GDPR Ready', 'CCPA Compliant', 'TLS 1.3', 'AES-256'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
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
                  {securitySections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        activeSection === section.id
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                      data-testid={`security-nav-${section.id}`}
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
                This page describes the security measures, policies, and practices that Jiffix Inc. employs to protect the Munal AI platform and your data. For additional details, enterprise customers may request our full Security Whitepaper or SOC 2 audit report.
              </p>

              <div className="space-y-4">
                {securitySections.map((section, index) => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections[section.id];

                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 border-emerald-400 overflow-hidden scroll-mt-24"
                      data-testid={`security-section-${section.id}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
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
                              className="mt-3 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
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
              <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Security Inquiries</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  For security questions, vulnerability reports, compliance documentation requests, or to report a security concern:
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Security Team: <a href="mailto:security@jiffix.ca" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">security@jiffix.ca</a>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Privacy Team: <a href="mailto:privacy@jiffix.ca" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">privacy@jiffix.ca</a>
                  </p>
                </div>
              </div>

              {/* Last updated */}
              <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-center">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Last updated: March 2026. This page is reviewed and updated quarterly. &copy; {new Date().getFullYear()} Jiffix Inc. All rights reserved.
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

export default SecurityPage;
