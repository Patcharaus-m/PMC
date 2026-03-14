import React, { useState } from 'react';
import { User, Mail, Lock, Building, Briefcase, ArrowRight, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import myLogo from '../assets/LogoBack.png';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password requirement checks
  const pw = formData.password;
  const pwChecks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
  };

  // Map frontend select values to backend enum values
  const roleMap = {
    pm: 'PM',
    engineer: 'SiteEngineer',
    architect: 'Inspector',
    qaqc: 'Inspector',
    subcon: 'DocumentController',
    admin: 'Admin',
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    if (!pwChecks.length || !pwChecks.uppercase || !pwChecks.number) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัว, ตัวพิมพ์ใหญ่ 1 ตัว, และตัวเลข 1 ตัว');
      return;
    }

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const backendRole = roleMap[formData.role] || 'PM';

      const result = await registerUser(
        fullName,
        formData.email,
        formData.password,
        formData.confirmPassword,
        backendRole
      );

      if (result.status === 1) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to connect to server';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] font-sans">
      
      {/* --- ฝั่งซ้าย: Branding (ซ่อนในมือถือ) --- */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0f1c] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 -right-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        {/* Logo Section */}
        <div className="relative z-10 w-fit">
          <div className="bg-white p-4 flex justify-center items-center rounded-2xl shadow-md">
            <img 
              src={myLogo} 
              alt="PMC System Logo" 
              className="h-14 w-auto object-contain" 
            />
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-black mb-6 leading-tight">
            Build smarter,<br />manage better.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            เข้าร่วมระบบจัดการโครงการก่อสร้างอัจฉริยะแบบครบวงจร ติดตามความคืบหน้า จัดการเอกสาร และตรวจสอบหน้างานแบบ Real-time
          </p>
        </div>

        {/* Footer Text */}
        <div className="relative z-10 text-xs text-gray-500 font-bold uppercase tracking-wider">
          © 2024 PMC Project Control Ecosystem
        </div>
      </div>

      {/* --- ฝั่งขวา: Register Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-8 w-full border-b pb-6 border-gray-100">
            <img 
              src={myLogo} 
              alt="PMC System Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Create an account</h2>
            <p className="text-sm text-gray-500">กรุณากรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบ</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* ชื่อ-นามสกุล */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-gray-400" size={18} />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="ชื่อ" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                <div className="relative flex items-center">
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="นามสกุล" required />
                </div>
              </div>
            </div>

            {/* อีเมล */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-gray-400" size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="อีเมลบริษัท หรือ อีเมลส่วนตัว" required />
              </div>
            </div>

            {/* แผนก / บริษัท */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company / Department</label>
              <div className="relative flex items-center">
                <Building className="absolute left-3 text-gray-400" size={18} />
                <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="ชื่อบริษัท หรือ แผนก" required />
              </div>
            </div>

            {/* Role / ตำแหน่ง */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">System Role</label>
              <div className="relative flex items-center">
                <Briefcase className="absolute left-3 text-gray-400 z-10" size={18} />
                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all appearance-none cursor-pointer text-gray-700" required>
                  <option value="" disabled>เลือกตำแหน่งของคุณ...</option>
                  <option value="pm">Project Manager</option>
                  <option value="engineer">Site Engineer</option>
                  <option value="architect">Architect</option>
                  <option value="qaqc">QA/QC Inspector</option>
                  <option value="subcon">Sub-contractor</option>
                </select>
              </div>
            </div>

            {/* รหัสผ่าน */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="สร้างรหัสผ่าน" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password requirements */}
              {pw.length > 0 && (
                <div className="mt-2 space-y-1 px-1">
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium ${pwChecks.length ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {pwChecks.length ? <Check size={12} /> : <XIcon size={12} />}
                    อย่างน้อย 8 ตัวอักษร
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium ${pwChecks.uppercase ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {pwChecks.uppercase ? <Check size={12} /> : <XIcon size={12} />}
                    ตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium ${pwChecks.number ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {pwChecks.number ? <Check size={12} /> : <XIcon size={12} />}
                    ตัวเลข (0-9) อย่างน้อย 1 ตัว
                  </div>
                </div>
              )}
            </div>

            {/* ยืนยันรหัสผ่าน */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-gray-400" size={18} />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" placeholder="ยืนยันรหัสผ่าน" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>

          </form>

          {/* ลิงก์ไปหน้า Login */}
          <p className="mt-8 text-center text-xs text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/" className="text-blue-600 font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;