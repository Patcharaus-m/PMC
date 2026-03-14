import React from 'react';

const DocStatusRow = ({ type, total, pending, approved }) => {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-b-0">
      {/* Document type label */}
      <div className="w-12 shrink-0">
        <span className="text-lg font-black text-gray-800">{type}</span>
      </div>

      {/* Total count */}
      <div className="text-sm text-gray-500 min-w-[110px] shrink-0">
        ทั้งหมด <span className="font-bold text-gray-700">{total}</span> รายการ
      </div>

      {/* Status badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
          รอดำเนินการ: {pending}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
          อนุมัติ: {approved}
        </span>
      </div>
    </div>
  );
};

export default DocStatusRow;