# The Shine Fitness & Yoga

A full-stack application built with React 19 (Vite) and Express (Node.js/TypeScript).

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in the required values:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `ADMIN_EMAILS`: Comma-separated list of authorized administrator Google emails (e.g. `ducnguyen06112002@gmail.com,theshinefitness.cskh@gmail.com`). All `/api/admin/*` endpoints require Firebase Auth ID tokens matching this list.
   - `RAG_ENABLED`: `true` or `false` (enables Retrieval-Augmented Generation).
   - SMTP credentials (`ADMIN_EMAIL`, `GMAIL_APP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

3. **Development**
   Start the unified dev server (Express serving API + Vite as middleware):
   ```bash
   npm run dev
   ```
   
   *Alternatively, if running locally outside AI Studio constraints:*
   ```bash
   npm run dev:server
   npm run dev:client
   ```

4. **Build Knowledge Index (RAG)**
   ```bash
   npm run build:index
   ```

5. **Production Build**
   ```bash
   npm run build
   npm run start
   ```

---

## 3.1. Tổng quan

The Shine Fitness & Yoga là hệ thống tư vấn dịch vụ và chăm sóc khách hàng tự động đa kênh dành cho phòng tập thể thao cao cấp The Shine Fitness tại Hải Phòng. Hệ thống kết hợp giữa trang web tiếp thị thương hiệu, cổng thông tin hội viên tự phục vụ (theo dõi tiến độ tập luyện, lịch tập, điểm danh QR), và trợ lý AI thông minh dựa trên kiến trúc RAG (Retrieval-Augmented Generation). Trợ lý AI có khả năng tự động phân loại nhu cầu, phản hồi chính xác bảng giá - lịch tập - chính sách theo tài liệu tri thức nội bộ, đồng thời tự động bàn giao tư vấn viên trực tiếp (Human Handover) khi gặp các tình huống nhạy cảm hoặc vượt ngưỡng tin cậy.

---

## 3.2. Kiến trúc 5 lớp

Hệ thống được thiết kế phân lớp chặt chẽ nhằm đảm bảo tính mở rộng, bảo mật và dễ bảo trì:

1. **UI Layer (Lớp giao diện người dùng)**:
   - `src/App.tsx`: Layout chính, điều hướng route và tích hợp widget Chatbot.
   - `src/components/Chatbot.tsx`: Cửa sổ trò chuyện tương tác với trợ lý AI, xử lý state tin nhắn và gợi ý nhanh.
   - `src/pages/HomePage.tsx`, `src/pages/ServicesPage.tsx`, `src/pages/SpecialsPage.tsx`, `src/pages/NewsPage.tsx`, `src/pages/ReviewsPage.tsx`, `src/pages/ContactPage.tsx`: Các trang nội dung tiếp thị.
   - `src/components/admin/AdminChatAnalyticsTab.tsx`, `AdminCRMTab.tsx`, `AdminPackagesTab.tsx`, `AdminPromotionsTab.tsx`, `AdminEmailMarketingTab.tsx`: Bảng điều khiển quản trị viên.

2. **Gateway & Backend Layer (Lớp cổng API & Máy chủ)**:
   - `server/src/index.ts`: Entrypoint máy chủ Express, cấu hình middleware Vite, routing endpoint `/api/chat`, `/api/admin/*`, `/api/handover/*`.
   - `server/src/middleware/auth.ts`: Middleware xác thực Bearer Token của Admin qua Firebase Admin Auth.
   - `server/src/passwordValidation.ts`: Kiểm tra mật khẩu quản trị viên.

3. **RAG & Data Layer (Lớp tri thức & Trích xuất dữ liệu)**:
   - `server/src/ragEngine.ts`: Động cơ RAG, nạp chỉ mục `index.json`, tính toán Cosine Similarity vector embedding.
   - `scripts/build_index.ts`: Script offline đọc 6 file Markdown tại `data/knowledge/`, thực hiện chunking và gọi Gemini Embedding API sinh vector.
   - `data/knowledge/*.md` (`01_pricing.md`, `02_schedule.md`, `03_trainer.md`, `04_facility.md`, `05_policy.md`, `06_trial.md`): Kho tri thức gốc đóng gói dạng Markdown có YAML metadata.
   - `data/knowledge/index.json`: File chỉ mục vector đã build sẵn.
   - `server/src/pricingData.ts`: Nguồn dữ liệu cứng về bảng giá, giờ mở cửa, địa chỉ, hotline.
   - `server/src/chatLogStorage.ts`: Lưu vết hội thoại vào `data/chat_logs.csv` và ẩn thông tin cá nhân PII (số điện thoại, email).
   - `server/src/handoverStorage.ts`: Lưu vết hàng đợi chuyển giao tư vấn viên vào `data/handover_queue.csv`.
   - `server/src/csvStorage.ts`: Module đọc/ghi file CSV tổng quát.

4. **LLM & Inference Layer (Lớp mô hình ngôn ngữ lớn)**:
   - `@google/genai`: SDK chính thức của Google Gemini API.
   - `server/src/intentClassifier.ts`: Gọi Gemini phân loại ý định (Intent), gạn lọc nhu cầu (Q1-Q4), phân khúc khách hàng (PK01-PK04) và điểm tin cậy (Confidence).
   - `server/src/chatConsultantKnowledge.ts`: Xây dựng System Instruction cá nhân hóa cho Gemini dựa trên phân khúc khách hàng và ngữ cảnh RAG trích xuất.

5. **Business & Extension Layer (Lớp nghiệp vụ & Mở rộng)**:
   - `server/src/handoverRules.ts`: Quy tắc 5 trigger tự động bàn giao tư vấn viên con người.
   - `server/src/excelDataService.ts`: Đọc/ghi dữ liệu đánh giá và tương tác từ file Excel/CSV.
   - `src/lib/firebase.ts`: Khởi tạo Firebase SDK phía Client (Authentication, Firestore).
   - `server/src/lib/firebase-admin.ts`: Khởi tạo Firebase Admin SDK phía Server.

---

## 3.3. Luồng xử lý một câu hỏi (/api/chat)

Khi khách hàng gửi một câu hỏi qua widget trò chuyện, yêu cầu POST `/api/chat` được xử lý theo 8 bước tuần tự trong `server/src/index.ts`:

1. **Bước 1: Kiểm tra Trigger Chuyển giao Tư vấn viên (Handover Check)**
   - Hàm `checkHandoverTrigger(message, history)` trong `server/src/handoverRules.ts` quét các từ khóa/ngữ cảnh nhạy cảm (khiếu nại, hợp đồng hội viên, tư vấn chuyên sâu HLV, đặt lịch VIP).
   - *Điểm rẽ nhánh*: Nếu khớp trigger, hệ thống lưu hàng đợi qua `addHandoverRecord()`, ghi log qua `appendChatLog()`, và trả về ngay phản hồi chuyển giao cùng thông tin Hotline/Zalo, không gọi LLM.

2. **Bước 2: Phân loại Ý định & Phân khúc (Intent Classification)**
   - Hàm `classify(message, history, ai)` trong `server/src/intentClassifier.ts` gửi prompt tới Gemini để phân loại Intent, nhu cầu gạn lọc (Q1-Q4), phân khúc (PK01-PK04) và điểm tin cậy `confidence`.

3. **Bước 3: Kiểm tra Ngưỡng Tin cậy Thấp (Low Confidence Handover)**
   - *Điểm rẽ nhánh*: Nếu `classification.confidence < 0.4`, hệ thống tự động rẽ nhánh sang Handover tag `LOW_CONFIDENCE`, thông báo AI chưa đủ tin cậy và chuyển tư vấn viên trực tiếp.

4. **Bước 4: Truy vấn Ngữ cảnh Tri thức RAG (RAG Retrieval)**
   - Nếu `RAG_ENABLED === 'true'`, hàm `retrieve(message, ai, { intent, topK: 4 })` trong `server/src/ragEngine.ts` chuyển câu hỏi thành vector embedding và tìm kiếm Cosine Similarity với 28 chunks trong `index.json`.
   - *Điểm rẽ nhánh*: Nếu không tìm thấy chunk nào có độ tương đồng `>= 0.55`, hệ thống tự động rẽ nhánh sang Handover tag `NO_GROUNDING_DATA` để tránh suy đoán/hallucination.

5. **Bước 5: Kiểm tra Bộ nhớ tạm (Cache Check)**
   - Kiểm tra `chatCache` map dựa trên cache key chứa cấu hình RAG, danh sách chunk IDs, ngôn ngữ, xưng hô, phân khúc và tin nhắn.
   - *Điểm rẽ nhánh*: Nếu Cache hit, trả về ngay kết quả đã lưu trong RAM và ghi log.

6. **Bước 6: Xây dựng System Instruction (Prompt Construction)**
   - Hàm `buildConsultantSystemInstruction()` trong `server/src/chatConsultantKnowledge.ts` tổng hợp quy tắc ứng xử, xưng hô anh/chị, gói tập phù hợp phân khúc, và khối văn bản tri thức RAG được trích xuất.

7. **Bước 7: Sinh Phản hồi qua Gemini API (LLM Generation & Fallback)**
   - Gọi `ai.models.generateContent()` với model ưu tiên `gemini-2.5-flash`.
   - *Điểm rẽ nhánh (Fallback)*: Nếu model chính gặp lỗi quota/API, hệ thống tự động fallback sang `gemini-2.0-flash`, rồi tiếp tục fallback sang `gemini-1.5-flash`.

8. **Bước 8: Làm sạch Dữ liệu & Ghi Log (Sanitize & Chat Log)**
   - Hàm `sanitizePii()` trong `server/src/chatLogStorage.ts` thực hiện che giấu PII (số điện thoại thay bằng `09** *** **89`, email thay bằng `d***g@gmail.com`).
   - Hàm `appendChatLog()` lưu bản ghi vào `data/chat_logs.csv` và cập nhật Cache RAM.

---

## 3.4. Biến môi trường

Các biến môi trường được khai báo trong file `/.env.example` và sử dụng trong hệ thống:

| Tên biến | Bắt buộc / Tùy chọn | Mô tả | Giá trị mặc định |
| :--- | :--- | :--- | :--- |
| `PORT` | Bắt buộc | Cổng lắng nghe của máy chủ Express | `3000` |
| `GEMINI_API_KEY` | Bắt buộc | API Key truy cập dịch vụ Google Gemini API | *(Trống)* |
| `RAG_ENABLED` | Tùy chọn | Cờ bật/tắt tính năng RAG vector retrieval | `false` |
| `STORAGE_BACKEND` | Tùy chọn | Lựa chọn backend lưu trữ log & handover (`csv` hoặc `firestore`) | `csv` |
| `ADMIN_EMAIL` | Tùy chọn | Email nhận thông báo quản trị viên | `ducnguyen06112002@gmail.com` |
| `GMAIL_APP_PASSWORD` | Tùy chọn | Mật khẩu ứng dụng Gmail gửi email thông báo | *(Trống)* |
| `SMTP_HOST` | Tùy chọn | Địa chỉ máy chủ SMTP gửi mail | *(Trống)* |
| `SMTP_PORT` | Tùy chọn | Cổng máy chủ SMTP | `587` |
| `SMTP_USER` | Tùy chọn | Tài khoản người dùng SMTP | *(Trống)* |
| `SMTP_PASS` | Tùy chọn | Mật khẩu tài khoản SMTP | *(Trống)* |
| `ADMIN_PASSWORD` | Tùy chọn | Mật khẩu đăng nhập quản trị viên dự phòng | *(Trống)* |

---

## 3.5. Vận hành Knowledge Base

Khi thông tin dịch vụ, bảng giá, lịch lớp hoặc chính sách thay đổi, quy trình cập nhật Kho tri thức tuân thủ các bước sau:

1. **Sửa đổi File Markdown**: Chỉnh sửa file tương ứng trong `data/knowledge/` (`01_pricing.md`, `02_schedule.md`, `03_trainer.md`, `04_facility.md`, `05_policy.md`, `06_trial.md`).
2. **Cập nhật Metadata**: Cập nhật phần YAML header đầu file (`version`, `effective_date`, `updated_by`).
3. **Chạy lại Build Index**: Chạy lệnh `npm run build:index` để sinh lại vector embedding và ghi đè `data/knowledge/index.json`.
4. **Kiểm tra**: Chạy danh sách kịch bản kiểm thử trong `docs/test-checklist.md` để đảm bảo bot phản hồi chính xác tri thức mới.

> **LƯU Ý ĐẶC BIỆT**: Nếu thay đổi bảng giá hoặc thông tin cốt lõi trong `server/src/pricingData.ts`, bắt buộc phải đồng bộ nội dung vào `data/knowledge/01_pricing.md` và chạy lại `npm run build:index`.

---

## 3.6. Bật và tắt RAG

Tính năng RAG được điều khiển qua biến môi trường `RAG_ENABLED` trong `.env`:

- **Bật RAG (`RAG_ENABLED=true`)**: Hệ thống thực hiện tìm kiếm ngữ nghĩa trong `index.json`, chỉ trả lời dựa trên tài liệu trích xuất đạt độ tương đồng `>= 0.55`. Nếu không tìm thấy tri thức đạt ngưỡng, hệ thống tự động chuyển giao tư vấn viên (`NO_GROUNDING_DATA`) để chống bịa đặt/hallucination.
- **Tắt RAG (`RAG_ENABLED=false`)**: Hệ thống vận hành theo chế độ truyền thống, sử dụng System Instruction tĩnh được xây dựng từ `server/src/pricingData.ts` và `server/src/chatConsultantKnowledge.ts`.
- **Khôi phục khi gặp sự cố**: Nếu Gemini Embedding API gián đoạn hoặc file index bị lỗi, quản trị viên chỉ cần đổi `RAG_ENABLED=false` trong file `.env` và khởi động lại server. Chatbot sẽ lập tức quay về chế độ System Instruction tĩnh mà không làm gián đoạn dịch vụ.

---

## 3.7. Bảng KPI Analytics

Bảng điều khiển Admin Analytics (`src/components/admin/AdminChatAnalyticsTab.tsx`) tính toán và hiển thị các chỉ số hiệu năng trực tiếp từ log dữ liệu thật:

| Tên chỉ số | Ý nghĩa | Cách tính trong code | Vị trí xem trong Admin |
| :--- | :--- | :--- | :--- |
| **Tổng hội thoại** (`totalConversations`) | Tổng số phiên tương tác khách hàng | Đếm số lượng `sessionId` duy nhất trong log | Thẻ KPI 1 (Hàng 1) |
| **Tổng tin nhắn** (`totalMessages`) | Tổng lượt hỏi - đáp giữa khách và AI | Đếm tổng số dòng log tin nhắn trong `chat_logs.csv` | Thẻ KPI 2 (Hàng 1) |
| **Sourced Answer Rate** | Tỷ lệ câu trả lời có nguồn trích xuất RAG | `(Số tin nhắn có groundedAnswer = true) / (Tổng tin nhắn không Handover) * 100%` | Thẻ KPI 3 (Hàng 1) |
| **Average Top Similarity** | Độ tương đồng vector trung bình của RAG | Trung bình cộng giá trị `topSimilarity` của các câu trả lời grounded | Thẻ KPI 4 (Hàng 1) |
| **Độ trễ trung bình** (`avgLatencyMs`) | Thời gian xử lý trung bình mỗi tin nhắn | Trung bình cộng cột `latencyMs` của tất cả tin nhắn | Thẻ KPI 5 (Hàng 1) |
| **Độ trễ P95** (`p95LatencyMs`) | Ngưỡng thời gian xử lý của 95% tin nhắn nhanh nhất | Sắp xếp tăng dần `latencyMs`, lấy giá trị tại vị trí index `95%` | Thẻ KPI 6 (Hàng 1) |
| **Tỷ lệ Fallback** (`fallbackRate`) | Tỷ lệ phải dùng model dự phòng | `(Số tin nhắn usedFallback = true) / (Tổng tin nhắn) * 100%` | Thẻ KPI 7 (Hàng 1) |
| **Tỷ lệ Handover** (`handoverRate`) | Tỷ lệ yêu cầu chuyển giao tư vấn viên | `(Số phiên hội thoại có handoverTag) / (Tổng hội thoại) * 100%` | Thẻ KPI 8 (Hàng 1) |

---

## 3.8. Hạn chế đã biết (Known Limitations)

Trong quá trình điều tra mã nguồn, các hạn chế kỹ thuật sau đã được ghi nhận trung thực:

1. **Bất đồng bộ quy tắc voucher & InBody**: Một số giao diện Admin CRM và mẫu kịch bản Email Marketing trong `src/` còn chứa nội dung đo InBody miễn phí hoặc mã voucher dạng chuỗi ký tự, trong khi Kho tri thức chuẩn hóa RAG (`data/knowledge/`) nghiêm cấm đo InBody và cấm mã voucher ký tự.
2. **Frontend Import trực tiếp từ Backend**: File `src/pages/SpecialsPage.tsx` đang import trực tiếp đối tượng `PRICING` từ `../../server/src/pricingData`. Điều này khiến mã backend bị đóng gói chung vào bundle phía client.
3. **Trigger Handover dựa trên Từ khóa**: Việc phát hiện nhu cầu chuyển giao tư vấn viên ở Bước 1 chủ yếu dựa trên trùng khớp từ khóa (Keyword matching). Các câu hỏi diễn đạt ẩn ý hoặc dùng từ địa phương phức tạp có thể vượt qua Bước 1 và cần đến sự can thiệp của ngưỡng `LOW_CONFIDENCE` ở Bước 3.
4. **Lưu trữ Log Đa Backend (CSV & Firestore)**: Dữ liệu log hội thoại (`chat_logs`) và hàng đợi chuyển giao (`handover_queue`) mặc định lưu dạng file CSV. Đã được nâng cấp hỗ trợ backend Firestore server-side thông qua cấu hình `STORAGE_BACKEND=firestore` để duy trì dữ liệu bền vững khi máy chủ khởi động lại.
5. **Nạp Index RAG vào Bộ nhớ RAM**: Động cơ RAG nạp file `index.json` vào RAM một lần khi khởi động máy chủ. Khi cập nhật `index.json`, cần restart máy chủ Express để nhận dữ liệu mới.

---

## 3.9. Quy trình & KPI Hàng đợi Chuyển giao Tư vấn viên (Step 10 Stateful Handover Queue)

Ở Bước 10, hàng đợi chuyển giao tư vấn viên (`data/handover_queue.csv`) đã được nâng cấp từ file ghi đơn thuần thành một **quy trình xử lý có trạng thái (Stateful Workflow)** kết hợp tính toán chỉ số KPI tự động:

### 1. Vòng đời 5 Trạng thái (State Machine)
Bản ghi chuyển giao chuyển đổi trạng thái một chiều (Forward-only):
- **`CHO_TIEP_NHAN`** (Chờ tiếp nhận): Trạng thái khởi tạo tự động từ `/api/chat` khi kích hoạt trigger.
- **`DANG_XU_LY`** (Đang xử lý): Tư vấn viên nhấn nút **"Tiếp nhận"** để nhận trách nhiệm hỗ trợ khách hàng.
- **`DA_LIEN_HE`** (Đã liên hệ): Tư vấn viên hoàn thành gọi điện/nhắn tin Zalo với khách và nhấn **"Đã liên hệ"**.
- **`THANH_CONG`** (Thành công): Khách hàng đồng ý mua gói/chốt lịch/giải quyết khiếu nại.
- **`KHONG_THANH_CONG`** (Không thành công): Khách hủy/không nghe máy/sai SĐT (Bắt buộc nhập lý do chi tiết `note`).

### 2. Định mức SLA & Cảnh báo Quá hạn (SLA Rules & Breach)
Mỗi loại trigger có thời hạn cam kết phản hồi (SLA Target):
- `COMPLAINT` / `HEALTH_RISK`: **2 giờ** (Ưu tiên khẩn cấp).
- `REQUEST_HUMAN` / `HOT_LEAD_OR_NEGOTIATION`: **4 giờ**.
- `LOW_CONFIDENCE` / `NO_GROUNDING_DATA`: **24 giờ**.

*Khi vượt hạn SLA mà chưa chuyển sang `DA_LIEN_HE`, hệ thống tự động đánh dấu cờ **Overdue**, đồng thời vi phạm SLA (`slaBreachRate`)*. Đối với tag `COMPLAINT` và `HEALTH_RISK`, UI Admin sẽ hiển thị hiệu ứng cảnh báo nhấp nháy màu đỏ khẩn cấp.

### 3. Bộ Chỉ Số KPI Handover
- **Handover Success Rate**: `(Số ca THANH_CONG) / (Số ca THANH_CONG + KHONG_THANH_CONG) * 100%`
- **Avg Time to Contact**: Thời gian trung bình (phút) từ lúc tạo yêu cầu đến mốc `DA_LIEN_HE`.
- **SLA Breach Rate**: `(Số ca quá hạn SLA) / (Tổng số ca) * 100%`
- **Open Handovers**: Tổng số ca đang ở trạng thái `CHO_TIEP_NHAN`, `DANG_XU_LY`, hoặc `DA_LIEN_HE`.

### 4. Ghi đĩa an toàn (Atomic File Writing)
Mọi thao tác cập nhật trạng thái qua `PATCH /api/admin/handover-queue/:id` đều được bảo vệ bởi middleware `requireAuth`, sao lưu file CSV hiện tại vào `data/backup/handover_queue_backup_<timestamp>.csv` và thực hiện ghi qua file tạm (`.tmp`) rồi đổi tên để đảm bảo tính toàn vẹn dữ liệu.

