import { FixFlowRole } from '../types';

export type AuditActionType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_ROLE_CHANGED'
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'PASSWORD_RESET'
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_STATUS_CHANGED'
  | 'TECHNICIAN_ASSIGNED'
  | 'QUOTATION_CREATED'
  | 'QUOTATION_SENT'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REVISION_REQUESTED'
  | 'GUEST_LINK_CREATED'
  | 'GUEST_LINK_VIEWED'
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'WORK_ACCEPTED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: FixFlowRole | 'system' | 'guest';
  actionType: AuditActionType;
  targetType: 'user' | 'ticket' | 'quotation' | 'payment' | 'share_link' | 'company';
  targetId: string;
  targetLabel?: string;
  details: string;
  metadata?: Record<string, any>;
}

const AUDIT_LOGS_KEY = 'fixflow_audit_logs_v1';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-21 11:20',
    actorId: 'usr_tech_thana',
    actorName: 'ช่างธนา มั่นคง',
    actorRole: 'technician',
    actionType: 'TICKET_STATUS_CHANGED',
    targetType: 'ticket',
    targetId: 'ticket-1',
    targetLabel: 'JOB-2026-0001 (แอร์ห้องนอนไม่เย็น)',
    details: 'เปลี่ยนสถานะเป็น กำลังดำเนินการ และอัปโหลดภาพระหว่างล้างแอร์',
  },
  {
    id: 'log-002',
    timestamp: '2026-09-20 16:30',
    actorId: 'usr_admin_01',
    actorName: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    actorRole: 'admin',
    actionType: 'PAYMENT_RECORDED',
    targetType: 'payment',
    targetId: 'pay-2',
    targetLabel: 'INV-2026-0002 (คุณสมชาย มีสุข)',
    details: 'บันทึกการรับชำระเงินมัดจำล้างแอร์ 1,000.00 บาท ผ่านการโอนธนาคาร',
  },
  {
    id: 'log-003',
    timestamp: '2026-09-20 14:05',
    actorId: 'usr_admin_01',
    actorName: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    actorRole: 'admin',
    actionType: 'GUEST_LINK_CREATED',
    targetType: 'share_link',
    targetId: 'share_quotation_1',
    targetLabel: 'QT-2026-0001',
    details: 'สร้าง Guest Link สำหรับอนุมัติใบเสนอราคาให้ คุณสมชาย มีสุข (อายุ 15 วัน)',
  },
  {
    id: 'log-004',
    timestamp: '2026-09-20 14:00',
    actorId: 'usr_tech_thana',
    actorName: 'ช่างธนา มั่นคง',
    actorRole: 'technician',
    actionType: 'QUOTATION_CREATED',
    targetType: 'quotation',
    targetId: 'quote-1',
    targetLabel: 'QT-2026-0001',
    details: 'สร้างใบเสนอราคาค่าบริการล้างแอร์และน้ำยาแอร์ 2,461.00 บาท',
  },
  {
    id: 'log-005',
    timestamp: '2026-09-18 11:50',
    actorId: 'guest_cust_5',
    actorName: 'คุณอรทัย วงศ์วิจิตร (ลูกค้า)',
    actorRole: 'guest',
    actionType: 'WORK_ACCEPTED',
    targetType: 'ticket',
    targetId: 'ticket-5',
    targetLabel: 'JOB-2026-0005 (ก๊อกน้ำฝักบัว)',
    details: 'ลูกค้าตรวจรับงานซ่อมแซมก๊อกน้ำเสร็จสมบูรณ์ พร้อมลงลายมือชื่อดิจิทัล (คะแนน 5/5 ดาว)',
  },
];

export const ActivityLogService = {
  getLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_KEY);
      if (!stored) {
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(stored) as AuditLogEntry[];
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  /**
   * Append-only audit logger
   */
  logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    logs.unshift(newEntry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    return newEntry;
  },

  getLogsByTarget(targetType: AuditLogEntry['targetType'], targetId: string): AuditLogEntry[] {
    return this.getLogs().filter((l) => l.targetType === targetType && l.targetId === targetId);
  },

  getLogsByActor(actorId: string): AuditLogEntry[] {
    return this.getLogs().filter((l) => l.actorId === actorId);
  },
};
