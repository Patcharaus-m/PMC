import React from 'react';
import { LayoutDashboard, FileText, ClipboardCheck, Video, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import myLogo from '../assets/LogoBack.png';

const Sidebar = ({ isOpen, setIsOpen, activeMenu = 'dashboard' }) => {
  return (
    <>
      {/* Overlay สำหรับมือถือ */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)}></div>
      )}
      
      <aside className={`w-64 bg-[#0a0f1c] text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* --- ส่วนหัวที่มีโลโก้ --- */}
        <div className="relative flex items-center justify-center p-6 mb-4 lg:mb-8">
          <Link to="/dashboard" className="block w-full" onClick={() => setIsOpen(false)}>
            <div className="bg-white p-4 flex justify-center items-center rounded-2xl shadow-md w-full">
              <img 
                src={myLogo} 
                alt="PMC System Logo" 
                className="h-14 w-auto object-contain" 
              />
            </div>
          </Link>

          {/* ปุ่มปิดสำหรับมือถือ */}
          <button className="lg:hidden text-gray-400 hover:text-white absolute right-2 top-2 p-2" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* --- เมนูหลัก --- */}
        <nav className="space-y-2 flex-1 px-4 overflow-y-auto">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard size={20}/>} 
            label="หน้าแรก (Dashboard)" 
            active={activeMenu === 'dashboard'} 
            onClick={() => setIsOpen(false)}
          />
          <NavItem 
            to="/document" 
            icon={<FileText size={20}/>} 
            label="การจัดการเอกสาร" 
            active={activeMenu === 'documents'} 
            onClick={() => setIsOpen(false)}
          />
          <NavItem 
            to="/qaqc" 
            icon={<ClipboardCheck size={20}/>} 
            label="ตรวจหน้างาน / QA/QC" 
            active={activeMenu === 'qaqc'} 
            onClick={() => setIsOpen(false)}
          />
          <NavItem 
            to="/cctv" 
            icon={<Video size={20}/>} 
            label="CCTV / Drone Monitor" 
            active={activeMenu === 'cctv'} 
            onClick={() => setIsOpen(false)}
          />
        </nav>

        {/* --- เมนูตั้งค่าด้านล่าง --- */}
        <div className="mt-auto border-t border-gray-800 p-4">
          <NavItem to="#" icon={<Settings size={20}/>} label="System Configuration" />
        </div>
      </aside>
    </>
  );
};

// Component ย่อยสำหรับรายการเมนู
const NavItem = ({ icon, label, active = false, to, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

export default Sidebar;