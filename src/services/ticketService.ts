import {
  RepairTicket,
  Comment,
  TicketImage,
  Expense,
  ActivityLog,
  TicketStatus,
  User,
} from '../types';

const STORAGE_KEY = 'fixflow_tickets_phase1';
const USERS_KEY = 'fixflow_users_v1';

export const DEMO_USERS: User[] = [
  {
    id: 'user_admin',
    loginId: 'admin.fixflow',
    name: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    role: 'admin',
    phone: '02-987-6543',
    email: 'admin@company.com',
    propertyName: 'สำนักงานนิติบุคคลส่วนกลาง',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-20 08:30',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_technician',
    loginId: 'technician.thana',
    name: 'ช่างธนา มั่นคง',
    role: 'technician',
    phone: '089-765-4321',
    email: 'thana@company.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-19 16:45',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_resident',
    loginId: 'resident.somchai',
    name: 'คุณสมชาย มีสุข',
    role: 'resident',
    phone: '081-234-5678',
    email: 'somchai@gmail.com',
    propertyName: 'ลุมพินี พาร์ค ริเวอร์ไซด์',
    unitNumber: '812',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-18 10:20',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

export const TECHNICIANS_LIST = [
  { name: 'สมชาย ช่างแอร์', phone: '089-765-4321', specialty: 'ช่างแอร์ & ระบบความเย็น' },
  { name: 'วิชัย ช่างประปา', phone: '084-555-1212', specialty: 'ช่างประปา & ท่อสุขภัณฑ์' },
];

export const INITIAL_MOCK_TICKETS: RepairTicket[] = [
  {
    id: 'ticket-1',
    jobNumber: 'JOB-2026-0001',
    title: 'แอร์ห้องนอนไม่เย็น มีน้ำหยดลงเตียงนอน',
    description: 'เปิดแอร์ไว้ทั้งคืนแล้วมีเสียงลมดังผิดปกติ ลมไม่ออกความเย็น และมีน้ำไหลหยดจากตัวคอยล์เย็นลงบนฟูกที่นอน รบกวนช่วยตรวจสอบเร่งด่วน',
    category: 'air_conditioner',
    priority: 'urgent',
    status: 'assigned',
    propertyType: 'condo',
    propertyName: 'คอนโดสุขุมวิท 42',
    building: 'อาคาร A',
    floor: '8',
    unitNumber: '812',
    requesterName: 'คุณอรทัย วงศ์วิจิตร',
    requesterPhone: '083-456-7890',
    assignedTechnician: 'สมชาย ช่างแอร์',
    assignedTechnicianPhone: '089-765-4321',
    appointment: {
      date: '2026-09-24',
      timeSlot: '13:00 - 16:00',
      notes: 'ลูกบ้านสะดวกรับช่างช่วงบ่าย มีคีย์การ์ดสำรองฝากไว้ที่นิติบุคคลหากไม่อยู่',
    },
    createdAt: '2026-09-20 09:30',
    updatedAt: '2026-09-21 11:15',
    images: [
      {
        id: 'img-1-1',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        phase: 'before',
        isPrimary: true,
        caption: 'จุดที่น้ำแอร์หยดซึมลงที่นอน',
        uploadedAt: '2026-09-20 09:30',
        uploaderName: 'คุณอรทัย วงศ์วิจิตร',
      },
    ],
    comments: [
      {
        id: 'c-1-1',
        authorId: 'usr_admin_01',
        authorName: 'คุณแอดมิน',
        authorRole: 'admin',
        content: 'รับเรื่องแล้ว ประสานงานมอบหมายให้สมชาย ช่างแอร์ เข้าตรวจสอบตามเวลานัดหมายครับ',
        createdAt: '2026-09-20 10:15',
      },
    ],
    expenses: [
      {
        id: 'exp-1-1',
        type: 'labor',
        description: 'ค่าบริการตรวจเช็กล้างแอร์ติดผนังและเป่าท่อน้ำทิ้ง',
        amount: 600,
        quantity: 1,
        unitPrice: 600,
        date: '2026-09-21',
      },
    ],
    activityLogs: [
      {
        id: 'act-1-1',
        timestamp: '2026-09-20 09:30',
        actorName: 'คุณอรทัย วงศ์วิจิตร',
        action: 'สร้างใบแจ้งซ่อม',
        details: 'แจ้งปัญหาแอร์ไม่เย็นและมีน้ำหยด',
      },
      {
        id: 'act-1-2',
        timestamp: '2026-09-20 10:15',
        actorName: 'คุณแอดมิน',
        action: 'มอบหมายช่าง',
        details: 'มอบหมายงานให้ สมชาย ช่างแอร์',
      },
    ],
  },
  {
    id: 'ticket-2',
    jobNumber: 'JOB-2026-0002',
    title: 'น้ำรั่วใต้ซิงก์ล้างจาน ซึมลงพื้นตู้บิวท์อิน',
    description: 'มีน้ำรั่วจากข้อต่อสายน้ำดีใต้อ่างล้างจานห้องครัว น้ำเริ่มซึมเข้าไม้บิวท์อิน มีกลิ่นอับ ชื้น กลัวไม้บวมเสียหาย ขอช่างเข้าดูโดยด่วนที่สุด',
    category: 'plumbing',
    priority: 'emergency',
    status: 'in_progress',
    propertyType: 'house',
    propertyName: 'บ้านเดี่ยวลาดพร้าว 71',
    building: 'บ้านเลขที่ 99/12',
    floor: '1',
    unitNumber: '99/12',
    requesterName: 'คุณณัฐ สิทธิวงศ์',
    requesterPhone: '089-999-1122',
    assignedTechnician: 'วิชัย ช่างประปา',
    assignedTechnicianPhone: '084-555-1212',
    appointment: {
      date: '2026-09-23',
      timeSlot: '14:00 - 17:00',
      notes: 'กรณีฉุกเฉินน้ำรั่ว ช่างวิชัยนำอะไหล่ข้อต่อและสายน้ำดีเข้าทันที',
    },
    createdAt: '2026-09-21 08:10',
    updatedAt: '2026-09-21 14:00',
    images: [
      {
        id: 'img-2-1',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
        phase: 'before',
        isPrimary: true,
        caption: 'รอยน้ำซึมจากเกลียวข้อต่อใต้อ่าง',
        uploadedAt: '2026-09-21 08:10',
        uploaderName: 'คุณณัฐ สิทธิวงศ์',
      },
      {
        id: 'img-2-2',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        phase: 'during',
        isPrimary: false,
        caption: 'กำลังรื้อเปลี่ยนข้อต่อท่อน้ำทิ้งและพันเทปเกลียวใหม่',
        uploadedAt: '2026-09-21 14:15',
        uploaderName: 'วิชัย ช่างประปา',
      },
    ],
    comments: [
      {
        id: 'c-2-1',
        authorId: 'usr_admin_01',
        authorName: 'คุณแอดมิน',
        authorRole: 'admin',
        content: 'จัดคิวกรณีฉุกเฉิน มอบหมายช่างวิชัยเข้าหน้างานช่วงบ่ายวันนี้ครับ',
        createdAt: '2026-09-21 08:45',
      },
      {
        id: 'c-2-2',
        authorId: 'usr_tech_02',
        authorName: 'วิชัย ช่างประปา',
        authorRole: 'technician',
        content: 'ถึงหน้างานแล้วครับ พบปะเก็นยางเสื่อมสภาพและเกลียวข้อต่อหลวม กำลังเปลี่ยนชุดสายน้ำดีใหม่ครับ',
        createdAt: '2026-09-21 14:10',
      },
    ],
    expenses: [
      {
        id: 'exp-2-1',
        type: 'part',
        description: 'สายน้ำดีสแตนเลสถัก 1/2 นิ้ว ยาว 40 ซม.',
        amount: 220,
        quantity: 1,
        unitPrice: 220,
        date: '2026-09-21',
      },
    ],
    activityLogs: [
      {
        id: 'act-2-1',
        timestamp: '2026-09-21 08:10',
        actorName: 'คุณณัฐ สิทธิวงศ์',
        action: 'สร้างใบแจ้งซ่อม',
        details: 'แจ้งเหตุน้ำรั่วซึมใต้อ่างล้างจานระดับฉุกเฉิน',
      },
      {
        id: 'act-2-2',
        timestamp: '2026-09-21 08:45',
        actorName: 'คุณแอดมิน',
        action: 'มอบหมายช่าง',
        details: 'มอบหมายงานให้ วิชัย ช่างประปา',
      },
      {
        id: 'act-2-3',
        timestamp: '2026-09-21 14:00',
        actorName: 'วิชัย ช่างประปา',
        action: 'เปลี่ยนสถานะเป็น กำลังดำเนินการ',
        details: 'ช่างวิชัยถึงหน้างานและเริ่มดำเนินการซ่อม',
      },
    ],
  },
  {
    id: 'ticket-3',
    jobNumber: 'JOB-2026-0003',
    title: 'หลอดไฟทางเดินเสีย ดับสนิท 2 โคม',
    description: 'หลอดไฟ LED โคมทางเดินโถงกลางอาคาร A ดับสนิท 2 จุด ทำให้ทางเดินมืดในช่วงค่ำ ขอให้ฝ่ายช่างเข้าตรวจสอบและเปลี่ยนหลอดใหม่',
    category: 'electrical',
    priority: 'normal',
    status: 'new',
    propertyType: 'condo',
    propertyName: 'คอนโดมิเนียม ABC รัชดา',
    building: 'อาคาร A',
    floor: '3',
    unitNumber: 'โถงทางเดินชั้น 3',
    requesterName: 'นิติบุคคลคอนโด ABC',
    requesterPhone: '02-123-4567',
    appointment: {
      date: '2026-09-25',
      timeSlot: '09:00 - 12:00',
      notes: 'ติดต่อขอเบิกกุญแจและบันไดที่เคาน์เตอร์นิติบุคคลชั้น 1',
    },
    createdAt: '2026-09-22 10:30',
    updatedAt: '2026-09-22 10:30',
    images: [
      {
        id: 'img-3-1',
        url: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=800&q=80',
        phase: 'before',
        isPrimary: true,
        caption: 'โคมดาวน์ไลท์ทางเดินดับ 2 ตำแหน่ง',
        uploadedAt: '2026-09-22 10:30',
        uploaderName: 'นิติบุคคลคอนโด ABC',
      },
    ],
    comments: [],
    expenses: [],
    activityLogs: [
      {
        id: 'act-3-1',
        timestamp: '2026-09-22 10:30',
        actorName: 'นิติบุคคลคอนโด ABC',
        action: 'สร้างใบแจ้งซ่อม',
        details: 'ส่งแจ้งงานใหม่เข้าระบบ รอการมอบหมายช่าง',
      },
    ],
  },
  {
    id: 'ticket-4',
    jobNumber: 'JOB-2026-0004',
    title: 'ประตูล็อกไม่ได้ กลอนประตูดิจิทัล Smart Door Lock ขัดข้อง',
    description: 'กลอนประตูดิจิทัล Smart Door Lock แตะคีย์การ์ดแล้วสแกนไม่ผ่าน มีเสียงปี๊บเตือนรัว สลักกลอนไม่ดีดล็อก ต้องใช้กุญแจสำรองไขแทน กลัวความปลอดภัย',
    category: 'doors_windows',
    priority: 'urgent',
    status: 'scheduled',
    propertyType: 'condo',
    propertyName: 'ทาวน์โฮมบางนา กม.5',
    building: 'ทาวน์โฮม 3 ชั้น',
    floor: '1',
    unitNumber: '128/45',
    requesterName: 'คุณพิมพ์ ชัยมงคล',
    requesterPhone: '087-123-9988',
    assignedTechnician: 'สมชาย ช่างแอร์',
    assignedTechnicianPhone: '089-765-4321',
    appointment: {
      date: '2026-09-26',
      timeSlot: '10:00 - 12:00',
      notes: 'นัดหมายวันเสาร์ช่วงเช้า ลูกบ้านอยู่รอต้อนรับ',
    },
    createdAt: '2026-09-22 14:00',
    updatedAt: '2026-09-22 15:30',
    images: [
      {
        id: 'img-4-1',
        url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
        phase: 'before',
        isPrimary: true,
        caption: 'แผงปุ่มกดขึ้นไฟกะพริบสีแดงเตือนข้อผิดพลาด',
        uploadedAt: '2026-09-22 14:00',
        uploaderName: 'คุณพิมพ์ ชัยมงคล',
      },
    ],
    comments: [
      {
        id: 'c-4-1',
        authorId: 'usr_admin_01',
        authorName: 'คุณแอดมิน',
        authorRole: 'admin',
        content: 'นัดหมายสมชาย ช่างแอร์ เข้าตรวจเช็กมอเตอร์สลักกลอนประตูดิจิทัลวันเสาร์นี้ครับ',
        createdAt: '2026-09-22 15:30',
      },
    ],
    expenses: [],
    activityLogs: [
      {
        id: 'act-4-1',
        timestamp: '2026-09-22 14:00',
        actorName: 'คุณพิมพ์ ชัยมงคล',
        action: 'สร้างใบแจ้งซ่อม',
        details: 'แจ้งปัญหากลอนประตูดิจิทัลขัดข้อง',
      },
      {
        id: 'act-4-2',
        timestamp: '2026-09-22 15:30',
        actorName: 'คุณแอดมิน',
        action: 'นัดหมายวันเข้าบริการ',
        details: 'นัดหมายวันที่ 26 ก.ย. 2026 เวลา 10:00 - 12:00 น.',
      },
    ],
  },
];

export const TicketService = {
  getTickets(): RepairTicket[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage, using initial mock data', e);
    }
    // Initialize with mock data
    this.saveTickets(INITIAL_MOCK_TICKETS);
    return INITIAL_MOCK_TICKETS;
  },

  saveTickets(tickets: RepairTicket[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets to localStorage', e);
    }
  },

  getTicketById(id: string): RepairTicket | undefined {
    const tickets = this.getTickets();
    return tickets.find((t) => t.id === id || t.jobNumber === id);
  },

  createTicket(
    data: Omit<RepairTicket, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt' | 'comments' | 'expenses' | 'activityLogs'> & {
      comments?: Comment[];
      expenses?: Expense[];
      activityLogs?: ActivityLog[];
    }
  ): RepairTicket {
    const tickets = this.getTickets();
    const currentYear = new Date().getFullYear();
    const count = tickets.length + 1;
    const formattedCount = String(count).padStart(4, '0');
    const jobNumber = `JOB-${currentYear}-${formattedCount}`;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTicket: RepairTicket = {
      ...data,
      id: `ticket-${Date.now()}`,
      jobNumber,
      createdAt: dateStr,
      updatedAt: dateStr,
      comments: data.comments || [],
      expenses: data.expenses || [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: dateStr,
          actorName: data.requesterName || 'ผู้แจ้งงาน',
          action: data.isDraft ? 'บันทึกร่างใบแจ้งซ่อม' : 'สร้างใบแจ้งซ่อม',
          details: `สร้างใบแจ้งซ่อมเลขที่ ${jobNumber}`,
        },
      ],
    };

    const updatedList = [newTicket, ...tickets];
    this.saveTickets(updatedList);
    return newTicket;
  },

  updateTicket(id: string, updates: Partial<RepairTicket>, actorName = 'ผู้ดูแลระบบ'): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const logs = [...(prev.activityLogs || [])];
    if (updates.status && updates.status !== prev.status) {
      logs.unshift({
        id: `act-${Date.now()}`,
        timestamp: dateStr,
        actorName,
        action: 'เปลี่ยนสถานะงาน',
        details: `เปลี่ยนสถานะจาก "${prev.status}" เป็น "${updates.status}"`,
      });
    }

    if (updates.assignedTechnician && updates.assignedTechnician !== prev.assignedTechnician) {
      logs.unshift({
        id: `act-${Date.now()}-tech`,
        timestamp: dateStr,
        actorName,
        action: 'มอบหมายช่าง',
        details: `มอบหมายให้ ${updates.assignedTechnician}`,
      });
    }

    if (updates.appointment && JSON.stringify(updates.appointment) !== JSON.stringify(prev.appointment)) {
      logs.unshift({
        id: `act-${Date.now()}-appt`,
        timestamp: dateStr,
        actorName,
        action: 'อัปเดตวันนัดหมาย',
        details: `นัดหมายวันที่ ${updates.appointment.date} เวลา ${updates.appointment.timeSlot}`,
      });
    }

    const updatedTicket: RepairTicket = {
      ...prev,
      ...updates,
      updatedAt: dateStr,
      activityLogs: logs,
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  addComment(ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newComment: Comment = {
      ...comment,
      id: `c-${Date.now()}`,
      createdAt: dateStr,
    };

    const updatedComments = [...(prev.comments || []), newComment];
    const updatedTicket: RepairTicket = {
      ...prev,
      comments: updatedComments,
      updatedAt: dateStr,
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  addImage(ticketId: string, image: Omit<TicketImage, 'id' | 'uploadedAt'>, actorName: string): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newImage: TicketImage = {
      ...image,
      id: `img-${Date.now()}`,
      uploadedAt: dateStr,
      uploaderName: actorName,
    };

    const updatedTicket: RepairTicket = {
      ...prev,
      images: [...(prev.images || []), newImage],
      updatedAt: dateStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: dateStr,
          actorName,
          action: 'อัปโหลดรูปภาพ',
          details: `เพิ่มรูปในหมวด "${image.phase === 'before' ? 'ก่อนซ่อม' : image.phase === 'during' ? 'ระหว่างซ่อม' : 'หลังซ่อม'}"`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  addExpense(ticketId: string, expense: Omit<Expense, 'id'>, actorName: string): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: expense.date || dateStr.split(' ')[0],
    };

    const updatedTicket: RepairTicket = {
      ...prev,
      expenses: [...(prev.expenses || []), newExpense],
      updatedAt: dateStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: dateStr,
          actorName,
          action: 'บันทึกค่าใช้จ่าย',
          details: `เพิ่มรายการ ${expense.description} จำนวน ${expense.amount.toLocaleString()} บาท`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  toggleChecklistItem(
    ticketId: string,
    itemKey: string,
    completed: boolean,
    actorName: string
  ): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const currentChecklist = prev.checklist || [];
    const updatedChecklist = currentChecklist.map((item) => {
      if (item.key === itemKey) {
        return {
          ...item,
          completed,
          completedAt: completed ? dateStr : undefined,
          completedBy: completed ? actorName : undefined,
        };
      }
      return item;
    });

    const updatedTicket: RepairTicket = {
      ...prev,
      checklist: updatedChecklist,
      updatedAt: dateStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: dateStr,
          actorName,
          action: completed ? 'เช็ครายการสำเร็จ' : 'ยกเลิกเช็ครายการ',
          details: `อัปเดตรายการตรวจเช็กหน้างาน (${itemKey})`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  deleteExpense(ticketId: string, expenseId: string, actorName: string): RepairTicket {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found');

    const prev = tickets[index];
    const removedExp = prev.expenses.find((e) => e.id === expenseId);
    const updatedExpenses = prev.expenses.filter((e) => e.id !== expenseId);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedTicket: RepairTicket = {
      ...prev,
      expenses: updatedExpenses,
      updatedAt: dateStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: dateStr,
          actorName,
          action: 'ลบรายการค่าใช้จ่าย',
          details: `ลบรายการ ${removedExp?.description || ''}`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  /**
   * Update work checklist item state
   */
  updateChecklistItem(
    ticketId: string,
    key: string,
    completed: boolean,
    completedBy?: string
  ): RepairTicket | undefined {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) return undefined;

    const prev = tickets[index];
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    let currentChecklist = prev.checklist || [];
    if (currentChecklist.length === 0) {
      currentChecklist = [
        { id: 'chk-1', key: 'confirm_appt', titleTh: '1. โทรยืนยันเวลานัดหมายกับลูกค้าล่วงหน้า', titleEn: '1. Call customer ahead to reconfirm arrival time slot', completed: false },
        { id: 'chk-2', key: 'arrive_onsite', titleTh: '2. เดินทางถึงหน้างานตรงเวลาและแสดงตัวสุภาพ', titleEn: '2. Arrive punctually on-site and present credentials', completed: false },
        { id: 'chk-3', key: 'inspect_issue', titleTh: '3. ตรวจสอบอาการเสียและแจ้งแนวทางเบื้องต้น', titleEn: '3. Inspect defect and explain preliminary repair solution', completed: false },
        { id: 'chk-4', key: 'photo_before', titleTh: '4. ถ่ายรูปพื้นที่ก่อนเริ่มทำงานบันทึกลงระบบ', titleEn: '4. Take clear photos of defect area before starting work', completed: false },
        { id: 'chk-5', key: 'perform_repair', titleTh: '5. ดำเนินการซ่อมแซมและเปลี่ยนอะไหล่ตามมาตรฐาน', titleEn: '5. Execute repairs and replacement per technical standards', completed: false },
        { id: 'chk-6', key: 'photo_after', titleTh: '6. ถ่ายรูปจุดที่ซ่อมแซมเรียบร้อยบันทึกลงระบบ', titleEn: '6. Take clear photos of completed work and upload', completed: false },
        { id: 'chk-7', key: 'test_result', titleTh: '7. ทดสอบการทำงานของอุปกรณ์ให้เห็นชัดเจน', titleEn: '7. Run thorough test and verify cooling/functionality', completed: false },
        { id: 'chk-8', key: 'customer_inspect', titleTh: '8. ให้ลูกค้าตรวจรับงานและทดสอบด้วยตนเอง', titleEn: '8. Have customer personally inspect and verify satisfaction', completed: false },
      ];
    }

    const updatedChecklist = currentChecklist.map((item) => {
      if (item.key === key) {
        return {
          ...item,
          completed,
          completedAt: completed ? nowStr : undefined,
          completedBy: completed ? completedBy : undefined,
        };
      }
      return item;
    });

    const targetItem = updatedChecklist.find((i) => i.key === key);
    const updatedTicket: RepairTicket = {
      ...prev,
      checklist: updatedChecklist,
      updatedAt: nowStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowStr,
          actorName: completedBy || 'ช่างผู้รับผิดชอบ',
          action: completed ? 'เช็กรายการหน้างาน' : 'ยกเลิกรายการหน้างาน',
          details: `${targetItem?.titleTh || key} (${completed ? 'เสร็จสิ้น' : 'รอดำเนินการ'})`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  /**
   * Record Customer Acceptance with signature
   */
  recordCustomerAcceptance(
    ticketId: string,
    acceptance: {
      acceptedByName: string;
      acceptedByPhone: string;
      signatureDataUrl?: string;
      rating?: number;
      feedback?: string;
    }
  ): RepairTicket | undefined {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === ticketId);
    if (index === -1) return undefined;

    const prev = tickets[index];
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const updatedTicket: RepairTicket = {
      ...prev,
      status: 'completed',
      customerAcceptance: {
        accepted: true,
        acceptedByName: acceptance.acceptedByName,
        acceptedByPhone: acceptance.acceptedByPhone,
        signatureDataUrl: acceptance.signatureDataUrl,
        acceptedAt: nowStr,
        rating: acceptance.rating,
        feedback: acceptance.feedback,
      },
      warranty: {
        durationMonths: 3,
        startDate: nowStr.slice(0, 10),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        termsTh: 'รับประกันงานซ่อมแซมและอะไหล่ 90 วัน',
        termsEn: '90-day warranty on workmanship and replaced parts',
      },
      updatedAt: nowStr,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowStr,
          actorName: acceptance.acceptedByName,
          action: 'ลูกค้าตรวจรับงานและลงนาม',
          details: `ตรวจรับงานซ่อมแซมสมบูรณ์ ให้คะแนน ${acceptance.rating || 5} ดาว`,
        },
        ...(prev.activityLogs || []),
      ],
    };

    tickets[index] = updatedTicket;
    this.saveTickets(tickets);
    return updatedTicket;
  },

  /**
   * Customer reports an issue during inspection or post-repair -> Creates linked follow-up ticket
   */
  reportCustomerIssue(
    originalTicketId: string,
    issueText: string,
    reportedBy: string,
    phone: string
  ): RepairTicket | undefined {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => t.id === originalTicketId);
    if (index === -1) return undefined;

    const original = tickets[index];
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    // Create follow-up ticket
    const count = tickets.length + 1;
    const year = new Date().getFullYear();
    const followUpJobNumber = `JOB-${year}-${String(count).padStart(4, '0')}`;
    const followUpId = `ticket-${Date.now()}`;

    const followUpTicket: RepairTicket = {
      id: followUpId,
      jobNumber: followUpJobNumber,
      customerId: original.customerId,
      title: `[ติดตามผล] ${original.title}`,
      description: `ปัญหาต่อเนื่องจากงาน ${original.jobNumber}:\n${issueText.trim()}`,
      category: original.category,
      priority: 'urgent',
      status: 'new',
      propertyType: original.propertyType,
      propertyName: original.propertyName,
      building: original.building,
      floor: original.floor,
      unitNumber: original.unitNumber,
      address: original.address,
      requesterName: reportedBy,
      requesterPhone: phone,
      followUpFromTicketId: original.id,
      createdAt: nowStr,
      updatedAt: nowStr,
      images: [],
      comments: [
        {
          id: `comm-${Date.now()}`,
          authorId: 'customer_guest',
          authorName: reportedBy,
          authorRole: 'resident',
          content: `ลูกค้าแจ้งปัญหาเพิ่มเติมจากงาน ${original.jobNumber}: ${issueText.trim()}`,
          createdAt: nowStr,
        },
      ],
      expenses: [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowStr,
          actorName: reportedBy,
          action: 'แจ้งปัญหาเพิ่มเติม (Follow-up)',
          details: `สร้างใบงานติดตามผลต่อเนื่องจาก ${original.jobNumber}`,
        },
      ],
    };

    // Update original ticket
    original.followUpTicketIds = [...(original.followUpTicketIds || []), followUpId];
    original.activityLogs.unshift({
      id: `act-${Date.now()}-orig`,
      timestamp: nowStr,
      actorName: reportedBy,
      action: 'ลูกค้าแจ้งปัญหาเพิ่มเติม',
      details: `เปิดใบงานติดตามผล ${followUpJobNumber}`,
    });

    tickets.unshift(followUpTicket);
    this.saveTickets(tickets);
    return followUpTicket;
  },

  resetMockData(): RepairTicket[] {
    this.saveTickets(INITIAL_MOCK_TICKETS);
    return INITIAL_MOCK_TICKETS;
  },

  exportToCsv(tickets: RepairTicket[]) {
    // Generate CSV with UTF-8 BOM so Thai characters open correctly in Excel
    const headers = [
      'เลขที่ใบงาน',
      'หัวข้องาน',
      'หมวดหมู่งาน',
      'ความเร่งด่วน',
      'สถานะ',
      'ประเภทสถานที่',
      'ชื่อโครงการ/บ้าน',
      'อาคาร/ชั้น',
      'เลขห้อง',
      'ชื่อผู้แจ้ง',
      'เบอร์โทรผู้แจ้ง',
      'ช่างผู้รับผิดชอบ',
      'วันนัดหมาย',
      'ช่วงเวลานัด',
      'ค่าใช้จ่ายรวม (บาท)',
      'วันที่สร้าง',
      'วันที่อัปเดต',
    ];

    const rows = tickets.map((t) => {
      const totalExpense = (t.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      return [
        `"${t.jobNumber}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${t.propertyType === 'condo' ? 'คอนโด' : 'บ้าน'}"`,
        `"${t.propertyName.replace(/"/g, '""')}"`,
        `"${t.building || ''} ${t.floor ? 'ชั้น ' + t.floor : ''}".trim()`,
        `"${t.unitNumber}"`,
        `"${t.requesterName.replace(/"/g, '""')}"`,
        `"${t.requesterPhone}"`,
        `"${t.assignedTechnician || 'ยังไม่ระบุ'}"`,
        `"${t.appointment?.date || '-'}"`,
        `"${t.appointment?.timeSlot || '-'}"`,
        `"${totalExpense}"`,
        `"${t.createdAt}"`,
        `"${t.updatedAt}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FixFlow_Tickets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
