import React, { useState, useEffect } from 'react';
import {
  RepairTicket,
  User,
} from './types';
import { TicketService, DEMO_USERS } from './services/ticketService';
import { AuthService } from './services/authService';
import { ShareLinkService } from './services/shareLinkService';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { TicketForm } from './components/TicketForm';
import { TicketDetail } from './components/TicketDetail';
import { CalendarView } from './components/CalendarView';
import { HistoryReportView } from './components/HistoryReportView';
import { QuotationView } from './components/QuotationView';
import { LoginPage } from './components/LoginPage';
import { GuestTicketView } from './components/GuestTicketView';
import { GuestQuotationView } from './components/GuestQuotationView';
import { GuestWorkAcceptance } from './components/GuestWorkAcceptance';
import { CustomersView } from './components/CustomersView';
import { PaymentsView } from './components/PaymentsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { MyProfileModal } from './components/MyProfileModal';
import { PrintableQrModal } from './components/PrintableQrModal';
import { UserManagement } from './components/UserManagement';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ToastContainer, ToastMessage } from './components/Toast';

interface GuestRouteState {
  type: 'job' | 'quotation' | 'acceptance';
  token: string;
}

export function App() {
  // State
  const [tickets, setTickets] = useState<RepairTicket[]>(() => TicketService.getTickets());
  const [currentUser, setCurrentUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Guest Route State (reads hash #/guest/job/:token or #/guest/quotation/:token or #/guest/acceptance/:token)
  const [guestRoute, setGuestRoute] = useState<GuestRouteState | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/guest/job/')) {
      const token = hash.replace('#/guest/job/', '').split('?')[0];
      return { type: 'job', token };
    }
    if (hash.startsWith('#/guest/quotation/')) {
      const token = hash.replace('#/guest/quotation/', '').split('?')[0];
      return { type: 'quotation', token };
    }
    if (hash.startsWith('#/guest/acceptance/')) {
      const token = hash.replace('#/guest/acceptance/', '').split('?')[0];
      return { type: 'acceptance', token };
    }
    return null;
  });

  // Listen for hash change for guest navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/guest/job/')) {
        const token = hash.replace('#/guest/job/', '').split('?')[0];
        setGuestRoute({ type: 'job', token });
      } else if (hash.startsWith('#/guest/quotation/')) {
        const token = hash.replace('#/guest/quotation/', '').split('?')[0];
        setGuestRoute({ type: 'quotation', token });
      } else if (hash.startsWith('#/guest/acceptance/')) {
        const token = hash.replace('#/guest/acceptance/', '').split('?')[0];
        setGuestRoute({ type: 'acceptance', token });
      } else {
        setGuestRoute(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Reload tickets from storage
  const reloadTickets = () => {
    const data = TicketService.getTickets();
    setTickets(data);
  };

  // Toast Helper
  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Select Ticket Handler
  const handleSelectTicket = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from Detail Handler
  const handleBackFromDetail = () => {
    setSelectedTicket(null);
  };

  // Update Ticket Handler
  const handleTicketUpdated = (updated: RepairTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
  };

  // New Ticket Success Handler
  const handleNewTicketSuccess = (newTicket: RepairTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    showToast('สร้างใบแจ้งซ่อมสำเร็จ', `เลขที่ใบงาน: ${newTicket.jobNumber}`, 'success');
  };

  // Tab Selection Handler
  const handleSelectTab = (tab: NavTab) => {
    // If technician or viewer tries to access user management, redirect to tickets
    if ((currentUser?.role === 'technician' || currentUser?.role === 'viewer') && tab === 'users') {
      setCurrentTab('tickets');
      return;
    }
    setCurrentTab(tab);
    setSelectedTicket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Mock Data Handler
  const handleResetMockData = () => {
    const fresh = TicketService.resetMockData();
    setTickets(fresh);
    setSelectedTicket(null);
  };

  // Logout Handler
  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setSelectedTicket(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', undefined, 'info');
  };

  // Open Guest Mode Demo Handler
  const handleOpenGuestDemo = () => {
    // Look for ticket-1 or first ticket
    const target = tickets[0];
    if (!target) {
      showToast('ไม่พบงานซ่อมในระบบสำหรับเปิดลิงก์', undefined, 'error');
      return;
    }

    let activeLink = ShareLinkService.getActiveShareLinkForTarget('ticket', target.id);
    if (!activeLink) {
      activeLink = ShareLinkService.createShareLink({
        targetType: 'ticket',
        targetId: target.id,
        createdBy: currentUser?.name || 'ระบบอัตโนมัติ',
        allowImages: true,
        allowTimeline: true,
        maskLocation: true,
      });
    }

    window.location.hash = `#/guest/job/${activeLink.token}`;
  };

  // Exit Guest Mode Handler
  const handleExitGuestMode = () => {
    window.location.hash = '';
    setGuestRoute(null);
  };

  // 1. If Guest Route is Active -> Render Public Guest Page
  if (guestRoute) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
        {guestRoute.type === 'job' ? (
          <GuestTicketView
            shareToken={guestRoute.token}
            onNavigateToQuotation={(qToken) => {
              window.location.hash = `#/guest/quotation/${qToken}`;
            }}
            onNavigateToAcceptance={(aToken) => {
              window.location.hash = `#/guest/acceptance/${aToken}`;
            }}
            onExitGuest={handleExitGuestMode}
          />
        ) : guestRoute.type === 'quotation' ? (
          <GuestQuotationView
            shareToken={guestRoute.token}
            onNavigateToJob={(jToken) => {
              window.location.hash = `#/guest/job/${jToken}`;
            }}
            onExitGuest={handleExitGuestMode}
            showToast={showToast}
          />
        ) : (
          <GuestWorkAcceptance
            shareToken={guestRoute.token}
            onNavigateToJob={(jToken) => {
              window.location.hash = `#/guest/job/${jToken}`;
            }}
            onExitGuest={handleExitGuestMode}
            showToast={showToast}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  // 2. If Not Logged In -> Render Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showToast(`ยินดีต้อนรับ ${user.name}`, `เข้าสู่ระบบในบทบาท "${user.role}" สำเร็จ`, 'success');
          }}
          onOpenGuestMode={handleOpenGuestDemo}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  // 3. Logged-in Application Shell
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSelectUser={(user) => {
          AuthService.switchUser(user);
          setCurrentUser(user);
          // If switching to technician and currently on reports, users, or company, navigate to tickets
          if (user.role === 'technician' && (currentTab === 'reports' || currentTab === 'users' || currentTab === 'company')) {
            setCurrentTab('tickets');
          }
          showToast(`สลับบทบาทเป็น "${user.name}" (${user.role})`, undefined, 'info');
        }}
        onNewTicketClick={() => handleSelectTab('new_ticket')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onLogout={handleLogout}
        onOpenGuestMode={handleOpenGuestDemo}
        onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onNavigateTicket={(ticketId) => {
          const target = tickets.find((t) => t.id === ticketId || t.jobNumber === ticketId);
          if (target) {
            setSelectedTicket(target);
            setCurrentTab('tickets');
          }
        }}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          tickets={tickets}
          currentUser={currentUser}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
          onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
          {/* If a ticket is currently selected, show detail */}
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              currentUser={currentUser}
              onBack={handleBackFromDetail}
              onTicketUpdated={handleTicketUpdated}
              showToast={showToast}
            />
          ) : currentTab === 'dashboard' ? (
            <Dashboard
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={handleSelectTicket}
              onNewTicketClick={() => handleSelectTab('new_ticket')}
              onNavigateTab={(tab) => handleSelectTab(tab as NavTab)}
              onOpenQrModal={() => setShowQrModal(true)}
              onOpenGuestMode={handleOpenGuestDemo}
            />
          ) : currentTab === 'tickets' ? (
            <TicketList
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={handleSelectTicket}
              onNewTicketClick={() => handleSelectTab('new_ticket')}
            />
          ) : currentTab === 'new_ticket' ? (
            <TicketForm
              currentUser={currentUser}
              onSuccess={handleNewTicketSuccess}
              onCancel={() => handleSelectTab('dashboard')}
            />
          ) : currentTab === 'calendar' ? (
            <CalendarView
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              onNewTicketClick={() => handleSelectTab('new_ticket')}
            />
          ) : currentTab === 'quotations' ? (
            <QuotationView
              currentUser={currentUser}
              onNavigateTicket={(ticketId) => {
                const found = tickets.find(
                  (t) => t.id === ticketId || t.jobNumber === ticketId
                );
                if (found) handleSelectTicket(found);
              }}
              showToast={showToast}
            />
          ) : currentTab === 'payments' ? (
            <PaymentsView
              currentUser={currentUser}
              onSelectTicket={handleSelectTicket}
              showToast={showToast}
            />
          ) : currentTab === 'customers' ? (
            <CustomersView
              currentUser={currentUser}
              onSelectTicket={handleSelectTicket}
              showToast={showToast}
            />
          ) : currentTab === 'company' ? (
            <CompanySettingsView
              currentUser={currentUser}
              showToast={showToast}
            />
          ) : currentTab === 'reports' ? (
            <HistoryReportView
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              onResetData={handleResetMockData}
              showToast={showToast}
            />
          ) : currentTab === 'users' ? (
            <UserManagement
              currentUser={currentUser}
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              showToast={showToast}
            />
          ) : null}
        </main>
      </div>

      {/* Printable Room QR Code Sheet Modal (Admin) */}
      {showQrModal && currentUser.role === 'admin' && (
        <PrintableQrModal
          tickets={tickets}
          currentUser={currentUser}
          onClose={() => setShowQrModal(false)}
          showToast={showToast}
        />
      )}

      {/* My Profile Modal */}
      {isProfileModalOpen && currentUser && (
        <MyProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            showToast('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว', undefined, 'success');
          }}
          showToast={showToast}
        />
      )}

      {/* Forced First-time Password Change Modal */}
      {currentUser?.mustChangePassword && (
        <ChangePasswordModal
          user={currentUser}
          isForcedFirstTime={true}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            showToast('เปลี่ยนรหัสผ่านเริ่มต้นสำเร็จ', 'เข้าสู่ระบบและเริ่มใช้งานได้ทันที', 'success');
          }}
        />
      )}

      {/* Voluntary Change Password Modal */}
      {!currentUser?.mustChangePassword && isChangePasswordModalOpen && (
        <ChangePasswordModal
          user={currentUser}
          isForcedFirstTime={false}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            setIsChangePasswordModalOpen(false);
            showToast('เปลี่ยนรหัสผ่านเรียบร้อย', 'รหัสผ่านใหม่ของคุณมีผลใช้งานทันที', 'success');
          }}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;

