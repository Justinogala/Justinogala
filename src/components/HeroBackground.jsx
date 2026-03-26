import React from 'react';

const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base gradient - soft pastel */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-lime-50/30" />
      
      {/* Teal/green bloom - bottom left */}
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-300/40 via-teal-200/30 to-transparent blur-3xl" />
      
      {/* Soft lavender bloom - top center */}
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-b from-violet-200/20 via-slate-100/10 to-transparent blur-3xl" />
      
      {/* Light yellow bloom - right */}
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-lime-200/25 via-emerald-100/15 to-transparent blur-3xl" />

      {/* Diagonal accent line - green to yellow */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1920 900">
        <defs>
          <linearGradient id="line-grad" x1="0.6" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <line x1="1200" y1="0" x2="1500" y2="900" stroke="url(#line-grad)" strokeWidth="2.5" />
      </svg>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default HeroBackground;
