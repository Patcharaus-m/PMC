import React, { useState } from 'react';
import { User, Clock, Menu, Navigation, Battery } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CameraFeed from '../components/CameraFeed';
import HeaderProfile from '../components/HeaderProfile';

const CctvPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans flex w-full overflow-x-hidden">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white h-16 px-4 flex items-center justify-between z-20 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md font-bold text-white text-sm">P</div>
          <h1 className="font-bold text-gray-800 text-sm">PMC SYSTEM</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 rounded-lg text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      {/* บอก Sidebar ว่าตอนนี้อยู่หน้า cctv */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeMenu="cctv" />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">โครงการก่อสร้างอาคารสำนักงานอัจฉริยะ (SMART OFFICE TOWER)</h2>
            <div className="flex items-center text-xs text-emerald-500 mt-2 font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> PROJECT LIVE TRACKER
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
            <div className="flex items-center gap-2 hidden sm:flex">
               <span className="text-[10px] text-gray-400 font-bold uppercase">Current Role Perspective</span>
               <select className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border-none outline-none">
                 <option>PROJECT MANAGER</option>
               </select>
            </div>
            <HeaderProfile />
          </div>
        </header>

        {/* --- TITLE & SYNC TIME --- */}
        <div className="flex justify-between items-end gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-blue-600 text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
               <span className="w-4 h-[2px] bg-blue-600 shrink-0"></span> <span className="truncate">Project Intelligence</span>
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black italic uppercase text-gray-900 tracking-tight truncate">Site Intelligence</h1>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Data Sync</span>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-bold text-gray-700 bg-white px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl shadow-sm border border-gray-100">
              <Clock size={14} className="text-gray-400"/>
              <span className="hidden sm:inline">2024-05-20</span> 09:30
            </div>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        {/* แบ่ง 12 คอลัมน์ (ซ้าย 8, ขวา 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-10">
          
          {/* LEFT: CCTV Grid (8 Columns) */}
          <div className="lg:col-span-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CameraFeed id="01" zone="ZONE A - MAIN ENTRANCE" />
              <CameraFeed id="02" zone="ZONE B - MATERIAL STORAGE" />
              <CameraFeed id="03" zone="ZONE C - CRANE TOWER 1" />
              <CameraFeed id="04" zone="LOADING BAY - SOUTH" />
            </div>
          </div>

          {/* RIGHT: Drone & Logs (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6 w-full min-w-0">
            
            {/* DRONE OPS PANEL (Dark Theme) */}
            <div className="bg-[#121826] rounded-2xl border border-gray-800 p-4 lg:p-6 text-white flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                   <div className="bg-blue-600 p-1.5 rounded-lg"><Navigation size={18} fill="white"/></div>
                   <span className="font-black text-sm lg:text-base tracking-widest italic">DRONE OPS</span>
                 </div>
                 <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800 font-bold tracking-wider">LIVE</span>
              </div>
              
              {/* Map Placeholder */}
              <div className="aspect-square sm:aspect-video lg:aspect-square bg-[#1a2133] rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden mb-6">
                 {/* วงกลม Radar ซ้อนๆ กัน */}
                 <div className="absolute w-48 h-48 border border-gray-700/50 rounded-full"></div>
                 <div className="absolute w-32 h-32 border border-gray-700/50 rounded-full"></div>
                 <div className="absolute w-16 h-16 border border-gray-600/50 rounded-full"></div>
                 {/* จุดระบุตำแหน่ง Ping */}
                 <div className="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
                 <div className="absolute w-4 h-4 bg-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                 <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] z-10"></div>
              </div>

              {/* Drone Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1a2133] p-3 rounded-xl border border-gray-800">
                  <p className="text-[8px] lg:text-[10px] text-gray-400 mb-1 flex items-center gap-1 font-bold tracking-wider uppercase"><Battery size={12}/> BATTERY</p>
                  <p className="text-xl lg:text-2xl font-black text-blue-400">82%</p>
                </div>
                <div className="bg-[#1a2133] p-3 rounded-xl border border-gray-800">
                  <p className="text-[8px] lg:text-[10px] text-gray-400 mb-1 flex items-center gap-1 font-bold tracking-wider uppercase">ALTITUDE</p>
                  <p className="text-xl lg:text-2xl font-black">45m</p>
                </div>
              </div>

              <div className="text-center mb-6">
                 <p className="text-[8px] lg:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">GPS COORDINATES</p>
                 <p className="text-xs lg:text-sm font-mono text-blue-300">13.7563° N, 100.5018° E</p>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic tracking-wider py-3 lg:py-4 rounded-xl transition-colors text-xs lg:text-sm">
                TAKE HIGH-RES ORTHOPHOTO
              </button>
            </div>

            {/* OPERATION LOG PANEL (Light Theme) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
               <h3 className="text-xs font-bold tracking-wider text-gray-800 uppercase mb-4">Operation Log</h3>
               
               <div className="space-y-3">
                 <div className="flex gap-3 items-start text-[10px] lg:text-xs">
                   <span className="text-gray-400 font-mono shrink-0">09:12</span>
                   <span className="text-gray-600 font-medium">Drone Takeoff successful</span>
                 </div>
                 <div className="flex gap-3 items-start text-[10px] lg:text-xs">
                   <span className="text-gray-400 font-mono shrink-0">09:15</span>
                   <span className="text-gray-600 font-medium">Zone B survey completed</span>
                 </div>
                 <div className="flex gap-3 items-start text-[10px] lg:text-xs">
                   <span className="text-orange-400 font-mono shrink-0">09:18</span>
                   <span className="text-orange-600 font-bold">Wind speed warning (18km/h)</span>
                 </div>
               </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default CctvPage;