# Publish website The Shine Fitness bằng Google AI Studio

Tài liệu này dành cho người vận hành, không cần biết lập trình. Làm theo thứ tự từ trên xuống.

## 0. Trước khi bắt đầu

1. **Chuyển repo GitHub sang Private**: GitHub → repo `the-shine-fitness` → Settings → General → Danger Zone → Change visibility → Private. Lịch sử cũ của repo vẫn còn tin nhắn Facebook đã gỡ, vì vậy repo không được để Public.
2. **Merge code vào `main`**: toàn bộ tính năng nằm trên nhánh `integration/all-features`. Merge Pull Request của nhánh này vào `main` sau khi CI xanh. AI Studio sẽ lấy code từ `main`.
3. Chuẩn bị danh sách **email quản trị** (người được vào trang admin và tab "Quản trị gym").

## 1. Nhập repo vào AI Studio

1. Mở [Google AI Studio](https://aistudio.google.com) → **Build**.
2. Ở ô nhập prompt, bấm **+** (Add files) → **Import from GitHub**.
3. Cho phép AI Studio truy cập GitHub (repo private cần bước này), chọn `the-shine-fitness`, nhánh `main` → **Import repository**.
4. AI Studio tự nhận dạng dự án React + máy chủ Node (Express). Không cần sửa code.

App dùng Firebase project `golden-ether-p6pck` (file `firebase-applet-config.json`). Nếu AI Studio đề nghị tạo Firebase mới, giữ project hiện tại để không mất dữ liệu hội viên đang có.

## 2. Khai báo biến môi trường (AI Studio → Settings → Secrets)

`GEMINI_API_KEY` được AI Studio tự cấp. Không bao giờ dán key vào code hoặc vào biến bắt đầu bằng `VITE_`.

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `ADMIN_EMAILS` | `a@x.com,b@y.com` | Email quản trị, cách nhau dấu phẩy |
| `STORAGE_BACKEND` | `firestore` | Bắt buộc khi chạy trên cloud; `csv` sẽ mất dữ liệu khi máy chủ khởi động lại |
| `RAG_ENABLED` | `true` hoặc `false` | Chatbot tư vấn đọc tài liệu nội bộ |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` hoặc `GMAIL_APP_PASSWORD` | theo hộp thư gửi | Chỉ cần nếu dùng gửi email |
| `USDA_FDC_API_KEY` | key USDA | Tra năng lượng món ăn (Companion) |
| `GOOGLE_PLACES_API_KEY` | key Google Places | Tìm quán gần đây (Companion) |

## 3. Bật tính năng theo 2 giai đoạn

Mọi cờ mặc định `false`. Cờ bắt đầu bằng `VITE_` được gắn vào giao diện **lúc build**: đổi xong phải build/deploy lại. Cờ không có `VITE_` là của máy chủ: đổi xong phải khởi động lại. Mỗi tính năng cần **cả hai** cờ cùng `true`.

**Giai đoạn 1: website + chatbot khách** — giữ mọi cờ `false`. Khách dùng chatbot tư vấn dịch vụ như hiện nay.

**Giai đoạn 2: trợ lý hội viên** (khách vẫn dùng chatbot tư vấn; hội viên đăng nhập thấy "Shine Companion" gồm Hỏi đáp, Đồng hành, Hồ sơ, Nhật ký):

```dotenv
SHINE_COMPANION_ENABLED=true
VITE_SHINE_COMPANION_ENABLED=true
SHINE_CHAT_ENABLED=true
VITE_SHINE_CHAT_ENABLED=true
SHINE_CHAT_MEMBER_CONTEXT_ENABLED=true
SHINE_TRAINING_ENABLED=true
VITE_SHINE_TRAINING_ENABLED=true
SHINE_TRAINING_PILOT_UIDS=<Firebase UID của hội viên được dùng thử, cách nhau dấu phẩy>
```

Nếu AI Studio không truyền biến `VITE_` vào bước build, tạo file `.env.production` ở thư mục gốc (trong AI Studio) chỉ chứa các dòng `VITE_...=true`. Các cờ này không phải bí mật; key và mật khẩu vẫn chỉ nằm trong Secrets.

## 4. Firestore: rules và index

Làm một lần sau khi import, và mỗi khi `firestore.rules` thay đổi. Người có quyền Owner của Firebase project thực hiện theo [docs/firestore-deploy.md](firestore-deploy.md) (sao lưu → backfill → deploy rules → kiểm tra). Index cần tạo: `firestore.indexes.json` và `firestore.training.indexes.json`.

## 5. Deploy

Trong AI Studio bấm **Deploy** → **Cloud Run**. Sau khi có đường dẫn, gắn tên miền riêng trong Cloud Run nếu cần.

Cấu hình Cloud Run cần giữ:

- **Max instances = 1**. Phiên chat của AI Gym Buddy lưu trong bộ nhớ một máy chủ; nhiều máy chủ sẽ làm hội viên mất phiên giữa chừng.
- **Request timeout ≥ 60 giây**: câu trả lời chat được truyền dần (streaming).

## 6. Danh mục máy và giáo án cho trợ lý hội viên

Trợ lý chỉ xếp buổi tập từ danh mục máy/bài tập trong **Firestore** đã được đánh dấu duyệt, có tên người duyệt và ngày duyệt. Các file trong `data/companion`, `data/nutrition`, `data/training-pathways` là bản lưu trữ nguồn số hóa, không tự nạp lên website. Quản trị viên đăng nhập → Shine Companion → **Quản trị gym** để nạp và duyệt danh mục.

## 7. Kiểm tra sau khi publish

- Khách chưa đăng nhập: mở chatbot, hỏi giá gói tập → trả lời được, không thấy dữ liệu hội viên.
- Hội viên đăng nhập (giai đoạn 2): thấy nút "Shine Companion"; tab Hỏi đáp trả lời "Protein là gì?"; hỏi "Tôi đã tập gì tuần này?" chỉ đọc dữ liệu của chính mình.
- Đăng xuất: chatbot quay về chế độ khách, không còn nội dung hội viên.
- Trang admin chỉ mở với email trong `ADMIN_EMAILS`.

## 8. Quay lui khi có sự cố

Tắt cờ tính năng (đặt về `false`) rồi deploy lại: website trở về chatbot khách như trước. Muốn về hẳn bản cũ: Cloud Run → Revisions → chuyển 100% traffic về revision trước.

## Không deploy

`Local Pilot` (SQLite, `npm run local:*`, `start-local.*`) chỉ để kiểm thử trên máy tin cậy với tài khoản QA. Không đưa database SQLite hoặc file `*.PRIVATE.*` lên GitHub hay cloud.
