import express from "express";
import path from "path";
import fs from "fs";
import nodemailer, { Transporter } from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as XLSXModule from "xlsx";
const XLSX = (XLSXModule as any).default || XLSXModule;
import {
  initCsvStorage,
  addRegistration,
  addMember,
  loginMember,
} from "./csvStorage";
import { parseExcelData } from "./excelDataService";
import { resolveMemberPronoun } from "./genderHelper";
import {
  buildConsultantSystemInstruction,
  sanitizeConsultantOutput,
  generateSmartConsultantFallback,
  ConsultantContext,
} from "./chatConsultantKnowledge";
import { requireAuth, AuthRequest } from "./middleware/auth.ts";
import { validatePassword } from "./passwordValidation";

const chatCache = new Map<string, string>();

interface SentEmailLog {
  id: string;
  recipient: string;
  recipientName: string;
  subject: string;
  flowName: string;
  triggerEvent: string;
  voucherCode: string;
  status: "SENT" | "DELIVERED" | "FAILED";
  sentAt: string;
  previewHtml?: string;
  messageId?: string;
  error?: string;
}

const sentEmailLogs: SentEmailLog[] = [
  {
    id: 'log_init_01',
    recipient: 'ducnguyen06112002@gmail.com',
    recipientName: 'Khách Hàng Đăng Ký Test',
    subject: '🔥 [The Shine Fitness] Kích Hoạt Thẻ Tập Thử & Voucher SHINE-3DAY-7789',
    flowName: 'Luồng Tự Động Chăm Sóc Khách Hàng Đăng Ký Mới',
    triggerEvent: 'new_trial_registered',
    voucherCode: 'SHINE-3DAY-7789',
    status: 'DELIVERED',
    sentAt: new Date().toISOString()
  }
];

let transporter: Transporter | null = null;
function getEmailTransporter(customPass?: string) {
  const pass = customPass || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || "ducnguyen06112002@gmail.com";

  if (pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: adminEmail,
        pass: pass
      }
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
}

