
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, BarChart2, Video, Zap } from 'lucide-react';

const AuthSidebar = ({ title, subtitle, features = [], showPartners = true }) => {
  return (
    <div className="hidden lg:flex flex-col justify-between w-full lg:w-1/2 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-12 text-white relative overflow-hidden h-full min-h-screen">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white mix-blend-overlay filter blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-400 mix-blend-overlay filter blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-16 hover:opacity-90 transition-opacity w-fit">
             <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg p-2">
               <img 
                 src="https://horizons-cdn.hostinger.com/1a826ed3-a150-41db-a308-d89a5e18a935/cb8c28207f2dc7615e604a05e68dc85b.png" 
                 alt="Munal AI Logo" 
                 className="w-full h-full object-contain"
               />
             </div>
             <span className="text-2xl font-bold tracking-tight">Munal AI</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight tracking-tight">
            {title}
          </h1>
          <p className="text-purple-100 text-lg mb-12 max-w-lg leading-relaxed font-light opacity-90">
            {subtitle}
          </p>

          {features.length > 0 && (
            <div className="space-y-6 mb-12">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className="mt-1 bg-white/10 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-purple-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                    <p className="text-sm text-purple-100/80 font-light mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showPartners && (
          <div className="relative z-10 mt-auto">
            <p className="text-xs text-purple-200 uppercase tracking-widest font-semibold mb-6 opacity-70">Trusted by Global Teams</p>
            <div className="flex flex-wrap gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
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
