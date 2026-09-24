import React, { useState } from 'react';
import {
  Wrench,
  PlusCircle,
  Bell,
  Menu,
  Shield,
  UserCheck,
  HardHat,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  ExternalLink,
  KeyRound,
  Eye,
} from 'lucide-react';
import { User, FixFlowRole, Notification } from '../types';
import { AuthService } from '../services/authService';
import { NotificationService } from '../services/notificationService';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onNewTicketClick: () => void;
  onToggleMobileSidebar: () => void;
  onLogout?: () => void;
  onOpenGuestMode?: () => void;
  onChangePasswordClick?: () => void;
  onProfileClick?: () => void;
  onNavigateTicket?: (ticketId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  onNewTicketClick,
  onToggleMobileSidebar,
  onLogout,
  onOpenGuestMode,
  onChangePasswordClick,
  onProfileClick,
  onNavigateTicket,
}) => {
  const { t, currentLang } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    NotificationService.getNotifications()
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const availableUsers = AuthService.getUsers().filter((u) => u.status !== 'deleted');

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    setNotifications(NotificationService.getNotifications());
  };

  const handleNotificationClick = (notif: Notification) => {
    NotificationService.markAsRead(notif.id);
    setNotifications(NotificationService.getNotifications());
    if (notif.ticketId && onNavigateTicket) {
      onNavigateTicket(notif.ticketId);
      setShowNotificationMenu(false);
    }
  };

  const getRoleIcon = (role: FixFlowRole | 'viewer') => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'technician':
        return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-teal-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRoleBadge = (role: FixFlowRole | 'viewer') => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'technician':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'viewer':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRoleLabel = (role: FixFlowRole | 'viewer') => {
    switch (role) {
      case 'admin':
        return currentLang === 'th' ? 'ผู้ดูแลระบบ (Admin)' : 'Administrator';
      case 'technician':
        return currentLang === 'th' ? 'ช่างซ่อม (Technician)' : 'Technician';
      case 'viewer':
        return currentLang === 'th' ? 'ผู้ดูอย่างเดียว (Viewer)' : 'Read-only Viewer';
      default:
        return currentLang === 'th' ? 'ลูกค้า (Guest)' : 'Guest Client';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Mobile Hamburger & Logo */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Wrench className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 font-display">FixFlow</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block -mt-0.5">
              {currentLang === 'th'
                ? 'ระบบจัดการงานช่างและซ่อมบำรุง'
                : 'Property Maintenance & Service Management'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Language, New Ticket Action, Notifications & User Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Language Switcher */}
        <LanguageSwitcher variant="header" />

        {/* New Ticket Button - Only for Admin or Tech with permission */}
        {currentUser.role !== 'viewer' && (
          <button
            onClick={onNewTicketClick}
            id="btn-header-new-ticket"
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('navNewTicket')}</span>
            <span className="sm:hidden">{t('create')}</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowRoleMenu(false);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative transition cursor-pointer"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {currentLang === 'th' ? 'การแจ้งเตือนระบบ' : 'System Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} ใหม่
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    {currentLang === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs hover:bg-slate-50 transition cursor-pointer ${
                        !n.read ? 'bg-blue-50/50 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-slate-900">{n.title}</h4>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block flex items-center space-x-1">
                        <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                        {new Date(n.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    ไม่มีการแจ้งเตือนใหม่
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotificationMenu(false);
            }}
            id="btn-header-profile"
            className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer text-left"
          >
            <img
              src={
                currentUser.avatarUrl ||
                currentUser.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
              }
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden md:block">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border inline-block ${getRoleBadge(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentLang === 'th' ? 'สลับบัญชีทดสอบระบบ' : 'Switch Demo Account'}
                </p>
                <p className="text-xs text-slate-600">
                  {currentLang === 'th' ? 'คลิกเพื่อเปลี่ยนมุมมอง Admin / Technician / Viewer' : 'Test role permissions & views'}
                </p>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {availableUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 text-blue-900 border border-blue-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={
                            user.avatarUrl ||
                            user.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
                          }
                          alt={user.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                            <span className="font-mono text-blue-600 font-semibold">@{user.loginId}</span>
                            <span>•</span>
                            <span>{getRoleLabel(user.role)}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions in Dropdown */}
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                {onProfileClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onProfileClick();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('navMyProfile')}</span>
                  </button>
                )}

                {onChangePasswordClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onChangePasswordClick();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentLang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('signOut')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

