
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, BarChart2, Video, Zap } from 'lucide-react';

const AuthSidebar = ({ title, subtitle, features = [], showPartners = true }) => {
  return (
    <div className="hidden lg:flex flex-col justify-between w-full lg:w-1/2 relative overflow-hidden p-12 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-lime-50/30">
      {/* Pastel gradient blooms (same as hero) */}
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-300/40 via-teal-200/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-b from-violet-200/20 via-slate-100/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-lime-200/25 via-emerald-100/15 to-transparent blur-3xl pointer-events-none" />

      {/* Diagonal accent line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 1200">
        <defs>
          <linearGradient id="auth-line-grad" x1="0.5" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <line x1="550" y1="0" x2="700" y2="1200" stroke="url(#auth-line-grad)" strokeWidth="2" />
      </svg>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="text-gray-500 text-lg mb-12 max-w-lg leading-relaxed font-light">
            {subtitle}
          </p>

          {features.length > 0 && (
            <div className="space-y-6 mb-12">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="mt-1 bg-emerald-100/60 p-1.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{feature.title}</h3>
                    <p className="text-sm text-gray-500 font-light mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showPartners && (
          <div className="relative z-10 mt-auto">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">Trusted by Global Teams</p>
            <div className="flex flex-wrap gap-8 text-gray-400">
              <div className="flex items-center gap-2"><Video className="w-6 h-6"/> <span className="font-bold text-lg">Stream</span></div>
              <div className="flex items-center gap-2"><BarChart2 className="w-6 h-6"/> <span className="font-bold text-lg">Analytics</span></div>
              <div className="flex items-center gap-2"><Zap className="w-6 h-6"/> <span className="font-bold text-lg">FastSync</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSidebar;
