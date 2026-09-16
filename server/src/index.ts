import express from "express";
import path from "path";
import fs from "fs";
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
  TRIAL_VOUCHER_CODE,
} from "./chatConsultantKnowledge";
import { requireAuth, AuthRequest } from "./middleware/auth.ts";

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

      if (password.length < 6) {
        return res.status(400).json({ error: "Mật khẩu tối thiểu phải từ 6 ký tự." });
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

  // ================= ADMIN AI EMAIL MARKETING API =================
  app.post("/api/admin/generate-email", async (req, res) => {
    try {
      const { 
        objective = "Chăm sóc khách đăng ký tập thử 3 ngày", 
        targetAudience = "Khách hàng mới đăng ký trải nghiệm",
        voucherCode = "TANBINH3D",
        discountInfo = "Miễn phí 100% vé tập thử 3 ngày + Đo InBody cùng HLV",
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
          subject: `🔥 [The Shine Fitness] Tặng {{customer_name}} Vé Tập Thử 3 Ngày Miễn Phí + Đo InBody 0Đ!`,
          preheader: "Trải nghiệm không gian thể thao chuẩn 5 sao 1500m2 tại Tân Bình ngay hôm nay",
          headline: "Chào mừng bạn đến với Hành Trình Bứt Phá Vóc Dáng!",
          greeting: "Chào bạn {{customer_name}},",
          paragraphs: [
            "Chúng tôi rất vui mừng khi bạn đã lựa chọn The Shine Fitness & Yoga để bắt đầu hành trình nâng tầm sức khỏe và tự tin với vóc dáng của mình.",
            "Tại The Shine (154 Hoàng Hoa Thám, Tân Bình), bạn sẽ được thỏa sức trải nghiệm hệ thống máy tập Technogym chuẩn Olympic, các lớp Yoga trị liệu, GroupX bùng nổ, cùng tiện ích hồ bơi nước ấm và phòng xông hơi thảo dược hoàn toàn miễn phí.",
            `Đặc biệt, mã ưu đãi độc quyền "${voucherCode}" đã được kích hoạt thành công. Đừng bỏ lỡ cơ hội đo phân tích chỉ số cơ thể InBody và nhận lộ trình tập luyện 1-1 cùng HLV chuyên nghiệp!`
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
          "Đặc quyền ưu đãi dành riêng cho bạn: Tặng vé trải nghiệm miễn phí và đo chỉ số InBody cùng Huấn luyện viên chuyên nghiệp."
        ],
        voucherHighlight: "TANBINH3D",
        ctaText: "Kích Hoạt Ưu Đãi Ngay",
        ctaUrl: "https://theshinefitness.vn/#schedule",
        footerNote: "The Shine Fitness & Yoga | 154 Hoàng Hoa Thám, Tân Bình | Hotline: 0946 293 593"
      };
      res.json({ success: true, email: fallbackEmail });
    }
  });

  // SIMULATE SENDING EMAIL
  app.post("/api/admin/send-email-test", (req, res) => {
    try {
      const { recipientEmail, subject, flowName } = req.body;
      res.json({
        success: true,
        message: `Đã gửi email thử nghiệm thành công tới ${recipientEmail || "ducnguyen06112002@gmail.com"}!`,
        sentAt: new Date().toISOString(),
        details: {
          recipient: recipientEmail,
          subject,
          flowName,
          status: "DELIVERED"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Không thể gửi email thử nghiệm." });
    }
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
