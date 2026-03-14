import React from 'react';

const StatusBadge = ({ status }) => {
  let colorClass = '';

  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED': // เพิ่มตัวนี้
      colorClass = 'bg-emerald-50 text-emerald-600';
      break;
    case 'PENDING':
      colorClass = 'bg-yellow-50 text-yellow-600';
      break;
    case 'IN PROGRESS': // เพิ่มตัวนี้
      colorClass = 'bg-orange-50 text-orange-500';
      break;
    case 'REVIEWING':
      colorClass = 'bg-indigo-50 text-indigo-600';
      break;
    case 'REJECTED':
      colorClass = 'bg-red-50 text-red-600';
      break;
    default:
      colorClass = 'bg-gray-50 text-gray-600';
  }

  return (
    <span className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;