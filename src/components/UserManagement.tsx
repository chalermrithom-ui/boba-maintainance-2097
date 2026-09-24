import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Wrench,
  KeyRound,
  UserX,
  UserCheck,
  Edit2,
  Trash2,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Eye,
  ShieldAlert,
  ArrowUpDown,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';
import { User, RepairTicket, FixFlowRole } from '../types';
import { AuthService } from '../services/authService';
import { UserFormModal } from './UserFormModal';
import { TechnicianJobsModal } from './TechnicianJobsModal';
import { ResetPasswordConfirmModal } from './ResetPasswordConfirmModal';
import { ConfirmActionModal, ActionType } from './ConfirmActionModal';
import { useLanguage } from '../context/LanguageContext';

interface UserManagementProps {
  currentUser: User;
  tickets: RepairTicket[];
  onSelectTicket?: (ticket: RepairTicket) => void;
  showToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  tickets,
  onSelectTicket,
  showToast,
}) => {
  const { t, currentLang } = useLanguage();

  // Access control: Only admin
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">ไม่มีสิทธิ์เข้าถึง / Access Denied</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น บัญชีช่างเทคนิคและผู้ดูไม่สามารถเข้าถึงหน้าจัดการบัญชีผู้ใช้งานได้
        </p>
      </div>
    );
  }

  // Users State
  const [users, setUsers] = useState<User[]>(() => AuthService.getUsers());

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | FixFlowRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'deleted'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedTechForJobs, setSelectedTechForJobs] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: User;
    type: ActionType;
  } | null>(null);

  // Reload users from storage
  const reloadUsers = () => {
    setUsers(AuthService.getUsers());
  };

  // Helper: Count assigned tickets for each user
  const getAssignedTicketsCount = (user: User) => {
    return tickets.filter(
      (t) =>
        t.assignedTechnician === user.name ||
        t.assignedTechnician?.includes(user.name.split(' ')[0]) ||
        t.assignedTechnician?.includes(user.loginId)
    ).length;
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.name.toLowerCase().includes(q);
      const matchLoginId = u.loginId.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone ? u.phone.includes(q) : false;
      return matchName || matchLoginId || matchEmail || matchPhone;
    }

    return true;
  });

  // Action handlers
  const handleConfirmActionExecute = () => {
    if (!confirmAction) return;
    const { user, type } = confirmAction;

    if (type === 'suspend') {
      if (user.role === 'admin') {
        const check = AuthService.canDemoteOrDeleteAdmin(user.id);
        if (!check.allowed) {
          showToast?.('ไม่สามารถระงับบัญชีได้', check.messageTh, 'error');
          setConfirmAction(null);
          return;
        }
      }
      AuthService.suspendUser(user.id);
      showToast?.('ระงับบัญชีแล้ว', `ระงับการใช้งานบัญชี ${user.name} สำเร็จ`, 'info');
    } else if (type === 'reactivate') {
      AuthService.reactivateUser(user.id);
      showToast?.('เปิดใช้งานบัญชีแล้ว', `เปิดใช้งานบัญชี ${user.name} เรียบร้อย`, 'success');
    } else if (type === 'delete') {
      const res = AuthService.deleteUser(user.id);
      if (res.success) {
        showToast?.('ลบบัญชีผู้ใช้ (Soft Delete) แล้ว', `บัญชี ${user.name} ถูกลบและเก็บประวัติไว้ในระบบ`, 'info');
      } else {
        showToast?.('ไม่สามารถลบบัญชีได้', res.error, 'error');
      }
    }

    setConfirmAction(null);
    reloadUsers();
  };

  // Stats calculation
  const totalCount = users.filter((u) => u.status !== 'deleted').length;
  const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
  const techCount = users.filter((u) => u.role === 'technician' && u.status === 'active').length;
  const viewerCount = users.filter((u) => u.role === 'viewer' && u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">
              {t('navUserManagement')}
            </h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentLang === 'th'
              ? 'จัดการบัญชีผู้ดูแลระบบ (Admin), ช่างเทคนิค (Technician) และผู้ดู (Viewer) ควบคุมสิทธิ์อย่างปลอดภัย'
              : 'Manage Admin, Technician, and Viewer accounts with role-based access control'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{currentLang === 'th' ? 'เพิ่มผู้ใช้งานใหม่' : 'Add New User'}</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ผู้ใช้ทั้งหมด
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ในระบบทั้งหมด</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ผู้ดูแลระบบ
            </span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{adminCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">สิทธิ์จัดการเต็มรูปแบบ</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ช่างซ่อม (Active)
            </span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{techCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">พร้อมรับงานซ่อม</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ผู้ดู (Viewer)
            </span>
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{viewerCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">อ่านอย่างเดียว</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ระงับการใช้งาน
            </span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{suspendedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">เข้าสู่ระบบไม่ได้</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentLang === 'th' ? 'ค้นหาชื่อ, Login ID, อีเมล, เบอร์โทร...' : 'Search name, Login ID, email...'}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-y-2">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">{currentLang === 'th' ? 'บทบาท:' : 'Role:'}</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{currentLang === 'th' ? 'ทั้งหมด (All Roles)' : 'All Roles'}</option>
              <option value="admin">Admin (ผู้ดูแล)</option>
              <option value="technician">Technician (ช่าง)</option>
              <option value="viewer">Viewer (ผู้ดู)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[11px]">{currentLang === 'th' ? 'สถานะ:' : 'Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{currentLang === 'th' ? 'ทั้งหมด (All Status)' : 'All Status'}</option>
              <option value="active">{currentLang === 'th' ? 'ใช้งาน (Active)' : 'Active'}</option>
              <option value="suspended">{currentLang === 'th' ? 'ระงับ (Suspended)' : 'Suspended'}</option>
              <option value="deleted">{currentLang === 'th' ? 'ลบแล้ว (Deleted)' : 'Deleted'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">{currentLang === 'th' ? 'ผู้ใช้งาน' : 'User'}</th>
                <th className="py-3.5 px-4">Login ID / อีเมล</th>
                <th className="py-3.5 px-4">{currentLang === 'th' ? 'บทบาท' : 'Role'}</th>
                <th className="py-3.5 px-4">{currentLang === 'th' ? 'สถานะบัญชี' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center">{currentLang === 'th' ? 'งานที่รับผิดชอบ' : 'Assigned Jobs'}</th>
                <th className="py-3.5 px-4">{currentLang === 'th' ? 'เข้าใช้ล่าสุด' : 'Last Login'}</th>
                <th className="py-3.5 px-4 text-right">{currentLang === 'th' ? 'การจัดการ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="text-sm font-bold text-slate-600">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</div>
                    <p className="text-xs text-slate-400 mt-0.5">ลองปรับตัวกรองหรือคำค้นหาของคุณ</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const assignedCount = getAssignedTicketsCount(user);
                  const isSuspended = user.status === 'suspended';
                  const isDeleted = user.status === 'deleted';
                  const isLastAdmin = user.role === 'admin' && !AuthService.canDemoteOrDeleteAdmin(user.id).allowed;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-rose-50/30' : isDeleted ? 'bg-slate-50/60 opacity-60' : ''
                      }`}
                    >
                      {/* User Info with Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              user.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
                            }
                            alt={user.name}
                            className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 ${
                              user.role === 'admin'
                                ? 'border-blue-500'
                                : user.role === 'viewer'
                                ? 'border-amber-500'
                                : 'border-indigo-500'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 flex-wrap">
                              <span>{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-sm font-semibold">
                                  {currentLang === 'th' ? 'คุณ' : 'You'}
                                </span>
                              )}
                              {isLastAdmin && (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-bold">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{currentLang === 'th' ? 'Admin หลัก' : 'Primary Admin'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center space-x-2">
                              {user.phone ? (
                                <span className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{user.phone}</span>
                                </span>
                              ) : (
                                <span>-</span>
                              )}
                              {user.lineId && (
                                <span className="text-emerald-600 font-mono text-[10px]">
                                  LINE: {user.lineId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login ID & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-xs text-slate-800 bg-slate-100 inline-block px-2 py-0.5 rounded-md border border-slate-200">
                            @{user.loginId}
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                            {user.email}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span>Admin</span>
                          </span>
                        ) : user.role === 'viewer' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>Viewer</span>
                            </span>
                            <div className="text-[10px] text-amber-700">
                              {user.viewerPermissions?.canViewQuotations ? '✓ ใบเสนอราคา ' : ''}
                              {user.viewerPermissions?.canViewReports ? '✓ สถิติ ' : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Wrench className="w-3 h-3 text-indigo-600" />
                            <span>Technician</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{currentLang === 'th' ? 'ใช้งาน' : 'Active'}</span>
                          </span>
                        ) : user.status === 'suspended' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{currentLang === 'th' ? 'ระงับการใช้งาน' : 'Suspended'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>{currentLang === 'th' ? 'ลบแล้ว' : 'Deleted'}</span>
                          </span>
                        )}

                        {user.mustChangePassword && (
                          <div className="text-[10px] text-amber-700 font-medium mt-1">
                            ⚠️ {currentLang === 'th' ? 'ต้องเปลี่ยนรหัสผ่าน' : 'Must change password'}
                          </div>
                        )}
                      </td>

                      {/* Assigned Jobs */}
                      <td className="py-3.5 px-4 text-center">
                        {user.role === 'technician' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTechForJobs(user)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-300 font-bold text-xs transition-colors cursor-pointer group"
                            title="คลิกเพื่อดูรายการงานที่ช่างคนนี้รับผิดชอบ"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />
                            <span>{assignedCount} งาน</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {user.lastLoginAt ? (
                          <div className="flex items-center space-x-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{user.lastLoginAt}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {currentLang === 'th' ? 'ยังไม่เคยเข้าสู่ระบบ' : 'Never logged in'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setUserToEdit(user)}
                            disabled={isDeleted}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => setUserToResetPassword(user)}
                            disabled={isDeleted}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                            title="รีเซ็ตรหัสผ่านชั่วคราว"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Suspend / Reactivate */}
                          {user.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => setConfirmAction({ user, type: 'suspend' })}
                              disabled={isDeleted || user.id === currentUser.id || isLastAdmin}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                              title={isLastAdmin ? 'ไม่สามารถระงับ Admin คนสุดท้ายได้' : 'ระงับการใช้งานบัญชี'}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : user.status === 'suspended' ? (
                            <button
                              type="button"
                              onClick={() => setConfirmAction({ user, type: 'reactivate' })}
                              disabled={isDeleted}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                              title="เปิดใช้งานบัญชีอีกครั้ง"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Delete (Soft Delete) */}
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ user, type: 'delete' })}
                            disabled={isDeleted || user.id === currentUser.id || isLastAdmin}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                            title={isLastAdmin ? 'ไม่สามารถลบ Admin คนสุดท้ายได้' : 'ลบบัญชีผู้ใช้'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <UserFormModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={() => {
            setIsAddModalOpen(false);
            reloadUsers();
          }}
          showToast={showToast}
        />
      )}

      {userToEdit && (
        <UserFormModal
          userToEdit={userToEdit}
          onClose={() => setUserToEdit(null)}
          onSave={() => {
            setUserToEdit(null);
            reloadUsers();
          }}
          showToast={showToast}
        />
      )}

      {selectedTechForJobs && (
        <TechnicianJobsModal
          technician={selectedTechForJobs}
          tickets={tickets}
          onClose={() => setSelectedTechForJobs(null)}
          onSelectTicket={onSelectTicket}
        />
      )}

      {userToResetPassword && (
        <ResetPasswordConfirmModal
          user={userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
          onSuccess={(tempPass) => {
            setUserToResetPassword(null);
            reloadUsers();
          }}
          showToast={showToast}
        />
      )}

      {confirmAction && (
        <ConfirmActionModal
          user={confirmAction.user}
          actionType={confirmAction.type}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmActionExecute}
        />
      )}
    </div>
  );
};
