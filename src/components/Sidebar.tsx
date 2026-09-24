import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  CalendarDays,
  X,
  Users,
  Contact,
  Shield,
  Eye,
  AlertTriangle,
  KeyRound,
  LogOut,
  FileText,
  CreditCard,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { RepairTicket, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

export type NavTab =
  | 'dashboard'
  | 'tickets'
  | 'new_ticket'
  | 'calendar'
  | 'quotations'
  | 'payments'
  | 'customers'
  | 'company'
  | 'reports'
  | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  tickets: RepairTicket[];
  currentUser?: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  onChangePasswordClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  tickets,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  onChangePasswordClick,
}) => {
  const { t, currentLang } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const isTechnician = currentUser?.role === 'technician';
  const isViewer = currentUser?.role === 'viewer';

  // For technicians, count only tickets assigned to them
  const visibleTickets = isTechnician
    ? tickets.filter(
        (t) =>
          t.assignedTechnician === currentUser?.name ||
          t.assignedTechnician?.includes(currentUser?.name?.split(' ')[0] || '')
      )
    : tickets;

  const pendingCount = visibleTickets.filter(
    (t) => t.status === 'new' || t.status === 'assigned' || t.status === 'in_progress'
  ).length;

  const urgentCount = visibleTickets.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'emergency') && t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  const allNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: t('navDashboard'),
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      id: 'tickets' as NavTab,
      label: isTechnician
        ? currentLang === 'th' ? 'งานที่รับมอบหมาย' : 'My Assigned Jobs'
        : t('navAllJobs'),
      icon: ClipboardList,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-blue-100 text-blue-700',
      visible: true,
    },
    {
      id: 'new_ticket' as NavTab,
      label: t('navNewTicket'),
      icon: PlusCircle,
      badge: null,
      visible: isAdmin, // Only Admin creates new tickets in Phase 1
    },
    {
      id: 'calendar' as NavTab,
      label: isTechnician
        ? currentLang === 'th' ? 'ปฏิทินงานของฉัน' : 'My Schedule'
        : t('navCalendar'),
      icon: CalendarDays,
      badge: null,
      visible: isAdmin || isTechnician || (isViewer && currentUser?.viewerPermissions?.canViewCalendar !== false),
    },
    {
      id: 'customers' as NavTab,
      label: t('navCustomers'),
      icon: Contact,
      badge: null,
      visible: isAdmin || (isViewer && currentUser?.viewerPermissions?.canViewCustomers !== false),
    },
    {
      id: 'reports' as NavTab,
      label: t('navReports'),
      icon: FileSpreadsheet,
      badge: null,
      visible: isAdmin || (isViewer && currentUser?.viewerPermissions?.canViewReports !== false),
    },
    {
      id: 'users' as NavTab,
      label: t('navUserManagement'),
      icon: Users,
      badge: null,
      visible: isAdmin, // Only Admin manages users
    },
    {
      id: 'company' as NavTab,
      label: t('navCompanySettings'),
      icon: Building2,
      badge: null,
      visible: isAdmin,
    },
  ];

  const navItems = allNavItems.filter((item) => item.visible);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Desktop & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base text-slate-900 font-display">FixFlow</span>
            <span className="text-xs text-slate-500">
              {currentLang === 'th' ? 'เมนูนำทาง' : 'Navigation'}
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {currentLang === 'th' ? 'เมนูหลัก' : 'Main Menu'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/30'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Alert Widget in Sidebar */}
          {urgentCount > 0 && (
            <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{currentLang === 'th' ? 'งานด่วนรอจัดการ' : 'Urgent Tickets Pending'}</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {currentLang === 'th' ? (
                  <>
                    มีงานระดับด่วน/ฉุกเฉิน <strong className="font-extrabold">{urgentCount}</strong> รายการที่ยังดำเนินการไม่เสร็จสิ้น
                  </>
                ) : (
                  <>
                    <strong className="font-extrabold">{urgentCount}</strong> urgent tickets require attention.
                  </>
                )}
              </p>
              <button
                onClick={() => {
                  onSelectTab('tickets');
                  onCloseMobile();
                }}
                className="mt-2 text-[11px] font-bold text-amber-900 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>{currentLang === 'th' ? 'ตรวจดูรายการด่วน →' : 'View Urgent Tasks →'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer user profile and logout */}
        {currentUser && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <img
                  src={
                    currentUser.avatarUrl ||
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
                  }
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 truncate">
                    <span className="font-mono text-blue-600 font-bold">@{currentUser.loginId}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {onChangePasswordClick && (
                  <button
                    type="button"
                    onClick={onChangePasswordClick}
                    title={currentLang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title={t('signOut')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentLang === 'th' ? 'ออนไลน์' : 'Online'}</span>
              </span>
              <span>FixFlow v2.0</span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (Top 5 primary tabs) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition relative ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 max-w-[64px] truncate">{item.label}</span>
              {item.badge !== null && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

