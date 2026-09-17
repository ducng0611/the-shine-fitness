import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Scale, 
  Ruler, 
  User, 
  Heart, 
  Flame, 
  Droplets, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ArrowRight, 
  ShieldCheck, 
  FileText,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { Language } from '../translations';
import { saveHealthAssessmentToFirebase } from '../lib/firebase';
import { HealthMetrics, HealthResult } from '../types';

interface HealthCalculatorProps {
  lang: Language;
  onOpenBooking?: (notes?: string) => void;
}

export const HealthCalculator: React.FC<HealthCalculatorProps> = ({ lang, onOpenBooking }) => {
  const isVi = lang === 'vi';

  // Input states
  const [metrics, setMetrics] = useState<HealthMetrics>({
    gender: 'male',
    age: 26,
    heightCm: 172,
    weightKg: 68,
    waistCm: 80,
    neckCm: 37,
    hipCm: 95,
    activityLevel: 'moderate',
    goal: 'fat_loss'
  });

  // Gated submission state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    timePreference: 'Buổi chiều (16:30 - 19:30)'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Compute calculated values
  const results: HealthResult = useMemo(() => {
    const { gender, age, heightCm, weightKg, waistCm, neckCm, hipCm, activityLevel, goal } = metrics;
    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    const bmi = Math.round(rawBmi * 10) / 10;

    // BMI Category (WHO Asian Standard)
    let bmiCategory = 'Cân đối (Lý tưởng)';
    let bmiCategoryEn = 'Normal Weight';
    let bmiColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';

    if (bmi < 18.5) {
      bmiCategory = 'Nhẹ cân / Thiếu cân';
      bmiCategoryEn = 'Underweight';
      bmiColor = 'text-sky-500 bg-sky-500/10 border-sky-500/30';
    } else if (bmi >= 18.5 && bmi <= 22.9) {
      bmiCategory = 'Chuẩn thể hình người Châu Á';
      bmiCategoryEn = 'Ideal Healthy Range';
      bmiColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    } else if (bmi >= 23.0 && bmi <= 24.9) {
      bmiCategory = 'Tiền thừa cân';
      bmiCategoryEn = 'Overweight Tendency';
      bmiColor = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    } else if (bmi >= 25.0 && bmi <= 29.9) {
      bmiCategory = 'Thừa cân (Độ 1)';
      bmiCategoryEn = 'Overweight';
      bmiColor = 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    } else {
      bmiCategory = 'Béo phì';
      bmiCategoryEn = 'Obese';
      bmiColor = 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }

    // Ideal weight range: BMI 19 to 23
    const minIdealKg = Math.round(18.5 * heightM * heightM);
    const maxIdealKg = Math.round(22.9 * heightM * heightM);
    const idealWeightRange = `${minIdealKg} - ${maxIdealKg} kg`;

    // BMR (Mifflin-St Jeor)
    let bmr = Math.round(
      gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    );

    // TDEE Multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const tdee = Math.round(bmr * multipliers[activityLevel]);

    // Body fat % estimation (U.S. Navy Formula)
    let bodyFatPct: number | undefined;
    try {
      if (waistCm && neckCm) {
        if (gender === 'male' && waistCm > neckCm) {
          const rawBf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
          bodyFatPct = Math.round(Math.max(5, Math.min(50, rawBf)) * 10) / 10;
        } else if (gender === 'female' && hipCm && (waistCm + hipCm) > neckCm) {
          const rawBf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
          bodyFatPct = Math.round(Math.max(10, Math.min(55, rawBf)) * 10) / 10;
        }
      }
    } catch (e) {
      // ignore calculation error
    }

    // Target Calories
    let targetCalories = tdee;
    if (goal === 'fat_loss') targetCalories = Math.max(1200, tdee - 450);
    if (goal === 'muscle_gain') targetCalories = tdee + 350;

    // Macro Split (Protein 2.0g/kg, Fat 25% total cals, Carbs rest)
    const proteinGrams = Math.round(weightKg * (goal === 'muscle_gain' ? 2.2 : 2.0));
    const fatCalories = targetCalories * 0.25;
    const fatGrams = Math.round(fatCalories / 9);
    const carbCalories = targetCalories - (proteinGrams * 4) - fatCalories;
    const carbsGrams = Math.round(Math.max(50, carbCalories / 4));

    // Daily Water: ~0.04L per kg + 0.5L for training
    const waterLiters = Math.round((weightKg * 0.04 + 0.5) * 10) / 10;

    return {
      bmi,
      bmiCategory,
      bmiCategoryEn,
      bmiColor,
      idealWeightRange,
      bmr,
      tdee,
      bodyFatPct,
      targetCalories,
      macros: {
        proteinGrams,
        carbsGrams,
        fatGrams
      },
      waterLiters
    };
  }, [metrics]);

  // Handle gated form submit & store in Firebase
  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!contactForm.fullName.trim()) {
      setErrorMsg(isVi ? 'Vui lòng nhập Họ và tên của bạn.' : 'Please enter your full name.');
      return;
    }
    if (!contactForm.phone.trim()) {
      setErrorMsg(isVi ? 'Vui lòng nhập Số điện thoại để nhận kết quả.' : 'Please enter your phone number.');
      return;
    }
    if (!contactForm.email.trim() || !contactForm.email.includes('@')) {
      setErrorMsg(isVi ? 'Vui lòng nhập địa chỉ Email hợp lệ.' : 'Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      await saveHealthAssessmentToFirebase({
        fullName: contactForm.fullName.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
        gender: metrics.gender,
        age: Number(metrics.age),
        heightCm: Number(metrics.heightCm),
        weightKg: Number(metrics.weightKg),
        waistCm: metrics.waistCm,
        neckCm: metrics.neckCm,
        activityLevel: metrics.activityLevel,
        bmi: results.bmi,
        bmiCategory: isVi ? results.bmiCategory : results.bmiCategoryEn,
        tdee: results.tdee,
        bmr: results.bmr,
        bodyFatPct: results.bodyFatPct,
        recommendedCalories: results.targetCalories,
        goal: metrics.goal
      });

      setIsUnlocked(true);
      setShowSuccessBadge(true);
    } catch (err: any) {
      console.error(err);
      setIsUnlocked(true); // Graceful unlock so user isn't blocked
    } finally {
      setLoading(false);
    }
  };

  const bmiPercentage = Math.min(96, Math.max(4, ((results.bmi - 15) / (35 - 15)) * 100));

  return (
    <section 
      id="health-calculator" 
      className="health-calculator-container py-16 sm:py-24 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/80 dark:from-[#131313] dark:via-[#161616] dark:to-[#131313] border-y border-slate-200 dark:border-white/10 transition-colors duration-200 relative overflow-hidden"
    >
      {/* Subtle Ambient Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header: Centered with balanced typography */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2.5">
            <Activity size={14} />
            <span>{isVi ? 'Công Cụ Khoa Học Chuẩn Y Khoa' : 'Scientific Fitness Assessment'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight">
            {isVi ? 'ĐO BMI & THỂ HÌNH CHUẨN 5 SAO' : 'Smart BMI & Health Assessment Station'}
          </h2>
          <div className="w-16 h-1 bg-brand-orange mx-auto my-3 rounded-full" />
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed text-justify text-pretty px-4 sm:px-8 max-w-3xl mx-auto">
            {isVi 
              ? 'Nhập các thông số thể lực cá nhân để tính toán chính xác chỉ số khối cơ thể (BMI), mức tiêu hao năng lượng (TDEE), tỷ lệ mỡ và kế hoạch dinh dưỡng mục tiêu tại The Shine.'
              : 'Calculate your Body Mass Index (BMI), Daily Caloric Burn (TDEE), estimated Body Fat %, and ideal macronutrient distribution customized to your fitness goal.'}
          </p>
        </div>

        {/* Main Grid: Consistent 50/50 Symmetrical Grid with Balanced Heights & Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Unified Parameters Input & InBody Station Guarantee */}
          <div className="h-full flex flex-col justify-between bg-white dark:bg-[#161616] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            
            {/* Upper: Primary Parameters Form */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3.5">
                <h3 className="font-heading font-bold text-base sm:text-lg uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale size={18} className="text-brand-orange" />
                  {isVi ? 'Thông Số Cơ Thể' : 'Body Parameters'}
                </h3>
                <span className="text-[11px] font-semibold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full border border-brand-orange/20">
                  {isVi ? 'Miễn phí 100%' : '100% Free'}
                </span>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {isVi ? 'Giới tính' : 'Gender'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMetrics(m => ({ ...m, gender: 'male' }))}
                    className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase italic transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      metrics.gender === 'male'
                        ? 'bg-brand-orange text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-brand-orange/40'
                    }`}
                  >
                    <span>👦 {isVi ? 'Nam giới' : 'Male'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetrics(m => ({ ...m, gender: 'female' }))}
                    className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase italic transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      metrics.gender === 'female'
                        ? 'bg-brand-orange text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-brand-orange/40'
                    }`}
                  >
                    <span>👧 {isVi ? 'Nữ giới' : 'Female'}</span>
                  </button>
                </div>
              </div>

              {/* Age & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {isVi ? 'Tuổi' : 'Age'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="12"
                      max="90"
                      value={metrics.age}
                      onChange={e => setMetrics(m => ({ ...m, age: Math.max(1, Number(e.target.value)) }))}
                      className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand-orange outline-hidden"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400">
                      {isVi ? 'tuổi' : 'yrs'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {isVi ? 'Chiều cao' : 'Height'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      max="230"
                      value={metrics.heightCm}
                      onChange={e => setMetrics(m => ({ ...m, heightCm: Math.max(50, Number(e.target.value)) }))}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand-orange outline-hidden"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Weight & Waist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {isVi ? 'Cân nặng' : 'Weight'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={metrics.weightKg}
                      onChange={e => setMetrics(m => ({ ...m, weightKg: Math.max(20, Number(e.target.value)) }))}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand-orange outline-hidden"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {isVi ? 'Vòng eo' : 'Waist'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="40"
                      max="160"
                      value={metrics.waistCm}
                      onChange={e => setMetrics(m => ({ ...m, waistCm: Number(e.target.value) }))}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand-orange outline-hidden"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {isVi ? 'Mức độ hoạt động hàng ngày' : 'Daily Activity Level'}
                </label>
                <select
                  value={metrics.activityLevel}
                  onChange={e => setMetrics(m => ({ ...m, activityLevel: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-orange outline-hidden"
                >
                  <option value="sedentary">{isVi ? 'Ít vận động (Ngồi văn phòng nhiều)' : 'Sedentary (Little or no exercise)'}</option>
                  <option value="light">{isVi ? 'Vận động nhẹ (Tập 1 - 3 ngày/tuần)' : 'Lightly active (1-3 days/week)'}</option>
                  <option value="moderate">{isVi ? 'Vận động vừa (Tập 3 - 5 ngày/tuần)' : 'Moderately active (3-5 days/week)'}</option>
                  <option value="active">{isVi ? 'Vận động cao (Tập 6 - 7 ngày/tuần)' : 'Very active (6-7 days/week)'}</option>
                  <option value="very_active">{isVi ? 'Cường độ cao / Vận động viên' : 'Extra active / Athlete'}</option>
                </select>
              </div>

              {/* Fitness Goal */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {isVi ? 'Mục tiêu thể hình mong muốn' : 'Fitness Goal'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fat_loss', labelVi: 'Giảm mỡ', labelEn: 'Fat Loss' },
                    { id: 'maintenance', labelVi: 'Giữ cân', labelEn: 'Maintain' },
                    { id: 'muscle_gain', labelVi: 'Tăng cơ', labelEn: 'Build Muscle' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMetrics(m => ({ ...m, goal: item.id as any }))}
                      className={`py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                        metrics.goal === item.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-slate-300'
                      }`}
                    >
                      {isVi ? item.labelVi : item.labelEn}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Lower: Docked InBody 270 Hospital-Grade Guarantee with authentic InBody branding & blurred machine backdrop */}
            <div className="relative p-5 sm:p-6 rounded-b-3xl overflow-hidden border-t border-slate-200 dark:border-white/10 space-y-3">
              {/* Blurred InBody Machine Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-[2px] opacity-15 dark:opacity-20 scale-105 pointer-events-none transition-transform"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-amber-500/10 dark:from-[#111111]/92 dark:via-[#141414]/88 dark:to-orange-500/10 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Official InBody Logotype */}
                  <div className="flex items-baseline font-black tracking-tight select-none px-2.5 py-1 bg-white/90 dark:bg-black/60 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <span className="text-base text-[#971B2F] font-black tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>In</span>
                    <span className="text-base text-slate-900 dark:text-white font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Body</span>
                    <span className="ml-1 text-[10px] text-brand-orange font-bold">270</span>
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs uppercase italic tracking-wider text-slate-900 dark:text-white leading-tight">
                      {isVi ? 'Đo Chỉ Số Cơ - Mỡ 0đ Tại Club' : 'Free InBody 270 Medical Scan'}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      154 Hoàng Hoa Thám, P.12, Tân Bình
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-brand-orange text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                  0 VNĐ
                </span>
              </div>

              <p className="relative z-10 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {isVi 
                  ? 'Công cụ online tính toán ước lượng. Tại The Shine, máy InBody 270 chính hãng quét phân tích 12 chỉ số chuẩn y khoa: khối lượng cơ xương từng chi, mỡ nội tạng và tốc độ trao đổi chất.'
                  : 'Online tools provide estimates. At The Shine, our authentic InBody 270 medical analyzer tracks 12 comprehensive clinical metrics with zero sales pressure.'}
              </p>

              {/* 4 Trust points */}
              <div className="relative z-10 grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={13} className="text-brand-orange shrink-0" />
                  <span>{isVi ? 'Tặng 3-7 ngày tập thử' : '3-7 Day Free Pass'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={13} className="text-brand-orange shrink-0" />
                  <span>{isVi ? 'HLV kèm máy 1:1 ban đầu' : '1:1 PT Machine Setup'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={13} className="text-brand-orange shrink-0" />
                  <span>{isVi ? 'Cam kết không chèo kéo' : 'Zero Sales Pressure'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 size={13} className="text-brand-orange shrink-0" />
                  <span>{isVi ? 'Mở cửa 06h - 21h hàng ngày' : 'Open 06:00 - 21:00'}</span>
                </div>
              </div>

              {/* Quick direct CTA */}
              <button
                type="button"
                onClick={() => onOpenBooking && onOpenBooking('Tập thử miễn phí 3-7 ngày (Voucher SHINE-TRIAL-FREE)')}
                className="relative z-10 w-full py-2.5 bg-slate-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white font-heading font-bold text-xs uppercase italic rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 shadow-sm"
              >
                <span>{isVi ? 'Đăng Ký Đo InBody & Nhận Thẻ Tập 0đ' : 'Book Free Scan & 0đ Pass'}</span>
                <ArrowRight size={13} className="text-brand-orange" />
              </button>
            </div>

          </div>

          {/* Right Column: Visual BMI Meter Gauge & Comprehensive Diagnostic Report */}
          <div className="h-full flex flex-col justify-between space-y-6">
            
            {/* Real-time BMI Quick Diagnostic Gauge Card */}
            <div className="bg-white dark:bg-[#161616] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    {isVi ? 'Chỉ Số BMI Cá Nhân' : 'Personal BMI Metric'}
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="text-4xl sm:text-5xl font-heading font-black text-brand-orange">
                      {results.bmi}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      kg/m²
                    </span>
                  </div>
                </div>

                <div className={`px-3.5 py-2 rounded-2xl border font-bold text-xs sm:text-sm ${results.bmiColor} flex items-center gap-2 self-start sm:self-auto shadow-xs`}>
                  <Sparkles size={15} />
                  <span>{isVi ? results.bmiCategory : results.bmiCategoryEn}</span>
                </div>
              </div>

              {/* Dynamic Visual Scale Gauge with Pointer Pin */}
              <div className="pt-6 pb-2">
                <div className="relative w-full mb-1">
                  {/* Dynamic Pointer Marker Pin */}
                  <div 
                    className="absolute -top-7 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none"
                    style={{ left: `${bmiPercentage}%` }}
                  >
                    <span className="text-[10px] font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      {results.bmi}
                    </span>
                    <span className="text-slate-900 dark:text-white text-[9px] -mt-1 leading-none">▼</span>
                  </div>

                  {/* Range Gauge Bar */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                    <div className="w-[23%] bg-sky-400 transition-colors" title="<18.5 Thiếu cân" />
                    <div className="w-[30%] bg-emerald-500 transition-colors" title="18.5 - 22.9 Chuẩn" />
                    <div className="w-[17%] bg-amber-500 transition-colors" title="23 - 24.9 Tiền thừa cân" />
                    <div className="w-[30%] bg-rose-500 transition-colors" title="≥25 Thừa cân / Béo phì" />
                  </div>
                </div>

                {/* Legend Labels */}
                <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-2.5">
                  <span className="text-sky-600 dark:text-sky-400">{isVi ? 'Thiếu cân (<18.5)' : 'Under (<18.5)'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{isVi ? 'Cân đối (18.5-22.9)' : 'Ideal (18.5-22.9)'}</span>
                  <span className="text-amber-600 dark:text-amber-400">{isVi ? 'Thừa cân (23-24.9)' : 'Over (23-24.9)'}</span>
                  <span className="text-rose-600 dark:text-rose-400">{isVi ? 'Béo phì (≥25)' : 'Obese (≥25)'}</span>
                </div>

                {/* Target Weight Pill */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{isVi ? 'Khoảng cân nặng lý tưởng theo chiều cao của bạn:' : 'Your healthy recommended weight range:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                    {results.idealWeightRange}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Report: Gated Form OR Unlocked Report (Fills remaining height smoothly) */}
            {!isUnlocked ? (
              <div className="relative bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50/50 dark:to-[#161616] p-6 sm:p-7 rounded-3xl border-2 border-brand-orange/30 shadow-md flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-sm shrink-0">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base sm:text-lg uppercase italic text-slate-900 dark:text-white leading-tight">
                        {isVi ? 'Mở Khóa Bản Phân Tích & Kế Hoạch Calo' : 'Unlock Complete Diagnostic & Caloric Plan'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isVi ? 'Nhận kết quả TDEE, BMR, % Mỡ và Voucher 3-7 ngày trải nghiệm toàn bộ tiện ích The Shine.' : 'Receive full TDEE, BMR, estimated Body Fat %, macros and your complimentary 3-7 day VIP pass.'}
                      </p>
                    </div>
                  </div>

                  {/* Blurred Confidential Metrics Teaser without badge */}
                  <div className="my-3 rounded-xl overflow-hidden filter blur-[5px] select-none pointer-events-none opacity-30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-slate-100 dark:bg-black/50 rounded-lg">
                        <div className="h-2 w-12 bg-slate-300 dark:bg-slate-700 rounded mx-auto mb-1.5" />
                        <div className="h-4 w-16 bg-slate-400 dark:bg-slate-600 rounded mx-auto" />
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-black/50 rounded-lg">
                        <div className="h-2 w-12 bg-slate-300 dark:bg-slate-700 rounded mx-auto mb-1.5" />
                        <div className="h-4 w-16 bg-slate-400 dark:bg-slate-600 rounded mx-auto" />
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-black/50 rounded-lg">
                        <div className="h-2 w-12 bg-slate-300 dark:bg-slate-700 rounded mx-auto mb-1.5" />
                        <div className="h-4 w-16 bg-slate-400 dark:bg-slate-600 rounded mx-auto" />
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-black/50 rounded-lg">
                        <div className="h-2 w-12 bg-slate-300 dark:bg-slate-700 rounded mx-auto mb-1.5" />
                        <div className="h-4 w-16 bg-slate-400 dark:bg-slate-600 rounded mx-auto" />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
                      {errorMsg}
                    </div>
                  )}
                </div>

                {/* Form Inputs: Ergonomic and structured */}
                <form onSubmit={handleSubmitContact} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      {isVi ? 'Họ và tên *' : 'Full Name *'}
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={isVi ? 'Nguyễn Văn Nam' : 'David Miller'}
                        value={contactForm.fullName}
                        onChange={e => setContactForm(f => ({ ...f, fullName: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-orange outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        {isVi ? 'Số điện thoại *' : 'Phone *'}
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          required
                          placeholder="0946 293 593"
                          value={contactForm.phone}
                          onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-orange outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        {isVi ? 'Email nhận báo cáo *' : 'Email *'}
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="nam@gmail.com"
                          value={contactForm.email}
                          onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-orange outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-sm uppercase italic rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
                  >
                    {loading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Unlock size={16} />
                        {isVi ? 'Mở Khóa Toàn Bộ Báo Cáo & Nhận Voucher Tập Thử' : 'Unlock Full Report & Claim Free Pass'}
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-500">
                    🔒 {isVi ? 'Thông tin được lưu trữ bảo mật trên Firebase và cam kết không chia sẻ cho bên thứ ba.' : 'Information is securely saved to Firebase and never shared.'}
                  </p>
                </form>
              </div>
            ) : (
              /* UNLOCKED FULL REPORT */
              <div className="bg-white dark:bg-[#161616] p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-5 animate-fadeIn flex-1 flex flex-col justify-between">
                
                {/* Success Banner */}
                <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-emerald-900 dark:text-emerald-200">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block text-sm">
                      {isVi ? `Báo cáo thể hình của ${contactForm.fullName} đã mở khóa!` : `Assessment unlocked for ${contactForm.fullName}!`}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                      {isVi ? 'Dữ liệu đã được lưu trữ bảo mật trên Firebase Firestore. HLV The Shine sẽ hỗ trợ tư vấn giáo án phù hợp cho bạn.' : 'Data synchronized with Firebase Firestore. A trainer will reach out to advise you.'}
                    </span>
                  </div>
                </div>

                {/* 4 In-Depth Key Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Flame size={14} className="text-orange-500" />
                      <span>TDEE Burn</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                      {results.tdee.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">kcal / {isVi ? 'ngày' : 'day'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Heart size={14} className="text-rose-500" />
                      <span>BMR Base</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                      {results.bmr.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">kcal {isVi ? 'cơ bản' : 'basal'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>{isVi ? 'Ước tính % Mỡ' : 'Body Fat %'}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-heading font-black text-brand-orange">
                      {results.bodyFatPct ? `${results.bodyFatPct}%` : '15-18%'}
                    </div>
                    <div className="text-[10px] text-slate-400">{isVi ? 'chuẩn thể thao' : 'fitness level'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <Droplets size={14} className="text-sky-500" />
                      <span>{isVi ? 'Nước uống' : 'Water intake'}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-heading font-black text-sky-500">
                      {results.waterLiters}L
                    </div>
                    <div className="text-[10px] text-slate-400">{isVi ? 'mỗi ngày' : 'liters / day'}</div>
                  </div>
                </div>

                {/* Target Nutrition & Macro Split */}
                <div className="p-4 bg-orange-500/10 dark:bg-orange-500/15 rounded-2xl border border-brand-orange/30">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-heading font-bold text-xs sm:text-sm uppercase italic text-brand-orange flex items-center gap-2">
                      <Flame size={15} />
                      {isVi ? 'Mục tiêu Calo & Tỷ lệ Dinh dưỡng khuyến nghị' : 'Recommended Daily Calories & Macro Split'}
                    </h5>
                    <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                      {results.targetCalories.toLocaleString()} kcal/ngày
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Protein (Đạm)</div>
                      <div className="text-base font-black text-brand-orange">{results.macros.proteinGrams}g</div>
                      <div className="text-[10px] text-slate-400">~{results.macros.proteinGrams * 4} kcal</div>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Carbs (Tinh bột)</div>
                      <div className="text-base font-black text-amber-500">{results.macros.carbsGrams}g</div>
                      <div className="text-[10px] text-slate-400">~{results.macros.carbsGrams * 4} kcal</div>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Fats (Chất béo)</div>
                      <div className="text-base font-black text-emerald-500">{results.macros.fatGrams}g</div>
                      <div className="text-[10px] text-slate-400">~{results.macros.fatGrams * 9} kcal</div>
                    </div>
                  </div>
                </div>

                {/* Trainer Action CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                    💡 {isVi ? 'Muốn có giáo án tập luyện chuẩn xác theo chỉ số này?' : 'Need a customized workout routine based on these metrics?'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenBooking && onOpenBooking(`Đo chỉ số: BMI ${results.bmi}, Mục tiêu ${metrics.goal}`)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-xs uppercase italic rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isVi ? 'Đặt Lịch Huấn Luyện Viên 1-1' : 'Book 1-on-1 PT Consultation'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
