import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Save, 
  Flame, 
  Award,
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { MemberUser } from './AuthModal';
import { Language } from '../translations';
import { 
  WorkoutLogEntry, 
  WorkoutSet, 
  saveWorkoutLogInFirebase, 
  getMemberWorkoutLogsFromFirebase, 
  deleteWorkoutLogInFirebase 
} from '../lib/firebase';

interface MemberWorkoutLogProps {
  user: MemberUser;
  lang?: Language;
}

interface QuickExercise {
  name: string;
  category: string;
}

const POPULAR_EXERCISES: QuickExercise[] = [
  // Ngực / Chest
  { name: 'Bench Press (Đẩy ngực ngang)', category: 'Ngực' },
  { name: 'Incline Dumbbell Press (Đẩy ngực dốc lên)', category: 'Ngực' },
  { name: 'Cable Fly (Ép ngực cáp)', category: 'Ngực' },
  // Lưng / Back
  { name: 'Lat Pulldown (Kéo xô máy)', category: 'Lưng' },
  { name: 'Barbell Row (Chèo tạ đòn)', category: 'Lưng' },
  { name: 'Deadlift (Kéo tạ truyền thống)', category: 'Lưng' },
  // Chân / Legs
  { name: 'Barbell Squat (Gánh đùi)', category: 'Chân' },
  { name: 'Leg Press (Đạp đùi máy)', category: 'Chân' },
  { name: 'Romanian Deadlift (Đùi sau)', category: 'Chân' },
  // Vai / Shoulders
  { name: 'Overhead Shoulder Press (Đẩy vai)', category: 'Vai' },
  { name: 'Dumbbell Lateral Raise (Dang vai đôi)', category: 'Vai' },
  // Tay / Arms
  { name: 'Barbell Bicep Curl (Cuốn tay trước)', category: 'Tay' },
  { name: 'Tricep Rope Pushdown (Kéo tay sau)', category: 'Tay' },
  // Bụng / Core
  { name: 'Plank & Hanging Leg Raise', category: 'Core' }
];