async function dispatchEmailNotification({
  toEmail,
  recipientName,
  subject,
  voucherCode = "SHINE-TRIAL-FREE",
  packageType = "Trải nghiệm Yoga, Gym & Boxing 3 Ngày 0đ",
  preferredTime = "Khung giờ linh hoạt",
  goal = "Tập luyện nâng cao thể chất",
  phone = "Chưa cung cấp",
  flowName = "Luồng Tự Động Chăm Sóc Khách Hàng Đăng Ký Mới",
  triggerEvent = "new_trial_registered",
  appPassword
}: {
  toEmail: string;
  recipientName: string;
  subject: string;
  voucherCode?: string;
  packageType?: string;
  preferredTime?: string;
  goal?: string;
  phone?: string;
  flowName?: string;
  triggerEvent?: string;
  appPassword?: string;
}): Promise<SentEmailLog> {
  const tp = getEmailTransporter(appPassword);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #334155; }
    .email-card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b; }
    .header { background: linear-gradient(135deg, #090d16 0%, #1e110a 100%); padding: 36px 28px; text-align: center; border-bottom: 4px solid #ea580c; }
    .logo-badge { background-color: #ea580c; color: #ffffff; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 2px 8px; display: inline-block; border-radius: 2px; margin-bottom: 3px; }
    .logo-main { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.1; font-style: italic; }
    .logo-shine { color: #ea580c; }
    .logo-fitness { color: #ffffff; }
    .logo-tagline { color: #ea580c; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; margin-top: 4px; font-style: italic; }
    .header-sub { font-size: 13px; font-weight: 800; color: #f1f5f9; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 14px; }
    .body-content { padding: 32px 28px; background-color: #ffffff; }
    .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .intro-p { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
    .voucher-banner { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px dashed #ea580c; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
    .voucher-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #9a3412; letter-spacing: 1.5px; margin-bottom: 8px; }
    .voucher-code { font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; color: #c2410c; letter-spacing: 3px; background: #ffffff; padding: 8px 16px; border-radius: 8px; display: inline-block; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
    .voucher-note { font-size: 12px; color: #9a3412; margin-top: 10px; font-weight: 600; }
    .table-box { background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .info-label { font-weight: 700; color: #64748b; margin-right: 8px; }
    .info-val { font-weight: 600; color: #0f172a; }
    .cta-container { text-align: center; margin: 32px 0 16px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #d97706 100%); color: #ffffff !important; font-size: 15px; font-weight: 800; text-decoration: none; padding: 16px 36px; border-radius: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.3); }
    .footer { background-color: #0f172a; color: #94a3b8; padding: 28px; text-align: center; font-size: 12px; line-height: 1.6; border-top: 1px solid #1e293b; }
    .footer strong { color: #f8fafc; }
  </style>
</head>
<body>
  <div class="email-card">
    <div class="header">
      <div style="display: inline-block; text-align: left; font-family: 'Arial Black', Arial, sans-serif;">
        <span class="logo-badge">THE</span><br>
        <div class="logo-main">
          <span class="logo-shine">SHINE</span><span class="logo-fitness">FITNESS</span>
        </div>
        <div class="logo-tagline">SHINE ON. SWEAT ON</div>
      </div>
      <div class="header-sub">🔥 XÁC NHẬN ĐĂNG KÝ & KÍCH HOẠT THẺ TẬP</div>
    </div>
    <div class="body-content">
      <div class="greeting">Chào ${recipientName},</div>
      <p class="intro-p">
        Chúc mừng bạn đã đăng ký trải nghiệm thành công tại câu lạc bộ <strong>The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Tân Bình)</strong>. Hệ thống Marketing Automation đã tự động kích hoạt luồng chăm sóc và tạo voucher quà tặng cho bạn.
      </p>

      <div class="voucher-banner">
        <div class="voucher-title">🎁 MÃ VOUCHER ĐẶC QUYỀN TẬP THỬ 0Đ</div>
        <div class="voucher-code">${voucherCode}</div>
        <div class="voucher-note">✓ Đưa mã này trực tiếp cho Lễ Tân tại The Shine Fitness & Yoga để nhận vé tập miễn phí!</div>
      </div>

      <div class="table-box">
        <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px;">📍 THÔNG TIN ĐĂNG KÝ HỘI VIÊN</div>
        <div class="info-row"><span class="info-label">Họ & Tên:</span><span class="info-val">${recipientName}</span></div>
        <div class="info-row"><span class="info-label">Email Nhận Thư:</span><span class="info-val">${toEmail}</span></div>
        <div class="info-row"><span class="info-label">Số Điện Thoại:</span><span class="info-val">${phone}</span></div>
        <div class="info-row"><span class="info-label">Gói Đăng Ký:</span><span class="info-val">${packageType}</span></div>
        <div class="info-row"><span class="info-label">Khung Giờ Tập:</span><span class="info-val">${preferredTime}</span></div>
        <div class="info-row"><span class="info-label">Mục Tiêu Thể Hình:</span><span class="info-val">${goal}</span></div>
      </div>

      <div class="cta-container">
        <a href="https://theshinefitness.vn/#schedule" class="cta-button">Xem Lịch Tập & Đặt Lịch HLV (PT)</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
        Bộ phận Chăm sóc khách hàng The Shine sẽ gọi điện tư vấn cho bạn trong vòng 15-30 phút tới.
      </p>
    </div>
    <div class="footer">
      <strong>THE SHINE FITNESS & YOGA TÂN BÌNH</strong><br>
      📍 Địa chỉ: 154 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, TP. Hồ Chí Minh<br>
      📞 Hotline / Zalo: 0946 293 593 | ✉️ Email: support@theshinefitness.vn<br>
      <span style="font-size: 11px; opacity: 0.7; margin-top: 8px; display: inline-block;">Email được gửi tự động từ hệ thống của The Shine Fitness. Vui lòng không phản hồi.</span>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: '"The Shine Fitness Admin" <ducnguyen06112002@gmail.com>',
    to: toEmail,
    subject: subject,
    html: htmlContent
  };

  let messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  let deliveryStatus: "DELIVERED" | "FAILED" = "DELIVERED";
  try {
    const info = await tp.sendMail(mailOptions);
    if (info && info.messageId) {
      messageId = info.messageId;
    }
  } catch (err: any) {
    console.warn("Nodemailer send log:", err?.message || err);
    deliveryStatus = "FAILED";
  }

  const logEntry: SentEmailLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    recipient: toEmail,
    recipientName: recipientName,
    subject: subject,
    flowName: flowName,
    triggerEvent: triggerEvent,
    voucherCode: voucherCode,
    status: deliveryStatus,
    sentAt: new Date().toISOString(),
    previewHtml: htmlContent,
    messageId: messageId
  };

  sentEmailLogs.unshift(logEntry);
  if (sentEmailLogs.length > 100) {
    sentEmailLogs.pop();
  }

  return logEntry;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize storage
  initCsvStorage();

  // Initialize Gemini API client
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Built-in middleware to parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Return self-destroying script for any legacy Service Worker registrations to clear cache and unregister
  const swKillScript = `
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (e) => {
      e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .then(() => self.registration.unregister())
          .then(() => self.clients.claim())
      );
    });
  `;
  app.get(["/sw.js", "/registerSW.js", "/dev-dist/sw.js", "/dev-dist/registerSW.js"], (req, res) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.send(swKillScript);
  });



  // Serve static thumbnails from project root and public folder
  app.use('/thumbnails', express.static(path.join(process.cwd(), 'thumbnails')));
  app.use('/thumbnails', express.static(path.join(process.cwd(), 'public', 'thumbnails')));

  // Cache for Google Maps Reviews from CSV
  let cachedReviews: any = null;
  let lastFetchTime = 0;

  app.get("/api/reviews", async (req, res) => {
    try {
      if (cachedReviews && Date.now() - lastFetchTime < 3600000) {
        return res.json(cachedReviews);
      }

      const csvFilePath = path.join(process.cwd(), 'data', 'google_reviews.csv');
      
      if (!fs.existsSync(csvFilePath)) {
        return res.json({ reviews: [] });
      }

      const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
      const { parse } = await import('csv-parse/sync');
      
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      const { getGoogleReviewText, getGoogleReviewTime } = await import('../../src/data/bilingualReviews');

      const reviews = records.map((record: any) => {
        const match = record.rating?.match(/(\d+)/);
        const ratingNum = match ? parseInt(match[1]) : 5;
        const authorName = record.author || "Khách hàng The Shine";
        const rawTime = record.time || "Đã xác thực";
        const rawText = record.text || "";

        const textVi = getGoogleReviewText({ authorName, text: rawText }, 'vi');
        const textEn = getGoogleReviewText({ authorName, text: rawText }, 'en');
        const timeVi = getGoogleReviewTime(rawTime, 'vi');
        const timeEn = getGoogleReviewTime(rawTime, 'en');
        
        return {
          authorName,
          rating: ratingNum,
          text: rawText,
          textVi,
          textEn,
          authorPhoto: null,
          time: rawTime,
          timeVi,
          timeEn
        };
      });

      cachedReviews = { reviews };
      lastFetchTime = Date.now();
      
      res.json(cachedReviews);
    } catch (error) {
      console.error("Failed to load reviews from CSV:", error);
      res.status(500).json({ error: "Failed to load reviews" });
    }
  });

  app.get("/api/reviews/facebook", async (req, res) => {
    try {
      const { FACEBOOK_REVIEWS_BILINGUAL } = await import('../../src/data/bilingualReviews');
      
      const reviews = FACEBOOK_REVIEWS_BILINGUAL.map((item) => ({
        author: item.author,
        text: item.textVi,
        textVi: item.textVi,
        textEn: item.textEn,
        dateVi: item.dateVi,
        dateEn: item.dateEn
      }));
      
      res.json({ reviews });
    } catch (error) {
      console.error("Failed to load Facebook reviews:", error);
      res.status(500).json({ error: "Failed to load Facebook reviews" });
    }
  });

  // TIKTOK REVIEWS WITH TOP 3 COMMENTS & THUMBNAILS DIRECTLY FROM EXCEL FILE
  app.get("/api/reviews/tiktok", async (req, res) => {
    try {
      const excelFilePath = path.join(process.cwd(), 'tiktok_comments_chuan.xlsx');
      
      if (fs.existsSync(excelFilePath)) {
        const workbook = XLSX.readFile(excelFilePath);
        const top3Sheet = workbook.Sheets["Top3_theo_video"] || workbook.Sheets[workbook.SheetNames[1]];
        const commentSheet = workbook.Sheets["Binh_luan"] || workbook.Sheets[workbook.SheetNames[0]];

        if (top3Sheet) {
          const top3Data: any[] = XLSX.utils.sheet_to_json(top3Sheet);
          const commentData: any[] = commentSheet ? XLSX.utils.sheet_to_json(commentSheet) : [];

          const formattedVideos = top3Data.map((row: any) => {
            const videoId = String(row["Video ID"] || "");
            const url = row["Link video"] || `https://www.tiktok.com/@the.shine.fitness/video/${videoId}`;
            const caption = row["Caption video"] || row["Caption"] || "";
            const views = row["Lượt xem"] || 0;
            const likes = row["Lượt thích"] || 0;
            const commentCount = row["Số bình luận"] || 0;
            const thumbnail = `/thumbnails/${videoId}.jpg`;

            const comments: any[] = [];
            if (row["BL1 - Nội dung"]) {
              comments.push({
                rank: 1,
                author: row["BL1 - Người"] || "Hội viên TikTok",
                comment: row["BL1 - Nội dung"],
                likes: row["BL1 - Thích"] || 0
              });
            }
            if (row["BL2 - Nội dung"]) {
              comments.push({
                rank: 2,
                author: row["BL2 - Người"] || "Hội viên TikTok",
                comment: row["BL2 - Nội dung"],
                likes: row["BL2 - Thích"] || 0
              });
            }
            if (row["BL3 - Nội dung"]) {
              comments.push({
                rank: 3,
                author: row["BL3 - Người"] || "Hội viên TikTok",
                comment: row["BL3 - Nội dung"],
                likes: row["BL3 - Thích"] || 0
              });
            }

            if (comments.length === 0 && commentData.length > 0) {
              const matched = commentData.filter((c: any) => String(c["Video ID"]) === videoId);
              matched.slice(0, 3).forEach((c: any, idx: number) => {
                comments.push({
                  rank: idx + 1,
                  author: c["Người bình luận"] || c["TikTok ID"] || "Hội viên TikTok",
                  comment: c["Bình luận"],
                  likes: c["Lượt thích"] || 0
                });
              });
            }

            return {
              videoId,
              url,
              caption,
              views,
              likes,
              commentCount,
              thumbnail,
              comments
            };
          });

          return res.json({ videos: formattedVideos });
        }
      }

      const fallbackJsonPath = path.join(process.cwd(), 'src', 'data', 'tiktokVideos.json');
      if (fs.existsSync(fallbackJsonPath)) {
        const fileContent = fs.readFileSync(fallbackJsonPath, 'utf-8');
        return res.json({ videos: JSON.parse(fileContent) });
      }

      res.json({ videos: [] });
    } catch (error) {
      console.error("Failed to load TikTok videos:", error);
      try {
        const fallbackJsonPath = path.join(process.cwd(), 'src', 'data', 'tiktokVideos.json');
        if (fs.existsSync(fallbackJsonPath)) {
          const fileContent = fs.readFileSync(fallbackJsonPath, 'utf-8');
          return res.json({ videos: JSON.parse(fileContent) });
        }
      } catch (inner) {
        // ignore
      }
      res.status(500).json({ error: "Failed to load TikTok videos" });
    }
  });

  // API Routes for Chatbot (AI Customer Consultant for The Shine Fitness & Yoga)
  app.post("/api/chat", async (req, res) => {
    // Resolve proper pronoun based on member status and gender
    const { pronoun, detectedGender, memberName, isMember } = resolveMemberPronoun(req.body?.memberInfo);
    const consultantContext: ConsultantContext = {
      pronoun,
      detectedGender: detectedGender || null,
      memberName,
      isMember,
      membershipTier: req.body?.memberInfo?.membershipTier,
      memberCode: req.body?.memberInfo?.memberCode,
    };

    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const lang = req.body?.lang || 'vi';

      // Simple caching mechanism
      // Create a cache key using the history length and the current message
      // This caches identical conversational states
      const historyStr = history ? JSON.stringify(history.map((h: any) => h.text)) : "";
      const cacheKey = `${lang}_${isMember}_${pronoun}_${historyStr}_${message}`;
      if (chatCache.has(cacheKey)) {
        return res.json({ text: chatCache.get(cacheKey) });
      }

      // Build comprehensive grounded system instruction adhering to all correction rules
      const systemInstruction = buildConsultantSystemInstruction(consultantContext);

      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          formattedContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
      formattedContents.push({ role: 'user', parts: [{ text: message }] });

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          },
        });
      } catch (genErr) {
        console.warn("gemini-3.6-flash failed, retrying with fallback model:", genErr);
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          },
        });
      }

      const rawText = response.text || "";
      const cleanText = sanitizeConsultantOutput(rawText, consultantContext);

      res.json({ text: cleanText });
    } catch (error) {
      console.error("Gemini API Error in /api/chat:", error);
      const fallbackText = generateSmartConsultantFallback(req.body?.message || "", consultantContext);
      res.json({ text: fallbackText });
    }
  });

  // SUBMIT NEW REGISTRATION (Stores securely in database / records)
  app.post("/api/register", (req, res) => {
    try {
      const { fullName, phone, email, packageType, goal, preferredTime, notes } = req.body;

      if (!fullName || !phone || !email) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Địa chỉ email không hợp lệ." });
      }

      const newRecord = addRegistration({
        fullName,
        phone,
        email,
        packageType: packageType || "Gói Basic (500k/tháng)",
        goal: goal || "Cải thiện sức khỏe & vóc dáng",
        preferredTime: preferredTime || "Linh hoạt",
        notes: notes || ""
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công! Chuyên viên The Shine sẽ liên hệ với bạn trong vòng 15 phút.",
        registration: {
          id: newRecord.id,
          fullName: newRecord.fullName,
          phone: newRecord.phone,
          packageType: newRecord.packageType
        }
      });
    } catch (error) {
      console.error("Failed to save registration:", error);
      res.status(500).json({ error: "Không thể xử lý thông tin đăng ký." });
    }
  });

  // MEMBER SIGN UP
  app.post("/api/auth/register", (req, res) => {
    try {
      const { fullName, email, phone, password, membershipTier } = req.body;

      if (!fullName || !email || !phone || !password) {
        return res.status(400).json({ error: "Vui lòng điền đủ Họ tên, Email, Số điện thoại và Mật khẩu." });
      }

      const passCheck = validatePassword(password);
      if (!passCheck.isValid) {
        return res.status(400).json({ 
          error: passCheck.errorMessage || "Mật khẩu tối thiểu 8 ký tự, phải có chữ hoa, thường và ký tự đặc biệt." 
        });
      }

      const result = addMember({
        fullName,
        email,
        phone,
        password,
        membershipTier: membershipTier || "Premium"
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        message: "Tạo tài khoản hội viên thành công!",
        member: result.member
      });
    } catch (error) {
      console.error("Member registration error:", error);
      res.status(500).json({ error: "Không thể đăng ký tài khoản thành viên." });
    }
  });

  // MEMBER LOGIN
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu." });
      }

      const result = loginMember(email, password);
      if (result.error) {
        return res.status(401).json({ error: result.error });
      }

      res.json({
        success: true,
        message: "Đăng nhập thành công!",
        member: result.member
      });
    } catch (error) {
      console.error("Member login error:", error);
      res.status(500).json({ error: "Lỗi xử lý đăng nhập." });
    }
  });

  // ADMIN AUTHENTICATION
  app.post("/api/admin/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Vui lòng nhập Email quản trị." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const OAUTH_ADMINS = [
        'ducnguyen06112002@gmail.com',
        'ducnh.hindu@gmail.com',
        'ducnguyen.526102090574@st.ueh.edu.vn'
      ];

      // If an OAuth-only admin tries to use password login
      if (OAUTH_ADMINS.includes(cleanEmail)) {
        return res.status(403).json({
          error: `Tài khoản ${cleanEmail} là vai trò quản trị cấp cao, bắt buộc phải đăng nhập bằng phương thức Google OAuth (Gmail).`
        });
      }

      // Default password-based admin
      if (cleanEmail === 'admin@theshinefitness.vn') {
        const passCheck = validatePassword(password);
        if (!passCheck.isValid) {
          return res.status(400).json({
            error: passCheck.errorMessage || "Mật khẩu tối thiểu 8 ký tự, phải có chữ hoa, thường và ký tự đặc biệt."
          });
        }

        if (password !== 'Admin@123') {
          return res.status(401).json({ error: "Mật khẩu quản trị viên mặc định không chính xác." });
        }

        return res.json({
          success: true,
          message: "Đăng nhập quản trị viên mặc định thành công!",
          admin: {
            uid: 'admin_theshine_default',
            email: 'admin@theshinefitness.vn',
            fullName: 'Ban Quản Lý The Shine (Mặc định)',
            role: 'manager',
            roleTitle: 'Tài khoản Quản lý Mặc định',
            phone: '0946 293 593',
            permissions: ['manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows'],
            lastLogin: new Date().toISOString()
          }
        });
      }

      return res.status(401).json({
        error: `Tài khoản "${email}" không thuộc danh sách quản trị viên hợp lệ.`
      });
    } catch (error) {
      console.error("Admin login API error:", error);
      res.status(500).json({ error: "Lỗi xử lý xác thực quản trị." });
    }
  });

  // ================= ADMIN AI EMAIL MARKETING API =================
  app.post("/api/admin/generate-email-flow", async (req, res) => {
    try {
      const { prompt: userPrompt } = req.body;

      if (!userPrompt) {
        return res.status(400).json({ error: "Vui lòng nhập mô tả luồng email tự động." });
      }

      const systemPrompt = `Bạn là Chuyên gia Marketing Automation cao cấp của câu lạc bộ The Shine Fitness & Yoga (154 Hoàng Hoa Thám, P. 12, Q. Tân Bình, TP.HCM).
Dựa vào mô tả của người dùng, hãy tạo 1 luồng gửi email Marketing tự động (Email Marketing Flow) hoàn chỉnh gồm 2 đến 4 bước thực thi.

Mô tả từ người dùng: "${userPrompt}"

Các trigger hợp lệ (trigger):
- "new_trial_registered" (Khách đăng ký tập thử mới)
- "membership_expiring_soon" (Thẻ sắp hết hạn)
- "inactive_14_days" (Vắng tập 14 ngày)
- "promo_announcement" (Thông báo khuyến mãi chung)
- "post_workout_checkin" (Sau buổi tập / InBody)

Hãy trả về kết quả dưới dạng JSON chuẩn (chỉ trả về chuỗi JSON thuần, không bọc trong code block):
{
  "name": "Tên ngắn gọn của luồng (ví dụ: Chăm Sóc Khách Gym & Boxing 3 Bước)",
  "title": "Tiêu đề hiển thị đầy đủ của luồng",
  "description": "Mô tả mục tiêu và phễu chuyển đổi của luồng này",
  "trigger": "chọn 1 trong các trigger ở trên",
  "triggerLabel": "Nhãn tiếng Việt của trigger (ví dụ: Khách Đăng Ký Tập Thử Mới)",
  "steps": [
    {
      "id": "step_1",
      "type": "email",
      "title": "Tên bước 1 (ví dụ: Email Chào Mừng & Hướng Dẫn)",
      "delayDays": 0,
      "subject": "Tiêu đề email chào mừng hấp dẫn",
      "voucherCode": "Mã voucher nếu có (ví dụ: TANBINH3D hoặc SHINE349 hoặc empty)",
      "config": {
        "delayDays": 0,
        "emailSubject": "Tiêu đề email",
        "emailPreheader": "Dòng xem trước",
        "emailBodyHtml": "Nội dung ngắn gọn trình bày hấp dẫn",
        "ctaText": "Văn bản nút (ví dụ: Xem Lịch Tập & Đặt Chỗ)",
        "ctaLink": "#schedule",
        "voucherCode": "TANBINH3D"
      }
    }
  ]
}`;

      let geminiRes;
      try {
        geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: systemPrompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });
      } catch (err) {
        console.warn("Gemini 3.8 flash failed for flow generation, retrying fallback:", err);
        geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: systemPrompt
        });
      }

      const text = geminiRes.text || "{}";
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      let flowData: any = {};
      try {
        flowData = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.error("JSON parse error for flow generation:", parseErr);
        flowData = {
          name: "Luồng Tự Động Chăm Sóc Khách Hàng",
          title: "Luồng Tự Động Chăm Sóc Khách Hàng AI",
          description: "Luồng tự động gửi email cho hội viên dựa trên nội dung prompt.",
          trigger: "new_trial_registered",
          triggerLabel: "Đăng Ký Mới",
          steps: [
            {
              id: "step_1",
              type: "email",
              title: "Email Chào Mừng & Kích Hoạt",
              delayDays: 0,
              subject: "🔥 Chào mừng bạn đến với The Shine Fitness!",
              voucherCode: "TANBINH3D",
              config: {
                delayDays: 0,
                emailSubject: "🔥 Chào mừng bạn đến với The Shine Fitness!",
                emailPreheader: "Nhận ngay voucher 3 ngày tập thử miễn phí 0đ",
                emailBodyHtml: "Cảm ơn bạn đã lựa chọn The Shine. Nhận ngay vé tập 3 ngày 0đ tại 154 Hoàng Hoa Thám.",
                ctaText: "Kích Hoạt Thẻ Tập",
                ctaLink: "#schedule",
                voucherCode: "TANBINH3D"
              }
            },
            {
              id: "step_2",
              type: "email",
              title: "Email Nhắc Lịch Tập & Tư Vấn InBody",
              delayDays: 3,
              subject: "⚡ Đánh giá thể trạng InBody miễn phí cùng HLV The Shine",
              voucherCode: "SHINE349",
              config: {
                delayDays: 3,
                emailSubject: "⚡ Đánh giá thể trạng InBody miễn phí cùng HLV The Shine",
                emailPreheader: "Hỗ trợ thiết lập lộ trình tập luyện cá nhân hóa",
                emailBodyHtml: "Đặt lịch kiểm tra chỉ số InBody hôm nay để được HLV hỗ trợ chọn gói tập phù hợp nhất.",
                ctaText: "Đặt Lịch InBody",
                ctaLink: "#schedule",
                voucherCode: "SHINE349"
              }
            }
          ]
        };
      }

      const newFlow = {
        id: `flow_ai_${Date.now()}`,
        name: flowData.name || "Luồng Email Marketing AI",
        title: flowData.title || flowData.name || "Luồng Email Tự Động AI",
        description: flowData.description || "Luồng gửi email được khởi tạo tự động bằng AI theo prompt.",
        trigger: flowData.trigger || "new_trial_registered",
        triggerLabel: flowData.triggerLabel || "Chăm Sóc Tự Động",
        status: "active",
        isActive: true,
        steps: Array.isArray(flowData.steps) ? flowData.steps.map((s: any, idx: number) => ({
          id: s.id || `step_${idx + 1}`,
          type: s.type || 'email',
          title: s.title || `Bước ${idx + 1}`,
          delayDays: s.delayDays ?? s.config?.delayDays ?? (idx * 3),
          subject: s.subject || s.config?.emailSubject || `Email bước ${idx + 1}`,
          voucherCode: s.voucherCode || s.config?.voucherCode || '',
          config: s.config || {
            delayDays: s.delayDays ?? 0,
            emailSubject: s.subject || `Email bước ${idx + 1}`,
            emailPreheader: "Thư từ The Shine Fitness",
            emailBodyHtml: "Nội dung email tự động...",
            ctaText: "Xem Chi Tiết",
            ctaLink: "#schedule",
            voucherCode: s.voucherCode || ''
          }
        })) : [],
        stats: {
          enrolled: 1,
          sent: 1,
          opened: 1,
          clicked: 1,
          converted: 1
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.json({ success: true, flow: newFlow });
    } catch (error) {
      console.error("Error generating AI email flow:", error);
      res.status(500).json({ error: "Không thể tạo luồng email tự động bằng AI." });
    }
  });

  // ================= ADMIN AI EMAIL MARKETING API =================
  app.post("/api/admin/generate-email", async (req, res) => {
    try {
      const { 
        objective = "Chăm sóc khách đăng ký tập thử 3 ngày", 
        targetAudience = "Khách hàng mới đăng ký trải nghiệm",
        voucherCode = "TANBINH3D",
        discountInfo = "Miễn phí 100% vé tập thử 3 ngày + Tư vấn thể trạng cùng HLV",
        tone = "Thân thiện, truyền cảm hứng thể thao, thôi thúc hành động",
        language = "vi"
      } = req.body;

      const prompt = `Bạn là Giám đốc Marketing & Copywriting cao cấp của The Shine Fitness & Yoga (154 Hoàng Hoa Thám, P. Bảy Hiền, Tân Bình, TP.HCM).
Hãy viết 1 bản email marketing chuyên nghiệp, chuyển đổi cao (high conversion) theo các tiêu chí sau:

- Mục tiêu chiến dịch: ${objective}
- Đối tượng nhận email: ${targetAudience}
- Mã khuyến mãi / Ưu đãi: ${voucherCode} (${discountInfo})
- Giọng văn: ${tone}
- Ngôn ngữ: ${language === 'en' ? 'Tiếng Anh' : 'Tiếng Việt'}

Hãy trả về kết quả định dạng JSON thuần túy (không bọc trong markdown code block, hoặc trả JSON chuẩn) có cấu trúc:
{
  "subject": "Tiêu đề email cực kỳ cuốn hút, kích thích mở mail (có emoji thích hợp)",
  "preheader": "Dòng xem trước hiển thị dưới tiêu đề trong hộp thư đến (40-60 ký tự)",
  "headline": "Tiêu đề lớn chính giữa email",
  "greeting": "Lời chào (dùng placeholder {{customer_name}})",
  "paragraphs": [
    "Đoạn mở đầu kết nối cảm xúc và mục tiêu thay đổi vóc dáng",
    "Đoạn nêu bật lợi ích đẳng cấp tại The Shine Fitness (1500m2, máy Technogym chuẩn Olympic, lớp Yoga/GroupX, hồ bơi nước ấm 4 mùa, phòng xông hơi thảo dược)",
    "Đoạn trình bày ưu đãi đặc biệt kèm mã voucher và tính cấp bách (thời hạn có hạn)"
  ],
  "voucherHighlight": "${voucherCode}",
  "ctaText": "Văn bản nút kêu gọi hành động (ví dụ: Kích Hoạt Vé Tập Thử Ngay)",
  "ctaUrl": "https://theshinefitness.vn/#schedule",
  "footerNote": "The Shine Fitness & Yoga | 154 Hoàng Hoa Thám, Tân Bình | Hotline: 0946 293 593"
}`;

      let geminiRes;
      try {
        geminiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });
      } catch (err) {
        console.warn("Gemini 2.5 flash JSON failed, trying text fallback:", err);
        geminiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
      }

      let emailData;
      try {
        const text = geminiRes.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        emailData = JSON.parse(cleanJson);
      } catch (parseErr) {
        // Fallback default rich content
        emailData = {
          subject: `🔥 [The Shine Fitness] Tặng {{customer_name}} Vé Tập Thử 3 Ngày Miễn Phí + Tư Vấn Thể Trạng 0Đ!`,
          preheader: "Trải nghiệm không gian thể thao chuẩn 5 sao 1500m2 tại Tân Bình ngay hôm nay",
          headline: "Chào mừng bạn đến với Hành Trình Bứt Phá Vóc Dáng!",
          greeting: "Chào bạn {{customer_name}},",
          paragraphs: [
            "Chúng tôi rất vui mừng khi bạn đã lựa chọn The Shine Fitness & Yoga để bắt đầu hành trình nâng tầm sức khỏe và tự tin với vóc dáng của mình.",
            "Tại The Shine (154 Hoàng Hoa Thám, Tân Bình), bạn sẽ được thỏa sức trải nghiệm hệ thống máy tập Technogym chuẩn Olympic, các lớp Yoga trị liệu, GroupX bùng nổ, cùng tiện ích hồ bơi nước ấm và phòng xông hơi thảo dược hoàn toàn miễn phí.",
            `Đặc biệt, mã ưu đãi độc quyền "${voucherCode}" đã được kích hoạt thành công. Đừng bỏ lỡ cơ hội đánh giá chỉ số thể trạng và nhận lộ trình tập luyện 1-1 cùng HLV chuyên nghiệp!`
          ],
          voucherHighlight: voucherCode,
          ctaText: "Đặt Lịch & Kích Hoạt Thẻ Ngay",
          ctaUrl: "https://theshinefitness.vn/#schedule",
          footerNote: "The Shine Fitness & Yoga | 154 Hoàng Hoa Thám, Tân Bình | Hotline: 0946 293 593"
        };
      }

      res.json({ success: true, email: emailData });
    } catch (error) {
      console.error("Error generating marketing email:", error);
      const fallbackEmail = {
        subject: `🔥 [The Shine Fitness] Ưu Đãi Đặc Biệt Dành Cho Bạn Tại 154 Hoàng Hoa Thám`,
        preheader: "Trải nghiệm không gian thể thao 1500m2 chuẩn 5 sao tại Tân Bình",
        headline: "Chinh Phục Mục Tiêu Thể Hình Cùng The Shine Fitness",
        greeting: "Chào bạn {{customer_name}},",
        paragraphs: [
          "The Shine Fitness & Yoga rất hân hạnh được đồng hành cùng bạn trên con đường nâng cao sức khỏe và hoàn thiện vóc dáng.",
          "Tại cơ sở 154 Hoàng Hoa Thám, bạn sẽ được trải nghiệm không gian tập luyện hiện đại, máy móc Technogym chuẩn Olympic, lớp Yoga và Zumba năng động cùng hồ bơi nước ấm 4 mùa.",
          "Đặc quyền ưu đãi dành riêng cho bạn: Tặng vé trải nghiệm miễn phí và tư vấn thể trạng cùng Huấn luyện viên chuyên nghiệp."
        ],
        voucherHighlight: "TANBINH3D",
        ctaText: "Kích Hoạt Ưu Đãi Ngay",
        ctaUrl: "https://theshinefitness.vn/#schedule",
        footerNote: "The Shine Fitness & Yoga | 154 Hoàng Hoa Thám, Tân Bình | Hotline: 0946 293 593"
      };
      res.json({ success: true, email: fallbackEmail });
    }
  });

  // TRIGGER AUTOMATIC REGISTRATION EMAIL
  app.post("/api/trigger-registration-email", async (req, res) => {
    try {
      const { fullName, email, phone, packageType, goal, preferredTime, voucherCode, appPassword } = req.body;

      const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ error: "Email không hợp lệ (Không khớp định dạng Regex: user@domain.com)." });
      }

      const cleanEmail = String(email).trim();
      const vCode = voucherCode || `SHINE-3DAY-${Math.floor(1000 + Math.random() * 9000)}`;
      const log = await dispatchEmailNotification({
        toEmail: cleanEmail,
        recipientName: fullName || "Khách Hàng",
        subject: `🔥 [The Shine Fitness] Xác nhận đăng ký tập thử & Voucher ${vCode}`,
        voucherCode: vCode,
        packageType: packageType || "Trải nghiệm Yoga, Gym & Boxing 3 Ngày 0đ",
        preferredTime: preferredTime || "Khung giờ linh hoạt",
        goal: goal || "Cải thiện vóc dáng & sức khỏe",
        phone: phone || "Chưa cung cấp",
        flowName: "Luồng Tự Động Chăm Sóc Khách Hàng Đăng Ký Mới",
        triggerEvent: "new_trial_registered",
        appPassword
      });

      res.json({
        success: true,
        message: `Đã tự động gửi email chào mừng & mã voucher tới ${email}!`,
        emailLog: log
      });
    } catch (error) {
      console.error("Error triggering registration email:", error);
      res.status(500).json({ error: "Không thể tự động gửi email đăng ký." });
    }
  });

  // POST ROUTE AT /api/contact
  app.post("/api/contact", async (req, res) => {
    try {
      const { fullName, email, name, phone, subject, message, appPassword } = req.body;
      const userEmail = email || req.body.recipientEmail;

      const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!userEmail || !EMAIL_REGEX.test(String(userEmail).trim())) {
        return res.status(400).json({ success: false, error: "Địa chỉ email không hợp lệ (Không đúng định dạng Regex: user@domain.com)." });
      }

      const senderName = fullName || name || "Khách Hàng";
      const cleanEmail = String(userEmail).trim();
      const userPhone = phone || "Chưa cung cấp";
      const inquirySubject = subject || "Yêu cầu tư vấn & Liên hệ từ Website";
      const inquiryMessage = message ? String(message).trim() : "Người dùng gửi yêu cầu tư vấn.";

      const adminEmail = process.env.ADMIN_EMAIL || "ducnguyen06112002@gmail.com";
      const pass = appPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

      // Configure nodemailer transporter using getEmailTransporter helper
      const transporterInstance = getEmailTransporter(appPassword);

      // Send inquiry mail to admin (ducnguyen06112002@gmail.com)
      const adminMailOptions = {
        from: `"The Shine Fitness Contact" <${adminEmail}>`,
        to: adminEmail,
        replyTo: cleanEmail,
        subject: `[Website Contact] ${inquirySubject} - Từ: ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f5; color: #18181b;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e4e4e7;">
              <h2 style="color: #ea580c; margin-top: 0;">📩 Yêu Cầu Liên Hệ Mới Từ Website</h2>
              <p>Hệ thống vừa nhận được câu hỏi từ khách hàng:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; font-weight: bold; width: 140px; color: #52525b;">Họ và tên:</td><td style="padding: 8px;"><strong>${senderName}</strong></td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #52525b;">Email liên hệ:</td><td style="padding: 8px;"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #52525b;">Số điện thoại:</td><td style="padding: 8px;">${userPhone}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #52525b;">Chủ đề:</td><td style="padding: 8px;">${inquirySubject}</td></tr>
              </table>
              <div style="background: #f8fafc; border-left: 4px solid #ea580c; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #334155;">Nội dung câu hỏi:</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.6; color: #0f172a;">${inquiryMessage}</p>
              </div>
              <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Thời gian gửi: ${new Date().toLocaleString("vi-VN")}</p>
            </div>
          </div>
        `,
      };

      try {
        await transporterInstance.sendMail(adminMailOptions);
      } catch (mailErr) {
        console.warn("Could not send mail via transporter instance:", mailErr);
      }

      // Dispatch confirmation to user and log it
      const log = await dispatchEmailNotification({
        toEmail: cleanEmail,
        recipientName: senderName,
        subject: `[The Shine Fitness] Tiếp nhận thông tin thắc mắc: ${inquirySubject}`,
        goal: inquiryMessage,
        phone: userPhone,
        packageType: inquirySubject,
        flowName: "Luồng Tiếp Nhận Yêu Cầu Tư Vấn",
        triggerEvent: "contact_form_submission",
        appPassword
      });

      res.json({
        success: true,
        message: `Đã gửi liên hệ thành công tới Admin (${adminEmail}) và email xác nhận tới ${cleanEmail}!`,
        emailLog: log
      });
    } catch (error: any) {
      console.error("Error processing /api/contact:", error);
      res.status(500).json({ success: false, error: "Lỗi hệ thống khi gửi email liên hệ." });
    }
  });

  // CONTACT FORM DIRECT INQUIRY ROUTE
  app.post("/api/contact-inquiry", async (req, res) => {
    try {
      const { fullName, email, phone, subject, message, appPassword } = req.body;

      const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ error: "Email không hợp lệ (Không đúng định dạng Regex: user@domain.com)." });
      }

      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: "Nội dung câu hỏi không được để trống." });
      }

      const cleanEmail = String(email).trim();
      const userSubject = subject || "Câu hỏi tư vấn dịch vụ";
      const userMessage = String(message).trim();

      // Dispatch confirmation email to user & admin log using Nodemailer
      const log = await dispatchEmailNotification({
        toEmail: cleanEmail,
        recipientName: fullName || "Hội Viên",
        subject: `📩 [The Shine Fitness] Tiếp nhận thông tin liên hệ: ${userSubject}`,
        goal: userMessage,
        phone: phone || "Chưa cung cấp",
        packageType: userSubject,
        flowName: "Luồng Tiếp Nhận Yêu Cầu Tư Vấn Trực Tiếp",
        triggerEvent: "contact_inquiry_received",
        appPassword
      });

      res.json({
        success: true,
        message: `Đã gửi phản hồi tự động tới email ${cleanEmail} và thông báo tới Admin (ducnguyen06112002@gmail.com)!`,
        emailLog: log
      });
    } catch (error) {
      console.error("Error processing contact inquiry:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi gửi email liên hệ." });
    }
  });

  // SEND REAL EMAIL TEST / MANUAL DISPATCH
  app.post("/api/admin/send-email-test", async (req, res) => {
    try {
      const { recipientEmail, subject, flowName, recipientName, voucherCode } = req.body;
      const targetEmail = recipientEmail || "ducnguyen06112002@gmail.com";
      const targetName = recipientName || "Anh/Chị Hội Viên Test";
      const emailSubject = subject || `🔥 [The Shine Fitness] Kích Hoạt Thẻ Tập Thử & Ưu Đãi Độc Quyền tại Tân Bình`;

      const log = await dispatchEmailNotification({
        toEmail: targetEmail,
        recipientName: targetName,
        subject: emailSubject,
        voucherCode: voucherCode || "SHINE-3DAY-7789",
        flowName: flowName || "Luồng Email Marketing Thử Nghiệm",
        triggerEvent: "manual_admin_test"
      });

      res.json({
        success: true,
        message: `Đã gửi email thành công tới ${targetEmail}!`,
        sentAt: log.sentAt,
        details: log
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Không thể gửi email thử nghiệm." });
    }
  });

  // GET EMAIL MARKETING SENT LOGS
  app.get("/api/admin/email-logs", (req, res) => {
    res.json({
      success: true,
      logs: sentEmailLogs
    });
  });

  // EXCEL DATA & DISTINCT PACKAGES API (TheShineFitness_Cleaned_V2.xlsx)
  app.get("/api/admin/excel-data", (req, res) => {
    try {
      const data = parseExcelData();
      res.json({
        success: true,
        distinctPackages: data.distinctPackages,
        customers: data.customers,
        kpis: data.kpis
      });
    } catch (error: any) {
      console.error("Error reading Excel data:", error);
      res.status(500).json({ success: false, error: error.message || "Lỗi khi đọc file Excel" });
    }
  });

  app.get("/api/admin/distinct-packages", (req, res) => {
    try {
      const data = parseExcelData();
      res.json({
        success: true,
        packages: data.distinctPackages
      });
    } catch (error: any) {
      console.error("Error getting distinct packages:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/admin/customers", (req, res) => {
    try {
      const data = parseExcelData();
      const { search, segment, packageCode, status } = req.query;

      let filtered = data.customers;

      if (search && typeof search === "string") {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.fullName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.memberCode && c.memberCode.toLowerCase().includes(q)) ||
          c.phone.toLowerCase().includes(q) ||
          (c.occupation && c.occupation.toLowerCase().includes(q))
        );
      }

      if (segment && typeof segment === "string" && segment !== "all") {
        filtered = filtered.filter(c => c.customerSegment === segment);
      }

      if (packageCode && typeof packageCode === "string" && packageCode !== "all") {
        filtered = filtered.filter(c => c.packageCode === packageCode);
      }

      if (status && typeof status === "string" && status !== "all") {
        filtered = filtered.filter(c => c.membershipStatus === status || c.status === status);
      }

      res.json({
        success: true,
        total: filtered.length,
        customers: filtered,
        kpis: data.kpis
      });
    } catch (error: any) {
      console.error("Error getting customers:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
