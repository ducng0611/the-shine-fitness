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
  let docId = 'offline_' + Date.now();
  try {
    const colRef = collection(db, 'registrations');
    const docRef = await addDoc(colRef, {
      ...registrationData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    docId = docRef.id;
  } catch (error) {
    console.error('Error saving registration to Firestore:', error);
  }

  // Trigger backend email automation flow (Nodemailer dispatch & logging)
  try {
    await fetch('/api/trigger-registration-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
  } catch (emailErr) {
    console.warn('Could not trigger backend email automation endpoint:', emailErr);
  }

  return { success: true, id: docId };
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

export interface FirebaseMemberRecord {
  uid: string;
  fullName: string;
  phone?: string;
  email?: string;
  membershipTier: string;
  membershipCode: string;
  authProvider: 'phone_otp' | 'email_otp' | 'google' | 'password';
  joinedDate: string;
  expiryDate: string;
  gender?: string;
  status?: string;
  updatedAt?: string;
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
  gender?: string;
  status?: string;
}) {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(memberData)
      });
      if (res.ok) return { success: true };
    }
    const docRef = doc(db, 'members', memberData.uid);
    // Sanitize undefined fields
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(memberData)) {
      if (v !== undefined) sanitized[k] = v;
    }
    await setDoc(docRef, {
      ...sanitized,
      userId: memberData.uid,
      uid: memberData.uid,
      status: sanitized.status || 'Active',
      updatedAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving member to Firestore:', error);
    return { success: false, error };
  }
}

export async function getMemberFromFirebase(uid: string): Promise<FirebaseMemberRecord | null> {
  try {
    const docRef = doc(db, 'members', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as FirebaseMemberRecord;
    }
    return null;
  } catch (error) {
    console.error('Error getting member from Firestore:', error);
    return null;
  }
}

