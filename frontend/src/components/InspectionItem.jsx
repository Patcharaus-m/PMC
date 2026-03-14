import React from 'react';
import { CheckCircle2, Clock, AlertCircle, MapPin, User, CalendarDays } from 'lucide-react';
import StatusBadge from './StatusBadge';

const InspectionItem = ({ title, zone, assignee, date, status }) => {
  // กำหนดไอคอนและสีพื้นหลังไอคอนตามสถานะ
  let IconComponent = Clock;
  let iconBgColor = 'bg-blue-50 text-blue-500';

  if (status.toUpperCase() === 'COMPLETED') {
    IconComponent = CheckCircle2;
    iconBgColor = 'bg-emerald-50 text-emerald-500';
  } else if (status.toUpperCase() === 'REJECTED') {
    IconComponent = AlertCircle;
    iconBgColor = 'bg-red-50 text-red-500';
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all gap-4 group cursor-pointer bg-white">
      
      {/* ฝั่งซ้าย: Icon + ข้อมูล */}
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <div className={`p-3 rounded-full shrink-0 transition-colors ${iconBgColor}`}>
          <IconComponent size={24} />
        </div>
        
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
            {title}
          </h4>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1.5 text-[10px] sm:text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1 shrink-0"><MapPin size={12}/> {zone}</span>
            <span className="flex items-center gap-1 shrink-0"><User size={12}/> {assignee}</span>
            <span className="flex items-center gap-1 shrink-0"><CalendarDays size={12}/> {date}</span>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: สถานะ */}
      <div className="flex sm:justify-end shrink-0 pl-14 sm:pl-0">
        <StatusBadge status={status} />
      </div>

    </div>
  );
};

export default InspectionItem;