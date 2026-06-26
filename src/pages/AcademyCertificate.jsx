import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Award, Download, CheckCircle, XCircle, ArrowLeft, Share2, QrCode, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const AcademyCertificate = () => {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/academy/certificates/${certId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCert(d); })
      .finally(() => setLoading(false));
  }, [certId]);

  const handleDownload = () => {
    const el = certRef.current;
    if (!el) return;
    // Use browser print-to-PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${cert.cert_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: landscape; margin: 0; }
            body { font-family: 'Georgia', 'Times New Roman', serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
            .cert { width: 1000px; padding: 60px; border: 3px solid ${cert.status === 'pass' ? '#10b981' : '#ef4444'}; margin: 20px auto; position: relative; background: linear-gradient(135deg, #fafafa 0%, #f5f3ff 50%, #fafafa 100%); }
            .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid ${cert.status === 'pass' ? '#a7f3d0' : '#fca5a5'}; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 14px; letter-spacing: 6px; text-transform: uppercase; color: #6d28d9; font-weight: 700; margin-bottom: 8px; }
            .title { font-size: 42px; font-weight: 700; color: #1e1b4b; margin: 10px 0; }
            .subtitle { font-size: 16px; color: #6b7280; }
            .body { text-align: center; margin: 30px 0; }
            .name { font-size: 32px; font-weight: 700; color: #1e1b4b; border-bottom: 2px solid #c4b5fd; display: inline-block; padding-bottom: 4px; margin: 10px 0; }
            .course { font-size: 20px; color: #4b5563; margin: 15px 0; }
            .score { display: inline-block; padding: 8px 24px; border-radius: 999px; font-size: 18px; font-weight: 700; margin: 15px 0; }
            .pass { background: #d1fae5; color: #065f46; }
            .fail { background: #fee2e2; color: #991b1b; }
            .meta { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .meta-item { text-align: center; }
            .meta-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
            .meta-value { font-size: 14px; color: #374151; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="header">
              <div class="logo">Munal AI Academy</div>
              <div class="title">Certificate of ${cert.status === 'pass' ? 'Completion' : 'Participation'}</div>
              <div class="subtitle">This is to certify that</div>
            </div>
            <div class="body">
              <div class="name">${cert.user_name || cert.user_email}</div>
              <div class="course">has ${cert.status === 'pass' ? 'successfully completed' : 'participated in'} the course</div>
              <div style="font-size: 24px; font-weight: 700; color: #4c1d95; margin: 10px 0;">${cert.title}</div>
              <div class="score ${cert.status === 'pass' ? 'pass' : 'fail'}">
                Quiz Score: ${cert.quiz_score || 0}% — ${cert.status === 'pass' ? 'PASSED' : 'NOT PASSED'}
              </div>
            </div>
            <div class="meta">
              <div class="meta-item">
                <div class="meta-label">Certificate Number</div>
                <div class="meta-value">${cert.cert_number}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Date Issued</div>
                <div class="meta-value">${new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Pass Threshold</div>
                <div class="meta-value">${cert.pass_threshold || 70}%</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Verify at</div>
                <div class="meta-value">${window.location.origin}/academy/certificates/${cert.id}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!cert) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Certificate not found</p></div>;

  const isPassed = cert.status === 'pass';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Certificate - {cert.cert_number} | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Academy
        </Link>

        {/* Certificate Card */}
        <div ref={certRef} className={cn("relative bg-white dark:bg-slate-900 rounded-2xl border-2 p-10 shadow-xl", isPassed ? "border-green-400" : "border-red-400")} data-testid="certificate-card">
          {/* Inner border */}
          <div className={cn("absolute inset-3 rounded-xl border", isPassed ? "border-green-200" : "border-red-200")} />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.3em] uppercase text-violet-600 font-bold mb-2">Munal AI Academy</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Certificate of {isPassed ? 'Completion' : 'Participation'}
              </h1>
              <p className="text-gray-500">This is to certify that</p>
            </div>

            {/* Name */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white border-b-2 border-violet-300 inline-block pb-1 px-4">
                {cert.user_name || cert.user_email}
              </h2>
            </div>

            {/* Course */}
            <div className="text-center mb-6">
              <p className="text-gray-500 mb-1">has {isPassed ? 'successfully completed' : 'participated in'} the course</p>
              <h3 className="text-xl font-bold text-violet-800 dark:text-violet-300">{cert.title}</h3>
            </div>

            {/* Score Badge */}
            <div className="flex justify-center mb-8">
              <div className={cn("inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold", isPassed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300")} data-testid="cert-score-badge">
                {isPassed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                Quiz Score: {cert.quiz_score || 0}% — {isPassed ? 'PASSED' : 'NOT PASSED'}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              {[
                { label: 'Certificate No.', value: cert.cert_number, icon: Award },
                { label: 'Issued', value: new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), icon: Calendar },
                { label: 'Pass Threshold', value: `${cert.pass_threshold || 70}%`, icon: GraduationCap },
                { label: 'Status', value: isPassed ? 'Verified' : 'Incomplete', icon: isPassed ? CheckCircle : XCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button onClick={handleDownload} className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="download-cert-btn">
            <Download className="w-4 h-4" /> Download Certificate
          </Button>
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="gap-2">
            <Share2 className="w-4 h-4" /> Copy Link
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AcademyCertificate;