export async function findMemberInFirebase(identifier: {
  uid?: string;
  email?: string;
  phone?: string;
  memberCode?: string;
}): Promise<FirebaseMemberRecord | null> {
  try {
    // 1. If UID provided, check members collection directly
    if (identifier.uid) {
      const direct = await getMemberFromFirebase(identifier.uid);
      if (direct) return direct;
    }

    const membersCol = collection(db, 'members');

    // 2. Query members collection by email
    if (identifier.email && identifier.email.trim()) {
      const cleanEmail = identifier.email.trim().toLowerCase();
      const qEmail = query(membersCol, where('email', '==', cleanEmail), limit(1));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const d = snapEmail.docs[0];
        return { uid: d.id, ...d.data() } as FirebaseMemberRecord;
      }
    }

    // 3. Query members collection by phone
    if (identifier.phone && identifier.phone.trim()) {
      const cleanPhone = identifier.phone.trim().replace(/\s+/g, '');
      const qPhone = query(membersCol, where('phone', '==', cleanPhone), limit(1));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const d = snapPhone.docs[0];
        return { uid: d.id, ...d.data() } as FirebaseMemberRecord;
      }
    }

    // 4. Query members collection by membershipCode
    if (identifier.memberCode && identifier.memberCode.trim()) {
      const qCode = query(membersCol, where('membershipCode', '==', identifier.memberCode.trim()), limit(1));
      const snapCode = await getDocs(qCode);
      if (!snapCode.empty) {
        const d = snapCode.docs[0];
        return { uid: d.id, ...d.data() } as FirebaseMemberRecord;
      }
    }

    // 5. Look in customers CRM collection if not in members collection
    const customersCol = collection(db, 'customers');
    if (identifier.email && identifier.email.trim()) {
      const cleanEmail = identifier.email.trim().toLowerCase();
      const qCust = query(customersCol, where('email', '==', cleanEmail), limit(1));
      const snapCust = await getDocs(qCust);
      if (!snapCust.empty) {
        const c = snapCust.docs[0].data();
        return {
          uid: snapCust.docs[0].id,
          fullName: c.fullName || 'Hội Viên',
          email: c.email || cleanEmail,
          phone: c.phone || '',
          membershipTier: c.packageInterested || 'VIP Platinum',
          membershipCode: c.memberCode || `TS-${snapCust.docs[0].id.slice(-4)}`,
          joinedDate: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          gender: c.gender || 'Nam',
          status: 'Active',
          authProvider: 'google'
        };
      }
    }

    if (identifier.phone && identifier.phone.trim()) {
      const cleanPhone = identifier.phone.trim().replace(/\s+/g, '');
      const qCustPhone = query(customersCol, where('phone', '==', cleanPhone), limit(1));
      const snapCustPhone = await getDocs(qCustPhone);
      if (!snapCustPhone.empty) {
        const c = snapCustPhone.docs[0].data();
        return {
          uid: snapCustPhone.docs[0].id,
          fullName: c.fullName || 'Hội Viên',
          email: c.email || '',
          phone: c.phone || cleanPhone,
          membershipTier: c.packageInterested || 'VIP Platinum',
          membershipCode: c.memberCode || `TS-${snapCustPhone.docs[0].id.slice(-4)}`,
          joinedDate: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          gender: c.gender || 'Nam',
          status: 'Active',
          authProvider: 'phone_otp'
        };
      }
    }

    // 6. Look in registrations collection
    const regsCol = collection(db, 'registrations');
    if (identifier.email && identifier.email.trim()) {
      const cleanEmail = identifier.email.trim().toLowerCase();
      const qReg = query(regsCol, where('email', '==', cleanEmail), limit(1));
      const snapReg = await getDocs(qReg);
      if (!snapReg.empty) {
        const r = snapReg.docs[0].data();
        return {
          uid: snapReg.docs[0].id,
          fullName: r.fullName || 'Hội Viên',
          email: r.email || cleanEmail,
          phone: r.phone || '',
          membershipTier: r.packageType || 'VIP Platinum',
          membershipCode: r.voucherCode || `TS-${Math.floor(1000 + Math.random() * 9000)}`,
          joinedDate: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          gender: 'Nam',
          status: 'Active',
          authProvider: 'email_otp'
        };
      }
    }

    if (identifier.phone && identifier.phone.trim()) {
      const cleanPhone = identifier.phone.trim().replace(/\s+/g, '');
      const qRegPhone = query(regsCol, where('phone', '==', cleanPhone), limit(1));
      const snapRegPhone = await getDocs(qRegPhone);
      if (!snapRegPhone.empty) {
        const r = snapRegPhone.docs[0].data();
        return {
          uid: snapRegPhone.docs[0].id,
          fullName: r.fullName || 'Hội Viên',
          email: r.email || '',
          phone: r.phone || cleanPhone,
          membershipTier: r.packageType || 'VIP Platinum',
          membershipCode: r.voucherCode || `TS-${Math.floor(1000 + Math.random() * 9000)}`,
          joinedDate: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          gender: 'Nam',
          status: 'Active',
          authProvider: 'phone_otp'
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('Error querying member in Firebase:', err);
    return null;
  }
}


export async function getMemberCheckInsFromFirebase(memberCode: string) {
  try {
    const colRef = collection(db, 'check_ins');
    const q = query(
      colRef,
      where('memberCode', '==', memberCode),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const checkIns: any[] = [];
    snap.forEach(doc => {
      checkIns.push({ id: doc.id, ...doc.data() });
    });
    return checkIns;
  } catch (error) {
    console.error('Error querying check-ins from Firestore:', error);
    return [];
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
    const currentUser = auth.currentUser;
    const currentUid = currentUser ? currentUser.uid : (entry.uid || entry.memberCode);

    const docRef = await addDoc(colRef, {
      ...entry,
      userId: currentUid,
      uid: currentUid,
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/workout-logs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return { success: true };
    }
    const docRef = doc(db, 'workout_logs', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting workout log from Firestore:', error);
    return { success: false };
  }
}

// ================= ADMIN & RBAC SERVICES =================
export const OAUTH_ADMIN_CONFIGS = {
  SYSADMIN: {
    email: 'ducnguyen06112002@gmail.com',
    role: 'super_admin' as const,
    roleTitle: 'SysAdmin - Quản trị toàn quyền hệ thống',
    fullName: 'Đức Nguyễn (SysAdmin)',
    permissions: ['all', 'manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'manage_admins', 'view_reports', 'view_revenue'],
    authType: 'oauth'
  },
  MANAGER: {
    email: 'ducnh.hindu@gmail.com',
    role: 'manager' as const,
    roleTitle: 'Ban Quản Lý - Quản lý vận hành chi nhánh',
    fullName: 'Ban Quản Lý The Shine',
    permissions: ['manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'view_reports'],
    authType: 'oauth'
  },
  MARKETING: {
    email: 'ducnguyen.526102090574@st.ueh.edu.vn',
    role: 'marketing' as const,
    roleTitle: 'Trưởng bộ phận Marketing & CRM',
    fullName: 'Trưởng bộ phận Marketing & CRM',
    permissions: ['manage_members', 'manage_promotions', 'manage_email_flows'],
    authType: 'oauth'
  }
} as const;

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    uid: 'admin_sysadmin_ducnguyen',
    email: 'ducnguyen06112002@gmail.com',
    fullName: 'Đức Nguyễn (SysAdmin)',
    role: 'super_admin',
    roleTitle: 'SysAdmin - Quản trị toàn quyền hệ thống',
    phone: '0946 293 593',
    permissions: ['all', 'manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'manage_admins', 'view_reports', 'view_revenue'],
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    uid: 'admin_ban_quan_ly',
    email: 'ducnh.hindu@gmail.com',
    fullName: 'Ban Quản Lý The Shine',
    role: 'manager',
    roleTitle: 'Ban Quản Lý - Quản lý vận hành chi nhánh',
    phone: '0946 293 593',
    permissions: ['manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'view_reports'],
    createdAt: '2025-01-15T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    uid: 'admin_marketing_crm',
    email: 'ducnguyen.526102090574@st.ueh.edu.vn',
    fullName: 'Trưởng bộ phận Marketing & CRM',
    role: 'marketing',
    roleTitle: 'Trưởng bộ phận Marketing & CRM',
    phone: '0946 293 593',
    permissions: ['manage_members', 'manage_promotions', 'manage_email_flows'],
    createdAt: '2025-02-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  },
  {
    uid: 'admin_theshine_default',
    email: 'admin@theshinefitness.vn',
    fullName: 'Ban Quản Lý The Shine (Mặc định)',
    role: 'manager',
    roleTitle: 'Tài khoản Quản lý Mặc định',
    phone: '0946 293 593',
    permissions: ['manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows'],
    createdAt: '2025-01-01T00:00:00.000Z',
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
    const adminsMap = new Map<string, AdminUser>();
    // First fill with DEFAULT_ADMINS to guarantee all 4 official accounts exist
    DEFAULT_ADMINS.forEach(a => adminsMap.set(a.email.toLowerCase(), a));
    
    // Merge from Firestore
    snap.forEach(docSnap => {
      const data = docSnap.data() as AdminUser;
      if (data && data.email) {
        adminsMap.set(data.email.toLowerCase(), { uid: docSnap.id, ...data });
      }
    });
    return Array.from(adminsMap.values());
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
    id: 'pkg_shine349',
    code: 'SHINE349',
    name: 'Gói Bứt Phá Năng Lượng (Gym & Boxing)',
    nameEn: 'Energy Boost Gym & Boxing Pass',
    category: 'gym',
    price: 349000,
    originalPrice: 549000,
    durationMonths: 1,
    durationLabel: '1 Tháng',
    benefits: [
      'Áp dụng trọn vẹn cho cả 2 bộ môn Gym & Boxing',
      'HLV hỗ trợ 1:1 kỹ thuật và set up máy trong những ngày đầu',
      'Hỗ trợ xuyên suốt kỹ thuật tập luyện và cách dùng máy',
      'Tặng 7 ngày tập thử miễn phí trải nghiệm toàn bộ tiện ích',
      'Đóng theo tháng linh hoạt (349.000 VNĐ / tháng)'
    ],
    isPopular: true,
    isActive: true,
    badge: 'Ưu đãi Fanpage (349k/Tháng)',
    notes: 'Gói ưu đãi từ Fanpage Facebook thu hút lượt đăng ký lớn nhất',
    memberCount: 312,
    totalRevenue: 108888000,
    ptSessionsIncluded: 1,
    extraServices: 'Gym & Boxing'
  },
  {
    id: 'pkg_yoga549',
    code: 'YOGA549',
    name: 'Gói Thân Tâm An Lạc (Yoga Chuyên Sâu)',
    nameEn: 'Deep Mindful Yoga Pass',
    category: 'all_inclusive',
    price: 549000,
    originalPrice: 700000,
    durationMonths: 1,
    durationLabel: '1 Tháng',
    benefits: [
      'Tham gia các lớp Yoga chuyên sâu theo lịch tập hàng tuần',
      'Giáo viên hướng dẫn tận tâm, chỉnh sửa tư thế chu đáo',
      'Đóng tiền theo từng tháng tự do, không bắt buộc hợp đồng dài hạn',
      'Phòng studio Yoga thoáng mát, thảm tập và đạo cụ đầy đủ',
      'Tủ đồ locker an toàn, phòng tắm nóng lạnh & gửi xe miễn phí'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Yoga Chuyên Sâu (549k)',
    notes: 'Gói dành cho học viên đam mê Yoga Master và tĩnh tâm',
    memberCount: 198,
    totalRevenue: 108702000,
    ptSessionsIncluded: 0,
    extraServices: 'Yoga & Locker 5 sao'
  },
  {
    id: 'pkg_allin699',
    code: 'ALLIN699',
    name: 'Gói Đỉnh Cao Thể Lực (All-In-One Yoga & Gym)',
    nameEn: 'All-In-One Ultimate Fitness Membership',
    category: 'all_inclusive',
    price: 699000,
    originalPrice: 950000,
    durationMonths: 1,
    durationLabel: '1 Tháng',
    benefits: [
      'Không giới hạn các lớp Yoga theo khung giờ cùng Master Yoga',
      'Toàn bộ quyền lợi tập Gym & Boxing không giới hạn khung giờ',
      'Tặng 02 buổi tập riêng 1:1 cùng Huấn luyện viên cá nhân (PT)',
      'Giảm thêm 20% khi xuất trình thẻ Học sinh - Sinh viên (HSSV)',
      'Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng'
    ],
    isPopular: true,
    isActive: true,
    badge: 'All-In-One VIP (699k)',
    notes: 'Gói VIP toàn năng đầy đủ tiện ích nhất trên website',
    memberCount: 224,
    totalRevenue: 156576000,
    ptSessionsIncluded: 2,
    extraServices: 'Gym, Yoga & PT 1:1'
  },
  {
    id: 'pkg_daypass',
    code: 'DAYPASS',
    name: 'Vé Ngày Day Pass (Trải Nghiệm Tự Do)',
    nameEn: 'Single Day Pass',
    category: 'gym',
    price: 100000,
    originalPrice: 150000,
    durationMonths: 0,
    durationLabel: '1 Ngày',
    benefits: [
      'Trải nghiệm tự do máy Gym, Cardio, Boxing & Tủ locker trọn ngày',
      'Sử dụng phòng tắm nóng lạnh và máy sấy tóc',
      'Thích hợp cho khách vãng lai hoặc trải nghiệm thử 1 ngày'
    ],
    isPopular: false,
    isActive: true,
    badge: 'Vé Ngày 100k',
    notes: 'Vé trải nghiệm 1 ngày dành cho khách vãng lai',
    memberCount: 420,
    totalRevenue: 42000000,
    ptSessionsIncluded: 0,
    extraServices: 'Gym & Locker Day Pass'
  },
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
      'Miễn phí phân tích chỉ số thể trạng định kỳ hàng tháng',
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
      'Kiểm tra thể trạng định kỳ phân tích tiến độ thay đổi thể hình',
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
      'Đánh giá phân tích chỉ số thể trạng ngày đầu tiên',
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
    id: 'pkg_pt',
    code: 'PT',
    name: 'Gói Tập Huấn Luyện Viên Cá Nhân (PT 1:1)',
    nameEn: '1-on-1 Personal Training Package',
    category: 'pt',
    price: 5000000,
    originalPrice: 6500000,
    durationMonths: 1,
    durationLabel: 'Theo Gói',
    benefits: [
      'Huấn luyện viên cá nhân theo sát 1 kèm 1 trong suốt quá trình tập luyện',
      'Đánh giá chỉ số thể trạng và tư vấn lộ trình dinh dưỡng cá nhân hóa',
      'Cam kết đạt được mục tiêu thay đổi hình thể (tăng cơ, giảm mỡ, cải thiện bệnh lý)',
      'Thời gian tập luyện linh hoạt theo lịch trình của hội viên'
    ],
    isPopular: true,
    isActive: true,
    badge: 'HLV Cá Nhân',
    notes: 'Gói tập HLV cá nhân chuyên sâu (Personal Training)',
    memberCount: 50,
    totalRevenue: 250000000,
    ptSessionsIncluded: 12,
    extraServices: 'Kèm 1:1 & Dinh dưỡng'
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
    const existingIds = new Set<string>();
    snap.forEach(docSnap => {
      existingIds.add(docSnap.id);
      packages.push({ id: docSnap.id, ...docSnap.data() } as GymPackage);
    });

    // Ensure any new default packages from landing page are merged/seeded into Firestore
    for (const pkg of DEFAULT_PACKAGES) {
      if (!existingIds.has(pkg.id)) {
        await setDoc(doc(db, 'packages', pkg.id), {
          ...pkg,
          timestamp: serverTimestamp()
        });
        packages.push(pkg);
      }
    }

    return packages;
  } catch (error) {
    console.error('Error getting packages from Firestore:', error);
    return DEFAULT_PACKAGES;
  }
}

export async function savePackageToFirebase(pkg: GymPackage): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pkg)
      });
      if (res.ok) return true;
    }
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
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
    id: 'promo_shine349',
    code: 'SHINE349',
    title: 'Gói Ưu Đãi Fanpage Gym & Boxing 349.000 VNĐ/Tháng',
    description: 'Ưu đãi đặc biệt giảm 36% (từ 549k xuống 349k/tháng) dành cho khách hàng tìm hiểu qua Fanpage.',
    discountType: 'fixed_amount',
    discountValue: 200000,
    minOrderValue: 349000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 500,
    usageCount: 218,
    applicablePackages: ['SHINE349', 'GYM_BOXING'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_yoga549',
    code: 'YOGA549',
    title: 'Ưu Đãi Yoga Chuyên Sâu 549.000 VNĐ/Tháng',
    description: 'Giảm 21% (từ 700k xuống 549k/tháng) tập Yoga không giới hạn lớp cùng Master Yoga.',
    discountType: 'fixed_amount',
    discountValue: 151000,
    minOrderValue: 549000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 300,
    usageCount: 114,
    applicablePackages: ['YOGA549'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_allin699',
    code: 'ALLIN699',
    title: 'Ưu Đãi All-In-One Yoga & Gym 699.000 VNĐ/Tháng',
    description: 'Giảm 26% (từ 950k xuống 699k) trọn gói Gym, Boxing, Yoga & tặng 2 buổi PT 1-kèm-1.',
    discountType: 'fixed_amount',
    discountValue: 251000,
    minOrderValue: 699000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 300,
    usageCount: 156,
    applicablePackages: ['ALLIN699'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_daypass100',
    code: 'DAYPASS100',
    title: 'Vé Ngày Day Pass 100.000 VNĐ Trải Nghiệm Tự Do',
    description: 'Trải nghiệm full dịch vụ 1 ngày tại The Shine Fitness & Yoga Tân Bình.',
    discountType: 'fixed_amount',
    discountValue: 50000,
    minOrderValue: 100000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 1000,
    usageCount: 420,
    applicablePackages: ['DAYPASS'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'promo_student20',
    code: 'STUDENT20',
    title: 'Ưu Đãi Giảm Trực Tiếp 20% Cho Học Sinh - Sinh Viên',
    description: 'Áp dụng trực tiếp khi xuất trình thẻ học sinh, sinh viên còn thời hạn.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 300000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    usageLimit: 500,
    usageCount: 185,
    applicablePackages: ['ALL'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
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
    const existingIds = new Set<string>();
    snap.forEach(docSnap => {
      existingIds.add(docSnap.id);
      promos.push({ id: docSnap.id, ...docSnap.data() } as PromotionCampaign);
    });

    // Ensure any new default promotions from landing page are merged/seeded into Firestore
    for (const promo of DEFAULT_PROMOTIONS) {
      if (!existingIds.has(promo.id)) {
        await setDoc(doc(db, 'promotions', promo.id), {
          ...promo,
          timestamp: serverTimestamp()
        });
        promos.push(promo);
      }
    }

    return promos;
  } catch (error) {
    console.error('Error getting promotions from Firestore:', error);
    return DEFAULT_PROMOTIONS;
  }
}

export async function savePromotionToFirebase(promo: PromotionCampaign): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(promo)
      });
      if (res.ok) return true;
    }
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
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
        title: 'Email 2: Nhắc hẹn & Tặng buổi tư vấn thể trạng cùng PT',
        subtitle: 'Gửi nếu khách chưa đến sau 24h',
        config: {
          emailSubject: '💪 {{customer_name}} ơi, HLV The Shine đang chờ bạn đến tư vấn thể trạng hôm nay!',
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/email-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(flow)
      });
      if (res.ok) return true;
    }
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/admin/email-flows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
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
    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/admin/excel-data', { headers });
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
          if (!c.tags?.includes('Đã đánh giá thể trạng')) {
            c.tags = [...(c.tags || []), 'Đã đánh giá thể trạng'];
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/customers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(customer)
      });
      if (res.ok) return true;
    }
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/customers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(customers)
      });
      if (res.ok) {
        if (onProgress) onProgress(100);
        return true;
      }
    }
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
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
    await deleteDoc(doc(db, 'customers', id));
    return true;
  } catch (error) {
    console.error('Error deleting customer from Firestore:', error);
    return false;
  }
}

