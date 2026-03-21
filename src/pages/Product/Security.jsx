
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, KeyRound, Eye, FileText, Server, Users, Clock,
  ShieldCheck, Fingerprint, Globe, AlertTriangle, Zap, Database,
  CheckCircle, ArrowRight, MonitorSmartphone, FolderLock, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const SecurityBadge = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="h-full border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:shadow-lg hover:shadow-violet-500/5 group">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const ComplianceBadgeItem = ({ label }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </div>
);

const Security = () => {
  return (
    <PageTransition>
      <Helmet><title>Security | Munal AI</title></Helmet>
      <Header />

      <div className="container mx-auto px-6"><BreadcrumbNav /></div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-violet-50/30 to-white dark:from-slate-950 dark:via-violet-950/10 dark:to-slate-900">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6 py-24 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-950/50 rounded-full mb-6">
              <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Enterprise-Grade Security</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Your Data, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Fortress Protected</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
              Munal AI is built security-first from the ground up. Every layer — from encryption to access control to audit trails — is designed to keep your organization safe.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full px-8 gap-2">
                <FileText className="w-4 h-4" /> Download Security Whitepaper
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2">
                Contact Security Team <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">Compliance & Standards</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <ComplianceBadgeItem label="PIPEDA Compliant" />
            <ComplianceBadgeItem label="Canadian E-Commerce Acts" />
            <ComplianceBadgeItem label="SOC 2 Type II" />
            <ComplianceBadgeItem label="GDPR Ready" />
            <ComplianceBadgeItem label="CCPA Compliant" />
            <ComplianceBadgeItem label="TLS 1.3 Enforced" />
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Security Built Into Every Layer</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">From data at rest to data in transit, every interaction is protected.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <SecurityBadge delay={0} icon={Lock} title="AES-256 Encryption at Rest" description="All stored data is encrypted using Fernet (AES-128-CBC + HMAC-SHA256) with field-level encryption for sensitive audit details." />
            <SecurityBadge delay={0.05} icon={Globe} title="TLS 1.3 In Transit" description="All network communications are secured with TLS 1.3 encryption, ensuring data integrity during transmission." />
            <SecurityBadge delay={0.1} icon={KeyRound} title="JWT Authentication" description="Stateless token-based authentication using HS256 algorithm with 24-hour expiration and automatic token rotation." />
            <SecurityBadge delay={0.15} icon={Fingerprint} title="Bcrypt Password Hashing" description="User passwords are hashed with bcrypt salt rounds, making brute-force attacks computationally infeasible." />
            <SecurityBadge delay={0.2} icon={Users} title="Role-Based Access Control" description="Granular RBAC system with Admin, Member, and Viewer roles. Permissions enforced at both API and UI layers." />
            <SecurityBadge delay={0.25} icon={Ban} title="API Rate Limiting" description="Built-in rate limiting via SlowAPI prevents abuse, DDoS attempts, and brute-force login attacks on all endpoints." />
            <SecurityBadge delay={0.3} icon={Eye} title="Security Headers" description="X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, and Content-Security-Policy headers enforced." />
            <SecurityBadge delay={0.35} icon={FileText} title="Encrypted Audit Logs" description="Every action is logged with encrypted details, IP addresses, and timestamps to the audit_logs collection." />
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Application Security Features</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Security controls embedded across every module of Munal AI.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {[
              { icon: ShieldCheck, title: "Admin Security Policies", desc: "Configurable password policies (min length, complexity, expiry), session timeout settings, meeting security controls, and account lockout thresholds — all managed from the admin panel.", color: "from-violet-500 to-purple-600" },
              { icon: MonitorSmartphone, title: "Session Management", desc: "Active session tracking with device fingerprinting, automatic session expiry after 24 hours, forced logout on all devices, and session revocation controls.", color: "from-blue-500 to-cyan-600" },
              { icon: FolderLock, title: "Workspace File Isolation", desc: "Secure file storage with workspace-level isolation. Owner/Member/Viewer permissions control who can upload, download, and delete files.", color: "from-emerald-500 to-teal-600" },
              { icon: AlertTriangle, title: "Incident & Safety Reporting", desc: "IR/SOR reports with admin-defined templates, auto-escalation workflows, and compliance-ready documentation for regulatory audits.", color: "from-amber-500 to-orange-600" },
              { icon: Database, title: "eSignature Legal Compliance", desc: "Electronic signatures comply with Canadian PIPEDA, UECA, and provincial Electronic Commerce Acts. Full signing history with audit trails.", color: "from-rose-500 to-pink-600" },
              { icon: Zap, title: "Approval Workflow Security", desc: "Multi-step approval chains with delegation audit trails, substitute tracking, and anomaly detection in approval patterns.", color: "from-indigo-500 to-violet-600" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex gap-5">
                    <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Password Security Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Password & Authentication Security</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Multi-layered password protection ensures your accounts stay secure.</p>
              <div className="space-y-4">
                {[
                  { label: "12+ character minimum with complexity requirements", icon: Lock },
                  { label: "Bcrypt hashing with automatic salt generation", icon: Fingerprint },
                  { label: "Password history tracking prevents reuse", icon: Clock },
                  { label: "Strength meter (weak/fair/good/strong) on all forms", icon: ShieldCheck },
                  { label: "Admin-configurable password expiry policies", icon: KeyRound },
                  { label: "Brute-force protection via rate limiting", icon: Ban },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                <img src="https://images.pexels.com/photos/4489171/pexels-photo-4489171.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="Digital Security" className="w-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CORS & Infrastructure */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Infrastructure & Network Security</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Enterprise-grade infrastructure hardened at every level.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "CORS Protection", desc: "Configurable Cross-Origin Resource Sharing policies with whitelist enforcement to prevent unauthorized API access." },
              { icon: Server, title: "Cloud Database", desc: "Cloud-hosted database with encryption at rest, network isolation, and automated backups with point-in-time recovery." },
              { icon: Shield, title: "Content Security Policy", desc: "Strict CSP headers prevent XSS attacks, clickjacking, and unauthorized script injection across the application." },
              { icon: Lock, title: "Field-Level Encryption", desc: "Sensitive data fields use Fernet encryption with 'enc::' prefix markers to prevent double-encryption." },
              { icon: Database, title: "Secure File Storage", desc: "Binary file storage with workspace-level isolation and permission-gated access controls." },
              { icon: Zap, title: "Kubernetes Deployment", desc: "Containerized infrastructure with automatic scaling, health checks, and zero-downtime deployments." },
            ].map((item, i) => (
              <SecurityBadge key={i} delay={i * 0.05} icon={item.icon} title={item.title} description={item.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto">
            <Shield className="w-14 h-14 text-violet-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Security Questions?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Our security team is available to answer questions, provide documentation, and assist with compliance audits.</p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full px-8" onClick={() => window.location.href = '/contact'}>
                Contact Security Team
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default Security;
