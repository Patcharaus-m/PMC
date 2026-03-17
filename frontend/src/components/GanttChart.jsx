import React, { useMemo } from 'react';

const GanttChart = ({ plans }) => {
  const { months } = useMemo(() => {
    if (!plans || plans.length === 0) return { months: [], minDate: null, maxDate: null };

    let minT = Infinity;
    let maxT = -Infinity;

    plans.forEach(plan => {
      const start = new Date(plan.startDate).getTime();
      const end = new Date(plan.endDate).getTime();
      if (start < minT) minT = start;
      if (end > maxT) maxT = end;
    });

    const startD = new Date(minT);
    const endD = new Date(maxT);

    // Normalize to start of month and end of month
    startD.setDate(1);
    endD.setMonth(endD.getMonth() + 1);
    endD.setDate(0); 

    const monthsArr = [];
    let currentM = new Date(startD);

    while (currentM <= endD) {
      const year = currentM.getFullYear();
      const month = currentM.getMonth(); // 0-11
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const monthName = currentM.toLocaleString('en-US', { month: 'short' });
      monthsArr.push({
        label: `${monthName}-${year.toString().slice(-2)}`,
        year,
        month,
        days: daysInMonth
      });
      currentM.setMonth(currentM.getMonth() + 1);
    }

    return { months: monthsArr };
  }, [plans]);

  // If no plans, don't render anything or render a placeholder
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 font-medium">ยังไม่มีแผนงาน (No plans available)</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex-none relative z-20">
        <h3 className="font-bold text-gray-800 text-sm">แผนงานการดำเนินงาน (Gantt Chart)</h3>
      </div>
      
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full border-collapse text-xs min-w-[1200px]">
          <thead className="sticky top-0 z-10 shadow-sm">
            {/* Header Row 1: Columns & Months */}
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2 w-12 text-center" rowSpan={2}>ลำดับ</th>
              <th className="border border-gray-200 p-2 w-48 text-left bg-gray-100" rowSpan={2}>รายละเอียดงาน</th>
              <th className="border border-gray-200 p-2 text-center bg-gray-100" colSpan={2}>ระยะเวลาการทำงาน</th>
              {months.map((m, idx) => (
                <th key={idx} className="border border-gray-200 p-1 text-center font-semibold text-gray-700 bg-gray-200" colSpan={m.days}>
                  {m.label}
                </th>
              ))}
              <th className="border border-gray-200 p-2 w-32 bg-gray-100" rowSpan={2}>หมายเหตุ</th>
            </tr>
            {/* Header Row 2: Start/Finish & Days */}
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-1 text-center font-medium w-24 top-[37px] bg-gray-100">Start</th>
              <th className="border border-gray-200 p-1 text-center font-medium w-24 top-[37px] bg-gray-100">Finished</th>
              {months.map(m => (
                Array.from({ length: m.days }).map((_, d) => (
                  <th key={`${m.year}-${m.month}-${d}`} className="border border-gray-200 p-0 text-[10px] text-center font-normal min-w-[20px] max-w-[20px] w-[20px] text-gray-500 bg-white">
                    {d + 1}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            
            {/* Render items (you could sort or group them by 'order') */}
            {plans.sort((a,b) => (a.order||'').localeCompare(b.order||'')).map((plan, i) => {
              const pStart = new Date(plan.startDate);
              const pEnd = new Date(plan.endDate);
              
              return (
                <tr key={plan._id || i} className={`hover:bg-blue-50/50 bg-white transition-colors`}>
                  <td className="border border-gray-200 p-1.5 text-center font-bold text-gray-500">{plan.order}</td>
                  <td className="border border-gray-200 p-1.5 pl-3 font-semibold text-gray-800 truncate" title={plan.planName}>
                    {plan.planName}
                  </td>
                  <td className="border border-gray-200 p-1.5 text-center text-gray-600 font-medium whitespace-nowrap">
                    {pStart.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric'})}
                  </td>
                  <td className="border border-gray-200 p-1.5 text-center text-gray-600 font-medium whitespace-nowrap">
                    {pEnd.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric'})}
                  </td>
                  
                  {/* Days mapping */}
                  {months.map((m) => {
                    return Array.from({ length: m.days }).map((_, d) => {
                      const currentCellDate = new Date(m.year, m.month, d + 1);
                      // Check if current day falls in [start, end]
                      
                      // Strip time for proper inclusive cell comparison
                      const currentDayTime = currentCellDate.getTime();
                      const startTime = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate()).getTime();
                      const endTime = new Date(pEnd.getFullYear(), pEnd.getMonth(), pEnd.getDate()).getTime();
                      
                      const isActive = currentDayTime >= startTime && currentDayTime <= endTime;
                      
                      // Highlight weekends lightly
                      const isWeekend = currentCellDate.getDay() === 0 || currentCellDate.getDay() === 6;
                      const cellBgClass = isActive ? '' : (isWeekend ? 'bg-gray-50' : '');
                      const cellStyle = isActive ? { backgroundColor: plan.color || '#3b82f6' } : {};

                      return (
                        <td key={`${m.year}-${m.month}-${d}`} className={`border border-gray-200 p-0 h-7 ${cellBgClass}`} style={cellStyle}>
                           {/* Empty cell, color comes from cellBg or inline style */}
                        </td>
                      );
                    });
                  })}
                  
                  <td className="border border-gray-200 p-1.5 pl-3 text-gray-500 text-xs truncate" title={plan.note}>{plan.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Notes Legend derived from plans */}
      {(() => {
        if (!plans || plans.length === 0) return null;
        const uniqueNotes = [];
        const seen = new Set();
        plans.forEach(plan => {
          if (plan.note && plan.note.trim()) {
            const key = `${plan.color || '#3b82f6'}-${plan.note.trim()}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueNotes.push({ color: plan.color || '#3b82f6', description: plan.note.trim() });
            }
          }
        });
        
        if (uniqueNotes.length === 0) return null;

        return (
          <div className="p-5 border-t border-gray-100 bg-white shadow-sm">
            <div className="flex items-start gap-6">
              <span className="font-bold text-sm text-gray-800 underline decoration-gray-300 underline-offset-4 mt-1 min-w-[40px]">Note</span>
              <div className="flex flex-col gap-3">
                {uniqueNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded flex-shrink-0" style={{ backgroundColor: note.color }}></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-medium">{note.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      
    </div>
  );
};

export default GanttChart;
