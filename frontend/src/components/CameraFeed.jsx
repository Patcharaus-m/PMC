import React from 'react';
import { Camera } from 'lucide-react';

const CameraFeed = ({ id, zone, time = '00:45:12' }) => {
  return (
    // กรอบสีดำของกล้อง
    <div className="aspect-video bg-[#0f1423] rounded-2xl border border-gray-800 p-3 lg:p-4 relative overflow-hidden flex flex-col w-full min-w-0">
      
      {/* Top Bar ในจอกล้อง */}
      <div className="flex justify-between items-start relative z-10 gap-2">
        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse shrink-0"></span>
          <span className="text-[8px] sm:text-[10px] font-mono text-gray-200">REC {time}</span>
        </div>
        <div className="bg-blue-600/20 text-blue-400 text-[8px] sm:text-[10px] px-2 py-1 rounded border border-blue-500/30 font-bold uppercase truncate max-w-[60%] sm:max-w-[70%]">
          CAM-{id} | {zone}
        </div>
      </div>
      
      {/* ลายน้ำไอคอนกล้องตรงกลาง (จางๆ) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <Camera className="text-gray-800/40" size={40} />
      </div>
    </div>
  );
};

export default CameraFeed;