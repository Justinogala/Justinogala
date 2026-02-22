
import React from 'react';

// Simple SVG Line Chart since Recharts is not available
const BillingChart = ({ data, color = "#4f46e5" }) => {
  if (!data || data.length === 0) return null;

  const height = 200;
  const width = 500;
  const padding = 20;

  const maxVal = Math.max(...data);
  const minVal = 0; // Fixed baseline at 0

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-[200px] flex items-center justify-center overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
           <line 
             key={tick}
             x1={padding} 
             y1={height - padding - (tick * (height - 2*padding))} 
             x2={width - padding} 
             y2={height - padding - (tick * (height - 2*padding))} 
             stroke="currentColor" 
             strokeOpacity="0.1" 
           />
        ))}
        
        {/* Area */}
        <path
          d={`M ${padding},${height - padding} L ${points.split(' ')[0]} ${points.replace(/,/g, ' L ')} L ${width - padding},${height - padding} Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default BillingChart;
