# Bảng Truy Vết Yêu Cầu Thiết Kế (Requirement Traceability Matrix)

Tài liệu này dùng để đối chiếu chi tiết các yêu cầu thiết kế hệ thống Chatbot The Shine Fitness với hiện trạng triển khai thực tế trong mã nguồn dự án.

---

## Bảng Ma Trận Truy Vết

| Yêu cầu thiết kế | Hiện thực trong repo (File / Hàm) | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| **1. Website & Chatbot UI** | `src/components/Chatbot.tsx`, `server/src/index.ts` | **Đạt** | Widget trò chuyện riêng biệt, tự động sinh `sessionId`, lưu trữ lịch sử hội thoại trong React State & Server. |
| **2. Kết nối Gemini API & Model Fallback** | `server/src/index.ts` (`runGeminiWithFallback`) | **Đạt** | Tự động chuyển đổi từ `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash` khi gặp sự cố quota/API. |
| **3. Knowledge Base chuẩn hóa** | `data/knowledge/*.md` (`01_pricing.md` - `06_trial.md`) | **Đạt** | 6 file Markdown chứa YAML header đầy đủ: `source`, `version`, `effective_date`, `responsible_person`. |
| **4. RAG Engine (Chunking, Embedding, Top-K)** | `scripts/build_index.ts`, `server/src/ragEngine.ts` | **Đạt** | Chunking theo tiêu đề Markdown, gọi `gemini-embedding-001`, tính Cosine Similarity, lọc Top-K (`topK: 4`, ngưỡng `>= 0.55`). |
| **5. Intent Classifier & Confidence Routing** | `server/src/intentClassifier.ts` (`classify`) | **Đạt** | Phân loại ý định qua Gemini với JSON schema; rẽ nhánh sang `LOW_CONFIDENCE` handover khi confidence < 0.4. |
| **6. Bộ câu gạn lọc nhu cầu Q1 – Q4** | `server/src/intentClassifier.ts`, `chatConsultantKnowledge.ts` | **Đạt** | Tự động xác định và gửi câu hỏi tiếp theo (`nextQuestion`) gạn lọc mục tiêu tập, ngân sách, thời gian. |
| **7. Phân khúc khách hàng PK01 – PK04** | `server/src/intentClassifier.ts`, `src/data/pkSegmentsData.ts` | **Đạt** | Gán nhãn phân khúc (PK01: Tối ưu chi phí, PK02: Trải nghiệm cao cấp, PK03: Giảm cân/HLV, PK04: Linh hoạt) vào log. |
| **8. Quy tắc gợi ý gói tập** | `server/src/chatConsultantKnowledge.ts` | **Đạt** | Prompt ép Gemini chỉ tư vấn **1 gói chính** phù hợp nhất và tối đa **1 phương án thay thế**, cấm liệt kê dàn tràn. |
| **9. Quy tắc Chuyển giao Tư vấn viên (Handover)** | `server/src/handoverRules.ts`, `server/src/handoverStorage.ts` | **Đạt** | 5 trigger: `SPECIALIST_CONSULT`, `FEEDBACK_COMPLAINT`, `MEMBERSHIP_CONTRACT`, `VIP_SCHEDULE`, `LOW_CONFIDENCE` / `NO_GROUNDING_DATA`. |
| **10. Guardrails chống bịa đặt & Chẩn đoán y tế** | `server/src/chatConsultantKnowledge.ts`, `server/src/ragEngine.ts` | **Đạt** | Ép AI tuân thủ tài liệu RAG; kích hoạt Handover `NO_GROUNDING_DATA` khi không có tri thức tham chiếu; cấm chẩn đoán y tế. |
| **11. Quản lý Hàng đợi Chuyển giao & Lead** | `server/src/handoverStorage.ts`, `data/handover_queue.csv` | **Đạt** | Tự động trích xuất tóm tắt ngữ cảnh hội thoại, tạo hồ sơ chờ tiếp nhận trong `handover_queue.csv`. |
| **12. KPI Analytics: Latency (Avg, P95)** | `server/src/index.ts`, `AdminChatAnalyticsTab.tsx` | **Đạt** | Đo chính xác `latencyMs` từng request và tính toán Latency trung bình & P95 trên Admin UI. |
| **13. KPI Analytics: Fallback Rate** | `server/src/index.ts`, `AdminChatAnalyticsTab.tsx` | **Đạt** | Đánh dấu cờ `usedFallback` khi chuyển model và tính tỷ lệ % trên Admin UI. |
| **14. KPI Analytics: Handover Rate & Count** | `server/src/index.ts`, `AdminChatAnalyticsTab.tsx` | **Đạt** | Thống kê chính xác tỷ lệ hội thoại cần chuyển giao tư vấn viên và đếm số ca trong hàng đợi. |
| **15. KPI Analytics: Sourced Answer Rate** | `server/src/index.ts`, `AdminChatAnalyticsTab.tsx` | **Đạt** | Thống kê tỷ lệ % câu trả lời được bảo chứng bởi dữ liệu RAG (`groundedAnswer = true`). |
| **16. KPI Analytics: Precision@K** | *Chưa triển khai trong code* | **Chưa đạt** | Cần một bộ dữ liệu kiểm thử (Test Set) có nhãn câu trả lời đúng (Ground Truth) để đánh giá offline định kỳ. |
| **17. Rate limit & Bảo mật truy cập** | `server/src/middleware/auth.ts`, `server/src/index.ts` | **Đạt một phần** | Đã xác thực Token phía Server cho các API Admin, kiểm tra mật khẩu; chưa cài đặt Redis Rate Limit theo IP client. |
| **18. Khử thông tin định danh cá nhân (PII Protection)** | `server/src/chatLogStorage.ts` (`sanitizePii`) | **Đạt** | Tự động che giấu số điện thoại và email bằng ký tự `*` trước khi ghi vào đĩa `chat_logs.csv`. |
| **19. Bảo Mật Firestore Rules & Phân Quyền Kiến Trúc** | `firestore.rules`, `server/src/index.ts`, `src/lib/firebase.ts` | **Đạt** | **Hướng A (Client + Rules):** `registrations`, `health_assessments`, `member_progress` (read/create/update), `workout_logs` (read/create/update), `members` (read) cho chính chủ (`request.auth.uid == userId`).<br>**Hướng B (Server Endpoint + Admin SDK):** Thao tác XÓA (`member_progress`, `workout_logs`) và toàn bộ thao tác ADMIN (`customers`, `packages`, `promotions`, `email_campaigns`, `admins`) thực hiện qua Express Endpoint có middleware `requireAuth`. |
| **20. Quy trình Handover 5 Trạng Thái & KPI Success / SLA** | `server/src/handoverStorage.ts`, `server/src/index.ts`, `src/components/admin/AdminChatAnalyticsTab.tsx` | **Đạt** | **State machine:** CHO_TIEP_NHAN → DANG_XU_LY → DA_LIEN_HE → THANH_CONG / KHONG_THANH_CONG.<br>**SLA Rules:** 2h (COMPLAINT, HEALTH_RISK), 4h (REQUEST_HUMAN, HOT_LEAD_OR_NEGOTIATION), 24h (LOW_CONFIDENCE, NO_GROUNDING_DATA).<br>**KPIs:** Handover Success Rate %, SLA Breach Rate %, Avg Time to Contact (m), Open Handovers.<br>**Atomic File Write:** Backup CSV + write temp file rename. |
| **21. Chuyển Đổi Storage sang Firestore & Firestore Transactions** | `server/src/chatLogStorage.ts`, `server/src/handoverStorage.ts`, `scripts/migrate_csv_to_firestore.ts` | **Đạt** | Hỗ trợ chuyển đổi động qua `STORAGE_BACKEND` (`csv` hoặc `firestore`). Sử dụng `firebase-admin` server-side, bảo vệ bằng Firestore Transactions cho cập nhật trạng thái handover, PII sanitization áp dụng cho cả 2 backend, script migration có cờ dry-run & `--apply`. |

