export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string[];
  category: 'Tập Luyện' | 'Dinh Dưỡng' | 'Giảm Cân' | 'Yoga & Sức Khỏe' | 'Hội Viên';
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  imageUrl: string;
  tags: string[];
  source?: string;
}

export interface HealthMetrics {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'fat_loss' | 'maintenance' | 'muscle_gain';
}

export interface HealthResult {
  bmi: number;
  bmiCategory: string;
  bmiCategoryEn: string;
  bmiColor: string;
  idealWeightRange: string;
  bmr: number;
  tdee: number;
  bodyFatPct?: number;
  targetCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  waterLiters: number;
}

// ================= ADMIN & RBAC TYPES =================
export type AdminRole = 'super_admin' | 'manager' | 'marketing';

export interface AdminUser {
  uid: string;
  email: string;
  fullName: string;
  role: AdminRole;
  roleTitle?: string;
  avatar?: string;
  phone?: string;
  permissions: string[];
  createdAt?: string;
  lastLogin?: string;
}

// ================= GYM PACKAGE TYPES =================
export type PackageCategory = 'gym' | 'yoga' | 'pt' | 'all_inclusive' | 'special';

export interface GymPackage {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  category: PackageCategory;
  price: number;
  originalPrice?: number;
  durationMonths?: number;
  durationDays?: number;
  durationLabel: string;
  benefits: string[];
  isPopular?: boolean;
  isActive: boolean;
  badge?: string;
  notes?: string;
  memberCount?: number;
  totalRevenue?: number;
  ptSessionsIncluded?: number;
  extraServices?: string;
  updatedAt?: string;
}

// ================= PROMOTIONS & VOUCHERS =================
export type DiscountType = 'percentage' | 'fixed_amount';

export interface PromotionCampaign {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  applicablePackages?: string[];
  isActive: boolean;
  createdAt?: string;
}

// ================= EMAIL MARKETING & AUTOMATION FLOW =================
export type FlowTriggerType = 
  | 'new_trial_registered'
  | 'membership_expiring_soon'
  | 'inactive_14_days'
  | 'promo_announcement'
  | 'post_workout_checkin';

export type FlowStepType = 'trigger' | 'delay' | 'email' | 'condition' | 'tag';

export interface FlowStep {
  id: string;
  type: FlowStepType;
  title: string;
  subtitle?: string;
  delayDays?: number;
  subject?: string;
  voucherCode?: string;
  config: {
    delayHours?: number;
    delayDays?: number;
    emailSubject?: string;
    emailPreheader?: string;
    emailBodyHtml?: string;
    ctaText?: string;
    ctaLink?: string;
    voucherCode?: string;
    conditionField?: 'has_visited' | 'has_purchased' | 'membership_tier';
    conditionValue?: string;
    tagToAdd?: string;
  };
}

export interface EmailMarketingFlow {
  id: string;
  name: string;
  title?: string;
  description: string;
  trigger: FlowTriggerType;
  triggerLabel: string;
  status: 'active' | 'draft' | 'paused';
  isActive?: boolean;
  steps: FlowStep[];
  stats: {
    enrolled: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ================= CUSTOMER CRM RECORD =================
export type CustomerStatus = 'new' | 'contacted' | 'trial_active' | 'member' | 'expired' | 'lost';
export type JourneyStage = 'awareness' | 'consideration' | 'conversion' | 'service' | 'retention';
export type CustomerPersona = 'minh' | 'tuan' | 'huong' | 'general';

export interface CustomerRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  source: 'trial_pass' | 'health_calculator' | 'walk_in' | 'member_portal' | 'excel_import' | 'reception';
  status: CustomerStatus;
  membershipTier?: string;
  packageInterested?: string;
  voucherUsed?: string;
  notes?: string;
  tags?: string[];
  bmiData?: {
    bmi: number;
    category: string;
    tdee: number;
    goal: string;
  };
  // Rich attributes from TheShineFitness_Cleaned_V2.xlsx
  memberCode?: string; // TS0001, etc.
  birthYear?: number;
  gender?: string; // Nam / Nữ
  occupation?: string; // Nghề nghiệp
  district?: string; // Quận cư trú
  incomeRange?: string; // Khoảng thu nhập
  leadSource?: string; // Nguồn biết đến (TikTok, Instagram, Internet, Facebook...)
  referrerCode?: string;
  firstContactDate?: string;
  hadTrial?: string; // Có / Không
  trialConverted?: string; // Có / Không / Không áp dụng
  registeredDate?: string;
  trainingGoal?: string; // Mục tiêu tập luyện
  packageCode?: string; // 12T, 3T, 1T, 6T, 24T, 48T
  packagePrice?: number;
  paymentStatus?: string; // Đã thanh toán / Chưa thanh toán
  checkinCount?: number;
  daysSinceLastCheckin?: number;
  ptSessions?: number;
  extraServices?: string; // Lớp Yoga
  totalSpent?: number;
  renewalCount?: number;
  expiryDate?: string;
  membershipStatus?: string; // Đang hoạt động / Hết hạn / Đã rời bỏ
  churnRisk?: string;
  churnReason?: string;
  customerSegment?: string; // Winback giá trị cao, Hội viên giá trị cao (VIP), Cam kết dài hạn (Committed)...
  journeyStage?: JourneyStage; // Hành trình ACCSR
  matchedPersona?: CustomerPersona; // Persona: Minh (Văn phòng), Tuấn (Giảm cân), Hương (Sau sinh)
  lastJourneyIntervention?: string;
  inbodyScore?: number;
  createdAt: string;
  lastContactedAt?: string;
}

// ================= MEMBER PROGRESS TRACKING =================
export interface MemberProgressEntry {
  id: string;
  userId: string;
  memberCode?: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  photoUrl?: string;
  notes?: string;
  energyLevel?: number;
  createdAt: string;
}

