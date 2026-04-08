import React from 'react';

const STATUS_LABELS = {
  'APPROVED': 'อนุมัติแล้ว',
  'COMPLETED': 'เสร็จสมบูรณ์',
  'PENDING': 'รอดำเนินการ',
  'IN PROGRESS': 'กำลังดำเนินการ',
  'REVIEWING': 'กำลังตรวจสอบ',
  'REJECTED': 'ไม่ผ่าน',
};

const StatusBadge = ({ status }) => {
  let colorClass = '';

  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED':
      colorClass = 'bg-emerald-50 text-emerald-600';
      break;
    case 'PENDING':
      colorClass = 'bg-yellow-50 text-yellow-600';
      break;
    case 'IN PROGRESS':
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

  const label = STATUS_LABELS[status.toUpperCase()] || status;

  return (
    <span className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;