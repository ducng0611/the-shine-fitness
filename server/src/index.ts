import { createNutritionRouter } from "./nutrition/router";
import { nutritionChatDecision } from "../../shared/nutritionRouting";
import { registerCompanionRoutes } from "./companion/router.ts";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import nodemailer, { Transporter } from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as XLSXModule from "xlsx";
const XLSX = (XLSXModule as any).default || XLSXModule;
import { PRICING, OPENING_HOURS, ADDRESS, HOTLINE } from "./pricingData";

const MODEL_CHINH = "gemini-3.5-flash-lite";
const MODEL_FALLBACK = "gemini-3.6-flash";
import {
  initCsvStorage,
  addRegistration,
  addMember,
  loginMember,
} from "./csvStorage";
import {
  initChatLogStorage,
  appendChatLog,
  getChatLogs,
  saveChatFeedback,
  getChatFeedbacks,
} from "./chatLogStorage";
import {
  detectHandoverTrigger,
  getHandoverReply,
  buildHandoverSummary,
} from "./handoverRules";
import {
  initHandoverStorage,
  addHandoverRecord,
  getHandoverQueue,
  updateHandoverStatus,
  getHandoverKpis,
} from "./handoverStorage";
import { parseExcelData } from "./excelDataService";
import { resolveMemberPronoun } from "./genderHelper";
import {
  buildConsultantSystemInstruction,
  sanitizeConsultantOutput,
  generateSmartConsultantFallback,
  ConsultantContext,
} from "./chatConsultantKnowledge";
import { classify, ClassificationResult } from "./intentClassifier";
import {
  loadIndex,
  retrieve,
  buildContextBlock,
  getIsRagAvailable,
  getIndexBuiltAt,
  RetrievedChunk
} from "./ragEngine";
import { requireAuth, requireAdmin, AuthRequest } from "./middleware/auth.ts";
import { adminDb, adminAuth } from "./lib/firebase-admin.ts";
import { createPathwayRouter } from "./companion/pathways/router";
import { createTrainingRouter } from "./companion/training/router";
import { FirestoreTrainingStore } from "./companion/training/store";
import { createIntentParser } from "./companion/training/intent";
import { validatePassword } from "./passwordValidation";
import {
  fetchFullCatalogueFromStorage,
  recordRevision,
  GymZone,
  GymEquipment,
  ExerciseCatalogueEntry
} from "./companion/catalogueService";

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
        <div class="voucher-note">✓ Đưa mã này cho Lễ Tân tại The Shine Fitness & Yoga để nhận vé tập miễn phí!</div>
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
        Bộ phận Chăm sóc khách hàng The Shine sẽ tư vấn cho bạn trong vòng 15-30 phút tới.
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
  // Cloud Run (AI Studio deploy) injects PORT; local and AI Studio preview default to 3000.
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize storage
  initCsvStorage();
  initChatLogStorage();
  initHandoverStorage();

  // Load RAG index into memory
  const ragInit = loadIndex();
  console.log(`[RAG ENGINE INIT] Status: ${ragInit.available ? 'AVAILABLE' : 'UNAVAILABLE'}, RAG_ENABLED: ${process.env.RAG_ENABLED === 'true'}`);

  // Initialize Gemini API client
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Private source intake owns its JSON limit and never feeds public RAG.
  app.use('/api/admin/pathway-intake', createPathwayRouter({
    store: new FirestoreTrainingStore(adminDb),
    verifyToken: token => adminAuth.verifyIdToken(token, true),
    enabled: () => process.env.SHINE_PATHWAY_INTAKE_ENABLED === 'true',
    adminEmails: () => (process.env.ADMIN_EMAILS || '').split(',')
  }));

  // Nutrition source review stays admin-only and never writes meal/member records.
  app.use('/api/admin/nutrition', createNutritionRouter({
    verifyToken: token => adminAuth.verifyIdToken(token, true),
    adminEmails: () => (process.env.ADMIN_EMAILS || '').split(','),
    enabled: () => process.env.SHINE_NUTRITION_SOURCE_REVIEW_ENABLED === 'true'
  }));

  // Built-in middleware to parse JSON bodies
  // Companion has its own authenticated parser and food-photo size limit.
  registerCompanionRoutes(app);
  app.use(express.json());

  // Step 3 is isolated from public RAG/cache/logs and defaults to disabled.
  app.use('/api/companion/training', createTrainingRouter({
    store: new FirestoreTrainingStore(adminDb),
    verifyToken: token => adminAuth.verifyIdToken(token, true),
    enabled: () => process.env.SHINE_TRAINING_ENABLED === 'true',
    pilotUids: () => (process.env.SHINE_TRAINING_PILOT_UIDS || '').split(',').map(s => s.trim()).filter(Boolean),
    adminEmails: () => (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    parseIntent: createIntentParser({ apiKey: process.env.GEMINI_API_KEY, model: process.env.SHINE_TRAINING_INTENT_MODEL })
  }));


  // Rate Limiter Configuration
  const chatRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    statusCode: 429,
    message: {
      error: `Rất tiếc, bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút hoặc liên hệ Hotline ${HOTLINE} để được tư vấn ngay lập tức!`
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const adminRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50,
    statusCode: 429,
    message: {
      error: "Hệ thống nhận quá nhiều yêu cầu thao tác quản trị. Vui lòng thử lại sau 5 phút."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/chat", chatRateLimiter);
  app.use("/api/admin", adminRateLimiter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ================= FIRESTORE SECURE ENDPOINTS (FIREBASE ADMIN) =================

  // Member Progress Deletion Endpoint
  app.delete("/api/member-progress/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized: Missing user token" });

      const docRef = adminDb.collection('member_progress').doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Thẻ tiến độ không tồn tại." });
      }
      const data = snap.data();
      if (data?.userId !== uid && data?.uid !== uid) {
        return res.status(403).json({ error: "Forbidden: Bạn không có quyền xóa dữ liệu của người khác." });
      }
      await docRef.delete();
      res.json({ success: true, message: "Đã xóa tiến độ thành công." });
    } catch (error: any) {
      console.error("Error deleting member progress:", error);
      res.status(500).json({ error: error.message || "Không thể xóa tiến độ." });
    }
  });

  // Workout Log Deletion Endpoint
  app.delete("/api/workout-logs/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized: Missing user token" });

      const docRef = adminDb.collection('workout_logs').doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Nhật ký tập luyện không tồn tại." });
      }
      const data = snap.data();
      if (data?.userId !== uid && data?.uid !== uid && data?.memberCode !== uid) {
        return res.status(403).json({ error: "Forbidden: Bạn không có quyền xóa dữ liệu của người khác." });
      }
      await docRef.delete();
      res.json({ success: true, message: "Đã xóa nhật ký tập luyện thành công." });
    } catch (error: any) {
      console.error("Error deleting workout log:", error);
      res.status(500).json({ error: error.message || "Không thể xóa nhật ký tập luyện." });
    }
  });

  // Save / Update Member Profile
  app.post("/api/members", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: "Unauthorized: Missing user token" });

      const memberData = req.body;
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(memberData)) {
        if (v !== undefined) sanitized[k] = v;
      }

      const docRef = adminDb.collection('members').doc(uid);
      await docRef.set({
        ...sanitized,
        uid,
        userId: uid,
        status: sanitized.status || 'Active',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, message: "Đã cập nhật thông tin hội viên thành công." });
    } catch (error: any) {
      console.error("Error saving member profile:", error);
      res.status(500).json({ error: error.message || "Không thể lưu thông tin hội viên." });
    }
  });

  // Lookup Member Profile
  app.post("/api/members/lookup", requireAuth, async (req: AuthRequest, res) => {
    try {
      const requesterUid = req.user?.uid;
      if (!requesterUid) return res.status(401).json({ error: "Unauthorized" });
      if (req.body?.uid && req.body.uid !== requesterUid) return res.status(403).json({ error: "Forbidden: self lookup only" });
      // Contact details / membership codes are identifiers, never authorization.
      const snap = await adminDb.collection('members').doc(requesterUid).get();
      const found = snap.exists ? { ...snap.data(), uid: requesterUid, userId: requesterUid } : null;

      res.json({ success: true, member: found });
    } catch (error: any) {
      console.error("Error looking up member:", error);
      res.status(500).json({ error: error.message || "Lỗi tra cứu thông tin hội viên." });
    }
  });

  // Admin Gym Packages Endpoints
  app.post("/api/admin/packages", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pkg = req.body;
      if (!pkg || !pkg.id) return res.status(400).json({ error: "Missing package id" });
      await adminDb.collection('packages').doc(pkg.id).set({
        ...pkg,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/packages/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await adminDb.collection('packages').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/packages/sync", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const packages = req.body;
      if (Array.isArray(packages)) {
        const batch = adminDb.batch();
        for (const pkg of packages) {
          if (pkg && pkg.id) {
            batch.set(adminDb.collection('packages').doc(pkg.id), {
              ...pkg,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
        await batch.commit();
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Promotions Endpoints
  app.post("/api/admin/promotions", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const promo = req.body;
      if (!promo || !promo.id) return res.status(400).json({ error: "Missing promo id" });
      await adminDb.collection('promotions').doc(promo.id).set({
        ...promo,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/promotions/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await adminDb.collection('promotions').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Email Marketing Flows Endpoints
  app.post("/api/admin/email-flows", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const flow = req.body;
      if (!flow || !flow.id) return res.status(400).json({ error: "Missing flow id" });
      await adminDb.collection('email_campaigns').doc(flow.id).set({
        ...flow,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/email-flows/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await adminDb.collection('email_campaigns').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Customers CRM Endpoints
  app.get("/api/admin/customers/unified", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const customersMap = new Map<string, any>();
      const custSnap = await adminDb.collection('customers').get();
      custSnap.forEach(docSnap => {
        const d = docSnap.data();
        const key = d.memberCode || d.id || docSnap.id;
        customersMap.set(key, { ...d, id: docSnap.id });
      });

      res.json({ success: true, customers: Array.from(customersMap.values()) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/customers/save", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const customer = req.body;
      const docId = customer.memberCode || customer.id;
      if (!docId) return res.status(400).json({ error: "Missing customer id" });
      await adminDb.collection('customers').doc(docId).set({
        ...customer,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/customers/create", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const customer = req.body;
      const memberCode = customer.memberCode || `TS_${Date.now().toString().slice(-4)}`;
      const docId = memberCode;
      const newCustomer = {
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
      await adminDb.collection('customers').doc(docId).set(newCustomer, { merge: true });
      res.json({ success: true, customer: newCustomer });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/customers/sync", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const customers = req.body;
      if (Array.isArray(customers)) {
        const batch = adminDb.batch();
        for (const c of customers) {
          const docId = c.memberCode || c.id;
          if (docId) {
            batch.set(adminDb.collection('customers').doc(docId), {
              ...c,
              syncedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
        await batch.commit();
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/customers/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await adminDb.collection('customers').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Users Management Endpoints
  app.get("/api/admin/users/all", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const snap = await adminDb.collection('admins').get();
      const admins: any[] = [];
      snap.forEach(docSnap => {
        admins.push({ uid: docSnap.id, ...docSnap.data() });
      });
      res.json({ success: true, admins });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/save", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const adminData = req.body;
      if (!adminData || !adminData.uid) return res.status(400).json({ error: "Missing admin uid" });
      await adminDb.collection('admins').doc(adminData.uid).set({
        ...adminData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:uid", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.params;
      await adminDb.collection('admins').doc(uid).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ================= GYM KNOWLEDGE & CATALOGUE API ENDPOINTS =================

  // 1. Get full catalogue (zones, equipment, exercises)
  app.get("/api/companion/catalogue", async (req, res) => {
    try {
      const data = await fetchFullCatalogueFromStorage();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Get strictly verified catalogue (for Shine Companion workout recommendation)
  app.get("/api/companion/catalogue/verified", async (req, res) => {
    try {
      const data = await fetchFullCatalogueFromStorage();
      
      const verifiedZones = (data.zones || []).filter(
        z => z.verified === true && z.reviewStatus === 'verified' && !z.SAMPLE_DATA_ONLY
      );
      
      const verifiedEquipment = (data.equipment || []).filter(
        e => e.verified === true && e.reviewStatus === 'verified' && !e.SAMPLE_DATA_ONLY && e.isFunctional && e.operationalStatus === 'operational'
      );
      const verifiedEquipmentIds = new Set(verifiedEquipment.map(e => e.id));

      const verifiedExercises = (data.exercises || []).filter(ex => {
        if (ex.SAMPLE_DATA_ONLY || !ex.verified || ex.reviewStatus !== 'verified') return false;
        if (ex.requiredEquipmentIds && ex.requiredEquipmentIds.length > 0) {
          return ex.requiredEquipmentIds.every(id => verifiedEquipmentIds.has(id));
        }
        return true;
      });

      const isSufficient = verifiedZones.length >= 1 && verifiedEquipment.length >= 3 && verifiedExercises.length >= 5;

      res.json({
        success: true,
        isSufficient,
        verified: {
          zones: verifiedZones,
          equipment: verifiedEquipment,
          exercises: verifiedExercises
        },
        counts: {
          zones: verifiedZones.length,
          equipment: verifiedEquipment.length,
          exercises: verifiedExercises.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Admin Zone Operations
  app.post("/api/admin/catalogue/zone", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const zone: GymZone = req.body;
      if (!zone || !zone.id || !zone.name) {
        return res.status(400).json({ error: "Missing zone id or name" });
      }

      const zoneId = zone.id;
      const adminEmail = req.user?.email || 'admin';
      
      const docRef = adminDb.collection('gym_zones').doc(zoneId);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      if (previousState?.SAMPLE_DATA_ONLY === true && zone.verified === true) return res.status(400).json({ error: 'Sample fixtures cannot be promoted to production knowledge.' });
      const updatedZone: GymZone = {
        ...zone,
        SAMPLE_DATA_ONLY: previousState?.SAMPLE_DATA_ONLY === true || zone.SAMPLE_DATA_ONLY === true,
        revision: (previousState?.revision || 0) + 1,
        updatedAt: new Date().toISOString(),
        createdAt: previousState?.createdAt || new Date().toISOString()
      };

      await docRef.set(updatedZone, { merge: true });

      await recordRevision({
        version: updatedZone.revision,
        entityType: 'zone',
        entityId: zoneId,
        action: previousState ? 'update' : 'create',
        changedBy: adminEmail,
        changeSummary: `${previousState ? 'Cập nhật' : 'Tạo mới'} khu vực: ${zone.name}`,
        previousState,
        newState: updatedZone
      });

      res.json({ success: true, zone: updatedZone });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/catalogue/zone/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const adminEmail = req.user?.email || 'admin';
      const docRef = adminDb.collection('gym_zones').doc(id);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      await docRef.delete();

      await recordRevision({
        version: (previousState?.revision || 0) + 1,
        entityType: 'zone',
        entityId: id,
        action: 'delete',
        changedBy: adminEmail,
        changeSummary: `Xóa khu vực: ${previousState?.name || id}`,
        previousState,
        newState: null
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Admin Equipment Operations
  app.post("/api/admin/catalogue/equipment", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const item: GymEquipment = req.body;
      if (!item || !item.id || !item.name) {
        return res.status(400).json({ error: "Missing equipment id or name" });
      }

      const eqId = item.id;
      const adminEmail = req.user?.email || 'admin';

      const docRef = adminDb.collection('gym_equipment').doc(eqId);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      if (previousState?.SAMPLE_DATA_ONLY === true && item.verified === true) return res.status(400).json({ error: 'Sample fixtures cannot be promoted to production knowledge.' });
      const updatedItem: GymEquipment = {
        ...item,
        SAMPLE_DATA_ONLY: previousState?.SAMPLE_DATA_ONLY === true || item.SAMPLE_DATA_ONLY === true,
        revision: (previousState?.revision || 0) + 1,
        updatedAt: new Date().toISOString(),
        createdAt: previousState?.createdAt || new Date().toISOString()
      };

      await docRef.set(updatedItem, { merge: true });

      await recordRevision({
        version: updatedItem.revision,
        entityType: 'equipment',
        entityId: eqId,
        action: previousState ? 'update' : 'create',
        changedBy: adminEmail,
        changeSummary: `${previousState ? 'Cập nhật' : 'Tạo mới'} thiết bị: ${item.name}`,
        previousState,
        newState: updatedItem
      });

      res.json({ success: true, equipment: updatedItem });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/catalogue/equipment/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const adminEmail = req.user?.email || 'admin';
      const docRef = adminDb.collection('gym_equipment').doc(id);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      await docRef.delete();

      await recordRevision({
        version: (previousState?.revision || 0) + 1,
        entityType: 'equipment',
        entityId: id,
        action: 'delete',
        changedBy: adminEmail,
        changeSummary: `Xóa thiết bị: ${previousState?.name || id}`,
        previousState,
        newState: null
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Admin Exercise Operations
  app.post("/api/admin/catalogue/exercise", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const exercise: ExerciseCatalogueEntry = req.body;
      if (!exercise || !exercise.id || !exercise.name) {
        return res.status(400).json({ error: "Missing exercise id or name" });
      }

      const exId = exercise.id;
      const adminEmail = req.user?.email || 'admin';

      const docRef = adminDb.collection('gym_exercises').doc(exId);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      if (previousState?.SAMPLE_DATA_ONLY === true && exercise.verified === true) return res.status(400).json({ error: 'Sample fixtures cannot be promoted to production knowledge.' });
      const updatedEx: ExerciseCatalogueEntry = {
        ...exercise,
        SAMPLE_DATA_ONLY: previousState?.SAMPLE_DATA_ONLY === true || exercise.SAMPLE_DATA_ONLY === true,
        revision: (previousState?.revision || 0) + 1,
        updatedAt: new Date().toISOString(),
        createdAt: previousState?.createdAt || new Date().toISOString()
      };

      await docRef.set(updatedEx, { merge: true });

      await recordRevision({
        version: updatedEx.revision,
        entityType: 'exercise',
        entityId: exId,
        action: previousState ? 'update' : 'create',
        changedBy: adminEmail,
        changeSummary: `${previousState ? 'Cập nhật' : 'Tạo mới'} bài tập: ${exercise.name}`,
        previousState,
        newState: updatedEx
      });

      res.json({ success: true, exercise: updatedEx });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/catalogue/exercise/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const adminEmail = req.user?.email || 'admin';
      const docRef = adminDb.collection('gym_exercises').doc(id);
      const existingSnap = await docRef.get();
      const previousState = existingSnap.exists ? existingSnap.data() : null;

      await docRef.delete();

      await recordRevision({
        version: (previousState?.revision || 0) + 1,
        entityType: 'exercise',
        entityId: id,
        action: 'delete',
        changedBy: adminEmail,
        changeSummary: `Xóa bài tập: ${previousState?.name || id}`,
        previousState,
        newState: null
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Admin Staff Verification & Audit Signing Endpoint
  app.post("/api/admin/catalogue/verify", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { entityType, entityId, verified, reviewStatus, notes } = req.body;
      if (!entityType || !entityId) {
        return res.status(400).json({ error: "Missing entityType or entityId" });
      }

      const collectionName = 
        entityType === 'zone' ? 'gym_zones' :
        entityType === 'equipment' ? 'gym_equipment' :
        entityType === 'exercise' ? 'gym_exercises' : null;

      if (!collectionName) {
        return res.status(400).json({ error: "Invalid entityType" });
      }

      const adminEmail = req.user?.email || 'trainer';
      const docRef = adminDb.collection(collectionName).doc(entityId);
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Entity not found" });
      }

      const prev = snap.data();
      if (prev?.SAMPLE_DATA_ONLY === true) return res.status(400).json({ error: 'Sample fixtures cannot be approved as real gym assets. Create a new record from verified business data.' });
      const isApproved = verified === true && reviewStatus === 'verified';
      const newRevStatus = reviewStatus || (isApproved ? 'verified' : 'needs_review');

      const updatedPayload: any = {
        verified: isApproved,
        reviewStatus: newRevStatus,
        SAMPLE_DATA_ONLY: prev?.SAMPLE_DATA_ONLY === true,
        verifiedBy: isApproved ? adminEmail : (prev?.verifiedBy || null),
        verifiedAt: isApproved ? new Date().toISOString() : (prev?.verifiedAt || null),
        revision: (prev?.revision || 0) + 1,
        updatedAt: new Date().toISOString()
      };

      await docRef.set(updatedPayload, { merge: true });

      await recordRevision({
        version: updatedPayload.revision,
        entityType,
        entityId,
        action: isApproved ? 'verify' : (newRevStatus === 'rejected' ? 'reject' : 'update'),
        changedBy: adminEmail,
        changeSummary: isApproved 
          ? `HLV/Quản lý (${adminEmail}) ĐÃ PHÊ DUYỆT XÁC THỰC: ${prev?.name || entityId}` 
          : `Cập nhật trạng thái duyệt (${newRevStatus}): ${prev?.name || entityId}${notes ? ` - Ghi chú: ${notes}` : ''}`,
        previousState: prev,
        newState: { ...prev, ...updatedPayload }
      });

      res.json({ success: true, updated: { ...prev, ...updatedPayload } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Get Revisions History
  app.get("/api/admin/catalogue/revisions", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const snap = await adminDb.collection('gym_catalogue_revisions').orderBy('timestamp', 'desc').limit(100).get();
      const revisions: any[] = [];
      snap.forEach(d => revisions.push({ id: d.id, ...d.data() }));
      res.json({ success: true, revisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
    const startTime = Date.now();
    const sessionId = req.body?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

    let classification: ClassificationResult | null = null;

    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const lang = req.body?.lang || 'vi';

      // 1. Check handover trigger BEFORE Gemini and BEFORE checking cache
      const handoverTrigger = detectHandoverTrigger(message, history || []);
      if (handoverTrigger.tag) {
        const replyText = handoverTrigger.replyText ?? getHandoverReply(handoverTrigger.tag, pronoun);
        const latencyMs = Date.now() - startTime;
        const summary = buildHandoverSummary(history || [], message, handoverTrigger.tag, handoverTrigger.reason);

        const queueStatus = handoverTrigger.tag === 'COMPLAINT' 
          ? 'Chờ tiếp nhận - Ưu tiên cao' 
          : 'Chờ tiếp nhận';

        try {
          addHandoverRecord({
            sessionId,
            tag: handoverTrigger.tag,
            summary,
            status: queueStatus
          });
        } catch (hoErr) {
          console.error("Failed to add handover record:", hoErr);
        }

        try {
          appendChatLog({
            sessionId,
            lang,
            isMember: !!isMember,
            userMessage: message,
            botResponse: replyText,
            latencyMs,
            usedFallback: false,
            handoverTag: handoverTrigger.tag,
            intent: '',
            pkSegment: '',
            responseChars: replyText.length
          });
        } catch (logErr) {
          console.error("Failed to append chat log for handover:", logErr);
        }

        return res.json({
          text: replyText,
          handover: true,
          handoverTag: handoverTrigger.tag,
          hotline: HOTLINE,
          sessionId
        });
      }

      // Source examples must not become personalized diet advice through model/cache fallback.
      // Existing HEALTH_RISK and explicit human-handover priorities remain above this gate.
      const nutritionDecision = nutritionChatDecision(message, Array.isArray(history) ? history : []);
      if (nutritionDecision) {
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ ...nutritionDecision, sessionId });
      }

      // 2. Classify intent, pkSegment, slots, nextQuestion in ONE Gemini call
      classification = await classify(message, history || [], ai);

      // 3. Low confidence handover check (< 0.4)
      if (classification.confidence < 0.4) {
        const replyText = getHandoverReply('LOW_CONFIDENCE', pronoun);
        const latencyMs = Date.now() - startTime;
        const summary = buildHandoverSummary(
          history || [],
          message,
          'LOW_CONFIDENCE',
          `AI chưa tự tin nhận diện ý định (Confidence: ${classification.confidence})`
        );

        try {
          addHandoverRecord({
            sessionId,
            tag: 'LOW_CONFIDENCE',
            summary,
            status: 'Chờ tiếp nhận'
          });
        } catch (hoErr) {
          console.error("Failed to add low confidence handover record:", hoErr);
        }

        try {
          appendChatLog({
            sessionId,
            lang,
            isMember: !!isMember,
            userMessage: message,
            botResponse: replyText,
            latencyMs,
            usedFallback: false,
            handoverTag: 'LOW_CONFIDENCE',
            intent: classification.intent,
            pkSegment: classification.pkSegment || '',
            responseChars: replyText.length
          });
        } catch (logErr) {
          console.error("Failed to append chat log for low confidence handover:", logErr);
        }

        return res.json({
          text: replyText,
          handover: true,
          handoverTag: 'LOW_CONFIDENCE',
          hotline: HOTLINE,
          sessionId
        });
      }

      // 4. RAG Retrieval (if RAG_ENABLED === 'true')
      const RAG_ENABLED = process.env.RAG_ENABLED === 'true';
      let retrievedChunks: RetrievedChunk[] = [];
      let retrievedContext: string | undefined = undefined;
      let retrievedChunkIds = '';
      let topSimilarity = 0;
      let groundedAnswer = false;

      if (RAG_ENABLED && getIsRagAvailable()) {
        retrievedChunks = await retrieve(message, ai, {
          intent: classification.intent,
          topK: 4
        });

        if (retrievedChunks.length > 0) {
          retrievedChunkIds = retrievedChunks.map(r => r.chunk.id).join(';');
          topSimilarity = retrievedChunks[0].similarity;
          groundedAnswer = true;
          retrievedContext = buildContextBlock(retrievedChunks);
        } else {
          // RAG_ENABLED=true but no chunk >= 0.55 similarity found.
          // Fallback to handover to avoid hallucination.
          const replyText = getHandoverReply('LOW_CONFIDENCE', pronoun);
          const latencyMs = Date.now() - startTime;
          const summary = buildHandoverSummary(
            history || [],
            message,
            'LOW_CONFIDENCE',
            'Không tìm thấy dữ liệu tham chiếu đạt ngưỡng'
          );

          try {
            addHandoverRecord({
              sessionId,
              tag: 'LOW_CONFIDENCE',
              summary,
              status: 'Chờ tiếp nhận'
            });
          } catch (hoErr) {
            console.error("Failed to add LOW_CONFIDENCE handover record:", hoErr);
          }

          try {
            appendChatLog({
              sessionId,
              lang,
              isMember: !!isMember,
              userMessage: message,
              botResponse: replyText,
              latencyMs,
              usedFallback: false,
              handoverTag: 'LOW_CONFIDENCE',
              intent: classification.intent,
              pkSegment: classification.pkSegment || '',
              responseChars: replyText.length,
              retrievedChunkIds: '',
              topSimilarity: 0,
              groundedAnswer: false
            });
          } catch (logErr) {
            console.error("Failed to append chat log for LOW_CONFIDENCE handover:", logErr);
          }

          return res.json({
            text: replyText,
            handover: true,
            handoverTag: 'LOW_CONFIDENCE',
            hotline: HOTLINE,
            sessionId
          });
        }
      }

      // 5. Cache check including RAG parameters in cacheKey
      const historyStr = history ? JSON.stringify(history.map((h: any) => h.text)) : "";
      const cacheKey = `${RAG_ENABLED}_${retrievedChunkIds}_${lang}_${isMember}_${pronoun}_${classification.pkSegment || 'NONE'}_${classification.nextQuestion || 'NONE'}_${historyStr}_${message}`;
      if (chatCache.has(cacheKey)) {
        const cachedText = chatCache.get(cacheKey)!;
        const latencyMs = Date.now() - startTime;
        try {
          appendChatLog({
            sessionId,
            lang,
            isMember: !!isMember,
            userMessage: message,
            botResponse: cachedText,
            latencyMs,
            usedFallback: false,
            handoverTag: '',
            intent: classification.intent,
            pkSegment: classification.pkSegment || '',
            responseChars: cachedText.length,
            retrievedChunkIds,
            topSimilarity,
            groundedAnswer
          });
        } catch (logErr) {
          console.error("Failed to append chat log for cache hit:", logErr);
        }
        return res.json({ text: cachedText, sessionId });
      }

      // 6. Build personalized system instruction
      const systemInstruction = buildConsultantSystemInstruction(
        consultantContext,
        {
          pkSegment: classification.pkSegment,
          slots: classification.slots,
          nextQuestion: classification.nextQuestion
        },
        retrievedContext
      );

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
      let usedFallback = false;
      try {
        response = await ai.models.generateContent({
          model: MODEL_CHINH,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          },
        });
      } catch (genErr) {
        usedFallback = true;
        console.warn(`${MODEL_CHINH} failed, retrying with fallback model ${MODEL_FALLBACK}:`, genErr);
        response = await ai.models.generateContent({
          model: MODEL_FALLBACK,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          },
        });
      }

      const latencyMs = Date.now() - startTime;
      const rawText = response.text || "";
      const cleanText = sanitizeConsultantOutput(rawText, consultantContext);

      chatCache.set(cacheKey, cleanText);

      try {
        appendChatLog({
          sessionId,
          lang,
          isMember: !!isMember,
          userMessage: message,
          botResponse: cleanText,
          latencyMs,
          usedFallback,
          handoverTag: '',
          intent: classification.intent,
          pkSegment: classification.pkSegment || '',
          responseChars: cleanText.length,
          retrievedChunkIds,
          topSimilarity,
          groundedAnswer
        });
      } catch (logErr) {
        console.error("Failed to append chat log:", logErr);
      }

      res.json({ text: cleanText, sessionId });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      console.error("Gemini API Error in /api/chat:", error);
      const fallbackText = generateSmartConsultantFallback(req.body?.message || "", consultantContext);

      try {
        appendChatLog({
          sessionId,
          lang: req.body?.lang || 'vi',
          isMember: !!consultantContext.isMember,
          userMessage: req.body?.message || "",
          botResponse: fallbackText,
          latencyMs,
          usedFallback: true,
          handoverTag: '',
          intent: classification?.intent || 'OTHER',
          pkSegment: classification?.pkSegment || '',
          responseChars: fallbackText.length
        });
      } catch (logErr) {
        console.error("Failed to append chat log in catch:", logErr);
      }

      res.json({ text: fallbackText, sessionId });
    }
  });

  // GET /api/admin/chat-logs (Returns chat logs and pre-calculated KPI metrics)
  app.get("/api/admin/chat-logs", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    try {
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const logs = getChatLogs({ from, to });

      const totalMessages = logs.length;
      const uniqueSessions = new Set(logs.map(l => l.sessionId));
      const totalConversations = uniqueSessions.size;

      const avgLatencyMs = totalMessages > 0
        ? Math.round(logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / totalMessages)
        : 0;

      let p95LatencyMs = 0;
      if (totalMessages > 0) {
        const latencies = logs.map(l => l.latencyMs || 0).sort((a, b) => a - b);
        const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
        p95LatencyMs = latencies[p95Idx];
      }

      const fallbackCount = logs.filter(l => l.usedFallback).length;
      const fallbackRate = totalMessages > 0
        ? Number(((fallbackCount / totalMessages) * 100).toFixed(1))
        : 0;

      const handoverCount = logs.filter(l => l.handoverTag && l.handoverTag.trim().length > 0).length;
      const handoverRate = totalMessages > 0
        ? Number(((handoverCount / totalMessages) * 100).toFixed(1))
        : 0;

      const avgResponseChars = totalMessages > 0
        ? Math.round(logs.reduce((acc, l) => acc + (l.responseChars || 0), 0) / totalMessages)
        : 0;

      // Intent Distribution (fixed 8 intents)
      const ALL_INTENTS = ['PRICE', 'SCHEDULE', 'TRAINER', 'FACILITY', 'POLICY', 'TRIAL', 'GREETING', 'OTHER'];
      const intentCounts: Record<string, number> = {
        PRICE: 0,
        SCHEDULE: 0,
        TRAINER: 0,
        FACILITY: 0,
        POLICY: 0,
        TRIAL: 0,
        GREETING: 0,
        OTHER: 0
      };

      logs.forEach(l => {
        const i = (l.intent || '').toUpperCase();
        if (intentCounts[i] !== undefined) {
          intentCounts[i]++;
        } else if (i) {
          intentCounts['OTHER']++;
        }
      });

      const intentDistribution = ALL_INTENTS.map(intent => ({
        intent,
        count: intentCounts[intent]
      }));

      // PK Segment Distribution (4 segments)
      const ALL_SEGMENTS = ['PK01', 'PK02', 'PK03', 'PK04'];
      const pkCounts: Record<string, number> = {
        PK01: 0,
        PK02: 0,
        PK03: 0,
        PK04: 0
      };

      const sessionSegmentMap = new Map<string, string>();

      logs.forEach(l => {
        if (l.pkSegment && pkCounts[l.pkSegment] !== undefined) {
          pkCounts[l.pkSegment]++;
          if (l.sessionId) {
            sessionSegmentMap.set(l.sessionId, l.pkSegment);
          }
        }
      });

      const pkSegmentDistribution = ALL_SEGMENTS.map(segment => ({
        segment,
        count: pkCounts[segment]
      }));

      const segmentedSessionsCount = Array.from(uniqueSessions).filter(sId => sessionSegmentMap.has(sId)).length;
      const segmentedSessionRate = totalConversations > 0
        ? Number(((segmentedSessionsCount / totalConversations) * 100).toFixed(1))
        : 0;

      // RAG KPIs
      const nonHandoverLogs = logs.filter(l => !l.handoverTag || l.handoverTag.trim().length === 0);
      const groundedLogs = logs.filter(l => l.groundedAnswer);
      const sourcedAnswerRate = nonHandoverLogs.length > 0
        ? Number(((groundedLogs.length / nonHandoverLogs.length) * 100).toFixed(1))
        : 0;

      const groundedLogsWithScore = logs.filter(l => l.groundedAnswer && typeof l.topSimilarity === 'number' && l.topSimilarity > 0);
      const avgTopSimilarity = groundedLogsWithScore.length > 0
        ? Number((groundedLogsWithScore.reduce((acc, l) => acc + l.topSimilarity!, 0) / groundedLogsWithScore.length).toFixed(4))
        : 0;

      const ragIndexInfo = loadIndex();
      const handoverKpis = getHandoverKpis();
      const handoverQueueRecords = getHandoverQueue();

      // Valid VN Mobile Phone Regex: 0 or +84 followed by 9-digit valid mobile prefix (3x, 5x, 7x, 8x, 9x)
      const VN_MOBILE_REGEX = /(?:\+84|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}\b/;
      const hasValidVnPhone = (text: string): boolean => {
        if (!text) return false;
        const normalized = text.replace(/[\s.-]/g, '');
        return VN_MOBILE_REGEX.test(normalized) || /(?:\+84|0)[35789]\d{8}\b/.test(normalized);
      };

      // Set of sessions that have a handover record
      const handoverSessionIds = new Set<string>();
      handoverQueueRecords.forEach(h => {
        if (h.sessionId) handoverSessionIds.add(h.sessionId);
      });
      logs.forEach(l => {
        if (l.sessionId && l.handoverTag && l.handoverTag.trim().length > 0) {
          handoverSessionIds.add(l.sessionId);
        }
      });

      // Valid Lead Rate: Số phiên có bản ghi handover KÈM số điện thoại Việt Nam hợp lệ / tổng số phiên
      // Không tính phiên chỉ có intent PRICE hoặc TRIAL
      const validLeadSessions = new Set<string>();
      
      // Check handover records text (summary, notes, history)
      handoverQueueRecords.forEach(h => {
        const textToCheck = `${h.summary || ''} ${h.resolution || ''} ${h.history?.map(item => item.note || '').join(' ') || ''}`;
        if (h.sessionId && hasValidVnPhone(textToCheck)) {
          validLeadSessions.add(h.sessionId);
        }
      });

      // Check session logs text for sessions with handover
      logs.forEach(l => {
        if (l.sessionId && handoverSessionIds.has(l.sessionId)) {
          if (hasValidVnPhone(l.userMessage) || hasValidVnPhone(l.botResponse)) {
            validLeadSessions.add(l.sessionId);
          }
        }
      });

      const validLeadCount = validLeadSessions.size;
      const validLeadRate = totalConversations > 0
        ? Number(((validLeadCount / totalConversations) * 100).toFixed(1))
        : 0;

      const conversionRate = validLeadCount > 0
        ? Number(((handoverKpis.successHandovers / validLeadCount) * 100).toFixed(1))
        : (handoverKpis.handoverSuccessRate || 0);

      // Feedback & Satisfaction CSAT: Deduplicate by keeping only the LATEST rating per messageId
      const feedbacks = getChatFeedbacks();
      const latestFeedbackByMessage = new Map<string, typeof feedbacks[0]>();
      for (const fb of feedbacks) {
        const key = fb.messageId || fb.id;
        const existing = latestFeedbackByMessage.get(key);
        if (!existing || new Date(fb.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
          latestFeedbackByMessage.set(key, fb);
        }
      }
      const deduplicatedFeedbacks = Array.from(latestFeedbackByMessage.values());
      const totalFeedbacks = deduplicatedFeedbacks.length;
      const likeCount = deduplicatedFeedbacks.filter(f => f.feedback === 'like').length;
      const dislikeCount = deduplicatedFeedbacks.filter(f => f.feedback === 'dislike').length;
      const satisfactionRate: number | null = totalFeedbacks > 0
        ? Number(((likeCount / totalFeedbacks) * 100).toFixed(1))
        : null;

      res.json({
        logs,
        kpi: {
          totalConversations,
          totalMessages,
          avgLatencyMs,
          p95LatencyMs,
          fallbackRate,
          handoverRate,
          validLeadRate,
          conversionRate,
          avgResponseChars,
          segmentedSessionRate,
          intentDistribution,
          pkSegmentDistribution,
          sourcedAnswerRate,
          avgTopSimilarity,
          handoverSuccessRate: handoverKpis.handoverSuccessRate,
          avgTimeToContactMinutes: handoverKpis.avgTimeToContactMinutes,
          slaBreachRate: handoverKpis.slaBreachRate,
          openHandovers: handoverKpis.openHandovers,
          successRateByTag: handoverKpis.successRateByTag,
          handoverStats: handoverKpis,
          feedbackStats: {
            total: totalFeedbacks,
            likes: likeCount,
            dislikes: dislikeCount,
            satisfactionRate
          },
          ragInfo: {
            enabled: process.env.RAG_ENABLED === 'true',
            available: ragIndexInfo.available,
            builtAt: ragIndexInfo.builtAt,
            chunkCount: ragIndexInfo.chunkCount || 0
          }
        }
      });
    } catch (error: any) {
      console.error("Error fetching chat logs:", error);
      res.status(500).json({ error: error.message || "Failed to fetch chat logs" });
    }
  });

  // GET /api/admin/rag-eval (Returns offline RAG evaluation metrics Precision@K, Recall@K, HitRate@K)
  app.get("/api/admin/rag-eval", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    try {
      const resultPath = path.join(process.cwd(), 'data', 'eval', 'latest_result.json');
      if (fs.existsSync(resultPath)) {
        const content = fs.readFileSync(resultPath, 'utf-8');
        return res.json(JSON.parse(content));
      }
      res.json({
        evaluatedAt: null,
        benchmarkVersion: "1.0.0",
        totalQuestions: 0,
        retrievalMetrics: {
          precisionAt1: 0,
          precisionAt3: 0,
          precisionAt5: 0,
          recallAt1: 0,
          recallAt3: 0,
          recallAt5: 0,
          hitRateAt1: 0,
          hitRateAt3: 0,
          hitRateAt5: 0
        },
        handoverMetrics: {
          accuracy: 0,
          precision: 0,
          recall: 0
        },
        categoryBreakdown: {}
      });
    } catch (error: any) {
      console.error("Error loading RAG eval report:", error);
      res.status(500).json({ error: error.message || "Failed to load RAG evaluation report" });
    }
  });

  // GET /api/admin/handover-queue (Returns human handover queue with pre-calculated KPIs, newest first)
  app.get("/api/admin/handover-queue", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    try {
      const queue = getHandoverQueue();
      const kpi = getHandoverKpis(queue);
      res.json({ queue, kpi });
    } catch (error: any) {
      console.error("Error fetching handover queue:", error);
      res.status(500).json({ error: error.message || "Failed to fetch handover queue" });
    }
  });

  // PATCH /api/admin/handover-queue/:id (Updates state of a handover record with strict state machine, SLA & audit trail)
  app.patch("/api/admin/handover-queue/:id", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    try {
      const id = req.params.id;
      const { newStatus, note } = req.body;

      if (!newStatus) {
        return res.status(400).json({ error: "Trạng thái mới (newStatus) là bắt buộc." });
      }

      // Extract actor identity from verified admin Bearer token
      const actor = req.user?.email || req.user?.name || req.user?.uid || "Admin";

      const updatedRecord = updateHandoverStatus(id, newStatus, actor, note);
      const kpi = getHandoverKpis();

      res.json({
        success: true,
        record: updatedRecord,
        kpi
      });
    } catch (error: any) {
      console.error("Error updating handover status:", error);
      const msg = error.message || "Cập nhật trạng thái chuyển giao thất bại.";
      if (msg.includes("Không tìm thấy")) {
        return res.status(404).json({ error: msg });
      }
      res.status(400).json({ error: msg });
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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu." });
      }

      const result = await loginMember(email, password);
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

  // ADMIN AUTHENTICATION (Google OAuth via Firebase Auth verified by requireAdmin)
  app.post("/api/admin/login", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    try {
      const user = req.user;
      return res.json({
        success: true,
        message: "Xác thực tài khoản quản trị viên Google OAuth thành công!",
        admin: {
          uid: user?.uid,
          email: user?.email,
          fullName: user?.name || user?.email,
          role: 'admin',
          roleTitle: 'Quản trị viên',
          phone: user?.phone_number || '',
          permissions: ['all', 'manage_members', 'manage_packages', 'manage_promotions', 'manage_email_flows', 'view_reports', 'view_revenue'],
          lastLogin: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Admin login API error:", error);
      res.status(500).json({ error: "Lỗi xử lý xác thực quản trị." });
    }
  });

  // ================= ADMIN AI EMAIL MARKETING API =================
  app.post("/api/admin/generate-email-flow", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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
          model: MODEL_CHINH,
          contents: systemPrompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });
      } catch (err) {
        console.warn(`${MODEL_CHINH} failed for flow generation, retrying fallback ${MODEL_FALLBACK}:`, err);
        geminiRes = await ai.models.generateContent({
          model: MODEL_FALLBACK,
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
  app.post("/api/admin/generate-email", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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
          model: MODEL_CHINH,
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });
      } catch (err) {
        console.warn(`${MODEL_CHINH} JSON failed, trying fallback model ${MODEL_FALLBACK}:`, err);
        geminiRes = await ai.models.generateContent({
          model: MODEL_FALLBACK,
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
  app.post("/api/admin/send-email-test", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
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
  app.get("/api/admin/email-logs", requireAuth, requireAdmin, (req: AuthRequest, res) => {
    res.json({
      success: true,
      logs: sentEmailLogs
    });
  });

  // EXCEL DATA & DISTINCT PACKAGES API (TheShineFitness_Cleaned_V2.xlsx)
  app.get("/api/admin/excel-data", requireAuth, requireAdmin, (req: AuthRequest, res) => {
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

  app.get("/api/admin/distinct-packages", requireAuth, requireAdmin, (req: AuthRequest, res) => {
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

  app.get("/api/admin/customers", requireAuth, requireAdmin, (req: AuthRequest, res) => {
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

  // POST /api/chat/feedback (Thumbs up/down feedback with rate limiting)
  const chatFeedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit 60 feedback actions per 15 minutes
    message: { error: "Bạn đã gửi quá nhiều phản hồi. Vui lòng thử lại sau 15 phút." }
  });

  app.post("/api/chat/feedback", chatFeedbackLimiter, (req, res) => {
    try {
      const { sessionId, messageId, feedback } = req.body;
      if (!sessionId || !feedback || !['like', 'dislike'].includes(feedback)) {
        return res.status(400).json({ error: "sessionId và feedback ('like' hoặc 'dislike') là bắt buộc." });
      }

      const record = saveChatFeedback({
        sessionId,
        messageId: messageId || '',
        feedback: feedback as 'like' | 'dislike'
      });

      res.json({
        success: true,
        message: "Cảm ơn bạn đã gửi phản hồi giúp hoàn thiện The Shine Chatbot!",
        feedbackId: record.id
      });
    } catch (error: any) {
      console.error("Error storing feedback:", error);
      res.status(500).json({ error: "Không thể lưu phản hồi." });
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
