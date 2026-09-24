import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building,
  Home,
  Calendar,
  Clock,
  User,
  Phone,
  Image as ImageIcon,
  Check,
  Zap,
  Droplets,
  Wind,
  Tv,
  DoorOpen,
  Paintbrush,
  Armchair,
  Wifi,
  HelpCircle,
  Camera,
} from 'lucide-react';
import {
  RepairTicket,
  TicketCategory,
  TicketPriority,
  PropertyType,
  TicketImage,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  User as UserType,
} from '../types';
import { TicketService } from '../services/ticketService';

interface TicketFormProps {
  currentUser: UserType;
  onSuccess: (newTicket: RepairTicket) => void;
  onCancel: () => void;
}

// Sample photo presets for quick testing
const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'แอร์มีน้ำหยด',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    caption: 'จุดน้ำหยดจากตัวแอร์',
  },
  {
    name: 'ท่อน้ำรั่วซึม',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    caption: 'ข้อต่อท่อน้ำดีใต้อ่างรั่วซึม',
  },
  {
    name: 'โคมไฟชำรุด',
    url: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=800&q=80',
    caption: 'หลอดไฟดาวน์ไลท์ไม่ติด',
  },
  {
    name: 'กลอนประตูขัดข้อง',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    caption: 'กลอนประตูดิจิทัลสแกนไม่ติด',
  },
  {
    name: 'คราบน้ำฝ้าเพดาน',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    caption: 'รอยด่างน้ำซึมจากชั้นบน',
  },
];

