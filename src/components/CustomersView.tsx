import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Wrench,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Customer, User, RepairTicket } from '../types';
import { CustomerService } from '../services/customerService';
import { TicketService } from '../services/ticketService';
import { ActivityLogService } from '../services/activityLogService';
import { useLanguage } from '../context/LanguageContext';

interface CustomersViewProps {
  currentUser: User;
  onSelectTicket?: (ticket: RepairTicket) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  currentUser,
  onSelectTicket,
  showToast,
}) => {
  const { currentLang, t } = useLanguage();
  const isEn = currentLang === 'en';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  // Customer Form Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    lineId: '',
    propertyName: '',
    building: '',
    floor: '',
    unitNumber: '',
    address: '',
    notes: '',
  });

  // Selected Customer Details Modal State
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const loadCustomers = () => {
    const list = CustomerService.getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter properties
  const properties = Array.from(new Set(customers.map((c) => c.propertyName).filter(Boolean)));

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.unitNumber && c.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.propertyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProp = selectedProperty === 'all' || c.propertyName === selectedProperty;
    return matchesSearch && matchesProp;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      lineId: '',
      propertyName: 'ลุมพินี พาร์ค ริเวอร์ไซด์',
      building: '',
      floor: '',
      unitNumber: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      lineId: c.lineId || '',
      propertyName: c.propertyName,
      building: c.building || '',
      floor: c.floor || '',
      unitNumber: c.unitNumber || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์', 'Name and phone are required', 'error');
      return;
    }

    if (editingCustomer) {
      CustomerService.updateCustomer(editingCustomer.id, formData);
      ActivityLogService.logAction({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actionType: 'USER_UPDATED',
        targetType: 'user',
        targetId: editingCustomer.id,
        targetLabel: formData.name,
        details: `อัปเดตข้อมูลลูกค้า ${formData.name} (${formData.propertyName} ห้อง ${formData.unitNumber})`,
      });
      showToast('อัปเดตข้อมูลลูกค้าสำเร็จ', 'Customer updated successfully', 'success');
    } else {
      const newCust = CustomerService.createCustomer(formData);
      ActivityLogService.logAction({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actionType: 'USER_CREATED',
        targetType: 'user',
        targetId: newCust.id,
        targetLabel: newCust.name,
        details: `เพิ่มลูกค้าใหม่ ${newCust.name} (${newCust.propertyName} ห้อง ${newCust.unitNumber})`,
      });
      showToast('เพิ่มลูกค้าใหม่เรียบร้อย', 'Customer created successfully', 'success');
    }

    setShowModal(false);
    loadCustomers();
    if (activeCustomer && editingCustomer && activeCustomer.id === editingCustomer.id) {
      setActiveCustomer({ ...activeCustomer, ...formData });
    }
  };

  const handleDeleteCustomer = (c: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (c.activeJobsCount && c.activeJobsCount > 0) {
      showToast(
        'ไม่สามารถลบลูกค้ารายนี้ได้',
        'Cannot delete customer with active ongoing repair tickets',
        'error'
      );
      return;
    }

    if (window.confirm(`ยืนยันการลบลูกค้ารายการ "${c.name}" หรือไม่?`)) {
      CustomerService.deleteCustomer(c.id);
      showToast('ลบข้อมูลลูกค้าเรียบร้อย', 'Customer removed', 'info');
      loadCustomers();
      if (activeCustomer?.id === c.id) {
        setActiveCustomer(null);
      }
    }
  };

  // Get tickets, quotations, and payments for active customer modal
  const customerTickets = activeCustomer
    ? TicketService.getTickets().filter(
        (t) =>
          t.requesterPhone === activeCustomer.phone ||
          t.requesterName.toLowerCase().includes(activeCustomer.name.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>{isEn ? 'Customers & Properties' : 'ข้อมูลลูกค้าและที่อยู่อาศัย'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn
              ? 'Manage customer directory, condo/house units, job history, and billing records.'
              : 'สมุดรายชื่อลูกค้า โครงการคอนโด/บ้าน ประวัติงานซ่อมแซม และการชำระเงิน'}
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Add Customer' : 'เพิ่มลูกค้าใหม่'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by customer name, phone, unit number...' : 'ค้นหาชื่อลูกค้า, เบอร์โทร, ห้อง, โครงการ...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="all">{isEn ? 'All Properties' : 'ทุกโครงการ / หมู่บ้าน'}</option>
            {properties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCustomer(c)}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                  </div>
                </div>

                {currentUser.role !== 'viewer' && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(c, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title={isEn ? 'Edit' : 'แก้ไข'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomer(c, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title={isEn ? 'Delete' : 'ลบ'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-3">
                <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{c.propertyName}</span>
                </div>
                <div className="text-slate-500 pl-5 flex flex-wrap gap-x-3 gap-y-1">
                  {c.unitNumber && <span>ห้อง: <strong className="text-slate-800 font-mono">{c.unitNumber}</strong></span>}
                  {c.building && <span>อาคาร: {c.building}</span>}
                  {c.floor && <span>ชั้น: {c.floor}</span>}
                </div>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                  <Wrench className="w-3 h-3 mr-1" />
                  {c.activeJobsCount || 0} {isEn ? 'active' : 'งานกำลังทำ'}
                </span>
                <span>รวม {c.totalJobsCount || 0} งาน</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-700">{isEn ? 'No customers found' : 'ไม่พบข้อมูลลูกค้า'}</div>
            <p className="text-xs text-slate-400 mt-1">
              {isEn ? 'Try adjusting your search criteria or add a new customer' : 'ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มลูกค้าใหม่'}
            </p>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up space-y-6">
            <button
              onClick={() => setActiveCustomer(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {activeCustomer.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 font-display">{activeCustomer.name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span className="flex items-center space-x-1 font-mono font-medium text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{activeCustomer.phone}</span>
                  </span>
                  {activeCustomer.email && (
                    <span className="flex items-center space-x-1 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeCustomer.email}</span>
                    </span>
                  )}
                  {activeCustomer.lineId && (
                    <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>LINE: {activeCustomer.lineId}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Property Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{activeCustomer.propertyName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-slate-600 pt-1">
                <div>อาคาร: <strong className="text-slate-800">{activeCustomer.building || '-'}</strong></div>
                <div>ชั้น: <strong className="text-slate-800">{activeCustomer.floor || '-'}</strong></div>
                <div>เลขห้อง: <strong className="text-slate-800 font-mono">{activeCustomer.unitNumber || '-'}</strong></div>
              </div>
              {activeCustomer.address && (
                <div className="text-slate-500 pt-1 text-[11px] border-t border-slate-200">
                  {activeCustomer.address}
                </div>
              )}
              {activeCustomer.notes && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-xs mt-2">
                  <strong>หมายเหตุลูกค้า:</strong> {activeCustomer.notes}
                </div>
              )}
            </div>

            {/* Job History Tab */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 font-display flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>{isEn ? 'Repair Tickets History' : 'ประวัติงานซ่อมแซม'} ({customerTickets.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {customerTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onSelectTicket) onSelectTicket(t);
                      setActiveCustomer(null);
                    }}
                    className="p-3 bg-white hover:bg-blue-50/50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {t.jobNumber}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        แจ้งเมื่อ: {t.createdAt} • ช่าง: {t.assignedTechnician || 'ยังไม่มอบหมาย'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0 bg-slate-100 text-slate-700">
                      {t.status}
                    </span>
                  </div>
                ))}

                {customerTickets.length === 0 && (
                  <div className="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-200 rounded-xl">
                    {isEn ? 'No repair tickets recorded for this customer' : 'ยังไม่มีประวัติงานซ่อมของลูกค้ารายนี้'}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              {currentUser.role !== 'viewer' && (
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(activeCustomer)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEn ? 'Edit Profile' : 'แก้ไขข้อมูล'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? 'Close' : 'ปิดหน้าต่าง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 font-display">
              {editingCustomer ? (isEn ? 'Edit Customer' : 'แก้ไขข้อมูลลูกค้า') : (isEn ? 'Add New Customer' : 'เพิ่มลูกค้าใหม่')}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Full Name' : 'ชื่อ-นามสกุล ลูกค้า'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น คุณสมชาย มีสุข"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Phone Number' : 'เบอร์โทรศัพท์'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Email' : 'อีเมล'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="somchai@example.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'LINE ID' : 'LINE ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.lineId}
                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                    placeholder="somchai_line"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEn ? 'Property / Condo / Village' : 'ชื่อโครงการ / หมู่บ้าน / คอนโด'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  placeholder="เช่น ลุมพินี พาร์ค ริเวอร์ไซด์"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Unit No.' : 'เลขที่ห้อง'}
                  </label>
                  <input
                    type="text"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="812"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Building' : 'อาคาร'}
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="อาคาร A"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Floor' : 'ชั้น'}
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="8"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEn ? 'Internal Notes' : 'บันทึกเพิ่มเติม (Notes)'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="เช่น สะดวกให้ช่างเข้าช่วงบ่าย, ฝากกุญแจนิติได้..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isEn ? 'Save Customer' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
