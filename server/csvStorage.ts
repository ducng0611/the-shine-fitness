import fs from 'fs';
import path from 'path';
import { inferGenderFromName } from './genderHelper';

export interface RegistrationRecord {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string;
  packageType: string;
  goal: string;
  preferredTime: string;
  notes: string;
  status: string;
}

export interface MemberRecord {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  memberCode: string;
  membershipTier: string;
  startDate: string;
  expiryDate: string;
  status: string;
  gender?: string;
}

export interface EmailLogRecord {
  id: string;
  sentAt: string;
  recipientEmail: string;
  recipientName: string;
  campaignStep: number;
  campaignName: string;
  subject: string;
  status: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const REGISTRATIONS_CSV = path.join(DATA_DIR, 'registrations.csv');
const MEMBERS_CSV = path.join(DATA_DIR, 'members.csv');
const EMAIL_LOGS_CSV = path.join(DATA_DIR, 'email_logs.csv');

// Helper to escape CSV cell value
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Ensure directory and CSV files exist with proper headers
export function initCsvStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Registrations CSV
  if (!fs.existsSync(REGISTRATIONS_CSV)) {
    const regHeader = 'id,createdAt,fullName,phone,email,packageType,goal,preferredTime,notes,status\n';
    // Seed with 2 realistic sample registrations
    const seed1 = [
      'REG-1001',
      '2026-09-12 09:30:00',
      'Nguyễn Văn An',
      '0912345678',
      'an.nguyen@gmail.com',
      'Premium (800k)',
      'Tăng cơ & Giảm mỡ',
      'Chiều 17:30 - 19:30',
      'Muốn được đo InBody và tập thử 3 ngày',
      'Đã liên hệ'
    ].map(escapeCsv).join(',') + '\n';

    const seed2 = [
      'REG-1002',
      '2026-09-14 14:15:00',
      'Trần Thị Mai',
      '0987654321',
      'mai.tran@gmail.com',
      'VIP (1.5M)',
      'Tập Yoga & Thư giãn',
      'Sáng 06:00 - 07:30',
      'Quan tâm lớp Yoga sáng và xông hơi',
      'Mới đăng ký'
    ].map(escapeCsv).join(',') + '\n';

    fs.writeFileSync(REGISTRATIONS_CSV, regHeader + seed1 + seed2, 'utf-8');
  }

  // Members CSV
  if (!fs.existsSync(MEMBERS_CSV)) {
    const memberHeader = 'id,createdAt,fullName,email,phone,password,memberCode,membershipTier,startDate,expiryDate,status\n';
    // Seed with 2 demo accounts
    const member1 = [
      'MEM-2001',
      '2026-09-01 10:00:00',
      'Nguyễn Minh Đức',
      'ducnguyen06112002@gmail.com',
      '0946293593',
      'shine123',
      'SHINE-VIP-88',
      'VIP',
      '2026-09-01',
      '2027-09-01',
      'Active'
    ].map(escapeCsv).join(',') + '\n';

    const member2 = [
      'MEM-2002',
      '2026-09-05 15:20:00',
      'Lê Hoàng Nam',
      'nam.le@theshine.vn',
      '0909123456',
      '123456',
      'SHINE-PRE-12',
      'Premium',
      '2026-09-05',
      '2027-03-05',
      'Active'
    ].map(escapeCsv).join(',') + '\n';

    fs.writeFileSync(MEMBERS_CSV, memberHeader + member1 + member2, 'utf-8');
  }

  // Email Logs CSV
  if (!fs.existsSync(EMAIL_LOGS_CSV)) {
    const emailHeader = 'id,sentAt,recipientEmail,recipientName,campaignStep,campaignName,subject,status\n';
    const log1 = [
      'EML-3001',
      '2026-09-12 09:31:00',
      'an.nguyen@gmail.com',
      'Nguyễn Văn An',
      '1',
      'Welcome Flow',
      '[The Shine Fitness] Chào mừng bạn! Nhận Voucher 3 ngày tập thử & Đo InBody',
      'Delivered'
    ].map(escapeCsv).join(',') + '\n';

    const log2 = [
      'EML-3002',
      '2026-09-14 14:16:00',
      'mai.tran@gmail.com',
      'Trần Thị Mai',
      '1',
      'Welcome Flow',
      '[The Shine Fitness] Chào mừng bạn! Nhận Voucher 3 ngày tập thử & Đo InBody',
      'Delivered'
    ].map(escapeCsv).join(',') + '\n';

    fs.writeFileSync(EMAIL_LOGS_CSV, emailHeader + log1 + log2, 'utf-8');
  }
}