export const TicketForm: React.FC<TicketFormProps> = ({
  currentUser,
  onSuccess,
  onCancel,
}) => {
  // Form fields
  const [propertyType, setPropertyType] = useState<PropertyType>('condo');
  const [propertyName, setPropertyName] = useState(currentUser.propertyName || 'ลุมพินี พาร์ค ริเวอร์ไซด์');
  const [building, setBuilding] = useState('อาคาร A');
  const [floor, setFloor] = useState('8');
  const [unitNumber, setUnitNumber] = useState(currentUser.unitNumber || '812');

  const [category, setCategory] = useState<TicketCategory>('air_conditioner');
  const [priority, setPriority] = useState<TicketPriority>('urgent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Requester & Appointment
  const [requesterName, setRequesterName] = useState(currentUser.name || 'คุณสมชาย มีสุข');
  const [requesterPhone, setRequesterPhone] = useState(currentUser.phone || '081-234-5678');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState('13:00 - 16:00');
  const [appointmentNotes, setAppointmentNotes] = useState('สะดวกรับสายตลอดวัน');

  // Images state
  const [images, setImages] = useState<TicketImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'กรุณาระบุหัวข้อปัญหาที่ต้องการแจ้งซ่อม';
    if (!description.trim()) newErrors.description = 'กรุณาระบุรายละเอียดปัญหา';
    if (!propertyName.trim()) newErrors.propertyName = 'กรุณาระบุชื่อคอนโดหรือโครงการหมู่บ้าน';
    if (!unitNumber.trim()) newErrors.unitNumber = 'กรุณาระบุเลขห้องหรือบ้านเลขที่';
    if (!requesterName.trim()) newErrors.requesterName = 'กรุณาระบุชื่อผู้แจ้ง';
    if (!requesterPhone.trim()) newErrors.requesterPhone = 'กรุณาระบุเบอร์โทรศัพท์ติดต่อ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newImg: TicketImage = {
          id: `local-img-${Date.now()}-${Math.random()}`,
          url,
          phase: 'before',
          isPrimary: images.length === 0,
          caption: file.name,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          uploaderName: requesterName,
        };
        setImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSamplePreset = (preset: typeof SAMPLE_PHOTO_PRESETS[0]) => {
    const newImg: TicketImage = {
      id: `sample-img-${Date.now()}-${Math.random()}`,
      url: preset.url,
      phase: 'before',
      isPrimary: images.length === 0,
      caption: preset.caption,
      uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      uploaderName: requesterName,
    };
    setImages((prev) => [...prev, newImg]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const created = TicketService.createTicket({
      title: title.trim() || 'แจ้งงานซ่อมทั่วไป (ร่าง)',
      description: description.trim() || 'ไม่มีรายละเอียด',
      category,
      priority,
      status: isDraft ? 'new' : 'new',
      propertyType,
      propertyName: propertyName.trim(),
      building: propertyType === 'condo' ? building.trim() : undefined,
      floor: propertyType === 'condo' ? floor.trim() : undefined,
      unitNumber: unitNumber.trim(),
      requesterName: requesterName.trim(),
      requesterPhone: requesterPhone.trim(),
      appointment: appointmentDate
        ? {
            date: appointmentDate,
            timeSlot,
            notes: appointmentNotes,
          }
        : undefined,
      images,
      isDraft,
    });

    onSuccess(created);
  };

  const getCategoryIcon = (catKey: TicketCategory) => {
    switch (catKey) {
      case 'electrical':
        return <Zap className="w-4 h-4" />;
      case 'plumbing':
        return <Droplets className="w-4 h-4" />;
      case 'air_conditioner':
        return <Wind className="w-4 h-4" />;
      case 'appliances':
        return <Tv className="w-4 h-4" />;
      case 'doors_windows':
        return <DoorOpen className="w-4 h-4" />;
      case 'walls_ceiling':
        return <Paintbrush className="w-4 h-4" />;
      case 'furniture':
        return <Armchair className="w-4 h-4" />;
      case 'internet':
        return <Wifi className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Form Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Camera className="w-4 h-4" />
          <span>แบบฟอร์มแจ้งซ่อมแซม</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
          แจ้งปัญหาซ่อมแซมบ้าน / คอนโด
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          กรอกข้อมูลและแนบรูปภาพเพื่อให้เจ้าหน้าที่นิติบุคคลและช่างเทคนิคประเมินและเข้าช่วยเหลืออย่างรวดเร็ว
        </p>
      </div>

      {/* Section 1: ข้อมูลสถานที่ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            ข้อมูลสถานที่และห้องพัก
          </h2>
        </div>

        {/* Property Type Toggle */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            ประเภทที่อยู่อาศัย <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setPropertyType('condo')}
              className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                propertyType === 'condo'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>คอนโดมิเนียม / ห้องชุด</span>
            </button>
            <button
              type="button"
              onClick={() => setPropertyType('house')}
              className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                propertyType === 'house'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>บ้านเดี่ยว / ทาวน์โฮม</span>
            </button>
          </div>
        </div>

        {/* Property & Room Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ชื่อคอนโด / ชื่อโครงการ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="เช่น ลุมพินี พาร์ค, ไอดีโอ สุขุมวิท"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {errors.propertyName && <p className="text-[11px] text-rose-600 mt-1">{errors.propertyName}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              เลขที่ห้อง / บ้านเลขที่ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="เช่น 812 หรือ 88/12"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
            />
            {errors.unitNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.unitNumber}</p>}
          </div>

          {propertyType === 'condo' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  อาคาร / ตึก (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="เช่น อาคาร A, Tower 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชั้น (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="เช่น ชั้น 8"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 2: ข้อมูลปัญหาและหมวดหมู่ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            ข้อมูลปัญหาและหมวดหมู่งานซ่อม
          </h2>
        </div>

        {/* Categories selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            เลือกหมวดหมู่งานซ่อม <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(CATEGORY_CONFIG) as TicketCategory[]).map((catKey) => {
              const conf = CATEGORY_CONFIG[catKey];
              const isSelected = category === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={`flex items-center space-x-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span
                    className="p-1.5 rounded-xl shrink-0"
                    style={{
                      backgroundColor: `${conf.color}20`,
                      color: conf.color,
                    }}
                  >
                    {getCategoryIcon(catKey)}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{conf.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            ระดับความเร่งด่วน <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map((prKey) => {
              const pConf = PRIORITY_CONFIG[prKey];
              const isSelected = priority === prKey;
              return (
                <button
                  key={prKey}
                  type="button"
                  onClick={() => setPriority(prKey)}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                    isSelected
                      ? prKey === 'emergency'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                        : prKey === 'urgent'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold">{pConf.label}</div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {prKey === 'emergency'
                      ? 'ส่งผลเสียหายฉับพลัน'
                      : prKey === 'urgent'
                      ? 'รบกวนการอยู่อาศัย'
                      : 'ซ่อมแซมทั่วไป'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            หัวข้ออาการ / ปัญหาที่พบ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น แอร์ห้องนอนไม่เย็น มีน้ำหยดลงเตียงนอน"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            รายละเอียดปัญหาเพิ่มเติม <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายอาการ เช่น เปิดแอร์แล้วมีเสียงดัง ลมไม่ออก หรือมีน้ำรั่วซึมจุดไหน..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
          />
          {errors.description && <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>}
        </div>
      </div>

      {/* Section 3: รูปภาพประกอบ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            รูปภาพจุดที่พบปัญหา (แนบได้หลายรูป)
          </h2>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              (Array.from(files) as File[]).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const url = event.target?.result as string;
                  const newImg: TicketImage = {
                    id: `local-img-${Date.now()}-${Math.random()}`,
                    url,
                    phase: 'before',
                    isPrimary: images.length === 0,
                    caption: file.name,
                    uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    uploaderName: requesterName,
                  };
                  setImages((prev) => [...prev, newImg]);
                };
                reader.readAsDataURL(file);
              });
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
            isDragging
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-xs font-bold text-slate-800">
            ลากและวางรูปภาพที่นี่ หรือ <span className="text-blue-600 underline">คลิกเพื่อเลือกไฟล์</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            รองรับไฟล์ PNG, JPG, WEBP (สูงสุด 10MB ต่อไฟล์)
          </p>
        </div>

        {/* Quick Sample Presets (for instant 1-click testing) */}
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>หรือคลิกเลือกรูปภาพตัวอย่างทดสอบระบบ:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PHOTO_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleAddSamplePreset(p)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-medium border border-slate-200 transition cursor-pointer"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Uploaded Images Thumbnails */}
        {images.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2">
              รูปภาพที่เลือก ({images.length} รูป):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center shadow-xs"
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'รูปประกอบ'}
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      รูปหลัก
                    </span>
                  )}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
                        title="ตั้งเป็นรูปหลัก"
                      >
                        ตั้งเป็นรูปหลัก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                      title="ลบรูป"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: ข้อมูลผู้แจ้งและวันเวลานัดหมาย */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            ข้อมูลผู้ติดต่อและวันเวลานัดหมายที่สะดวก
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ชื่อ-นามสกุล ผู้แจ้ง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {errors.requesterName && <p className="text-[11px] text-rose-600 mt-1">{errors.requesterName}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={requesterPhone}
              onChange={(e) => setRequesterPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {errors.requesterPhone && <p className="text-[11px] text-rose-600 mt-1">{errors.requesterPhone}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              วันที่สะดวกให้ช่างเข้าตรวจสอบ
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ช่วงเวลาที่สะดวก
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="09:00 - 12:00">ช่วงเช้า (09:00 - 12:00 น.)</option>
              <option value="13:00 - 16:00">ช่วงบ่าย (13:00 - 16:00 น.)</option>
              <option value="16:00 - 18:00">ช่วงเย็น (16:00 - 18:00 น.)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              หมายเหตุเพิ่มเติมเกี่ยวกับการเข้าพื้นที่
            </label>
            <input
              type="text"
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              placeholder="เช่น มีกุญแจฝากไว้ที่นิติบุคคล, สะดวกรับสายหลังเที่ยง"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          ยกเลิก
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            บันทึกร่าง
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ส่งแจ้งงานซ่อม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