export const MemberWorkoutLog: React.FC<MemberWorkoutLogProps> = ({
  user,
  lang = 'vi'
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  // Form State
  const [exerciseName, setExerciseName] = useState<string>('');
  const [category, setCategory] = useState<string>('Ngực');
  const [notes, setNotes] = useState<string>('');
  const [sets, setSets] = useState<WorkoutSet[]>([
    { setNumber: 1, reps: 12, weightKg: 20, completed: true },
    { setNumber: 2, reps: 10, weightKg: 25, completed: true },
    { setNumber: 3, reps: 8, weightKg: 30, completed: true }
  ]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const memberIdentifier = user.memberCode || user.membershipCode || user.id || user.uid || '';
  const userUid = user.uid || user.id || memberIdentifier;

  // LocalStorage Key
  const localCacheKey = `theshine_workouts_${memberIdentifier}`;

  // Fetch initial logs (from LocalStorage first, then Firestore)
  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      
      // Load from local storage first for instant feedback
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        try {
          setLogs(JSON.parse(cached));
        } catch (e) {
          console.error(e);
        }
      }

      // Sync with Firestore
      try {
        const cloudLogs = await getMemberWorkoutLogsFromFirebase(memberIdentifier);
        if (cloudLogs && cloudLogs.length > 0) {
          setLogs(cloudLogs);
          localStorage.setItem(localCacheKey, JSON.stringify(cloudLogs));
        }
      } catch (err) {
        console.error('Firestore sync error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [memberIdentifier, userUid]);

  // Set management
  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const nextNumber = sets.length + 1;
    setSets([
      ...sets,
      {
        setNumber: nextNumber,
        reps: lastSet ? lastSet.reps : 10,
        weightKg: lastSet ? lastSet.weightKg : 20,
        completed: true
      }
    ]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    const updated = sets.filter((_, i) => i !== index).map((s, idx) => ({
      ...s,
      setNumber: idx + 1
    }));
    setSets(updated);
  };

  const handleUpdateSet = (index: number, field: keyof WorkoutSet, value: any) => {
    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSets(updated);
  };

  // Calculate Total Volume (kg) for currently edited exercise
  const currentVolume = sets.reduce((sum, s) => sum + (s.reps * s.weightKg), 0);

  // Submit Workout Log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    setIsSaving(true);
    const newEntry: WorkoutLogEntry = {
      id: 'log_' + Date.now(),
      memberCode: memberIdentifier,
      uid: userUid,
      date: selectedDate,
      exerciseName: exerciseName.trim(),
      category: category,
      sets: sets,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    // Save locally
    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(localCacheKey, JSON.stringify(updatedLogs));

    // Reset Form
    setExerciseName('');
    setNotes('');
    setShowAddForm(false);

    // Save to Cloud Firestore
    try {
      const res = await saveWorkoutLogInFirebase(newEntry);
      if (res.id) {
        newEntry.id = res.id;
        localStorage.setItem(localCacheKey, JSON.stringify(updatedLogs));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (logId?: string) => {
    if (!logId) return;
    const updated = logs.filter(l => l.id !== logId);
    setLogs(updated);
    localStorage.setItem(localCacheKey, JSON.stringify(updated));
    await deleteWorkoutLogInFirebase(logId);
  };

  // Filter logs by selected date
  const filteredLogs = logs.filter(l => l.date === selectedDate);
  const totalDayVolume = filteredLogs.reduce((acc, log) => {
    return acc + log.sets.reduce((s, set) => s + (set.reps * set.weightKg), 0);
  }, 0);

  const categories = ['Tất cả', 'Ngực', 'Lưng', 'Chân', 'Vai', 'Tay', 'Core'];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Overview Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-orange/20 text-brand-orange">
                <Dumbbell size={18} />
              </span>
              <h3 className="font-heading font-bold text-base sm:text-lg uppercase tracking-wide">
                {lang === 'vi' ? 'Nhật Ký Tập Luyện Hằng Ngày' : 'Daily Workout Progress'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'vi' 
                ? 'Ghi nhận số hiệp (sets), số lần (reps) và mức tạ (kg) để theo dõi sự tiến bộ.' 
                : 'Track your sets, reps, and weights to measure progressive overload.'}
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 shrink-0">
            <Calendar size={15} className="text-brand-orange shrink-0 ml-1" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Daily Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'vi' ? 'Bài tập đã ghi' : 'Exercises'}
            </span>
            <span className="text-base font-bold text-white flex items-center gap-1 mt-0.5">
              {filteredLogs.length} <span className="text-[11px] text-slate-400 font-normal">{lang === 'vi' ? 'bài' : 'logged'}</span>
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'vi' ? 'Tổng tải trọng' : 'Total Volume'}
            </span>
            <span className="text-base font-bold text-brand-orange flex items-center gap-1 mt-0.5">
              {totalDayVolume.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">kg</span>
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {lang === 'vi' ? 'Tổng số hiệp' : 'Total Sets'}
            </span>
            <span className="text-base font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              {filteredLogs.reduce((acc, log) => acc + log.sets.length, 0)} <span className="text-[11px] text-slate-400 font-normal">{lang === 'vi' ? 'hiệp' : 'sets'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar: Add Exercise Button */}
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Layers size={16} className="text-brand-orange" />
          {lang === 'vi' ? `Buổi tập ngày ${selectedDate === todayStr ? 'Hôm nay' : selectedDate}` : `Workout on ${selectedDate}`}
        </h4>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{lang === 'vi' ? 'Thêm bài tập mới' : 'Add Exercise'}</span>
          </button>
        )}
      </div>

      {/* Add New Exercise Form */}
      {showAddForm && (
        <form onSubmit={handleSaveLog} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#202020] border-2 border-brand-orange/40 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <span className="font-bold text-xs uppercase tracking-wider text-brand-orange flex items-center gap-1">
              <Sparkles size={14} />
              {lang === 'vi' ? 'Ghi lại bài tập mới' : 'Record New Exercise'}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer font-medium"
            >
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
          </div>

          {/* Exercise Name Input with Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'vi' ? 'Tên bài tập:' : 'Exercise Name:'}
            </label>
            <input
              type="text"
              required
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder={lang === 'vi' ? 'Ví dụ: Bench Press, Barbell Squat, Lat Pulldown...' : 'e.g. Bench Press, Squat...'}
              className="w-full px-3 py-2.5 bg-white dark:bg-[#151515] border border-slate-300 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-orange"
            />

            {/* Quick Picker Pills */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 self-center mr-1">
                {lang === 'vi' ? 'Gợi ý nhanh:' : 'Quick pick:'}
              </span>
              {POPULAR_EXERCISES.slice(0, 6).map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setExerciseName(ex.name);
                    setCategory(ex.category);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {ex.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Sets, Reps & Weights Table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'vi' ? 'Các hiệp tập (Sets & Reps):' : 'Sets & Reps:'}
              </label>
              <span className="text-[11px] font-semibold text-brand-orange">
                {lang === 'vi' ? 'Tải trọng bài này:' : 'Exercise Volume:'} {currentVolume.toLocaleString()} kg
              </span>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-2">
                <div className="col-span-2 text-center">{lang === 'vi' ? 'Hiệp' : 'Set'}</div>
                <div className="col-span-4 text-center">{lang === 'vi' ? 'Khối lượng (kg)' : 'Weight (kg)'}</div>
                <div className="col-span-4 text-center">{lang === 'vi' ? 'Số lần (Reps)' : 'Reps'}</div>
                <div className="col-span-2 text-center">{lang === 'vi' ? 'Xóa' : 'Del'}</div>
              </div>

              {sets.map((set, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-[#151515] p-2 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="col-span-2 font-bold text-center text-xs text-brand-orange">
                    #{set.setNumber}
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weightKg}
                        onChange={(e) => handleUpdateSet(index, 'weightKg', parseFloat(e.target.value) || 0)}
                        className="w-full text-center px-1.5 py-1.5 bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-4">
                    <input
                      type="number"
                      min="1"
                      value={set.reps}
                      onChange={(e) => handleUpdateSet(index, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full text-center px-1.5 py-1.5 bg-slate-50 dark:bg-[#202020] border border-slate-300 dark:border-white/10 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(index)}
                      disabled={sets.length <= 1}
                      className="text-slate-400 hover:text-rose-500 disabled:opacity-30 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddSet}
                className="w-full py-2 border border-dashed border-slate-300 dark:border-white/20 hover:border-brand-orange hover:text-brand-orange rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{lang === 'vi' ? 'Thêm hiệp tiếp theo (Add Set)' : 'Add Another Set'}</span>
              </button>
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'vi' ? 'Ghi chú cảm nhận (tùy chọn):' : 'Notes (optional):'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'vi' ? 'Ví dụ: Tăng 2.5kg so với tuần trước, pump cơ tốt...' : 'e.g. Increased 2.5kg, good pump...'}
              className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-300 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {lang === 'vi' ? 'Đóng' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || !exerciseName.trim()}
              className="px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSaving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu bài tập' : 'Save Exercise')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Logged Exercises List for the Day */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-slate-300 dark:border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-orange/10 text-brand-orange mx-auto flex items-center justify-center">
            <Dumbbell size={24} />
          </div>
          <div>
            <h5 className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
              {lang === 'vi' ? 'Chưa có bài tập nào được ghi trong ngày này' : 'No workout recorded for this date'}
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {lang === 'vi'
                ? 'Hãy bấm nút "Thêm bài tập mới" ở trên để lưu lại các hiệp tập và theo dõi mức tạ tiến bộ theo thời gian.'
                : 'Tap "Add Exercise" above to record sets, reps, and weights to monitor your fitness progress.'}
            </p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>{lang === 'vi' ? 'Bắt đầu ghi bài tập ngay' : 'Start Logging Now'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const exerciseVolume = log.sets.reduce((acc, s) => acc + (s.reps * s.weightKg), 0);
            const maxWeight = Math.max(...log.sets.map(s => s.weightKg), 0);

            return (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 shadow-xs hover:border-brand-orange/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold shrink-0">
                      <Dumbbell size={16} />
                    </div>
                    <div>
                      <h5 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {log.exerciseName}
                      </h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {log.category} • {log.sets.length} {lang === 'vi' ? 'hiệp' : 'sets'} • Max {maxWeight}kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg">
                      {exerciseVolume.toLocaleString()} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id)}
                      title={lang === 'vi' ? 'Xóa bài này' : 'Delete log'}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Sets Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {log.sets.map((s, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-[#151515] border border-slate-200/60 dark:border-white/5 text-center">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">
                        {lang === 'vi' ? `Hiệp ${s.setNumber}` : `Set ${s.setNumber}`}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                        {s.reps} reps × <strong className="text-brand-orange">{s.weightKg}kg</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Optional Note */}
                {log.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2 rounded-lg italic">
                    💬 {log.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fitness Motivation Tip */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-500 shrink-0" />
        <span className="leading-relaxed">
          {lang === 'vi'
            ? 'Mẹo huấn luyện: Duy trì ghi chép số tạ và số rep đều đặn để áp dụng nguyên lý Tăng tiến quá tải (Progressive Overload) giúp cơ bắp phát triển liên tục!'
            : 'Coaching tip: Track your sets and weights consistently to apply Progressive Overload for continuous strength and muscle gains!'}
        </span>
      </div>
    </div>
  );
};
