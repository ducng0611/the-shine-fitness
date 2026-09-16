import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { 
  AdminUser, 
  GymPackage, 
  PromotionCampaign, 
  EmailMarketingFlow, 
  CustomerRecord,
  MemberProgressEntry 
} from '../types';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Database Service Functions
export async function saveRegistrationToFirebase(registrationData: {
  fullName: string;
  phone: string;
  email: string;
  packageType: string;
  goal: string;
  preferredTime: string;
  notes?: string;
  voucherCode: string;
}) {
  try {
    const colRef = collection(db, 'registrations');
    const docRef = await addDoc(colRef, {
      ...registrationData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving registration to Firestore:', error);
    // Return gracefully so UI can still provide member voucher
    return { success: true, id: 'offline_' + Date.now() };
  }
}

export async function saveHealthAssessmentToFirebase(assessmentData: {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number;
  neckCm?: number;
  activityLevel: string;
  bmi: number;
  bmiCategory: string;
  tdee: number;
  bmr: number;
  bodyFatPct?: number;
  recommendedCalories: number;
  goal: string;
}) {
  try {
    const colRef = collection(db, 'health_assessments');
    const docRef = await addDoc(colRef, {
      ...assessmentData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving health assessment to Firestore:', error);
    return { success: true, id: 'offline_' + Date.now() };
  }
}

export async function saveOrUpdateMemberInFirebase(memberData: {
  uid: string;
  fullName: string;
  phone?: string;
  email?: string;
  membershipTier: string;
  membershipCode: string;
  authProvider: 'phone_otp' | 'email_otp' | 'google' | 'password';
  joinedDate: string;
  expiryDate: string;
}) {
  try {
    const docRef = doc(db, 'members', memberData.uid);
    await setDoc(docRef, {
      ...memberData,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving member to Firestore:', error);
    return { success: true };
  }
}

export async function getMemberFromFirebase(uid: string) {
  try {
    const docRef = doc(db, 'members', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting member from Firestore:', error);
    return null;
  }
}

export async function recordCheckInInFirebase(checkInData: {
  memberCode: string;
  fullName: string;
  membershipTier: string;
  branch?: string;
  checkInTime: string;
  status: 'SUCCESS' | 'EXPIRED' | 'PENDING';
}) {
  try {
    const colRef = collection(db, 'check_ins');
    const docRef = await addDoc(colRef, {
      ...checkInData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error recording check-in to Firestore:', error);
    return { success: true, id: 'offline_' + Date.now() };
  }
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed?: boolean;
}

export interface WorkoutLogEntry {
  id?: string;
  memberCode: string;
  uid?: string;
  date: string; // YYYY-MM-DD
  exerciseName: string;
  category: string;
  sets: WorkoutSet[];
  notes?: string;
  createdAt: string;
}

export async function saveWorkoutLogInFirebase(entry: WorkoutLogEntry) {
  try {
    const colRef = collection(db, 'workout_logs');
    const docRef = await addDoc(colRef, {
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving workout log to Firestore:', error);
    return { success: true, id: 'local_' + Date.now() };
  }
}

export async function getMemberWorkoutLogsFromFirebase(memberCode: string): Promise<WorkoutLogEntry[]> {
  try {
    const colRef = collection(db, 'workout_logs');
    const q = query(
      colRef, 
      where('memberCode', '==', memberCode),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const logs: WorkoutLogEntry[] = [];
    snap.forEach((docSnap) => {
      logs.push({
        id: docSnap.id,
        ...docSnap.data()
      } as WorkoutLogEntry);
    });
    return logs;
  } catch (error) {
    console.error('Error querying workout logs from Firestore:', error);
    return [];
  }
}

export async function deleteWorkoutLogInFirebase(id: string) {
  try {
    if (id.startsWith('local_')) return { success: true };
    const docRef = doc(db, 'workout_logs', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting workout log from Firestore:', error);
    return { success: false };
  }
}

// ================= ADMIN & RBAC SERVICES =================
export const DEFAULT_ADMINS: AdminUser[] = [
  {
    uid: 'admin_ducnguyen',
    email: 'ducnguyen06112002@gmail.com',
    fullName: 'Đức Nguyễn (Super Admin)',
    role: 'super_admin',
    roleTitle: 'Chủ cơ sở & Quản trị cấp cao',
    phone: '0946 293 593',
    permissions: ['all', 'manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'manage_admins'],
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    uid: 'admin_theshine_manager',
    email: 'admin@theshinefitness.vn',
    fullName: 'Ban Quản Lý The Shine Tân Bình',
    role: 'manager',
    roleTitle: 'Quản lý vận hành chi nhánh',
    phone: '0946 293 593',
    permissions: ['manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows'],
    createdAt: '2025-01-15T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    uid: 'admin_marketing_lead',
    email: 'marketing@theshinefitness.vn',
    fullName: 'Trưởng nhóm Marketing & CRM',
    role: 'marketing',
    roleTitle: 'Chuyên viên Tiếp thị số & Email Flow',
    phone: '0946 293 593',
    permissions: ['manage_members', 'manage_promotions', 'manage_email_flows'],
    createdAt: '2025-02-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  }
];

export async function getAdminUsersFromFirebase(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, 'admins');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default admins to Firestore
      for (const admin of DEFAULT_ADMINS) {
        await setDoc(doc(db, 'admins', admin.uid), {
          ...admin,
          timestamp: serverTimestamp()
        });
      }
      return DEFAULT_ADMINS;
    }
    const admins: AdminUser[] = [];
    snap.forEach(docSnap => {
      admins.push({ uid: docSnap.id, ...docSnap.data() } as AdminUser);
    });
    return admins;
  } catch (error) {
    console.error('Error fetching admins from Firestore:', error);
    return DEFAULT_ADMINS;
  }
}

export async function saveAdminUserToFirebase(admin: AdminUser): Promise<boolean> {
  try {
    const docRef = doc(db, 'admins', admin.uid);
    await setDoc(docRef, {
      ...admin,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving admin to Firestore:', error);
    return false;
  }
}

// ================= GYM PACKAGES SERVICES (SYNCED FROM THESHINEFITNESS EXCEL DATA) =================
export const DEFAULT_PACKAGES: GymPackage[] = [
  {
    id: 'pkg_12t',
    code: '12T',
    name: 'Thẻ Hội Viên 12 Tháng (1 Năm Toàn Diện)',
    nameEn: '12-Month All-Inclusive Annual Membership',
    category: 'all_inclusive',
    price: 5900000,
    originalPrice: 7200000,
    durationMonths: 12,
    durationLabel: '12 Tháng',
    benefits: [
      'Tập luyện không giới hạn 365 ngày trong năm tại tất cả các khu vực',
      'Sử dụng không giới hạn dàn máy Cardio & Tạ Technogym chuẩn Olympic',
      'Tham gia toàn bộ lớp Yoga Ấn Độ & GroupX sôi động hàng tuần',
      'Trải nghiệm tiện ích 5 sao: Hồ bơi nước ấm 4 mùa & Xông hơi đá muối Himalaya',
      'Miễn phí đo chỉ số InBody phân tích cơ mỡ định kỳ hàng tháng',
      'Bao gồm tủ locker thông minh, phòng tắm nóng lạnh & gửi xe miễn phí'
    ],
    isPopular: true,
    isActive: true,
    badge: 'Bán chạy nhất (256 Hội Viên)',
    notes: 'Gói chủ lực chiếm doanh thu cao nhất trên hệ thống dữ liệu khách hàng The Shine Fitness',
    memberCount: 256,
    totalRevenue: 1710399999,
    ptSessionsIncluded: 1,
    extraServices: 'Yoga, Sauna & Hồ bơi'
  },
  {
    id: 'pkg_6t',
    code: '6T',
    name: 'Thẻ Hội Viên 6 Tháng (Bán Niên Bứt Phá)',
    nameEn: '6-Month Transformation Membership',
    category: 'gym',
    price: 3400000,
    originalPrice: 4200000,
    durationMonths: 6,
    durationLabel: '6 Tháng',
    benefits: [
      'Tập luyện không giới hạn khung giờ suốt 180 ngày',
      'Sử dụng khu tập gym hiện đại, khu chức năng Functional Training',
      'Đo InBody định kỳ phân tích tiến độ thay đổi thể trạng',
      'Sử dụng phòng xông hơi thảo dược thư giãn cơ bắp sau buổi tập',
      'Tủ đồ cá nhân an toàn & bãi đỗ xe bảo vệ 24/7'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Tiết Kiệm (140 Hội Viên)',
    notes: 'Phù hợp cho hội viên có lộ trình thay đổi vóc dáng nửa năm',
    memberCount: 140,
    totalRevenue: 602099999,
    ptSessionsIncluded: 0,
    extraServices: 'Gym & Xông hơi'
  },
  {
    id: 'pkg_3t',
    code: '3T',
    name: 'Thẻ Hội Viên 3 Tháng (Quý Năng Động)',
    nameEn: '3-Month Active Quarterly Membership',
    category: 'gym',
    price: 1900000,
    originalPrice: 2300000,
    durationMonths: 3,
    durationLabel: '3 Tháng',
    benefits: [
      '90 ngày tập luyện không giới hạn số lần ra vào',
      'Đầy đủ khu tạ Free Weights, máy khối và dàn Cardio chạy bộ',
      'Hướng dẫn làm quen thiết bị và xây dựng bài tập ban đầu',
      'Miễn phí phòng tắm nóng lạnh, máy sấy tóc & tủ locker'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Phổ Biến (236 Hội Viên)',
    notes: 'Gói tập quý phổ biến cho khách hàng bắt đầu rèn luyện thói quen',
    memberCount: 236,
    totalRevenue: 525500000,
    ptSessionsIncluded: 0,
    extraServices: 'Gym tiêu chuẩn'
  },
  {
    id: 'pkg_1t',
    code: '1T',
    name: 'Thẻ Hội Viên 1 Tháng (Khởi Động Trải Nghiệm)',
    nameEn: '1-Month Kick-Starter Pass',
    category: 'gym',
    price: 700000,
    originalPrice: 850000,
    durationMonths: 1,
    durationLabel: '1 Tháng',
    benefits: [
      'Tập luyện 30 ngày tự do không ràng buộc hợp đồng dài hạn',
      'Sử dụng đầy đủ trang thiết bị gym và cardio cao cấp',
      'Đo phân tích chỉ số InBody thể trạng ngày đầu tiên',
      'Phù hợp cho khách công tác hoặc trải nghiệm môi trường tập luyện'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Linh Hoạt (181 Hội Viên)',
    notes: 'Gói ngắn hạn cho khách hàng kiểm chứng chất lượng câu lạc bộ',
    memberCount: 181,
    totalRevenue: 135400000,
    ptSessionsIncluded: 0,
    extraServices: 'Gym tiêu chuẩn'
  },
  {
    id: 'pkg_24t',
    code: '24T',
    name: 'Thẻ Hội Viên VIP 24 Tháng (Kim Cương 2 Năm)',
    nameEn: '24-Month Diamond VIP Membership',
    category: 'all_inclusive',
    price: 10500000,
    originalPrice: 14000000,
    durationMonths: 24,
    durationLabel: '24 Tháng',
    benefits: [
      'Đặc quyền tối thượng 2 năm sử dụng toàn bộ tiện ích The Shine Luxury',
      'Bao gồm Gym, Yoga Master, GroupX, Hồ bơi nước ấm & Xông hơi đá muối',
      'Chính sách bảo lưu thẻ miễn phí lên tới 60 ngày',
      'Tặng 02 buổi tập riêng 1:1 cùng Huấn luyện viên thể hình cá nhân (PT)',
      'Bộ quà tặng hội viên VIP độc quyền The Shine Fitness & Yoga'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Đẳng Cấp VIP (37 Hội Viên)',
    notes: 'Dành cho hội viên cam kết gắn bó lâu dài với chi phí tiết kiệm mỗi tháng chỉ ~437.000 VNĐ',
    memberCount: 37,
    totalRevenue: 404900000,
    ptSessionsIncluded: 2,
    extraServices: 'Toàn năng VIP & PT'
  },
  {
    id: 'pkg_48t',
    code: '48T',
    name: 'Thẻ Hội Viên Tri Ân 48 Tháng (Lifetime Elite 4 Năm)',
    nameEn: '48-Month Lifetime Elite Membership',
    category: 'special',
    price: 18000000,
    originalPrice: 24000000,
    durationMonths: 48,
    durationLabel: '48 Tháng',
    benefits: [
      'Hội viên danh dự 4 năm trọn gói mọi dịch vụ cao cấp nhất',
      'Đặc quyền mang theo 01 bạn đồng hành vào cuối tuần',
      'Ưu tiên đăng ký lịch tập cùng Master Yoga & Huấn luyện viên trưởng',
      'Bảo lưu thẻ linh hoạt lên tới 120 ngày khi có kế hoạch công tác xa'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Siêu Đặc Quyền',
    notes: 'Gói tập dài hạn cao cấp nhất trong cơ sở dữ liệu The Shine Fitness',
    memberCount: 1,
    totalRevenue: 21400000,
    ptSessionsIncluded: 4,
    extraServices: 'Toàn quyền Elite'
  }
];

export async function getPackagesFromFirebase(): Promise<GymPackage[]> {
  try {
    const colRef = collection(db, 'packages');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const pkg of DEFAULT_PACKAGES) {
        await setDoc(doc(db, 'packages', pkg.id), {
          ...pkg,
          timestamp: serverTimestamp()
        });
      }
      return DEFAULT_PACKAGES;
    }
    const packages: GymPackage[] = [];
    snap.forEach(docSnap => {
      packages.push({ id: docSnap.id, ...docSnap.data() } as GymPackage);
    });
    return packages;
  } catch (error) {
    console.error('Error getting packages from Firestore:', error);
    return DEFAULT_PACKAGES;
  }
}

export async function savePackageToFirebase(pkg: GymPackage): Promise<boolean> {
  try {
    const docRef = doc(db, 'packages', pkg.id);
    await setDoc(docRef, {
      ...pkg,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving package to Firestore:', error);
    return false;
  }
}

export async function deletePackageFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'packages', id));
    return true;
  } catch (error) {
    console.error('Error deleting package from Firestore:', error);
    return false;
  }
}

// ================= PROMOTIONS & VOUCHERS SERVICES =================
export const DEFAULT_PROMOTIONS: PromotionCampaign[] = [
  {
    id: 'promo_shine50',
    code: 'SHINE50',
    title: 'Ưu Đãi Bứt Phá: Giảm 50% Tháng Đầu Tiên',
    description: 'Áp dụng cho khách hàng mới đăng ký gói Premium hoặc VIP từ 3 tháng trở lên.',
    discountType: 'percentage',
    discountValue: 50,
    minOrderValue: 800000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 200,
    usageCount: 86,
    applicablePackages: ['PREMIUM_MONTH', 'VIP_MONTH', 'ANNUAL_PASSPORT'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_tanbinh3d',
    code: 'TANBINH3D',
    title: 'Voucher 03 Ngày Tập Thử 0 Đồng',
    description: 'Trải nghiệm miễn phí toàn bộ máy tập, lớp Yoga, GroupX và hồ bơi 5 sao.',
    discountType: 'percentage',
    discountValue: 100,
    minOrderValue: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 1000,
    usageCount: 342,
    applicablePackages: ['ALL'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_summer_fit',
    code: 'SUMMERFIT',
    title: 'Khởi Động Hè Sang: Giảm Trực Tiếp 500.000 VNĐ',
    description: 'Tặng ngay 500k khi đăng ký thẻ hội viên 6 tháng hoặc 12 tháng.',
    discountType: 'fixed_amount',
    discountValue: 500000,
    minOrderValue: 3000000,
    startDate: '2025-04-01',
    endDate: '2025-08-31',
    usageLimit: 150,
    usageCount: 47,
    applicablePackages: ['ANNUAL_PASSPORT', 'VIP_MONTH'],
    isActive: true,
    createdAt: '2025-04-01T00:00:00.000Z'
  },
  {
    id: 'promo_pt_starter',
    code: 'PTBONUS',
    title: 'Tặng 2 Buổi PT 1-kèm-1 Khi Mua Thẻ',
    description: 'Tặng ngay 2 buổi huấn luyện cá nhân chuyên sâu kèm bảng kế hoạch dinh dưỡng.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 1500000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 100,
    usageCount: 63,
    applicablePackages: ['PREMIUM_MONTH', 'PT_12_SESSIONS'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export async function getPromotionsFromFirebase(): Promise<PromotionCampaign[]> {
  try {
    const colRef = collection(db, 'promotions');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const promo of DEFAULT_PROMOTIONS) {
        await setDoc(doc(db, 'promotions', promo.id), {
          ...promo,
          timestamp: serverTimestamp()
        });
      }
      return DEFAULT_PROMOTIONS;
    }
    const promos: PromotionCampaign[] = [];
    snap.forEach(docSnap => {
      promos.push({ id: docSnap.id, ...docSnap.data() } as PromotionCampaign);
    });
    return promos;
  } catch (error) {
    console.error('Error getting promotions from Firestore:', error);
    return DEFAULT_PROMOTIONS;
  }
}

export async function savePromotionToFirebase(promo: PromotionCampaign): Promise<boolean> {
  try {
    const docRef = doc(db, 'promotions', promo.id);
    await setDoc(docRef, {
      ...promo,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving promotion to Firestore:', error);
    return false;
  }
}

export async function deletePromotionFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'promotions', id));
    return true;
  } catch (error) {
    console.error('Error deleting promotion from Firestore:', error);
    return false;
  }
}

// ================= EMAIL MARKETING & AUTOMATION FLOWS =================
export const DEFAULT_EMAIL_FLOWS: EmailMarketingFlow[] = [
  {
    id: 'flow_trial_welcome',
    name: 'Luồng 1: Chăm Sóc & Chuyển Đổi Khách Tập Thử 3 Ngày',
    description: 'Tự động gửi email chào mừng, gửi mã voucher và nhắc nhở khách đến trải nghiệm trong 72 giờ đầu tiên.',
    trigger: 'new_trial_registered',
    triggerLabel: 'Khách vừa gửi đăng ký tập thử 3 ngày trên website',
    status: 'active',
    steps: [
      {
        id: 'step_1',
        type: 'trigger',
        title: 'Bắt đầu: Khi khách đăng ký',
        subtitle: 'Kích hoạt ngay khi có lượt submit form đăng ký',
        config: {}
      },
      {
        id: 'step_2',
        type: 'email',
        title: 'Email 1: Chào mừng & Trao Voucher 3 Ngày Miễn Phí',
        subtitle: 'Gửi tức thì kèm hướng dẫn đến phòng tập',
        config: {
          emailSubject: '🔥 [The Shine Fitness] Chào mừng {{customer_name}}! Nhận ngay Vé Tập Thử 3 Ngày Miễn Phí của bạn',
          emailPreheader: 'Khám phá phòng gym 1500m2, hồ bơi nước ấm và lớp Yoga tại The Shine Tân Bình',
          voucherCode: 'TANBINH3D',
          ctaText: 'Xem Lịch Lớp & Đặt Giờ Tập',
          ctaLink: 'https://theshinefitness.vn/#schedule'
        }
      },
      {
        id: 'step_3',
        type: 'delay',
        title: 'Chờ 24 giờ',
        subtitle: 'Đợi 1 ngày để khách sắp xếp thời gian đến phòng',
        config: {
          delayDays: 1
        }
      },
      {
        id: 'step_4',
        type: 'condition',
        title: 'Kiểm tra: Khách đã đến Check-in chưa?',
        subtitle: 'Tra cứu lịch sử check-in quầy lễ tân',
        config: {
          conditionField: 'has_visited',
          conditionValue: 'true'
        }
      },
      {
        id: 'step_5',
        type: 'email',
        title: 'Email 2: Nhắc hẹn & Tặng buổi tư vấn InBody cùng PT',
        subtitle: 'Gửi nếu khách chưa đến sau 24h',
        config: {
          emailSubject: '💪 {{customer_name}} ơi, HLV The Shine đang chờ bạn đến đo chỉ số cơ thể hôm nay!',
          emailPreheader: 'Nhận phân tích mỡ thừa và lịch tập chuẩn cùng HLV chuyên nghiệp hoàn toàn miễn phí',
          ctaText: 'Nhận Cuộc Gọi Tư Vấn Ngay',
          ctaLink: 'https://theshinefitness.vn/#contact'
        }
      },
      {
        id: 'step_6',
        type: 'delay',
        title: 'Chờ thêm 48 giờ',
        subtitle: 'Thời điểm kết thúc 3 ngày trải nghiệm',
        config: {
          delayDays: 2
        }
      },
      {
        id: 'step_7',
        type: 'email',
        title: 'Email 3: Ưu Đãi Độc Quyền - Giảm 50% Khi Gia Nhập Chính Thức',
        subtitle: 'Chốt gói hội viên với mã SHINE50',
        config: {
          emailSubject: '🎁 Ưu đãi độc quyền cho {{customer_name}}: Giảm ngay 50% khi đăng ký thẻ hội viên The Shine',
          emailPreheader: 'Chỉ còn hiệu lực trong 48h tới. Đừng bỏ lỡ hành trình thay đổi vóc dáng tuyệt vời!',
          voucherCode: 'SHINE50',
          ctaText: 'Đăng Ký Nhận Giảm Giá 50%',
          ctaLink: 'https://theshinefitness.vn/#pricing'
        }
      }
    ],
    stats: {
      enrolled: 412,
      sent: 980,
      opened: 724,
      clicked: 389,
      converted: 148
    },
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-04-12T10:30:00.000Z'
  },
  {
    id: 'flow_retention_renewal',
    name: 'Luồng 2: Nhắc Nhở & Gia Hạn Thẻ Hội Viên Sắp Hết Hạn',
    description: 'Tự động kích hoạt trước 7 ngày khi gói thẻ sắp đáo hạn, gửi ưu đãi tri ân để giữ chân khách hàng.',
    trigger: 'membership_expiring_soon',
    triggerLabel: 'Thẻ hội viên còn 7 ngày nữa là hết hạn',
    status: 'active',
    steps: [
      {
        id: 'step_r1',
        type: 'trigger',
        title: 'Bắt đầu: Thẻ còn 7 ngày hết hạn',
        subtitle: 'Lọc tự động danh sách hội viên có hạn trong tuần',
        config: {}
      },
      {
        id: 'step_r2',
        type: 'email',
        title: 'Email 1: Tri ân hành trình tập luyện & Báo cáo số buổi tập',
        subtitle: 'Báo cáo thành tích và gửi voucher tái gia hạn',
        config: {
          emailSubject: '🏆 Chúc mừng {{customer_name}} đã hoàn thành 1 chặng đường tập luyện bền bỉ tại The Shine!',
          emailPreheader: 'Bạn đã tập luyện chăm chỉ. Gia hạn ngay hôm nay để nhận thêm 1 tháng tập miễn phí',
          voucherCode: 'LOYALTY1M',
          ctaText: 'Gia Hạn Thẻ Trực Tuyến',
          ctaLink: 'https://theshinefitness.vn/#pricing'
        }
      },
      {
        id: 'step_r3',
        type: 'delay',
        title: 'Chờ 4 ngày',
        subtitle: 'Nhắc lại khi còn 3 ngày cuối cùng',
        config: {
          delayDays: 4
        }
      },
      {
        id: 'step_r4',
        type: 'email',
        title: 'Email 2: Nhắc nhở khẩn cấp - Giữ nguyên mức giá cũ',
        subtitle: 'Ưu đãi giữ nguyên hạng thẻ trước ngày hết hạn',
        config: {
          emailSubject: '⏳ Chỉ còn 3 ngày: Giữ nguyên mức phí hội viên ưu đãi của {{customer_name}}',
          emailPreheader: 'Đừng để gián đoạn thói quen tập luyện tốt bạn đã xây dựng suốt thời gian qua',
          ctaText: 'Gia Hạn Ngay Hôm Nay',
          ctaLink: 'https://theshinefitness.vn/#pricing'
        }
      }
    ],
    stats: {
      enrolled: 185,
      sent: 320,
      opened: 278,
      clicked: 194,
      converted: 122
    },
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-04-10T14:15:00.000Z'
  },
  {
    id: 'flow_winback_inactive',
    name: 'Luồng 3: Kích Hoạt Lại Hội Viên Không Đến Tập (>14 Ngày)',
    description: 'Chăm sóc và hỏi thăm khi phát hiện hội viên không quét mã check-in trong 14 ngày liên tiếp.',
    trigger: 'inactive_14_days',
    triggerLabel: 'Không có lượt Check-in trong 14 ngày qua',
    status: 'active',
    steps: [
      {
        id: 'step_w1',
        type: 'trigger',
        title: 'Bắt đầu: 14 ngày không check-in',
        subtitle: 'Phát hiện sự sụt giảm tần suất tập',
        config: {}
      },
      {
        id: 'step_w2',
        type: 'email',
        title: 'Email Chăm Sóc: The Shine nhớ bạn & Tặng 1 buổi giãn cơ phục hồi',
        subtitle: 'Động viên tinh thần và gỡ bỏ khó khăn lịch trình',
        config: {
          emailSubject: '💙 {{customer_name}} ơi, The Shine rất nhớ bạn! Mọi việc vẫn ổn chứ ạ?',
          emailPreheader: 'HLV đã chuẩn bị một buổi giãn cơ phục hồi nhẹ nhàng khi bạn quay lại',
          voucherCode: 'COMEBACK',
          ctaText: 'Đặt Lịch Trở Lại Cùng HLV',
          ctaLink: 'https://theshinefitness.vn/#schedule'
        }
      }
    ],
    stats: {
      enrolled: 94,
      sent: 94,
      opened: 65,
      clicked: 38,
      converted: 29
    },
    createdAt: '2025-02-20T08:00:00.000Z',
    updatedAt: '2025-04-05T09:45:00.000Z'
  }
];

export async function getEmailFlowsFromFirebase(): Promise<EmailMarketingFlow[]> {
  try {
    const colRef = collection(db, 'email_campaigns');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const flow of DEFAULT_EMAIL_FLOWS) {
        await setDoc(doc(db, 'email_campaigns', flow.id), {
          ...flow,
          timestamp: serverTimestamp()
        });
      }
      return DEFAULT_EMAIL_FLOWS;
    }
    const flows: EmailMarketingFlow[] = [];
    snap.forEach(docSnap => {
      flows.push({ id: docSnap.id, ...docSnap.data() } as EmailMarketingFlow);
    });
    return flows;
  } catch (error) {
    console.error('Error getting email flows from Firestore:', error);
    return DEFAULT_EMAIL_FLOWS;
  }
}

export async function saveEmailFlowToFirebase(flow: EmailMarketingFlow): Promise<boolean> {
  try {
    const docRef = doc(db, 'email_campaigns', flow.id);
    await setDoc(docRef, {
      ...flow,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving email flow to Firestore:', error);
    return false;
  }
}

export async function deleteEmailFlowFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'email_campaigns', id));
    return true;
  } catch (error) {
    console.error('Error deleting email flow from Firestore:', error);
    return false;
  }
}

// ================= DISTINCT PACKAGES FIREBASE SYNC =================
export async function syncDistinctPackagesToFirebase(packages: GymPackage[]): Promise<boolean> {
  try {
    for (const pkg of packages) {
      const docRef = doc(db, 'packages', pkg.id);
      await setDoc(docRef, {
        ...pkg,
        updatedAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      }, { merge: true });
    }
    return true;
  } catch (error) {
    console.error('Error syncing distinct packages to Firestore:', error);
    return false;
  }
}

// ================= CUSTOMER CRM UNIFIED SERVICES =================
export async function fetchExcelCustomerAndPackageData() {
  try {
    const res = await fetch('/api/admin/excel-data');
    if (!res.ok) {
      console.warn(`Excel data API responded with status ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('Could not fetch Excel data via API:', error);
    return null;
  }
}

export async function getAllCustomersUnified(): Promise<CustomerRecord[]> {
  try {
    const customersMap = new Map<string, CustomerRecord>();

    // 1. Fetch from 'customers' collection in Firestore first
    try {
      const custSnap = await getDocs(collection(db, 'customers'));
      custSnap.forEach(docSnap => {
        const d = docSnap.data() as CustomerRecord;
        const key = d.memberCode || d.id || docSnap.id;
        customersMap.set(key, {
          ...d,
          id: docSnap.id
        });
      });
    } catch (err) {
      console.warn('Could not read customers collection in Firestore:', err);
    }

    // 2. If Firestore 'customers' is empty, fetch all 851 records directly from TheShineFitness_Cleaned_V2.xlsx API
    if (customersMap.size === 0) {
      try {
        const excelRes = await fetchExcelCustomerAndPackageData();
        if (excelRes && excelRes.customers && Array.isArray(excelRes.customers)) {
          excelRes.customers.forEach((c: CustomerRecord) => {
            const key = c.memberCode || c.id;
            customersMap.set(key, c);
          });
        }
      } catch (excelErr) {
        console.warn('Could not read from Excel API:', excelErr);
      }
    }

    // 3. Fetch from 'registrations' for any fresh online form submissions
    try {
      const regSnap = await getDocs(collection(db, 'registrations'));
      regSnap.forEach(docSnap => {
        const d = docSnap.data();
        const key = d.memberCode || d.email || d.phone || docSnap.id;
        if (!customersMap.has(key)) {
          customersMap.set(key, {
            id: docSnap.id,
            fullName: d.fullName || 'Khách đăng ký web',
            phone: d.phone || '',
            email: d.email || '',
            source: 'trial_pass',
            status: 'new',
            packageInterested: d.packageType || 'Gói 12 Tháng (1 Năm Toàn Diện)',
            voucherUsed: d.voucherCode || 'TANBINH3D',
            notes: d.notes || d.goal || '',
            tags: ['Khách website', 'Đăng ký tập thử 3 ngày'],
            createdAt: d.createdAt || new Date().toISOString()
          });
        }
      });
    } catch (err) {
      console.warn('Could not read registrations collection:', err);
    }

    // 4. Fetch from 'members'
    try {
      const memberSnap = await getDocs(collection(db, 'members'));
      memberSnap.forEach(docSnap => {
        const d = docSnap.data();
        const key = d.membershipCode || d.email || d.phone || docSnap.id;
        const existing = customersMap.get(key);
        if (existing) {
          existing.membershipTier = d.membershipTier || existing.membershipTier;
          existing.status = 'member';
          existing.membershipStatus = 'Đang hoạt động';
        } else {
          customersMap.set(key, {
            id: docSnap.id,
            memberCode: d.membershipCode || `TS_${docSnap.id.slice(0, 4)}`,
            fullName: d.fullName || 'Hội viên The Shine',
            phone: d.phone || '',
            email: d.email || '',
            source: 'member_portal',
            status: 'member',
            membershipTier: d.membershipTier || 'Diamond VIP',
            packageInterested: d.membershipTier,
            notes: `Mã hội viên: ${d.membershipCode}`,
            tags: ['Hội viên cổng thành viên', d.membershipTier || 'VIP'],
            membershipStatus: 'Đang hoạt động',
            createdAt: d.joinedDate || new Date().toISOString(),
            lastContactedAt: d.updatedAt
          });
        }
      });
    } catch (err) {
      console.warn('Could not read members collection:', err);
    }

    // 5. Fetch from 'health_assessments' for BMI metrics enrichment
    try {
      const healthSnap = await getDocs(collection(db, 'health_assessments'));
      healthSnap.forEach(docSnap => {
        const d = docSnap.data();
        const key = d.email || d.phone || docSnap.id;
        if (customersMap.has(key)) {
          const c = customersMap.get(key)!;
          c.bmiData = {
            bmi: d.bmi || 22,
            category: d.bmiCategory || 'Bình thường',
            tdee: d.tdee || 2000,
            goal: d.goal || 'Tăng cơ giảm mỡ'
          };
          if (!c.tags?.includes('Đã đo BMI/InBody')) {
            c.tags = [...(c.tags || []), 'Đã đo BMI/InBody'];
          }
        }
      });
    } catch (err) {
      console.warn('Could not read health assessments collection:', err);
    }

    return Array.from(customersMap.values());
  } catch (error) {
    console.error('Error unifying customers list:', error);
    return [];
  }
}

export async function saveCustomerToFirebase(customer: CustomerRecord): Promise<boolean> {
  try {
    const docId = customer.memberCode || customer.id;
    const docRef = doc(db, 'customers', docId);
    await setDoc(docRef, {
      ...customer,
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving customer to Firestore:', error);
    return false;
  }
}

export async function syncCustomersToFirebase(customers: CustomerRecord[], onProgress?: (percent: number) => void): Promise<boolean> {
  try {
    const total = customers.length;
    // Chunk into batches of 20 to avoid exceeding transaction/network limits
    const chunkSize = 20;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(c => {
          const docId = c.memberCode || c.id;
          return setDoc(doc(db, 'customers', docId), {
            ...c,
            syncedAt: new Date().toISOString(),
            timestamp: serverTimestamp()
          }, { merge: true });
        })
      );
      if (onProgress) {
        onProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
      }
    }
    return true;
  } catch (error) {
    console.error('Error batch syncing customers to Firestore:', error);
    return false;
  }
}

export async function deleteCustomerFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'customers', id));
    return true;
  } catch (error) {
    console.error('Error deleting customer from Firestore:', error);
    return false;
  }
}

export async function deleteAdminUserFromFirebase(uid: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'admins', uid));
    return true;
  } catch (error) {
    console.error('Error deleting admin from Firestore:', error);
    return false;
  }
}

export async function createCustomerInFirebase(customer: Partial<CustomerRecord>): Promise<CustomerRecord> {
  const memberCode = customer.memberCode || `TS_${Date.now().toString().slice(-4)}`;
  const docId = memberCode;
  const newCustomer: CustomerRecord = {
    id: docId,
    memberCode,
    fullName: customer.fullName || 'Hội viên mới',
    phone: customer.phone || '',
    email: customer.email || '',
    gender: customer.gender || 'Nam',
    occupation: customer.occupation || 'Tự do',
    source: customer.source || 'reception',
    status: customer.status || 'member',
    membershipStatus: customer.membershipStatus || 'Đang hoạt động',
    packageCode: customer.packageCode || '12T',
    packageInterested: customer.packageInterested || 'Gói 12 Tháng (1 Năm Toàn Diện)',
    totalSpent: customer.totalSpent !== undefined ? customer.totalSpent : 5900000,
    checkinCount: customer.checkinCount || 0,
    ptSessions: customer.ptSessions || 0,
    customerSegment: customer.customerSegment || 'Khách mới',
    churnRisk: customer.churnRisk || 'Thấp',
    notes: customer.notes || '',
    tags: customer.tags || ['Hội viên mới'],
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'customers', docId), {
    ...newCustomer,
    timestamp: serverTimestamp()
  }, { merge: true });
  return newCustomer;
}

// ================= MEMBER PROGRESS TRACKING FUNCTIONS =================

export async function saveMemberProgressToFirebase(entry: MemberProgressEntry): Promise<boolean> {
  try {
    const docId = entry.id || `progress_${Date.now()}`;
    await setDoc(doc(db, 'member_progress', docId), {
      ...entry,
      id: docId,
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving member progress to Firestore:', error);
    return false;
  }
}

export async function getMemberProgressFromFirebase(userId: string, memberCode?: string): Promise<MemberProgressEntry[]> {
  try {
    const colRef = collection(db, 'member_progress');
    // Query by userId or memberCode
    const q = query(colRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: MemberProgressEntry[] = [];
    snapshot.forEach(docSnap => {
      results.push({ id: docSnap.id, ...docSnap.data() } as MemberProgressEntry);
    });

    if (results.length === 0 && memberCode) {
      const qCode = query(colRef, where('memberCode', '==', memberCode));
      const snapCode = await getDocs(qCode);
      snapCode.forEach(docSnap => {
        results.push({ id: docSnap.id, ...docSnap.data() } as MemberProgressEntry);
      });
    }

    // Sort by date ascending
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching member progress from Firestore:', error);
    return [];
  }
}

export async function deleteMemberProgressFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'member_progress', id));
    return true;
  } catch (error) {
    console.error('Error deleting member progress from Firestore:', error);
    return false;
  }
}


