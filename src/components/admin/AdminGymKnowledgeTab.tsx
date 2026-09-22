import { PathwayIntakeModal, pathwayIntakeEnabled } from '../pathways/PathwayIntakeModal';
import { TrainingPrescriptionEditor } from '../training/TrainingPrescriptionEditor';
import { trainingUiEnabled } from '../training/TrainingGateway';
import { auth } from '../../lib/firebase';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Dumbbell, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  FileText,
  Building2,
  Trash2,
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  GymZone, 
  GymEquipment, 
  ExerciseCatalogueEntry, 
  CatalogueRevision,
  ReviewStatus 
} from '../../types/companion';
import { 
  checkCatalogueCompleteness 
} from '../../lib/companion/catalogueGuard';
import { 
  ZoneModal, 
  EquipmentModal, 
  ExerciseModal, 
  StaffVerifyModal 
} from './AdminGymModals';

interface AdminGymKnowledgeTabProps {
  currentAdminEmail: string;
  showToast: (msg: string) => void;
}

type SubTab = 'zones' | 'equipment' | 'exercises' | 'revisions';

async function catalogueFetch(url: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (url.startsWith('/api/admin/') && !user) throw new Error('Firebase admin sign-in required.');
  const headers = new Headers(init.headers);
  if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  if (user && auth.currentUser?.uid !== user.uid) throw new Error('Account changed.');
  return fetch(url, { ...init, headers });
}