// Manual CSV line parser handling quoted cells
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Read all registrations
export function getRegistrations(): RegistrationRecord[] {
  initCsvStorage();
  try {
    const content = fs.readFileSync(REGISTRATIONS_CSV, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: RegistrationRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length >= 10) {
        records.push({
          id: cols[0],
          createdAt: cols[1],
          fullName: cols[2],
          phone: cols[3],
          email: cols[4],
          packageType: cols[5],
          goal: cols[6],
          preferredTime: cols[7],
          notes: cols[8],
          status: cols[9]
        });
      }
    }
    return records.reverse(); // Newest first
  } catch (err) {
    console.error('Error reading registrations CSV:', err);
    return [];
  }
}

// Save a new registration to CSV
export function addRegistration(data: Omit<RegistrationRecord, 'id' | 'createdAt' | 'status'>): RegistrationRecord {
  initCsvStorage();
  const id = `REG-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const createdAt = now.toISOString().replace('T', ' ').substring(0, 19);
  const status = 'Mới đăng ký';

  const record: RegistrationRecord = {
    id,
    createdAt,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    packageType: data.packageType || 'Chưa chọn gói',
    goal: data.goal || 'Cải thiện sức khỏe',
    preferredTime: data.preferredTime || 'Linh hoạt',
    notes: data.notes || '',
    status
  };

  const line = [
    record.id,
    record.createdAt,
    record.fullName,
    record.phone,
    record.email,
    record.packageType,
    record.goal,
    record.preferredTime,
    record.notes,
    record.status
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(REGISTRATIONS_CSV, line, 'utf-8');

  // Trigger Email Marketing Step 1 (Welcome + Voucher)
  logEmailCampaign({
    recipientEmail: record.email,
    recipientName: record.fullName,
    campaignStep: 1,
    campaignName: 'Welcome Lead Flow',
    subject: `[The Shine Fitness] Chào mừng ${record.fullName}! Nhận Voucher 3 ngày tập thử & Buổi đo InBody miễn phí`
  });

  return record;
}

// Read all members
export function getMembers(): MemberRecord[] {
  initCsvStorage();
  try {
    const content = fs.readFileSync(MEMBERS_CSV, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: MemberRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length >= 11) {
        const rawGender = cols[11] ? cols[11].trim() : '';
        const resolvedGender = rawGender || (inferGenderFromName(cols[2]) || 'Nam');
        records.push({
          id: cols[0],
          createdAt: cols[1],
          fullName: cols[2],
          email: cols[3].toLowerCase(),
          phone: cols[4],
          password: cols[5],
          memberCode: cols[6],
          membershipTier: cols[7],
          startDate: cols[8],
          expiryDate: cols[9],
          status: cols[10],
          gender: resolvedGender
        });
      }
    }
    return records;
  } catch (err) {
    console.error('Error reading members CSV:', err);
    return [];
  }
}

// Register a new member and append to CSV
export function addMember(data: { fullName: string; email: string; phone: string; password: string; membershipTier?: string; gender?: string }): { member: Omit<MemberRecord, 'password'>; error?: string } {
  initCsvStorage();
  const members = getMembers();
  const cleanEmail = data.email.trim().toLowerCase();

  const existing = members.find(m => m.email === cleanEmail);
  if (existing) {
    return { member: null as any, error: 'Email này đã được đăng ký tài khoản thành viên.' };
  }

  const id = `MEM-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const createdAt = now.toISOString().replace('T', ' ').substring(0, 19);
  const tier = data.membershipTier || 'Premium';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const memberCode = `SHINE-${tier.toUpperCase().slice(0, 3)}-${randomSuffix}`;

  const startDate = now.toISOString().split('T')[0];
  const expDateObj = new Date(now);
  expDateObj.setFullYear(expDateObj.getFullYear() + 1);
  const expiryDate = expDateObj.toISOString().split('T')[0];
  const status = 'Active';
  const gender = data.gender ? data.gender.trim() : (inferGenderFromName(data.fullName) || 'Nam');

  const memberRow: MemberRecord = {
    id,
    createdAt,
    fullName: data.fullName.trim(),
    email: cleanEmail,
    phone: data.phone.trim(),
    password: data.password.trim(),
    memberCode,
    membershipTier: tier,
    startDate,
    expiryDate,
    status,
    gender
  };

  const line = [
    memberRow.id,
    memberRow.createdAt,
    memberRow.fullName,
    memberRow.email,
    memberRow.phone,
    memberRow.password,
    memberRow.memberCode,
    memberRow.membershipTier,
    memberRow.startDate,
    memberRow.expiryDate,
    memberRow.status,
    memberRow.gender
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(MEMBERS_CSV, line, 'utf-8');

  // Trigger automated member welcome email
  logEmailCampaign({
    recipientEmail: memberRow.email,
    recipientName: memberRow.fullName,
    campaignStep: 1,
    campaignName: 'Member Onboarding Flow',
    subject: `[The Shine Fitness] Chúc mừng Hội viên mới - Thẻ ${memberRow.membershipTier} (${memberRow.memberCode})`
  });

  const { password, ...safeMember } = memberRow;
  return { member: safeMember };
}

// Authenticate member
export function loginMember(email: string, password: string): { member?: Omit<MemberRecord, 'password'>; error?: string } {
  initCsvStorage();
  const members = getMembers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  const user = members.find(m => m.email === cleanEmail && m.password === cleanPass);
  if (!user) {
    return { error: 'Email hoặc mật khẩu không chính xác.' };
  }

  const { password: _, ...safeMember } = user;
  if (!safeMember.gender) {
    safeMember.gender = inferGenderFromName(safeMember.fullName) || 'Nam';
  }
  return { member: safeMember };
}

// Log an email sent in marketing flow
export function logEmailCampaign(data: {
  recipientEmail: string;
  recipientName: string;
  campaignStep: number;
  campaignName: string;
  subject: string;
}): EmailLogRecord {
  initCsvStorage();
  const id = `EML-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const sentAt = now.toISOString().replace('T', ' ').substring(0, 19);
  const status = 'Delivered';

  const log: EmailLogRecord = {
    id,
    sentAt,
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    campaignStep: data.campaignStep,
    campaignName: data.campaignName,
    subject: data.subject,
    status
  };

  const line = [
    log.id,
    log.sentAt,
    log.recipientEmail,
    log.recipientName,
    String(log.campaignStep),
    log.campaignName,
    log.subject,
    log.status
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(EMAIL_LOGS_CSV, line, 'utf-8');
  return log;
}

// Get email logs
export function getEmailLogs(): EmailLogRecord[] {
  initCsvStorage();
  try {
    const content = fs.readFileSync(EMAIL_LOGS_CSV, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: EmailLogRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length >= 8) {
        records.push({
          id: cols[0],
          sentAt: cols[1],
          recipientEmail: cols[2],
          recipientName: cols[3],
          campaignStep: Number(cols[4]) || 1,
          campaignName: cols[5],
          subject: cols[6],
          status: cols[7]
        });
      }
    }
    return records.reverse(); // Newest first
  } catch (err) {
    console.error('Error reading email logs CSV:', err);
    return [];
  }
}

// Marketing Flow Steps definition
export const EMAIL_MARKETING_FLOW = [
  {
    step: 1,
    trigger: 'Ngay khi điền form Đăng ký / Đăng ký Hội viên',
    timing: 'Tức thì (0 phút)',
    name: 'Thư Chào Mừng & Tặng Voucher Tập Thử',
    subject: '[The Shine Fitness] Chào mừng bạn! Quà tặng Voucher 3 ngày tập thử & Đo InBody miễn phí',
    badge: 'Kích hoạt tự động',
    description: 'Xác nhận thông tin đăng ký, cấp mã Voucher tập thử 3 ngày tại 154 Hoàng Hoa Thám, tặng kèm buổi đo phân tích chỉ số cơ thể InBody cùng PT.',
    openRate: '88.4%',
    clickRate: '42.1%'
  },
  {
    step: 2,
    trigger: 'Sau khi đăng ký 2 ngày (Day 2 Nurture)',
    timing: 'Sau 48 giờ',
    name: 'Bí Kíp Khởi Động & Thời Khóa Biểu Lớp Nhóm',
    subject: '[The Shine Fitness] 5 lưu ý vàng cho người mới & Lịch lớp Yoga/Zumba tuần này',
    badge: 'Drip Email 1',
    description: 'Cung cấp kiến thức tập luyện tránh chấn thương, lịch lớp Yoga, Zumba, Kickboxing tuần mới nhất và giới thiệu đội ngũ Huấn luyện viên.',
    openRate: '71.2%',
    clickRate: '31.5%'
  },
  {
    step: 3,
    trigger: 'Sau khi đăng ký 5 ngày (Day 5 Conversion)',
    timing: 'Sau 5 ngày',
    name: 'Ưu Đãi Đặc Quyền Giảm 20% Thẻ Hội Viên',
    subject: '[The Shine Fitness] Ưu đãi độc quyền: Giảm 20% khi kích hoạt thẻ hội viên tháng này',
    badge: 'Drip Email 2',
    description: 'Chính sách ưu đãi độc quyền dành riêng cho khách hàng đăng ký online: Giảm 20% phí thẻ năm, tặng thêm 2 buổi PT 1-kèm-1 và bình nước thể thao.',
    openRate: '65.8%',
    clickRate: '38.0%'
  },
  {
    step: 4,
    trigger: 'Sau khi đăng ký 10 ngày (Day 10 Feedback)',
    timing: 'Sau 10 ngày',
    name: 'Khảo Sát Mục Tiêu & Tư Vấn Dinh Dưỡng Miễn Phí',
    subject: '[The Shine Fitness] Bạn cảm thấy thế nào sau những buổi tập đầu tiên?',
    badge: 'Chăm sóc & Retargeting',
    description: 'Khảo sát cảm nhận tập luyện và mời tham gia buổi tư vấn dinh dưỡng cá nhân hóa miễn phí cùng chuyên gia The Shine.',
    openRate: '59.3%',
    clickRate: '24.7%'
  }
];

// Return formatted HTML template preview for each flow step
export function getEmailTemplateHtml(step: number, recipientName: string = 'Quý khách'): { subject: string; html: string } {
  const stepData = EMAIL_MARKETING_FLOW.find(s => s.step === step) || EMAIL_MARKETING_FLOW[0];
  
  let bodyContent = '';

  if (step === 1) {
    bodyContent = `
      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; color: #ea580c; font-size: 16px;">🎁 MÃ VOUCHER ĐẶC QUYỀN CỦA BẠN: <span style="background: #ea580c; color: #fff; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px;">SHINE-TRIAL-FREE</span></h3>
        <p style="margin: 0; color: #431407; font-size: 14px;">Quyền lợi: <strong>03 ngày trải nghiệm miễn phí 100%</strong> toàn bộ trang thiết bị tại The Shine Fitness + <strong>01 buổi đo InBody & tư vấn lộ trình tập luyện</strong> cùng Huấn luyện viên chuyên nghiệp.</p>
      </div>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
        Chào <strong>${recipientName}</strong>,<br><br>
        Cảm ơn bạn đã đăng ký quan tâm đến <strong>The Shine Fitness & Yoga</strong>. Chúng tôi rất hào hứng được đồng hành cùng bạn trên chặng đường kiến tạo vóc dáng và nâng tầm sức khỏe!
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">📍 Hướng dẫn nhận ưu đãi:</h4>
        <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
          <li>Đến quầy Lễ tân tại: <strong>154 Hoàng Hoa Thám, Phường Bảy Hiền, TP. Hồ Chí Minh</strong></li>
          <li>Đọc số điện thoại của bạn hoặc mã voucher <strong>SHINE-TRIAL-FREE</strong> để nhân viên kích hoạt thẻ tập thử.</li>
          <li>Khung giờ hoạt động: <strong>Thứ 2 - Thứ 7: 06:00 - 21:00 | Chủ Nhật: 06:00 - 20:30</strong>.</li>
        </ol>
      </div>
    `;
  } else if (step === 2) {
    bodyContent = `
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
        Chào <strong>${recipientName}</strong>,<br><br>
        Bắt đầu một thói quen rèn luyện thể thao mới luôn là bước đi dũng cảm nhất! Để buổi tập đầu tiên tại The Shine diễn ra hiệu quả và tràn đầy hứng khởi, các HLV gửi tặng bạn 3 bí quyết vàng:
      </p>
      <div style="margin: 20px 0;">
        <div style="display: flex; margin-bottom: 12px;">
          <div style="background: #ea580c; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 12px; shrink: 0;">1</div>
          <div style="color: #334155; font-size: 14px;"><strong>Khởi động kỹ 10 - 15 phút:</strong> Giúp các khớp sản sinh dịch bôi trơn và tăng nhịp tim dần đều.</div>
        </div>
        <div style="display: flex; margin-bottom: 12px;">
          <div style="background: #ea580c; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 12px; shrink: 0;">2</div>
          <div style="color: #334155; font-size: 14px;"><strong>Đừng ngại hỏi Huấn luyện viên trực sàn:</strong> Nhân viên The Shine luôn túc trực để hướng dẫn bạn chỉnh tư thế chuẩn.</div>
        </div>
        <div style="display: flex;">
          <div style="background: #ea580c; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 12px; shrink: 0;">3</div>
          <div style="color: #334155; font-size: 14px;"><strong>Thử sức với các lớp GroupX & Yoga:</strong> Lớp tập nhóm âm nhạc sôi động sẽ truyền năng lượng bùng nổ cho bạn!</div>
        </div>
      </div>
    `;
  } else if (step === 3) {
    bodyContent = `
      <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Ưu đãi giới hạn 48H</span>
        <h2 style="margin: 10px 0 6px 0; font-size: 26px;">GIẢM 20% KHI ĐĂNG KÝ HỘI VIÊN NĂM</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Tặng kèm 2 buổi tập PT 1-kèm-1 và miễn phí sử dụng phòng Xông hơi cao cấp</p>
      </div>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
        Chào <strong>${recipientName}</strong>,<br><br>
        Để tiếp thêm động lực cho mục tiêu thể hình bứt phá trong năm nay, The Shine trân trọng gửi đến bạn chương trình tri ân độc quyền cho khách hàng online.
      </p>
      <ul style="color: #334155; font-size: 14px; line-height: 1.8; margin-bottom: 20px;">
        <li>Gói Basic: Chỉ từ <strong>400.000đ/tháng</strong></li>
        <li>Gói Premium: Chỉ từ <strong>640.000đ/tháng</strong> (Full lớp Yoga & Zumba)</li>
        <li>Gói VIP: Chỉ từ <strong>1.200.000đ/tháng</strong> (Locker riêng & Đậu xe hơi riêng)</li>
      </ul>
    `;
  } else {
    bodyContent = `
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
        Chào <strong>${recipientName}</strong>,<br><br>
        Hành trình tập luyện của bạn trong tuần vừa qua như thế nào? Sự hài lòng và tiến bộ của bạn chính là tôn chỉ hoạt động hàng đầu của The Shine Fitness & Yoga.
      </p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #1e293b; font-size: 15px;">Bạn đánh giá trải nghiệm tại The Shine bao nhiêu điểm?</p>
        <div style="font-size: 24px; letter-spacing: 8px;">⭐⭐⭐⭐⭐</div>
      </div>
    `;
  }

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px 12px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 24px 32px; border-bottom: 3px solid #ea580c; text-align: left;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; text-transform: uppercase; color: #ffffff; letter-spacing: -0.5px; font-style: italic;">
                      <span style="background: #ea580c; color: #fff; padding: 2px 6px; font-size: 11px; vertical-align: middle; margin-right: 4px; font-weight: 900;">THE</span>
                      <span style="color: #ea580c;">SHINE</span> FITNESS
                    </div>
                    <div style="color: #ea580c; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px;">SHINE ON. SWEAT ON</div>
                  </td>
                  <td align="right">
                    <span style="color: #9ca3af; font-size: 12px;">Hotline: <strong style="color: #ea580c;">0946 293 593</strong></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="color: #ea580c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                ${stepData.name}
              </div>
              <h1 style="color: #111827; font-size: 20px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.4;">
                ${stepData.subject}
              </h1>

              ${bodyContent}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://theshinefitness.vn" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                  Đến Phòng Tập Nhận Quà Ngay
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">
                <strong>The Shine Fitness and Yoga Center</strong>
              </p>
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 11px;">
                📍 154 Hoàng Hoa Thám, Phường Bảy Hiền, TP. Hồ Chí Minh | ⏰ Thứ 2 - Thứ 7: 06:00 - 21:00 | Chủ Nhật: 06:00 - 20:30
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                Email này được gửi tự động từ hệ thống Email Marketing của The Shine Fitness.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    subject: stepData.subject,
    html: fullHtml
  };
}