export async function deleteAdminUserFromFirebase(uid: string): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
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

  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(customer)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customer) return data.customer;
      }
    }
  } catch (err) {
    console.warn('Backend create customer failed, writing client-side:', err);
  }

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
    const currentUser = auth.currentUser;
    const currentUid = currentUser ? currentUser.uid : (entry.userId || entry.memberCode);

    // Strip out any undefined fields so Firestore doesn't reject the payload
    const sanitizedEntry: Record<string, any> = {};
    for (const [key, value] of Object.entries(entry)) {
      if (value !== undefined) {
        sanitizedEntry[key] = value;
      }
    }

    await setDoc(doc(db, 'member_progress', docId), {
      ...sanitizedEntry,
      id: docId,
      userId: currentUid,
      uid: currentUid,
      timestamp: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Unable to persist member progress to Firestore (will use local cache):', error);
    return false;
  }
}

export async function getMemberProgressFromFirebase(userId: string, memberCode?: string): Promise<MemberProgressEntry[]> {
  try {
    const colRef = collection(db, 'member_progress');
    const results: MemberProgressEntry[] = [];
    const seenIds = new Set<string>();

    // Query by userId if provided
    if (userId) {
      try {
        const q = query(colRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => {
          if (!seenIds.has(docSnap.id)) {
            seenIds.add(docSnap.id);
            results.push({ id: docSnap.id, ...docSnap.data() } as MemberProgressEntry);
          }
        });
      } catch (userErr) {
        console.warn('Query by userId encountered an issue, trying memberCode fallback:', userErr);
      }
    }

    // Also query by memberCode if available and needed
    if (memberCode && (results.length === 0 || !userId)) {
      try {
        const qCode = query(colRef, where('memberCode', '==', memberCode));
        const snapCode = await getDocs(qCode);
        snapCode.forEach(docSnap => {
          if (!seenIds.has(docSnap.id)) {
            seenIds.add(docSnap.id);
            results.push({ id: docSnap.id, ...docSnap.data() } as MemberProgressEntry);
          }
        });
      } catch (codeErr) {
        console.warn('Query by memberCode encountered an issue:', codeErr);
      }
    }

    // Sort by date ascending
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.warn('Unable to fetch member progress from Firestore (falling back to local cache):', error);
    return [];
  }
}

export async function deleteMemberProgressFromFirebase(id: string): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`/api/member-progress/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return true;
    }
    await deleteDoc(doc(db, 'member_progress', id));
    return true;
  } catch (error) {
    console.error('Error deleting member progress from Firestore:', error);
    return false;
  }
}