export const AdminGymKnowledgeTab: React.FC<AdminGymKnowledgeTabProps> = ({
  currentAdminEmail,
  showToast
}) => {
  const [subTab, setSubTab] = useState<SubTab>('zones');
  const [pathwayOpen, setPathwayOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [zones, setZones] = useState<GymZone[]>([]);
  const [equipment, setEquipment] = useState<GymEquipment[]>([]);
  const [exercises, setExercises] = useState<ExerciseCatalogueEntry[]>([]);
  const [revisions, setRevisions] = useState<CatalogueRevision[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GymZone | null>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<GymEquipment | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseCatalogueEntry | null>(null);

  const [verifyModalState, setVerifyModalState] = useState<{
    isOpen: boolean;
    entityType: 'zone' | 'equipment' | 'exercise' | null;
    entityId: string;
    entityName: string;
    currentStatus: ReviewStatus;
  }>({
    isOpen: false,
    entityType: null,
    entityId: '',
    entityName: '',
    currentStatus: 'draft'
  });

  // Load Catalogue Data
  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await catalogueFetch('/api/companion/catalogue');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setZones(json.data.zones || []);
          setEquipment(json.data.equipment || []);
          setExercises(json.data.exercises || []);
        }
      }

      // Fetch revisions
      try {
        const revRes = await catalogueFetch('/api/admin/catalogue/revisions');
        if (revRes.ok) {
          const revJson = await revRes.json();
          setRevisions(revJson.revisions || []);
        }
      } catch (rErr) {
        console.warn('Could not fetch revisions:', rErr);
      }
    } catch (err) {
      console.error('Error loading gym catalogue:', err);
      showToast('Lỗi tải dữ liệu hạ tầng phòng tập');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Completeness analysis
  const completeness = useMemo(() => {
    return checkCatalogueCompleteness(zones, equipment, exercises);
  }, [zones, equipment, exercises]);

  // Zone handlers
  const handleSaveZone = async (zone: GymZone) => {
    const res = await catalogueFetch('/api/admin/catalogue/zone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zone)
    });
    if (!res.ok) throw new Error('Lỗi lưu khu vực');
    showToast(`Đã lưu khu vực: ${zone.name}`);
    await loadData();
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khu vực "${name}"?`)) return;
    const res = await catalogueFetch(`/api/admin/catalogue/zone/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      showToast('Lỗi xóa khu vực');
      return;
    }
    showToast(`Đã xóa khu vực: ${name}`);
    await loadData();
  };

  // Equipment handlers
  const handleSaveEquipment = async (item: GymEquipment) => {
    const res = await catalogueFetch('/api/admin/catalogue/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Lỗi lưu thiết bị');
    showToast(`Đã lưu thiết bị: ${item.name}`);
    await loadData();
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${name}"?`)) return;
    const res = await catalogueFetch(`/api/admin/catalogue/equipment/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      showToast('Lỗi xóa thiết bị');
      return;
    }
    showToast(`Đã xóa thiết bị: ${name}`);
    await loadData();
  };

  // Exercise handlers
  const handleSaveExercise = async (exercise: ExerciseCatalogueEntry) => {
    const res = await catalogueFetch('/api/admin/catalogue/exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise)
    });
    if (!res.ok) throw new Error('Lỗi lưu bài tập');
    showToast(`Đã lưu bài tập: ${exercise.name}`);
    await loadData();
  };

  const handleDeleteExercise = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${name}"?`)) return;
    const res = await catalogueFetch(`/api/admin/catalogue/exercise/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      showToast('Lỗi xóa bài tập');
      return;
    }
    showToast(`Đã xóa bài tập: ${name}`);
    await loadData();
  };

  // Verification signing handler
  const handleConfirmVerification = async (data: {
    entityType: 'zone' | 'equipment' | 'exercise';
    entityId: string;
    verified: boolean;
    reviewStatus: ReviewStatus;
    notes?: string;
  }) => {
    const res = await catalogueFetch('/api/admin/catalogue/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Lỗi cập nhật ký duyệt');
    showToast(data.verified ? '✅ Đã ký duyệt xác thực thành công!' : 'Đã cập nhật trạng thái kiểm duyệt.');
    await loadData();
  };

  // Export JSON handler
  const handleExportJson = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: currentAdminEmail,
      zones,
      equipment,
      exercises
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TheShine_GymCatalogue_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file dữ liệu hạ tầng');
  };

  // Import JSON handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.zones && !parsed.equipment && !parsed.exercises) {
          throw new Error('Cấu trúc file JSON không hợp lệ (cần zones, equipment, hoặc exercises)');
        }

        let importedZones = 0;
        let importedEq = 0;
        let importedEx = 0;

        // Save zones
        if (Array.isArray(parsed.zones)) {
          for (const z of parsed.zones) {
            await catalogueFetch('/api/admin/catalogue/zone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(z)
            });
            importedZones++;
          }
        }

        // Save equipment
        if (Array.isArray(parsed.equipment)) {
          for (const eq of parsed.equipment) {
            await catalogueFetch('/api/admin/catalogue/equipment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eq)
            });
            importedEq++;
          }
        }

        // Save exercises
        if (Array.isArray(parsed.exercises)) {
          for (const ex of parsed.exercises) {
            await catalogueFetch('/api/admin/catalogue/exercise', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ex)
            });
            importedEx++;
          }
        }

        showToast(`Đã nhập thành công: ${importedZones} khu vực, ${importedEq} thiết bị, ${importedEx} bài tập!`);
        await loadData();
      } catch (err: any) {
        alert(`Lỗi nhập file JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered lists
  const filteredZones = useMemo(() => {
    return zones.filter(z => {
      if (statusFilter !== 'all' && z.reviewStatus !== statusFilter) return false;
      if (floorFilter !== 'all' && z.floor !== floorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return z.name.toLowerCase().includes(q) || (z.nameEn && z.nameEn.toLowerCase().includes(q)) || z.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [zones, statusFilter, floorFilter, searchQuery]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      if (statusFilter !== 'all' && eq.reviewStatus !== statusFilter) return false;
      if (floorFilter !== 'all' && eq.floor !== floorFilter) return false;
      if (categoryFilter !== 'all' && eq.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return eq.name.toLowerCase().includes(q) || (eq.brand && eq.brand.toLowerCase().includes(q)) || eq.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [equipment, statusFilter, floorFilter, categoryFilter, searchQuery]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      if (statusFilter !== 'all' && ex.reviewStatus !== statusFilter) return false;
      if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ex.name.toLowerCase().includes(q) || (ex.nameEn && ex.nameEn.toLowerCase().includes(q)) || ex.primaryMuscle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [exercises, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {pathwayIntakeEnabled() && <button type="button" onClick={() => setPathwayOpen(true)} className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold">Training Pathway Intake</button>}
      {pathwayOpen && <PathwayIntakeModal onClose={() => setPathwayOpen(false)} />}
      {/* 1. Core Principle Banner & Completeness Scoreboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Hạ Tầng & Danh Mục Máy Tập (The Shine Gym Knowledge Base)
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Cơ sở dữ liệu vật lý và bài tập chuẩn hóa làm nền tảng kiểm chứng cho <strong>Shine Companion AI</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-200 transition"
              title="Xuất dữ liệu ra file JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Core Verification Safety Rule Notice */}
        <div className="p-4 bg-zinc-950/80 border border-amber-500/30 rounded-xl text-xs space-y-2 text-zinc-300">
          <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>NGUYÊN TẮC BẢO ĐẢM DỮ LIỆU THỰC TẾ (GROUNDED GYM KNOWLEDGE):</span>
          </div>
          <p className="leading-relaxed">
            AI Shine Companion <strong>không tự suy đoán máy tập</strong> nếu chưa có dữ liệu thực tế được Ban Quản Lý và HLV trưởng kiểm định. Mọi đối tượng có nhãn <em>Bản nháp</em> hoặc <em>Dữ liệu mẫu</em> đều bị <strong>chặn tự động</strong> không cho phép khuyến nghị vào lịch tập của Hội viên nhằm tránh rủi ro an toàn.
          </p>
        </div>

        {/* Verification Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Khu Vực (Zones)</span>
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{completeness.verifiedCounts.zones}</span>
              <span className="text-xs text-zinc-400">/ {completeness.totalCounts.zones} đã duyệt</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-400 h-1.5 rounded-full transition-all"
                style={{ width: `${completeness.totalCounts.zones ? (completeness.verifiedCounts.zones / completeness.totalCounts.zones) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Thiết Bị (Equipment)</span>
              <Dumbbell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{completeness.verifiedCounts.equipment}</span>
              <span className="text-xs text-zinc-400">/ {completeness.totalCounts.equipment} khả dụng & đã duyệt</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{ width: `${completeness.totalCounts.equipment ? (completeness.verifiedCounts.equipment / completeness.totalCounts.equipment) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Bài Tập (Exercises)</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{completeness.verifiedCounts.exercises}</span>
              <span className="text-xs text-zinc-400">/ {completeness.totalCounts.exercises} bài chuẩn hóa</span>
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-400 h-1.5 rounded-full transition-all"
                style={{ width: `${completeness.totalCounts.exercises ? (completeness.verifiedCounts.exercises / completeness.totalCounts.exercises) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Readiness Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          completeness.isSufficientForPlanning
            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
            : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5 text-xs">
            {completeness.isSufficientForPlanning ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm text-zinc-100">
                {completeness.isSufficientForPlanning 
                  ? 'Trạng thái: ĐÃ ĐỦ DỮ LIỆU XÁC THỰC CHO SHINE COMPANION' 
                  : 'Trạng thái: CHƯA ĐỦ DỮ LIỆU XÁC THỰC THỰC TẾ'}
              </div>
              <p className="text-zinc-400 mt-0.5">{completeness.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subtabs Navigation & Search/Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSubTab('zones')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              subTab === 'zones'
                ? 'bg-amber-400 text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Khu Vực ({zones.length})</span>
          </button>

          <button
            onClick={() => setSubTab('equipment')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              subTab === 'equipment'
                ? 'bg-amber-400 text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Thiết Bị & Máy ({equipment.length})</span>
          </button>

          <button
            onClick={() => setSubTab('exercises')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              subTab === 'exercises'
                ? 'bg-amber-400 text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Bài Tập Chuẩn Hóa ({exercises.length})</span>
          </button>

          <button
            onClick={() => setSubTab('revisions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
              subTab === 'revisions'
                ? 'bg-amber-400 text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch Sử Kiểm Duyệt ({revisions.length})</span>
          </button>
        </div>

        {/* Add Button */}
        <div>
          {subTab === 'zones' && (
            <button
              onClick={() => {
                setEditingZone(null);
                setIsZoneModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-semibold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khu Vực</span>
            </button>
          )}

          {subTab === 'equipment' && (
            <button
              onClick={() => {
                setEditingEquipment(null);
                setIsEquipmentModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-semibold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thiết Bị / Máy Tập</span>
            </button>
          )}

          {subTab === 'exercises' && (
            <button
              onClick={() => {
                setEditingExercise(null);
                setIsExerciseModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-semibold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bài Tập Chuẩn Hóa</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      {subTab !== 'revisions' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, mã ID, thương hiệu..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="verified">✅ Đã Xác Thực (Verified)</option>
              <option value="needs_review">⏳ Chờ Duyệt (Needs Review)</option>
              <option value="draft">📝 Bản Nháp (Draft)</option>
              <option value="rejected">❌ Từ Chối (Rejected)</option>
            </select>
          </div>

          {subTab === 'zones' || subTab === 'equipment' ? (
            <div>
              <select
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Tất cả các tầng</option>
                <option value="floor1">Tầng 1</option>
                <option value="floor2">Tầng 2</option>
                <option value="rooftop">Tầng Thượng</option>
              </select>
            </div>
          ) : (
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Tất cả nhóm cơ</option>
                <option value="Ngực">Ngực</option>
                <option value="Lưng">Lưng</option>
                <option value="Chân">Chân</option>
                <option value="Vai">Vai</option>
                <option value="Tay">Tay</option>
                <option value="Core">Core</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 4. Subtab Contents */}

      {/* SUBTAB 1: ZONES */}
      {subTab === 'zones' && (
        <div className="space-y-3">
          {filteredZones.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              Chưa có khu vực nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredZones.map(zone => (
                <div 
                  key={zone.id} 
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 border border-zinc-700 rounded text-[11px] font-mono">
                          {zone.floor === 'floor1' ? 'Tầng 1' : zone.floor === 'floor2' ? 'Tầng 2' : zone.floor}
                        </span>
                        <h4 className="font-bold text-white text-base">{zone.name}</h4>
                      </div>
                      {zone.nameEn && <p className="text-xs text-zinc-400 mt-0.5">{zone.nameEn}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        zone.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        zone.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {zone.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                         zone.reviewStatus === 'needs_review' ? 'Chờ Duyệt' : 'Bản Nháp'}
                      </span>
                    </div>
                  </div>

                  {zone.landmark && (
                    <p className="text-xs text-zinc-300">
                      <strong>Điểm nhận diện:</strong> {zone.landmark}
                    </p>
                  )}

                  {zone.directionsFromReception && (
                    <p className="text-xs text-zinc-400">
                      <strong>Chỉ dẫn:</strong> {zone.directionsFromReception}
                    </p>
                  )}

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="text-zinc-500">
                      {zone.verified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Duyệt bởi {zone.verifiedBy || 'Staff'}
                        </span>
                      ) : (
                        <span>Rev {zone.revision} • Chưa ký duyệt</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVerifyModalState({
                          isOpen: true,
                          entityType: 'zone',
                          entityId: zone.id,
                          entityName: zone.name,
                          currentStatus: zone.reviewStatus
                        })}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-lg text-xs font-medium transition"
                      >
                        Ký Duyệt
                      </button>
                      <button
                        onClick={() => {
                          setEditingZone(zone);
                          setIsZoneModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id, zone.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: EQUIPMENT */}
      {subTab === 'equipment' && (
        <div className="space-y-3">
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              Chưa có máy tập / thiết bị nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEquipment.map(eq => (
                <div 
                  key={eq.id} 
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[11px] font-mono">
                          {eq.brand || 'The Shine'}
                        </span>
                        <h4 className="font-bold text-white text-base">{eq.name}</h4>
                      </div>
                      <p className="text-xs text-amber-400/90 mt-0.5">
                        {eq.zoneName || eq.zoneId} ({eq.floor === 'floor1' ? 'Tầng 1' : 'Tầng 2'})
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        eq.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        eq.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {eq.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                         eq.reviewStatus === 'needs_review' ? 'Chờ Duyệt' : 'Bản Nháp'}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        eq.operationalStatus === 'operational' ? 'text-emerald-400' :
                        eq.operationalStatus === 'under_maintenance' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {eq.operationalStatus === 'operational' ? '● Hoạt động' :
                         eq.operationalStatus === 'under_maintenance' ? '● Bảo trì' : '● Ngừng sử dụng'}
                      </span>
                    </div>
                  </div>

                  {eq.primaryMuscleGroups && eq.primaryMuscleGroups.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-zinc-400">Cơ chính:</span>
                      {eq.primaryMuscleGroups.map((mg, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded text-[11px]">
                          {mg}
                        </span>
                      ))}
                    </div>
                  )}

                  {eq.safetyNotes && (
                    <p className="text-xs text-zinc-400">
                      <strong>Lưu ý:</strong> {eq.safetyNotes}
                    </p>
                  )}

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="text-zinc-500">
                      {eq.verified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Duyệt bởi {eq.verifiedBy || 'Staff'}
                        </span>
                      ) : (
                        <span>Rev {eq.revision} • Chưa duyệt</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVerifyModalState({
                          isOpen: true,
                          entityType: 'equipment',
                          entityId: eq.id,
                          entityName: eq.name,
                          currentStatus: eq.reviewStatus
                        })}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-lg text-xs font-medium transition"
                      >
                        Ký Duyệt
                      </button>
                      <button
                        onClick={() => {
                          setEditingEquipment(eq);
                          setIsEquipmentModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: EXERCISES */}
      {subTab === 'exercises' && (
        <div className="space-y-3">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              Chưa có bài tập chuẩn hóa nào phù hợp với bộ lọc
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExercises.map(ex => (
                <div 
                  key={ex.id} 
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 border border-zinc-700 rounded text-[11px] font-mono">
                          {ex.category}
                        </span>
                        <h4 className="font-bold text-white text-base">{ex.name}</h4>
                      </div>
                      {ex.nameEn && <p className="text-xs text-zinc-400 mt-0.5">{ex.nameEn}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        ex.reviewStatus === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        ex.reviewStatus === 'needs_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {ex.reviewStatus === 'verified' ? 'Đã Xác Thực' :
                         ex.reviewStatus === 'needs_review' ? 'Chờ Duyệt' : 'Bản Nháp'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-zinc-300">
                    <div><strong>Độ khó:</strong> {ex.difficulty} • <strong>Chuyển động:</strong> {ex.movementPattern || 'Standard'}</div>
                    {ex.requiredEquipmentIds && ex.requiredEquipmentIds.length > 0 && (
                      <div className="text-zinc-400">
                        <strong>Máy tập yêu cầu:</strong> {ex.requiredEquipmentIds.join(', ')}
                      </div>
                    )}
                  </div>

                  {ex.trainerCues && ex.trainerCues.length > 0 && (
                    <div className="p-2.5 bg-zinc-950 rounded-xl text-xs text-zinc-300 space-y-0.5 border border-zinc-800">
                      <div className="font-semibold text-amber-400">HLV Cues:</div>
                      {ex.trainerCues.map((cue, idx) => (
                        <div key={idx}>• {cue}</div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="text-zinc-500">
                      {ex.verified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Duyệt bởi {ex.verifiedBy || 'Staff'}
                        </span>
                      ) : (
                        <span>Rev {ex.revision} • Chưa duyệt</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVerifyModalState({
                          isOpen: true,
                          entityType: 'exercise',
                          entityId: ex.id,
                          entityName: ex.name,
                          currentStatus: ex.reviewStatus
                        })}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-lg text-xs font-medium transition"
                      >
                        Ký Duyệt
                      </button>
                      <button
                        onClick={() => {
                          setEditingExercise(ex);
                          setIsExerciseModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(ex.id, ex.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: REVISIONS AUDIT LOG */}
      {subTab === 'revisions' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Nhật Ký Kiểm Duyệt & Thay Đổi Hạ Tầng (Audit Trail)</span>
            </h3>
            <span className="text-xs text-zinc-400">{revisions.length} bản ghi</span>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto">
            {revisions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Chưa có bản ghi thay đổi nào được lưu lại
              </div>
            ) : (
              revisions.map(rev => (
                <div key={rev.id} className="p-4 text-xs space-y-1 hover:bg-zinc-800/30 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {rev.changeSummary || `${rev.action.toUpperCase()} ${rev.entityType}`}
                    </span>
                    <span className="text-zinc-500 font-mono">
                      {new Date(rev.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span>Người thực hiện: <strong className="text-amber-400">{rev.changedBy}</strong></span>
                    <span>Đối tượng: <code>{rev.entityId}</code></span>
                    <span>Phiên bản: <strong>v{rev.version}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {trainingUiEnabled() && <TrainingPrescriptionEditor exercises={exercises} onSaved={loadData} />}

      {/* MODALS */}
      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        zone={editingZone}
        onSave={handleSaveZone}
        currentAdminEmail={currentAdminEmail}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        equipment={editingEquipment}
        zones={zones}
        onSave={handleSaveEquipment}
        currentAdminEmail={currentAdminEmail}
      />

      <ExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        exercise={editingExercise}
        equipmentList={equipment}
        onSave={handleSaveExercise}
        currentAdminEmail={currentAdminEmail}
      />

      <StaffVerifyModal
        isOpen={verifyModalState.isOpen}
        onClose={() => setVerifyModalState({ ...verifyModalState, isOpen: false })}
        entityType={verifyModalState.entityType}
        entityId={verifyModalState.entityId}
        entityName={verifyModalState.entityName}
        currentStatus={verifyModalState.currentStatus}
        onConfirmVerification={handleConfirmVerification}
        currentAdminEmail={currentAdminEmail}
      />
    </div>
  );
};
