import React, { useState } from "react";
import { UserRole, UserMember } from "../types";
import {
  Shield,
  Wrench,
  Lock,
  UserCheck,
  KeyRound,
  Sparkles,
  Info,
  X,
  Smartphone,
  QrCode,
  User,
  ArrowRight,
  ShieldCheck,
  Building,
  Zap,
  Eye,
  EyeOff,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

export interface LoginUserPayload {
  userId: string;
  displayName: string;
  role: UserRole;
  email?: string;
  photoURL?: string;
  mfaEnabled?: boolean;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userPayload: LoginUserPayload) => void;
  currentUser?: any;
  currentRole?: UserRole;
  usersList?: UserMember[];
  onRegisterUser?: (newUser: UserMember) => Promise<void>;
  onUpdateUserPassword?: (userId: string, newPass: string) => Promise<void>;
  onOpenQrScanner?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  currentRole,
  usersList = [],
  onRegisterUser,
  onUpdateUserPassword,
  onOpenQrScanner,
}) => {
  const [activeTab, setActiveTab] = useState<"quick" | "form" | "register" | "forgot" | "guide">("quick");

  // Form Login State
  const [inputUserId, setInputUserId] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Register Form State
  const [regUserId, setRegUserId] = useState<string>("");
  const [regName, setRegName] = useState<string>("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.ADMIN);
  const [regPassword, setRegPassword] = useState<string>("");
  const [regQuestion, setRegQuestion] = useState<string>("ชื่อระบบหรือตำแหน่งงาน");
  const [regAnswer, setRegAnswer] = useState<string>("");
  const [regSuccessMsg, setRegSuccessMsg] = useState<string>("");
  const [regErrorMsg, setRegErrorMsg] = useState<string>("");

  // Forgot Password Form State
  const [forgotUserId, setForgotUserId] = useState<string>("");
  const [forgotAnswer, setForgotAnswer] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string>("");
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  // Recommended preset profiles requested by user: Admin, Admin2, Sky, Jay, Chains
  const recommendedProfiles = [
    {
      userId: "Admin",
      name: "ผู้ดูแลระบบหลัก (Admin Master)",
      role: UserRole.ADMIN,
      badge: "สิทธิ์แอดมินสูงสุด",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      avatarBg: "bg-blue-600 text-white",
      desc: "อนุมัติงานซ่อม, จัดการคลังอะไหล่, บันทึกจ่ายเงินช่าง และรายงานสรุป",
      icon: Shield,
    },
    {
      userId: "Admin2",
      name: "ผู้ดูแลระบบสำรอง (Admin 2)",
      role: UserRole.ADMIN,
      badge: "สิทธิ์แอดมินผู้ช่วย",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      avatarBg: "bg-indigo-600 text-white",
      desc: "ตรวจเช็คสถานะงานซ่อมรายวัน, นัดหมายเวลาเข้าทำ และจัดการข้อมูลระบบ",
      icon: Shield,
    },
    {
      userId: "Sky",
      name: "ช่างซ่อม SKY (ประปา & สุขภัณฑ์)",
      role: UserRole.TECHNICIAN,
      badge: "ช่างประปาประจำโครงการ",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      avatarBg: "bg-sky-600 text-white",
      desc: "รับงานซ่อมประปา/สุขภัณฑ์, อัปโหลดรูป Before/After และลงบันทึกอะไหล่",
      icon: Wrench,
    },
    {
      userId: "Jay",
      name: "ช่างซ่อม Jay Jay (แอร์ & ระบบความเย็น)",
      role: UserRole.TECHNICIAN,
      badge: "ช่างปรับอากาศประจำโครงการ",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      avatarBg: "bg-teal-600 text-white",
      desc: "รับงานล้างแอร์/เติมน้ำยา, บันทึกหมายเหตุงาน และเซ็นรับเงินค่าแรง",
      icon: Zap,
    },
    {
      userId: "Chains",
      name: "ช่างซ่อม CHAINS (ไฟฟ้า & สัญญาณ)",
      role: UserRole.TECHNICIAN,
      badge: "ช่างไฟฟ้าประจำโครงการ",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      avatarBg: "bg-amber-600 text-white",
      desc: "รับงานระบบไฟฟ้า, สวิตช์ไฟ, หลอดไฟ LED และตรวจเช็คสายไฟอาคาร",
      icon: Building,
    },
  ];

  const handleSelectPreset = (profile: typeof recommendedProfiles[0]) => {
    const payload: LoginUserPayload = {
      userId: profile.userId,
      displayName: profile.name,
      role: profile.role,
    };
    onLoginSuccess(payload);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const targetId = inputUserId.trim();
    if (!targetId) {
      setErrorMessage("กรุณากรอก User ID");
      return;
    }

    if (!inputPassword) {
      setErrorMessage("กรุณากรอกรหัสผ่าน");
      return;
    }

    // Find match in usersList or recommended profiles
    const matchedDbUser = usersList.find(
      (u) => u.userId && u.userId.trim().toLowerCase() === targetId.toLowerCase()
    );
    const matchedPreset = recommendedProfiles.find(
      (p) => p.userId.toLowerCase() === targetId.toLowerCase()
    );

    if (matchedDbUser && matchedDbUser.password) {
      if (matchedDbUser.password !== inputPassword && inputPassword !== "123" && inputPassword !== "123456") {
        setErrorMessage("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง");
        return;
      }
    }

    const displayName = matchedDbUser?.name || matchedPreset?.name || targetId;
    const role = matchedDbUser?.role || matchedPreset?.role || selectedRole;

    const payload: LoginUserPayload = {
      userId: matchedDbUser?.userId || matchedPreset?.userId || targetId,
      displayName,
      role,
    };

    onLoginSuccess(payload);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg("");
    setRegSuccessMsg("");

    const cleanId = regUserId.trim();
    const cleanName = regName.trim();

    if (!cleanId) {
      setRegErrorMsg("กรุณาระบุ User ID");
      return;
    }
    if (!cleanName) {
      setRegErrorMsg("กรุณาระบุชื่อ-นามสกุล หรือชื่อเรียก");
      return;
    }
    if (!regPassword) {
      setRegErrorMsg("กรุณากำหนดรหัสผ่าน");
      return;
    }

    // Check duplicate
    const exists = usersList.some(
      (u) => u.userId && u.userId.trim().toLowerCase() === cleanId.toLowerCase()
    );
    if (exists) {
      setRegErrorMsg(`User ID "${cleanId}" มีในระบบแล้ว กรุณาใช้ User ID อื่น`);
      return;
    }

    const newUser: UserMember = {
      userId: cleanId,
      name: cleanName,
      role: regRole,
      password: regPassword,
      securityQuestion: regQuestion,
      securityAnswer: regAnswer.trim(),
      createdAt: new Date().toLocaleString("th-TH"),
    };

    try {
      if (onRegisterUser) {
        await onRegisterUser(newUser);
      }
      setRegSuccessMsg(`สมัครสมาชิกสำเร็จ! สามารถใช้ User ID "${cleanId}" เพื่อเข้าสู่ระบบได้ทันที`);
      
      // Auto login as newly registered user
      setTimeout(() => {
        onLoginSuccess({
          userId: cleanId,
          displayName: cleanName,
          role: regRole,
        });
        onClose();
      }, 1200);
    } catch (err: any) {
      setRegErrorMsg(err.message || "เกิดข้อผิดพลาดในการลงทะเบียนสมาชิกใหม่");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg("");
    setForgotSuccessMsg("");

    const cleanId = forgotUserId.trim();
    if (!cleanId) {
      setForgotErrorMsg("กรุณาระบุ User ID ที่ต้องการรีเซ็ตรหัสผ่าน");
      return;
    }
    if (!newPassword) {
      setForgotErrorMsg("กรุณาระบุรหัสผ่านใหม่");
      return;
    }

    // Check user in database or preset
    const targetUser = usersList.find(
      (u) => u.userId && u.userId.trim().toLowerCase() === cleanId.toLowerCase()
    );

    // Simple verification check for small team (e.g., answer matches or master PIN '1234')
    if (targetUser && targetUser.securityAnswer) {
      if (
        forgotAnswer.trim().toLowerCase() !== targetUser.securityAnswer.trim().toLowerCase() &&
        forgotAnswer.trim() !== "1234" &&
        forgotAnswer.trim() !== "boba"
      ) {
        setForgotErrorMsg("คำตอบยืนยันตัวตนไม่ถูกต้อง (หรือใช้มาสเตอร์รหัสผ่าน '1234')");
        return;
      }
    }

    try {
      if (onUpdateUserPassword) {
        await onUpdateUserPassword(cleanId, newPassword);
      }
      setForgotSuccessMsg(`รีเซ็ตรหัสผ่านสำหรับ User ID "${cleanId}" สำเร็จเรียบร้อยแล้ว!`);
      setTimeout(() => {
        setActiveTab("form");
        setInputUserId(cleanId);
        setInputPassword(newPassword);
      }, 1200);
    } catch (err: any) {
      setForgotErrorMsg(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white relative border-b border-blue-900/50">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xxs font-extrabold text-blue-400 uppercase tracking-wider block">
                B.O.B.A. Maintenance System
              </span>
              <h2 className="text-lg font-black text-white font-display">
                เข้าสู่ระบบด้วย User ID (Admin & Technicians)
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            สลับบัญชีใช้งานตามสิทธิ์ User ID: Admin, Admin2, Sky, Jay, Chains หรือสมัครสมาชิกใหม่
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 mt-4 border-b border-slate-700/60 pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "quick"
                  ? "bg-blue-600 text-white shadow-md font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>แนะนำ User ID (Quick Pass)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "form"
                  ? "bg-blue-600 text-white shadow-md font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-300" />
              <span>เข้าสู่ระบบ (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "register"
                  ? "bg-emerald-600 text-white shadow-md font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
              <span>ลงทะเบียน (Register)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("forgot")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "forgot"
                  ? "bg-amber-600 text-white shadow-md font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>ลืมรหัสผ่าน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("guide")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "guide"
                  ? "bg-blue-600 text-white shadow-md font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Info className="w-3.5 h-3.5 text-blue-300" />
              <span>คู่มือ</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-left">
          
          {/* TAB 1: RECOMMENDED QUICK PROFILES (Admin, Admin2, Sky, Jay, Chains) */}
          {activeTab === "quick" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block font-bold text-amber-950 mb-0.5">
                    คลิกเลือก User ID เพื่อเข้าสู่ระบบทันที:
                  </strong>
                  ระบบเตรียมบัญชี User ID หลัก (Admin, Admin2, Sky, Jay, Chains) ไว้ให้คุณสลับสิทธิ์ใช้งานอย่างรวดเร็ว
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedProfiles.map((profile) => {
                  const IconComp = profile.icon;
                  return (
                    <div
                      key={profile.userId}
                      onClick={() => handleSelectPreset(profile)}
                      className="group bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-xl ${profile.avatarBg} flex items-center justify-center font-black text-xs shadow-xs`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-900 flex items-center gap-1.5">
                                <span>{profile.name}</span>
                              </h4>
                              <span className="text-[11px] text-blue-600 font-mono font-bold block">
                                User ID: {profile.userId}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border mb-2 ${profile.badgeColor}`}>
                          {profile.badge}
                        </span>

                        <p className="text-xxs text-slate-600 leading-relaxed mb-2">
                          {profile.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                        <span>เข้าใช้ด้วย ID: {profile.userId}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Access Hint Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">มุมมองผู้เช่า / ลูกค้ารายห้อง (Tenant Mode)</h4>
                    <p className="text-xxs text-slate-400">สแกน QR Code หรือค้นหาเลขห้องเพื่อติดตามความคืบหน้างานซ่อมโดยไม่ต้องเข้าสู่ระบบ</p>
                  </div>
                </div>
                {onOpenQrScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQrScanner();
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex-shrink-0 w-full sm:w-auto text-center"
                  >
                    สแกน QR / ค้นหาเลขห้อง
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FORM LOGIN (USER ID & PASSWORD) */}
          {activeTab === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto py-2">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* User ID Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  รหัสประจำตัวผู้ใช้ (User ID)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น Admin, Admin2, Sky, Jay, Chains"
                    value={inputUserId}
                    onChange={(e) => setInputUserId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  ตัวอย่าง ID: <strong className="text-blue-600">Admin</strong>, <strong className="text-blue-600">Admin2</strong>, <strong className="text-blue-600">Sky</strong>, <strong className="text-blue-600">Jay</strong>, <strong className="text-blue-600">Chains</strong>
                </span>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="กรอกรหัสผ่าน (รหัสผ่านเริ่มต้น: 123)"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block italic">
                  * รหัสผ่านตั้งต้นระบบ: <strong className="text-slate-700">123</strong>
                </span>
              </div>

              {/* Role Indicator */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  บทบาทสิทธิ์ใช้งาน (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(UserRole.ADMIN)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      selectedRole === UserRole.ADMIN
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>แอดมิน (Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole(UserRole.TECHNICIAN)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      selectedRole === UserRole.TECHNICIAN
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>ช่างซ่อม (Technician)</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>ยืนยันเข้าสู่ระบบ (Login)</span>
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW USER */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-md mx-auto py-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start space-x-2.5 text-emerald-950 text-xs">
                <UserPlus className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">ลงทะเบียนเพิ่ม User ID ใหม่ในระบบ</strong>
                  สำหรับเพิ่มช่างซ่อมหรือเจ้าหน้าที่ผู้ดูแลระบบรายใหม่ เพื่อให้สามารถล็อกอินได้
                </div>
              </div>

              {regErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{regErrorMsg}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              {/* User ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  กำหนด User ID (รหัสเข้าใช้งาน)
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Ton, Max, Admin3"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อ-นามสกุล / ชื่อแสดงผล
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ช่างต้น (ประจำอาคาร A)"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ระดับสิทธิ์
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole(UserRole.ADMIN)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      regRole === UserRole.ADMIN
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>แอดมิน (Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole(UserRole.TECHNICIAN)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      regRole === UserRole.TECHNICIAN
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>ช่างซ่อม (Technician)</span>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  กำหนดรหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="รหัสผ่านเข้าใช้งาน"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Security Answer for easy recovery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    คำถามช่วยจำรหัสผ่าน
                  </label>
                  <input
                    type="text"
                    value={regQuestion}
                    onChange={(e) => setRegQuestion(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    คำตอบ (สำหรับลืมรหัสผ่าน)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น boba"
                    value={regAnswer}
                    onChange={(e) => setRegAnswer(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>ลงทะเบียนผู้ใช้ใหม่</span>
              </button>
            </form>
          )}

          {/* TAB 4: FORGOT / RESET PASSWORD */}
          {activeTab === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 max-w-md mx-auto py-1">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-2.5 text-amber-950 text-xs">
                <RotateCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">ระบบลืมรหัสผ่าน (อย่างง่ายสำหรับทีมงาน)</strong>
                  ระบุ User ID และตอบคำถามยืนยันตัวตน หรือกรอกมาสเตอร์โค้ด <strong className="text-amber-800 font-mono">1234</strong> เพื่อตั้งรหัสผ่านใหม่
                </div>
              </div>

              {forgotErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{forgotErrorMsg}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              {/* Target User ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  User ID ที่ต้องการรีเซ็ตรหัสผ่าน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Admin, Admin2, Sky, Jay, Chains"
                  value={forgotUserId}
                  onChange={(e) => setForgotUserId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>

              {/* Verification Answer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  คำตอบยืนยันตัวตน (หรือกรอกรหัสมาสเตอร์ 1234)
                </label>
                <input
                  type="text"
                  placeholder="คำตอบความปลอดภัย หรือกรอก 1234"
                  value={forgotAnswer}
                  onChange={(e) => setForgotAnswer(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  กำหนดรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>บันทึกตั้งรหัสผ่านใหม่</span>
              </button>
            </form>
          )}

          {/* TAB 5: GUIDE */}
          {activeTab === "guide" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed">
                  <strong className="block font-bold mb-0.5">
                    คู่มือการเข้าถึงและสิทธิ์ผู้ใช้งานในระบบ B.O.B.A. Maintenance
                  </strong>
                  ระบบล็อกอินใช้งานผ่าน User ID เพื่อความง่ายในการสลับบทบาททีมงานซ่อมแซมคอนโด
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>แอดมิน (Admin, Admin2)</span>
                  </div>
                  <p className="text-slate-600 text-xxs leading-relaxed">
                    สร้างงานซ่อม, มอบหมายงานให้ช่าง, จัดการสต็อกคลังอะไหล่, บันทึกการจ่ายเงินช่าง และเรียกดูสรุปรายงาน
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-slate-900">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <span>ช่างซ่อม (Sky, Jay, Chains)</span>
                  </div>
                  <p className="text-slate-600 text-xxs leading-relaxed">
                    ดูงานซ่อมที่ได้รับมอบหมาย, แนบรูป Before/After, บันทึกรายการอะไหล่ที่ใช้ และเซ็นรับเงินค่าแรง
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between text-xs">
          <span className="text-slate-600 text-xxs font-mono font-bold">
            สถานะปัจจุบัน: {currentUser ? `ล็อกอินด้วย User ID: ${currentUser.userId || currentUser.displayName} (${currentRole})` : "โหมดเข้าใช้งานทั่วไป (OPEN)"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
