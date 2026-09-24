import { Notification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'fixflow_notifications_v2';

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'งานฉุกเฉินใหม่ (JOB-2026-0002)',
    message: 'ท่อน้ำใต้อ่างล้างจานรั่วซึม อาคาร B ชั้น 14 ห้อง 1405 ต้องการเข้าซ่อมด่วน',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    ticketId: 'ticket-2',
  },
  {
    id: 'notif-2',
    title: 'ลูกค้าอนุมัติใบเสนอราคา (QT-2026-0001)',
    message: 'คุณสมชาย มีสุข ได้อนุมัติใบเสนอราคาล้างแอร์ 2,461.00 บาทแล้ว',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    read: false,
    ticketId: 'ticket-1',
  },
  {
    id: 'notif-3',
    title: 'ลูกค้าตรวจรับงานและเซ็นรับมอบ (JOB-2026-0005)',
    message: 'คุณอรทัย วงศ์วิจิตร ได้ลงนามดิจิทัลตรวจรับงานและให้คะแนน 5 ดาว',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    read: true,
    ticketId: 'ticket-5',
  },
  {
    id: 'notif-4',
    title: 'การรับประกันงานใกล้ครบกำหนด',
    message: 'งานซ่อม JOB-2026-0004 จะสิ้นสุดระยะเวลารับประกัน 90 วัน ในอีก 5 วัน',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read: true,
    ticketId: 'ticket-4',
  },
];

export const NotificationService = {
  getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifications: Notification[]) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  },

  addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const list = this.getNotifications();
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  },

  markAsRead(id: string): void {
    const list = this.getNotifications();
    const index = list.findIndex((n) => n.id === id);
    if (index !== -1) {
      list[index].read = true;
      this.saveNotifications(list);
    }
  },

  markAllAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
  },

  deleteNotification(id: string): void {
    const list = this.getNotifications().filter((n) => n.id !== id);
    this.saveNotifications(list);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.read).length;
  },
};
