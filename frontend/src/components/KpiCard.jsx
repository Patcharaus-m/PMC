import React from 'react';

const KpiCard = ({ title, value, subtext, icon, iconBg, borderColor }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center gap-3 w-full min-w-0 p-5 relative overflow-hidden"
      style={{ borderTop: `3px solid ${borderColor || '#3b82f6'}` }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-gray-500 text-xs font-semibold mb-2">{title}</h3>
        <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
        <p className="text-xs mt-1.5 font-medium text-gray-400">{subtext}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;