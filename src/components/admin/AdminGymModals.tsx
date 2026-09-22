import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  MapPin, 
  Dumbbell, 
  Flame, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  GymZone, 
  GymEquipment, 
  ExerciseCatalogueEntry, 
  ReviewStatus,
  EquipmentCategory,
  EquipmentOperationalStatus,
  ExerciseDifficulty,
  MovementPattern
} from '../../types/companion';

// ================= MODAL 1: ZONE MODAL =================
interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: GymZone | null;
  onSave: (zone: GymZone) => Promise<void>;
  currentAdminEmail: string;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  zone,
  onSave,
  currentAdminEmail
}) => {
  const [formData, setFormData] = useState<Partial<GymZone>>({
    id: '',
    name: '',
    nameEn: '',
    floor: 'floor1',
    description: '',
    landmark: '',
    directionsFromReception: '',
    reviewStatus: 'needs_review',
    verified: false,
    revision: 1
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zone) {
      setFormData(zone);
    } else {
      setFormData({
        id: `zone_${Date.now()}`,
        name: '',
        nameEn: '',
        floor: 'floor1',
        description: '',
        landmark: '',
        directionsFromReception: '',
        reviewStatus: 'draft',
        verified: false,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [zone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên khu vực');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const zonePayload: GymZone = {
        id: formData.id || `zone_${Date.now()}`,
        name: formData.name.trim(),
        nameEn: formData.nameEn?.trim() || '',
        floor: formData.floor || 'floor1',
        description: formData.description?.trim() || '',
        landmark: formData.landmark?.trim() || '',
        directionsFromReception: formData.directionsFromReception?.trim() || '',
        reviewStatus: formData.reviewStatus || 'draft',
        verified: formData.verified || false,
        verifiedBy: formData.verified ? (formData.verifiedBy || currentAdminEmail) : undefined,
        verifiedAt: formData.verified ? (formData.verifiedAt || new Date().toISOString()) : undefined,
        revision: (formData.revision || 1),
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(zonePayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu khu vực');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg text-white">
              {zone ? 'Chỉnh sửa Khu Vực / Zone' : 'Thêm Khu Vực Mới'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Mã Định Danh (ID) *
            </label>
            <input
              type="text"
              value={formData.id || ''}
              disabled={!!zone}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 disabled:opacity-60 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: zone_cardio_floor1"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Khu Vực (Tiếng Việt) *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Khu Cardio & Chạy Bộ"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Tiếng Anh (English)
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Cardio & Treadmill Zone"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Vị Trí Tầng *
            </label>
            <select
              value={formData.floor || 'floor1'}
              onChange={e => setFormData({ ...formData, floor: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
            >
              <option value="floor1">Tầng 1 (Lễ Tân, Locker, Cardio, Studio Yoga)</option>
              <option value="floor2">Tầng 2 (Tạ Tự Do, Máy Kháng Lực, Boxing Ring, PT Floor)</option>
              <option value="rooftop">Tầng Thượng / Ngoài Trời</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Điểm Nhận Diện / Landmark
            </label>
            <input
              type="text"
              value={formData.landmark || ''}
              onChange={e => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: Nằm phía tay phải sảnh chính, hướng cửa kính mặt đường"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Chỉ Dẫn Từ Quầy Lễ Tân (Directions)
            </label>
            <textarea
              rows={2}
              value={formData.directionsFromReception || ''}
              onChange={e => setFormData({ ...formData, directionsFromReception: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: Từ quầy lễ tân đi thẳng 5m rẽ phải..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Mô Tả Chi Tiết
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="Mô tả các loại hình tập luyện tại khu vực này..."
            />
          </div>

          {/* Verification Status */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Trạng Thái Kiểm Duyệt:
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                formData.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                formData.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                formData.reviewStatus === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {formData.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                 formData.reviewStatus === 'needs_review' ? 'Chờ Duyệt' :
                 formData.reviewStatus === 'rejected' ? 'Từ Chối' : 'Bản Nháp'}
              </span>
            </div>
            <select
              value={formData.reviewStatus || 'draft'}
              onChange={e => {
                const val = e.target.value as ReviewStatus;
                setFormData({
                  ...formData,
                  reviewStatus: val,
                  verified: val === 'verified'
                });
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100"
            >
              <option value="draft">Bản Nháp (Draft - Chưa kiểm tra)</option>
              <option value="needs_review">Chờ Kiểm Duyệt (Needs Review)</option>
              <option value="verified">Đã Xác Thực Thực Tế (Verified by Staff)</option>
              <option value="rejected">Từ Chối / Không Khả Dụng (Rejected)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu Khu Vực'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL 2: EQUIPMENT MODAL =================
interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: GymEquipment | null;
  zones: GymZone[];
  onSave: (equipment: GymEquipment) => Promise<void>;
  currentAdminEmail: string;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipment,
  zones,
  onSave,
  currentAdminEmail
}) => {
  const [formData, setFormData] = useState<Partial<GymEquipment>>({
    id: '',
    name: '',
    nameEn: '',
    modelNumber: '',
    brand: '',
    zoneId: '',
    category: 'selectorized_machine',
    operationalStatus: 'operational',
    isFunctional: true,
    primaryMuscleGroups: [],
    secondaryMuscleGroups: [],
    contraindications: [],
    safetyNotes: '',
    reviewStatus: 'draft',
    verified: false,
    revision: 1
  });

  const [primaryMusclesStr, setPrimaryMusclesStr] = useState('');
  const [secondaryMusclesStr, setSecondaryMusclesStr] = useState('');
  const [contraindicationsStr, setContraindicationsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
      setPrimaryMusclesStr(equipment.primaryMuscleGroups?.join(', ') || '');
      setSecondaryMusclesStr(equipment.secondaryMuscleGroups?.join(', ') || '');
      setContraindicationsStr(equipment.contraindications?.join(', ') || '');
    } else {
      const defaultZone = zones[0]?.id || '';
      setFormData({
        id: `eq_${Date.now()}`,
        name: '',
        nameEn: '',
        modelNumber: '',
        brand: '',
        zoneId: defaultZone,
        category: 'selectorized_machine',
        operationalStatus: 'operational',
        isFunctional: true,
        primaryMuscleGroups: [],
        secondaryMuscleGroups: [],
        contraindications: [],
        safetyNotes: '',
        reviewStatus: 'draft',
        verified: false,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setPrimaryMusclesStr('');
      setSecondaryMusclesStr('');
      setContraindicationsStr('');
    }
  }, [equipment, isOpen, zones]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên thiết bị / máy tập');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const selectedZone = zones.find(z => z.id === formData.zoneId);

      const eqPayload: GymEquipment = {
        id: formData.id || `eq_${Date.now()}`,
        name: formData.name.trim(),
        nameEn: formData.nameEn?.trim() || '',
        modelNumber: formData.modelNumber?.trim() || '',
        brand: formData.brand?.trim() || 'The Shine Standard',
        zoneId: formData.zoneId || (zones[0]?.id || 'zone_default'),
        zoneName: selectedZone?.name || '',
        floor: selectedZone?.floor || 'floor1',
        category: formData.category as EquipmentCategory || 'selectorized_machine',
        operationalStatus: formData.operationalStatus as EquipmentOperationalStatus || 'operational',
        isFunctional: formData.isFunctional ?? true,
        primaryMuscleGroups: primaryMusclesStr.split(',').map(s => s.trim()).filter(Boolean),
        secondaryMuscleGroups: secondaryMusclesStr.split(',').map(s => s.trim()).filter(Boolean),
        contraindications: contraindicationsStr.split(',').map(s => s.trim()).filter(Boolean),
        safetyNotes: formData.safetyNotes?.trim() || '',
        reviewStatus: formData.reviewStatus || 'draft',
        verified: formData.verified || false,
        verifiedBy: formData.verified ? (formData.verifiedBy || currentAdminEmail) : undefined,
        verifiedAt: formData.verified ? (formData.verifiedAt || new Date().toISOString()) : undefined,
        revision: (formData.revision || 1),
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(eqPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu thiết bị');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg text-white">
              {equipment ? 'Chỉnh sửa Thiết Bị / Máy Tập' : 'Thêm Máy Tập Mới'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Mã Thiết Bị (ID) *
              </label>
              <input
                type="text"
                value={formData.id || ''}
                disabled={!!equipment}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 disabled:opacity-60 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: eq_lat_pulldown_01"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Khu Vực Bố Trí (Zone) *
              </label>
              <select
                value={formData.zoneId || ''}
                onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                required
              >
                <option value="">-- Chọn Khu Vực --</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.floor === 'floor1' ? 'T1' : 'T2'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Thiết Bị (Tiếng Việt) *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Máy Kéo Xô (Lat Pulldown)"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Tiếng Anh (English)
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Lat Pulldown Machine"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Thương Hiệu / Hãng Sản Xuất
              </label>
              <input
                type="text"
                value={formData.brand || ''}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Impulse, LifeFitness, Matrix..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Phân Loại Thiết Bị
              </label>
              <select
                value={formData.category || 'selectorized_machine'}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="selectorized_machine">Máy Kháng Lực Tạ Cài (Pin-loaded)</option>
                <option value="plate_loaded_machine">Máy Tạ Đĩa (Plate-loaded)</option>
                <option value="free_weight">Tạ Tự Do (Dumbbell, Barbell, Khung Squat)</option>
                <option value="cable_station">Dàn Kéo Cáp (Cable Station)</option>
                <option value="cardio">Máy Cardio (Treadmill, Bike, Elliptical)</option>
                <option value="bodyweight_functional">Thanh Xà & Dụng Cụ Functional</option>
                <option value="boxing">Sàn Đấu & Bao Cát Boxing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Trạng Thái Hoạt Động *
              </label>
              <select
                value={formData.operationalStatus || 'operational'}
                onChange={e => {
                  const status = e.target.value as EquipmentOperationalStatus;
                  setFormData({
                    ...formData,
                    operationalStatus: status,
                    isFunctional: status === 'operational'
                  });
                }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="operational">🟢 Đang Hoạt Động Tốt (Operational)</option>
                <option value="under_maintenance">🟡 Đang Bảo Trì (Under Maintenance)</option>
                <option value="out_of_order">🔴 Hỏng / Ngừng Sử Dụng (Out of Order)</option>
                <option value="unverified">⚪ Chưa Kiểm Tra (Unverified)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Nhóm Cơ Chính (Phân cách bằng dấu phẩy) *
              </label>
              <input
                type="text"
                value={primaryMusclesStr}
                onChange={e => setPrimaryMusclesStr(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Lưng, Xô"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Chống Chỉ Định Y Khoa / Chấn Thương Cần Tránh
            </label>
            <input
              type="text"
              value={contraindicationsStr}
              onChange={e => setContraindicationsStr(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: Đau lưng dưới cấp tính, chấn thương khớp vai"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Lưu Ý Kỹ Thuật & An Toàn Khi Sử Dụng
            </label>
            <textarea
              rows={2}
              value={formData.safetyNotes || ''}
              onChange={e => setFormData({ ...formData, safetyNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="Hướng dẫn căn chỉnh đệm ghế, chốt tạ an toàn..."
            />
          </div>

          {/* Verification Status */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Trạng Thái Kiểm Duyệt:
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                formData.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                formData.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {formData.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                 formData.reviewStatus === 'needs_review' ? 'Chờ Duyệt' : 'Bản Nháp'}
              </span>
            </div>
            <select
              value={formData.reviewStatus || 'draft'}
              onChange={e => {
                const val = e.target.value as ReviewStatus;
                setFormData({
                  ...formData,
                  reviewStatus: val,
                  verified: val === 'verified'
                });
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100"
            >
              <option value="draft">Bản Nháp (Draft - Chưa kiểm duyệt)</option>
              <option value="needs_review">Chờ Kiểm Duyệt (Needs Review)</option>
              <option value="verified">Đã Xác Thực Thực Tế (Verified by Staff)</option>
              <option value="rejected">Từ Chối / Không Khả Dụng (Rejected)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu Thiết Bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL 3: EXERCISE MODAL =================
interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseCatalogueEntry | null;
  equipmentList: GymEquipment[];
  onSave: (exercise: ExerciseCatalogueEntry) => Promise<void>;
  currentAdminEmail: string;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  exercise,
  equipmentList,
  onSave,
  currentAdminEmail
}) => {
  const [formData, setFormData] = useState<Partial<ExerciseCatalogueEntry>>({
    id: '',
    name: '',
    nameEn: '',
    category: 'Ngực',
    primaryMuscle: 'Ngực',
    targetMuscles: [],
    secondaryMuscles: [],
    requiredEquipmentIds: [],
    difficulty: 'beginner',
    movementPattern: 'push',
    instructions: [],
    trainerCues: [],
    contraindications: [],
    reviewStatus: 'draft',
    verified: false,
    revision: 1
  });

  const [instructionsStr, setInstructionsStr] = useState('');
  const [cuesStr, setCuesStr] = useState('');
  const [contraindicationsStr, setContraindicationsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
      setInstructionsStr(exercise.instructions?.join('\n') || '');
      setCuesStr(exercise.trainerCues?.join('\n') || '');
      setContraindicationsStr(exercise.contraindications?.join(', ') || '');
    } else {
      setFormData({
        id: `ex_${Date.now()}`,
        name: '',
        nameEn: '',
        category: 'Ngực',
        primaryMuscle: 'Ngực',
        targetMuscles: [],
        secondaryMuscles: [],
        requiredEquipmentIds: [],
        difficulty: 'beginner',
        movementPattern: 'push',
        instructions: [],
        trainerCues: [],
        contraindications: [],
        reviewStatus: 'draft',
        verified: false,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setInstructionsStr('');
      setCuesStr('');
      setContraindicationsStr('');
    }
  }, [exercise, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên bài tập');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const exPayload: ExerciseCatalogueEntry = {
        id: formData.id || `ex_${Date.now()}`,
        name: formData.name.trim(),
        nameEn: formData.nameEn?.trim() || '',
        category: formData.category || 'Ngực',
        primaryMuscle: formData.primaryMuscle || formData.category || 'Ngực',
        targetMuscles: [formData.primaryMuscle || formData.category || 'Ngực'],
        secondaryMuscles: formData.secondaryMuscles || [],
        requiredEquipmentIds: formData.requiredEquipmentIds || [],
        difficulty: formData.difficulty as ExerciseDifficulty || 'beginner',
        movementPattern: formData.movementPattern as MovementPattern || 'push',
        instructions: instructionsStr.split('\n').map(s => s.trim()).filter(Boolean),
        trainerCues: cuesStr.split('\n').map(s => s.trim()).filter(Boolean),
        contraindications: contraindicationsStr.split(',').map(s => s.trim()).filter(Boolean),
        reviewStatus: formData.reviewStatus || 'draft',
        verified: formData.verified || false,
        verifiedBy: formData.verified ? (formData.verifiedBy || currentAdminEmail) : undefined,
        verifiedAt: formData.verified ? (formData.verifiedAt || new Date().toISOString()) : undefined,
        revision: (formData.revision || 1),
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(exPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipmentSelection = (eqId: string) => {
    const current = formData.requiredEquipmentIds || [];
    if (current.includes(eqId)) {
      setFormData({
        ...formData,
        requiredEquipmentIds: current.filter(id => id !== eqId)
      });
    } else {
      setFormData({
        ...formData,
        requiredEquipmentIds: [...current, eqId]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg text-white">
              {exercise ? 'Chỉnh sửa Bài Tập Chuẩn Hóa' : 'Thêm Bài Tập Mới'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Bài Tập (Tiếng Việt) *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Kéo Xô Rộng Tay Trên Máy"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tên Tiếng Anh (English)
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                placeholder="ví dụ: Wide-Grip Lat Pulldown"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Nhóm Cơ Chính *
              </label>
              <select
                value={formData.category || 'Ngực'}
                onChange={e => setFormData({ ...formData, category: e.target.value, primaryMuscle: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Ngực">Ngực (Chest)</option>
                <option value="Lưng">Lưng / Xô (Back)</option>
                <option value="Chân">Đùi & Chân (Legs)</option>
                <option value="Vai">Vai (Shoulders)</option>
                <option value="Tay">Tay (Arms)</option>
                <option value="Core">Bụng & Core (Abs)</option>
                <option value="Cardio">Cardio & Sức Bền</option>
                <option value="Boxing">Boxing & Kickfit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Độ Khó
              </label>
              <select
                value={formData.difficulty || 'beginner'}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="beginner">Người Mới (Beginner)</option>
                <option value="intermediate">Trung Cấp (Intermediate)</option>
                <option value="advanced">Nâng Cao (Advanced)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Chuyển Động (Pattern)
              </label>
              <select
                value={formData.movementPattern || 'push'}
                onChange={e => setFormData({ ...formData, movementPattern: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="push">Đẩy (Push)</option>
                <option value="pull">Kéo (Pull)</option>
                <option value="squat">Ngồi Xổm (Squat)</option>
                <option value="hinge">Gập Hông (Hinge)</option>
                <option value="lunge">Bước Chân (Lunge)</option>
                <option value="carry">Mang Vác (Carry)</option>
                <option value="isolation">Cô Lập (Isolation)</option>
              </select>
            </div>
          </div>

          {/* Required Equipment Binding */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Thiết Bị Yêu Cầu (Required Equipment)
            </label>
            <div className="max-h-36 overflow-y-auto p-2 bg-zinc-800/80 border border-zinc-700 rounded-xl space-y-1">
              {equipmentList.length === 0 ? (
                <p className="text-xs text-zinc-500 italic p-2">Chưa có thiết bị nào trong danh mục</p>
              ) : (
                equipmentList.map(eq => {
                  const isSelected = formData.requiredEquipmentIds?.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquipmentSelection(eq.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition text-left ${
                        isSelected 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                          : 'hover:bg-zinc-700/50 text-zinc-300'
                      }`}
                    >
                      <span>{eq.name} ({eq.zoneName || eq.zoneId})</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Cues Nhắc Nhở Từ HLV (Mỗi dòng 1 cue)
            </label>
            <textarea
              rows={2}
              value={cuesStr}
              onChange={e => setCuesStr(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: Ép chặt 2 bả vai&#10;Không dùng quán tính lắc người"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Các Bước Thực Hiện (Mỗi dòng 1 bước)
            </label>
            <textarea
              rows={3}
              value={instructionsStr}
              onChange={e => setInstructionsStr(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="1. Ngồi thẳng lưng&#10;2. Kéo thanh xà xuống ngang ngực trên..."
            />
          </div>

          {/* Verification Status */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Trạng Thái Kiểm Duyệt:
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                formData.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                formData.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {formData.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                 formData.reviewStatus === 'needs_review' ? 'Chờ Duyệt' : 'Bản Nháp'}
              </span>
            </div>
            <select
              value={formData.reviewStatus || 'draft'}
              onChange={e => {
                const val = e.target.value as ReviewStatus;
                setFormData({
                  ...formData,
                  reviewStatus: val,
                  verified: val === 'verified'
                });
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100"
            >
              <option value="draft">Bản Nháp (Draft)</option>
              <option value="needs_review">Chờ Kiểm Duyệt (Needs Review)</option>
              <option value="verified">Đã Xác Thực Thực Tế (Verified by Staff)</option>
              <option value="rejected">Từ Chối (Rejected)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu Bài Tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL 4: STAFF SIGNATURE / VERIFY MODAL =================
interface StaffVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'zone' | 'equipment' | 'exercise' | null;
  entityId: string;
  entityName: string;
  currentStatus: ReviewStatus;
  onConfirmVerification: (data: {
    entityType: 'zone' | 'equipment' | 'exercise';
    entityId: string;
    verified: boolean;
    reviewStatus: ReviewStatus;
    notes?: string;
  }) => Promise<void>;
  currentAdminEmail: string;
}

export const StaffVerifyModal: React.FC<StaffVerifyModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  currentStatus,
  onConfirmVerification,
  currentAdminEmail
}) => {
  const [targetStatus, setTargetStatus] = useState<ReviewStatus>('verified');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetStatus('verified');
    setNotes('');
    setError(null);
  }, [isOpen, entityId]);

  if (!isOpen || !entityType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await onConfirmVerification({
        entityType,
        entityId,
        verified: targetStatus === 'verified',
        reviewStatus: targetStatus,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi kiểm duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg text-white">
              Ký Duyệt Kiểm Định Cơ Sở (Staff Signature)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1.5">
            <div className="text-zinc-400">
              Đối tượng: <strong className="text-zinc-100">{entityName}</strong>
            </div>
            <div className="text-zinc-400">
              Mã ID: <code className="text-amber-400">{entityId}</code> ({entityType.toUpperCase()})
            </div>
            <div className="text-zinc-400">
              Người ký duyệt: <strong className="text-zinc-200">{currentAdminEmail}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Hành Động Phê Duyệt *
            </label>
            <select
              value={targetStatus}
              onChange={e => setTargetStatus(e.target.value as ReviewStatus)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
            >
              <option value="verified">✅ Xác Nhận Đã Kiểm Tra Thực Tế (Phê duyệt)</option>
              <option value="needs_review">⏳ Yêu Cầu Kiểm Tra Lại (Needs Review)</option>
              <option value="rejected">❌ Từ Chối / Thiết Bị Không Đạt Chuẩn (Rejected)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Ghi Chú Kiểm Tra / Lý Do
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              placeholder="ví dụ: Đã kiểm tra dây cáp và chốt tạ Tầng 2, thiết bị hoạt động hoàn hảo..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {submitting ? 'Đang ký duyệt...' : 'Xác Nhận Ký Duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