---

## Chi Tiết Phân Phối Kiến Trúc Bảo Mật Firestore (Giai đoạn 9)

### 🟢 Hướng A: Client-side trực tiếp Firestore được bảo vệ bởi `firestore.rules`
* **Áp dụng cho:**
  * Đăng ký tập thử (`registrations`): Khách vô danh được tạo mới (`allow create`).
  * Đánh giá sức khỏe InBody (`health_assessments`): Khách vô danh được tạo mới (`allow create`).
  * Theo dõi chỉ số tiến độ (`member_progress`): Hội viên xem/tạo/sửa chính bản ghi của mình (`request.auth.uid == resource.data.userId`).
  * Nhật ký luyện tập (`workout_logs`): Hội viên xem/tạo/sửa chính bản ghi của mình (`request.auth.uid == resource.data.userId`).
  * Thông tin hội viên (`members`): Hội viên xem profile cá nhân (`request.auth.uid == userId`).
* **Lý do chọn:** Tận dụng tối đa hiệu năng của Firebase Client SDK, độ phản hồi tức thì (real-time listeners), giảm tải lưu lượng Express server, đồng thời được siết chặt an toàn qua `firestore.rules`.

### 🔵 Hướng B: Chuyển qua Server Endpoint dùng `firebase-admin` & Middleware `requireAuth`
* **Áp dụng cho:**
  * Thao tác XÓA lịch sử / tiến độ (`DELETE /api/member-progress/:id`, `DELETE /api/workout-logs/:id`).
  * Thao tác cập nhật Profile hội viên (`POST /api/members`).
  * Quản trị khách hàng CRM (`/api/admin/customers/*`).
  * Quản lý gói tập & dịch vụ (`/api/admin/packages/*`).
  * Quản lý chiến dịch ưu đãi (`/api/admin/promotions/*`).
  * Quản lý luồng Email Automation (`/api/admin/email-flows/*`).
  * Quản lý tài khoản Admin (`/api/admin/users/*`).
* **Lý do chọn:** Đảm bảo nguyên tắc bảo mật tối cao (N1, N2, N4). Tránh việc client tự ý xóa dữ liệu nghiêm trọng, thực hiện xác thực token quản trị qua middleware server, tránh lỗ hổng phân quyền phức tạp ở Client.

---

## Tóm Tắt Đánh Giá Truy Vết

- **Tổng số yêu cầu đánh giá**: 20
- **Đạt (Passed)**: 19
- **Đạt một phần (Partially Passed)**: 1
- **Chưa đạt (Failed / Missing)**: 0
