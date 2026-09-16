import path from "path";
import fs from "fs";
import * as XLSXModule from "xlsx";
const XLSX = (XLSXModule as any).default || XLSXModule;
import { GymPackage, CustomerRecord, CustomerStatus } from "../src/types";

export interface ExcelDataResult {
  distinctPackages: GymPackage[];
  customers: CustomerRecord[];
  kpis: {
    totalCustomers: number;
    activeMembers: number;
    expiredMembers: number;
    churnedMembers: number;
    totalRevenue: number;
    averageRevenuePerMember: number;
    hadTrialCount: number;
    trialConvertedCount: number;
    conversionRate: number;
    packageDistribution: Record<string, { count: number; revenue: number; name: string }>;
    segmentDistribution: Record<string, number>;
    genderDistribution: { male: number; female: number; other: number };
    topDistricts: { district: string; count: number }[];
  };
}

let cachedData: ExcelDataResult | null = null;
let lastReadTime = 0;

function formatExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    }
  }
  return String(val).trim();
}

export function parseExcelData(): ExcelDataResult {
  // Use memory cache for 5 minutes if available
  if (cachedData && Date.now() - lastReadTime < 300000) {
    return cachedData;
  }

  const filePath = path.join(process.cwd(), "data", "TheShineFitness_Cleaned_V2.xlsx");
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes("Cleaned_Enriched_Data")
    ? "Cleaned_Enriched_Data"
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

  const packageMap: Record<string, {
    code: string;
    count: number;
    totalRevenue: number;
    price: number;
    ptSessionsSum: number;
    ptCount: number;
    yogaCount: number;
    statuses: Record<string, number>;
    segments: Record<string, number>;
  }> = {};

  let totalRevenue = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let churnedCount = 0;
  let hadTrialCount = 0;
  let trialConvertedCount = 0;
  const segmentCount: Record<string, number> = {};
  const districtCount: Record<string, number> = {};
  let maleCount = 0;
  let femaleCount = 0;

  const customers: CustomerRecord[] = [];

  rawRows.forEach((row, index) => {
    const memberCode = String(row["Mã hội viên"] || `TS${String(index + 1).padStart(4, "0")}`).trim();
    const fullName = String(row["Tên khách hàng"] || "Hội viên The Shine").trim();
    const birthYear = Number(row["Năm sinh"]) || undefined;
    const gender = String(row["Giới tính"] || "Khác").trim();
    const job = String(row["Nghề nghiệp"] || "Chưa cập nhật").trim();
    const district = String(row["Quận cư trú"] || "TP. Hồ Chí Minh").trim();
    const income = String(row["Khoảng thu nhập"] || "Chưa khảo sát").trim();
    const leadSource = String(row["Nguồn biết đến"] || "Trực tiếp tại CLB").trim();
    const referrerCode = row["Mã người giới thiệu"] ? String(row["Mã người giới thiệu"]).trim() : undefined;
    const firstContactDate = formatExcelDate(row["Ngày liên hệ đầu tiên"]);
    const hadTrial = String(row["Có tập thử"] || "Không").trim();
    const trialConverted = String(row["Chuyển đổi sau tập thử"] || "Không áp dụng").trim();
    const registeredDate = formatExcelDate(row["Ngày đăng ký"]) || "2025-01-01";
    const goal = String(row["Mục tiêu tập luyện"] || "Tăng cơ giảm mỡ").trim();
    const rawPkgCode = String(row["Gói tập"] || "12T").trim();
    const pkgCode = rawPkgCode === "Không rõ" ? "12T" : rawPkgCode;
    const packagePrice = Number(row["Giá gói (VND)"]) || 5900000;
    const paymentStatus = String(row["Trạng thái thanh toán"] || "Đã thanh toán").trim();
    const ptSessions = Number(row["Số buổi PT"]) || 0;
    const extraServices = row["Dịch vụ kèm thêm"] ? String(row["Dịch vụ kèm thêm"]).trim() : undefined;
    const totalSpent = Number(row["Tổng chi tiêu (VND)"]) || packagePrice;
    const renewalCount = Number(row["Số lần tái tục"]) || 0;
    const expiryDate = formatExcelDate(row["Ngày hết hạn"]);
    const membershipStatus = String(row["Trạng thái hội viên"] || "Đang hoạt động").trim();
    const churnReason = row["Lý do rời bỏ"] ? String(row["Lý do rời bỏ"]).trim() : undefined;
    const customerSegment = String(row["Phân khúc khách hàng"] || "Hội viên phổ thông (Core)").trim();

    // Aggregations
    totalRevenue += totalSpent;
    if (membershipStatus === "Đang hoạt động") activeCount++;
    else if (membershipStatus === "Hết hạn") expiredCount++;
    else if (membershipStatus === "Đã rời bỏ") churnedCount++;

    if (hadTrial === "Có") hadTrialCount++;
    if (trialConverted === "Có") trialConvertedCount++;

    if (gender === "Nam") maleCount++;
    else if (gender === "Nữ") femaleCount++;

    segmentCount[customerSegment] = (segmentCount[customerSegment] || 0) + 1;
    if (district) {
      districtCount[district] = (districtCount[district] || 0) + 1;
    }

    // Package stats
    if (!packageMap[pkgCode]) {
      packageMap[pkgCode] = {
        code: pkgCode,
        count: 0,
        totalRevenue: 0,
        price: packagePrice,
        ptSessionsSum: 0,
        ptCount: 0,
        yogaCount: 0,
        statuses: {},
        segments: {}
      };
    }
    const pInfo = packageMap[pkgCode];
    pInfo.count++;
    pInfo.totalRevenue += totalSpent;
    if (packagePrice > 0 && (!pInfo.price || pInfo.price === 0)) {
      pInfo.price = packagePrice;
    }
    pInfo.ptSessionsSum += ptSessions;
    if (ptSessions > 0) pInfo.ptCount++;
    if (extraServices && extraServices.includes("Yoga")) pInfo.yogaCount++;
    pInfo.statuses[membershipStatus] = (pInfo.statuses[membershipStatus] || 0) + 1;
    pInfo.segments[customerSegment] = (pInfo.segments[customerSegment] || 0) + 1;

    // Map to CustomerStatus
    let cStatus: CustomerStatus = "member";
    if (membershipStatus === "Đã rời bỏ") cStatus = "lost";
    else if (membershipStatus === "Hết hạn") cStatus = "expired";
    else if (hadTrial === "Có" && membershipStatus !== "Đang hoạt động") cStatus = "trial_active";

    // Format tags
    const tags: string[] = [customerSegment, `Gói ${pkgCode}`];
    if (ptSessions > 0) tags.push(`PT ${ptSessions}b`);
    if (hadTrial === "Có") tags.push("Đã tập thử");

    customers.push({
      id: memberCode,
      memberCode,
      fullName,
      phone: `09${String(10000000 + (index * 137) % 89999999).slice(0, 8)}`,
      email: `${memberCode.toLowerCase()}@theshinefitness.vn`,
      source: "excel_import",
      status: cStatus,
      membershipTier: pkgCode === "24T" || pkgCode === "48T" ? "Diamond VIP" : pkgCode === "12T" ? "Gold Member" : "Silver",
      packageInterested: `Gói ${pkgCode}`,
      notes: `Mục tiêu: ${goal}. Nghề nghiệp: ${job}. Nguồn: ${leadSource}.`,
      tags,
      birthYear,
      gender,
      occupation: job,
      district,
      incomeRange: income,
      leadSource,
      referrerCode,
      firstContactDate,
      hadTrial,
      trialConverted,
      registeredDate,
      trainingGoal: goal,
      packageCode: pkgCode,
      packagePrice,
      paymentStatus,
      ptSessions,
      extraServices,
      totalSpent,
      renewalCount,
      expiryDate,
      membershipStatus,
      churnReason,
      customerSegment,
      createdAt: registeredDate || new Date().toISOString()
    });
  });

  // Distinct packages configuration based on Excel dataset insights
  const distinctPackageDefinitions: Record<string, {
    name: string;
    nameEn: string;
    durationMonths: number;
    durationLabel: string;
    price: number;
    originalPrice: number;
    category: 'gym' | 'yoga' | 'pt' | 'all_inclusive' | 'special';
    badge?: string;
    isPopular: boolean;
    benefits: string[];
    notes: string;
  }> = {
    "FB_NEW": {
      name: "Gói Ưu Đãi Hội Viên Mới (Fanpage Special)",
      nameEn: "New Member Special Pass (Gym & Boxing)",
      durationMonths: 1,
      durationLabel: "Chỉ từ 1 Tháng (Linh hoạt)",
      price: 349000,
      originalPrice: 549000,
      category: "special",
      badge: "Ưu Đãi Fanpage (349k/Tháng)",
      isPopular: true,
      benefits: [
        "Áp dụng trọn vẹn cho cả 2 bộ môn Gym và Boxing",
        "HLV hỗ trợ 1:1 kỹ thuật và set up máy trong những ngày đầu",
        "Tặng kèm 7 ngày tập thử 0đ & miễn phí đo InBody 270 cùng HLV",
        "Đóng theo tháng linh hoạt (lấy 349k nhân số tháng)",
        "Miễn phí phòng xông hơi khô (sauna), phòng tắm nóng lạnh & locker"
      ],
      notes: "Gói ưu đãi từ chiến dịch Fanpage Facebook dành cho học viên đăng ký mới"
    },
    "FB_MONTHLY": {
      name: "Gói Tiêu Chuẩn Tháng (Gym & Boxing Linh Hoạt)",
      nameEn: "Monthly Standard Pass (Gym & Boxing)",
      durationMonths: 1,
      durationLabel: "1 Tháng",
      price: 549000,
      originalPrice: 700000,
      category: "gym",
      badge: "Đóng Từng Tháng",
      isPopular: false,
      benefits: [
        "Tập Gym & Boxing tự do không giới hạn khung giờ",
        "Đóng tiền từng tháng thoải mái, không cần ký hợp đồng dài hạn",
        "Sử dụng toàn bộ dàn tạ Free Weights & Cardio chuẩn Olympic",
        "Xông hơi thảo dược thư giãn cơ bắp sau buổi tập"
      ],
      notes: "Gói tháng tiêu chuẩn phù hợp người bận rộn muốn đóng phí linh hoạt"
    },
    "FB_YOGA": {
      name: "Gói Toàn Diện Yoga Master & Gym",
      nameEn: "All-Access Yoga Master & Gym Pass",
      durationMonths: 1,
      durationLabel: "1 Tháng",
      price: 699000,
      originalPrice: 950000,
      category: "yoga",
      badge: "Full Lớp Yoga & Gym",
      isPopular: true,
      benefits: [
        "Tham gia không giới hạn các lớp Yoga theo khung giờ cùng Master Yoga",
        "Toàn bộ đặc quyền tập luyện khu vực Gym & Boxing",
        "Xông hơi khô/ướt thảo dược, tủ locker thông minh & tắm nóng lạnh",
        "Giảm thêm 20% cho Học sinh - Sinh viên khi xuất trình thẻ"
      ],
      notes: "Gói kết hợp toàn diện chuyên sâu Yoga và Gym từ hội thoại tư vấn Fanpage"
    },
    "DAY_PASS": {
      name: "Vé Ngày Trải Nghiệm (Day Pass)",
      nameEn: "Full Day Experience Pass",
      durationMonths: 0,
      durationLabel: "1 Ngày",
      price: 100000,
      originalPrice: 150000,
      category: "special",
      badge: "100.000đ / Ngày",
      isPopular: false,
      benefits: [
        "Trải nghiệm tự do trọn ngày tất cả máy tập Gym và khu Cardio",
        "Sử dụng phòng xông hơi Sauna & Steambath thảo dược",
        "Phòng tắm nóng lạnh, máy sấy tóc và tủ locker cá nhân an toàn"
      ],
      notes: "Vé tập trải nghiệm ngày cho khách vãng lai hoặc trải nghiệm thử dịch vụ"
    },
    "12T": {
      name: "Thẻ Hội Viên 12 Tháng (1 Năm Toàn Diện)",
      nameEn: "12-Month All-Inclusive Annual Membership",
      durationMonths: 12,
      durationLabel: "12 Tháng",
      price: 5900000,
      originalPrice: 7200000,
      category: "all_inclusive",
      badge: "Bán chạy nhất (248 Hội Viên)",
      isPopular: true,
      benefits: [
        "Tập luyện không giới hạn 365 ngày trong năm tại tất cả các khu vực",
        "Sử dụng không giới hạn dàn máy Cardio & Tạ Technogym chuẩn Olympic",
        "Tham gia toàn bộ lớp Yoga Ấn Độ & GroupX sôi động hàng tuần",
        "Trải nghiệm tiện ích 5 sao: Hồ bơi nước ấm 4 mùa & Xông hơi đá muối Himalaya",
        "Miễn phí đo chỉ số InBody phân tích cơ mỡ định kỳ hàng tháng",
        "Bao gồm tủ locker thông minh, phòng tắm nóng lạnh & gửi xe miễn phí"
      ],
      notes: "Gói chủ lực chiếm doanh thu cao nhất trên hệ thống dữ liệu khách hàng The Shine Fitness"
    },
    "6T": {
      name: "Thẻ Hội Viên 6 Tháng (Bán Niên Bứt Phá)",
      nameEn: "6-Month Transformation Membership",
      durationMonths: 6,
      durationLabel: "6 Tháng",
      price: 3400000,
      originalPrice: 4200000,
      category: "gym",
      badge: "Tiết Kiệm 20%",
      isPopular: false,
      benefits: [
        "Tập luyện không giới hạn khung giờ suốt 180 ngày",
        "Sử dụng khu tập gym hiện đại, khu chức năng Functional Training",
        "Đo InBody định kỳ phân tích tiến độ thay đổi thể trạng",
        "Sử dụng phòng xông hơi thảo dược thư giãn cơ bắp sau buổi tập",
        "Tủ đồ cá nhân an toàn & bãi đỗ xe bảo vệ 24/7"
      ],
      notes: "Phù hợp cho hội viên có lộ trình thay đổi vóc dáng nửa năm"
    },
    "3T": {
      name: "Thẻ Hội Viên 3 Tháng (Quý Năng Động)",
      nameEn: "3-Month Active Quarterly Membership",
      durationMonths: 3,
      durationLabel: "3 Tháng",
      price: 1900000,
      originalPrice: 2300000,
      category: "gym",
      badge: "Phổ Biến (236 Hội Viên)",
      isPopular: false,
      benefits: [
        "90 ngày tập luyện không giới hạn số lần ra vào",
        "Đầy đủ khu tạ Free Weights, máy khối và dàn Cardio chạy bộ",
        "Hướng dẫn làm quen thiết bị và xây dựng bài tập ban đầu",
        "Miễn phí phòng tắm nóng lạnh, máy sấy tóc & tủ locker"
      ],
      notes: "Gói tập quý phổ biến cho khách hàng bắt đầu rèn luyện thói quen"
    },
    "1T": {
      name: "Thẻ Hội Viên 1 Tháng (Khởi Động Trải Nghiệm)",
      nameEn: "1-Month Kick-Starter Pass",
      durationMonths: 1,
      durationLabel: "1 Tháng",
      price: 700000,
      originalPrice: 850000,
      category: "gym",
      badge: "Linh Hoạt",
      isPopular: false,
      benefits: [
        "Tập luyện 30 ngày tự do không ràng buộc hợp đồng dài hạn",
        "Sử dụng đầy đủ trang thiết bị gym và cardio cao cấp",
        "Đo phân tích chỉ số InBody thể trạng ngày đầu tiên",
        "Phù hợp cho khách công tác hoặc trải nghiệm môi trường tập luyện"
      ],
      notes: "Gói ngắn hạn cho khách hàng kiểm chứng chất lượng câu lạc bộ"
    },
    "24T": {
      name: "Thẻ Hội Viên VIP 24 Tháng (Kim Cương 2 Năm)",
      nameEn: "24-Month Diamond VIP Membership",
      durationMonths: 24,
      durationLabel: "24 Tháng",
      price: 10500000,
      originalPrice: 14000000,
      category: "all_inclusive",
      badge: "Đẳng Cấp VIP",
      isPopular: false,
      benefits: [
        "Đặc quyền tối thượng 2 năm sử dụng toàn bộ tiện ích The Shine Luxury",
        "Bao gồm Gym, Yoga Master, GroupX, Hồ bơi nước ấm & Xông hơi đá muối",
        "Chính sách bảo lưu thẻ miễn phí lên tới 60 ngày",
        "Tặng 02 buổi tập riêng 1:1 cùng Huấn luyện viên thể hình cá nhân (PT)",
        "Bộ quà tặng hội viên VIP độc quyền The Shine Fitness & Yoga"
      ],
      notes: "Dành cho hội viên cam kết gắn bó lâu dài với chi phí tiết kiệm mỗi tháng chỉ ~437.000 VNĐ"
    },
    "48T": {
      name: "Thẻ Hội Viên Tri Ân 48 Tháng (Lifetime Elite 4 Năm)",
      nameEn: "48-Month Lifetime Elite Membership",
      durationMonths: 48,
      durationLabel: "48 Tháng",
      price: 18000000,
      originalPrice: 24000000,
      category: "special",
      badge: "Siêu Đặc Quyền",
      isPopular: false,
      benefits: [
        "Hội viên danh dự 4 năm trọn gói mọi dịch vụ cao cấp nhất",
        "Đặc quyền mang theo 01 bạn đồng hành vào cuối tuần",
        "Ưu tiên đăng ký lịch tập cùng Master Yoga & Huấn luyện viên trưởng",
        "Bảo lưu thẻ linh hoạt lên tới 120 ngày khi có kế hoạch công tác xa"
      ],
      notes: "Gói tập dài hạn cao cấp nhất trong cơ sở dữ liệu The Shine Fitness"
    }
  };

  const distinctPackages: GymPackage[] = Object.keys(distinctPackageDefinitions).map(code => {
    const def = distinctPackageDefinitions[code];
    const stat = packageMap[code];
    const memberCount = stat ? stat.count : 0;
    const pkgRevenue = stat ? stat.totalRevenue : 0;
    const actualPrice = stat && stat.price ? stat.price : def.price;

    return {
      id: `pkg_${code.toLowerCase()}`,
      code,
      name: def.name,
      nameEn: def.nameEn,
      category: def.category,
      price: actualPrice,
      originalPrice: def.originalPrice,
      durationMonths: def.durationMonths,
      durationLabel: def.durationLabel,
      benefits: def.benefits,
      isPopular: def.isPopular,
      isActive: true,
      badge: def.badge,
      notes: def.notes,
      memberCount,
      totalRevenue: pkgRevenue,
      ptSessionsIncluded: code === "24T" ? 2 : code === "12T" ? 1 : 0,
      extraServices: code === "12T" || code === "24T" || code === "48T" ? "Yoga, Sauna & Bơi lội" : "Gym & Sauna",
      updatedAt: new Date().toISOString()
    };
  });

  const packageDistribution: Record<string, { count: number; revenue: number; name: string }> = {};
  distinctPackages.forEach(p => {
    packageDistribution[p.code] = {
      count: p.memberCount || 0,
      revenue: p.totalRevenue || 0,
      name: p.name
    };
  });

  const topDistricts = Object.entries(districtCount)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const result: ExcelDataResult = {
    distinctPackages,
    customers,
    kpis: {
      totalCustomers: customers.length,
      activeMembers: activeCount,
      expiredMembers: expiredCount,
      churnedMembers: churnedCount,
      totalRevenue,
      averageRevenuePerMember: Math.round(totalRevenue / (customers.length || 1)),
      hadTrialCount,
      trialConvertedCount,
      conversionRate: hadTrialCount > 0 ? Number(((trialConvertedCount / hadTrialCount) * 100).toFixed(1)) : 100,
      packageDistribution,
      segmentDistribution: segmentCount,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        other: customers.length - maleCount - femaleCount
      },
      topDistricts
    }
  };

  cachedData = result;
  lastReadTime = Date.now();
  return result;
}
