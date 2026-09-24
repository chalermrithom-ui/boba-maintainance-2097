import { Customer } from '../types';

const CUSTOMERS_KEY = 'fixflow_customers_data_v1';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'คุณอรทัย วงศ์วิจิตร',
    phone: '083-456-7890',
    email: 'orathai.w@outlook.com',
    lineId: 'orathai_condo',
    customerType: 'homeowner',
    propertyName: 'คอนโดสุขุมวิท 42',
    building: 'อาคาร A',
    floor: '8',
    unitNumber: '812',
    address: 'ห้อง 812 ชั้น 8 อาคาร A คอนโดสุขุมวิท 42 แขวงพระโขนง เขตคลองเตย กทม.',
    siteContactName: 'คุณอรทัย วงศ์วิจิตร',
    siteContactPhone: '083-456-7890',
    accessInstructions: 'ติดต่อรปภ. แจ้งเลขห้อง 812 แลกบัตรขึ้นลิฟต์ มีคีย์การ์ดสำรองที่นิติบุคคล',
    preferredServiceTime: 'ช่วงบ่าย 13:00 - 17:00 น.',
    importantNote: 'มีสัตว์เลี้ยง (แมว 1 ตัว) ระวังเปิดประตูทิ้งไว้',
    notes: 'ลูกค้าประจำ คอนโดสุขุมวิท สะดวกช่วงบ่าย กุญแจฝากไว้ที่นิติหากไม่อยู่',
    activeJobsCount: 1,
    totalJobsCount: 3,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'cust-2',
    name: 'คุณณัฐ สิทธิวงศ์',
    phone: '089-999-1122',
    email: 'nattawut.s@hotmail.com',
    lineId: 'nat_ladprao',
    customerType: 'homeowner',
    propertyName: 'บ้านเดี่ยวลาดพร้าว 71',
    building: 'บ้านเลขที่ 99/12',
    floor: '2',
    unitNumber: '99/12',
    address: '99/12 ซอยนาคนิวาส 24 ถนนลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กทม.',
    siteContactName: 'คุณณัฐ สิทธิวงศ์',
    siteContactPhone: '089-999-1122',
    accessInstructions: 'เข้าซอยนาคนิวาส 24 เลี้ยวขวาซอยย่อยที่ 2 บ้านรั้วสีขาว สามารถจอดรถในบ้านได้ 2 คัน',
    preferredServiceTime: 'ทุกวัน เวลา 09:00 - 18:00 น.',
    importantNote: 'จอดรถในบ้านได้ มีสุนัขพันธุ์เล็กในกรง',
    notes: 'บ้านลาดพร้าว แจ้งซ่อมท่อน้ำรั่วใต้อ่างล้างจานห้องครัว',
    activeJobsCount: 1,
    totalJobsCount: 2,
    createdAt: '2026-02-10T11:30:00Z',
  },
  {
    id: 'cust-3',
    name: 'นิติบุคคลคอนโด ABC',
    phone: '02-123-4567',
    email: 'juristic@abc-condo.com',
    lineId: 'abc_juristic',
    customerType: 'juristic_person',
    propertyName: 'คอนโดมิเนียม ABC รัชดา',
    building: 'อาคาร A (ส่วนกลาง)',
    floor: '1-8',
    unitNumber: 'พื้นที่ส่วนกลาง',
    address: '88 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กทม.',
    siteContactName: 'คุณผู้จัดการนิติบุคคล ABC',
    siteContactPhone: '02-123-4567',
    accessInstructions: 'ติดต่อเคาน์เตอร์นิติบุคคลชั้น 1 แลกบัตรช่างและสวมเสื้อกั๊กสะท้อนแสง',
    preferredServiceTime: 'เวลาทำการนิติ 09:00 - 17:00 น.',
    importantNote: 'งานในพื้นที่ส่วนกลาง ต้องปฏิบัติตามระเบียบความปลอดภัยของอาคาร',
    notes: 'ดูแลระบบส่วนกลาง อาคาร A หลอดไฟทางเดินเสีย',
    activeJobsCount: 1,
    totalJobsCount: 4,
    createdAt: '2026-01-20T16:00:00Z',
  },
  {
    id: 'cust-4',
    name: 'คุณพิมพ์ ชัยมงคล',
    phone: '087-123-9988',
    email: 'pim.c@bangna.com',
    lineId: 'pim_bangna',
    customerType: 'tenant',
    propertyName: 'ทาวน์โฮมบางนา กม.5',
    building: 'ทาวน์โฮม 3 ชั้น',
    floor: '1',
    unitNumber: '128/45',
    address: '128/45 หมู่บ้านพฤกษาทาวน์ บางนา-ตราด กม.5 ต.บางแก้ว อ.บางพลี สมุทรปราการ',
    siteContactName: 'คุณพิมพ์ ชัยมงคล',
    siteContactPhone: '087-123-9988',
    accessInstructions: 'แลกบัตรหน้าป้อม รปภ. หมู่บ้าน แจ้งบ้านเลขที่ 128/45',
    preferredServiceTime: 'วันเสาร์-อาทิตย์ หรือ วันธรรมดาหลัง 18:00 น.',
    importantNote: 'ประตูล็อกไม่ได้ กลอนประตูดิจิทัล Smart Door Lock แบรนด์เกาหลี',
    notes: 'ทาวน์โฮมบางนา ปัญหากลอนประตูดิจิทัล Smart Door Lock ขัดข้อง',
    activeJobsCount: 1,
    totalJobsCount: 1,
    createdAt: '2026-03-01T14:15:00Z',
  },
  {
    id: 'cust-5',
    name: 'บริษัท Sample จำกัด',
    phone: '02-987-6543',
    email: 'facility@samplecorp.co.th',
    lineId: 'sample_office',
    customerType: 'company',
    propertyName: 'อาคาร Sample Tower พระราม 9',
    building: 'Tower 1',
    floor: '15',
    unitNumber: '1502-1504',
    address: 'ชั้น 15 อาคาร Sample Tower ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม.',
    siteContactName: 'คุณเกรียงไกร (ฝ่ายธุรการและอาคาร)',
    siteContactPhone: '02-987-6543 ต่อ 105',
    accessInstructions: 'แลกบัตรผู้มาติดต่อที่ล็อบบี้ชั้น 1 ขึ้นลิฟต์โซน High Zone ชั้น 15',
    preferredServiceTime: 'จันทร์-ศุกร์ 08:30 - 17:30 น.',
    importantNote: 'งานที่มีเสียงดังหรือกลิ่นแรงให้ทำนอกเวลาทำการหลัง 18:00 น.',
    notes: 'สัญญางานบริการซ่อมบำรุงประจำปี อาคารสำนักงานและห้องประชุม',
    activeJobsCount: 0,
    totalJobsCount: 5,
    createdAt: '2026-02-18T10:00:00Z',
  },
];

export const CustomerService = {
  getCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(CUSTOMERS_KEY);
      if (!stored) {
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
        return INITIAL_CUSTOMERS;
      }
      return JSON.parse(stored) as Customer[];
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  saveCustomer(customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }): Customer {
    const list = this.getCustomers();
    if (customer.id) {
      const idx = list.findIndex((c) => c.id === customer.id);
      if (idx !== -1) {
        const updated: Customer = {
          ...list[idx],
          ...customer,
          updatedAt: new Date().toISOString(),
        };
        list[idx] = updated;
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
        return updated;
      }
    }
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newCust);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    return newCust;
  },

  deleteCustomer(id: string): boolean {
    const list = this.getCustomers();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    return this.saveCustomer(customer);
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    return updated;
  },
};
