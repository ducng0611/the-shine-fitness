# Publish website The Shine Fitness bằng Google AI Studio

Mục tiêu: **Import từ GitHub → Publish → dùng được ngay**, không phải khai báo biến nào. Cấu hình mặc định không bí mật nằm sẵn trong file `.env.production` của repo.

## 1. Import và publish

1. Repo GitHub phải là **Private** (lịch sử cũ còn tin nhắn Facebook đã gỡ). Code nằm ở nhánh `main`.
2. Mở [Google AI Studio](https://aistudio.google.com) → **Build** → nút **+** → **Import from GitHub** → chọn `the-shine-fitness` → **Import repository**.
3. Bấm **Publish / Deploy** → Cloud Run.

`GEMINI_API_KEY` do AI Studio tự cấp. App dùng sẵn Firebase project `golden-ether-p6pck` (file `firebase-applet-config.json`); nếu AI Studio hỏi, giữ project này để không mất dữ liệu hội viên.

## 2. Những gì chạy ngay sau khi publish

| Người dùng | Có ngay |
|---|---|
| Khách | Website, chatbot tư vấn dịch vụ (giá, lịch, đăng ký tập thử, chuyển nhân viên) |
| Hội viên đăng nhập (email đã xác minh) | Nút **Shine Companion**: Hỏi đáp (AI Gym Buddy, kiến thức và dữ liệu của chính mình), Hồ sơ, Nhật ký, ghi bữa ăn, phân tích ảnh món ăn, không gian Training |
| Quản trị (email trong `ADMIN_EMAILS`) | Trang admin, tab **Quản trị gym** |

Cấu hình đang bật trong `.env.production`: trợ lý hội viên, Hỏi đáp đọc dữ liệu riêng, Training cho **mọi** hội viên đã xác minh email (`SHINE_TRAINING_PILOT_UIDS=*`), lưu nhật ký chat trên Firestore, RAG. Quản trị: `ducnguyen06112002@gmail.com`, `theshinefitness.cskh@gmail.com`.

Muốn đổi một giá trị: khai báo cùng tên trong AI Studio → Settings → Secrets (ưu tiên hơn file), hoặc sửa `.env.production`. Cờ bắt đầu bằng `VITE_` cần publish lại mới có hiệu lực.

## 3. Không bắt buộc (bật khi cần)

Thêm vào AI Studio → Settings → Secrets, **không** ghi vào `.env.production`:

| Biến | Dùng cho |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` hoặc `ADMIN_EMAIL` + `GMAIL_APP_PASSWORD` | Gửi email từ trang admin |
| `USDA_FDC_API_KEY` | Tra năng lượng món ăn theo cơ sở dữ liệu USDA |
| `GOOGLE_PLACES_API_KEY` | Nút "Quán gần đây" |

Thiếu các key này, phần tương ứng báo chưa khả dụng; phần còn lại vẫn chạy.

## 4. Xếp buổi tập theo máy của phòng tập

"Tạo buổi tập cho tôi" dùng sẵn danh mục `data/companion/the-shine-catalogue.json`: 25 thiết bị theo danh sách kiểm kê của phòng tập và 35 bài tập phổ biến tương ứng (mỗi máy có bài tương tự để thay khi máy bận). Trợ lý chọn tối đa 6 bài, cân bằng chân/đẩy/kéo/bụng, theo trình độ và thời gian hội viên có. Danh mục chưa ghi vị trí từng máy nên trợ lý nói "hỏi lễ tân hoặc HLV". Quản trị sửa hoặc thay danh mục trong tab **Quản trị gym**; bản đã lưu trên Firestore luôn được ưu tiên hơn file mặc định.

Danh sách việc còn lại và prompt dán sẵn cho AI Studio: [viec-can-lam.vi.md](viec-can-lam.vi.md).

## 5. Nếu có lỗi sau khi publish

- **Đăng nhập báo `auth/unauthorized-domain`**: Firebase Console → Authentication → Settings → Authorized domains → thêm tên miền web vừa publish.
- **Hội viên đang chat bị mất phiên**: Cloud Run → service → Edit → Maximum instances = 1 (phiên chat Buddy lưu trong bộ nhớ một máy chủ).
- **Muốn tắt trợ lý hội viên**: đặt `VITE_SHINE_COMPANION_ENABLED=false` và `SHINE_COMPANION_ENABLED=false` rồi publish lại; khách và hội viên đều quay về chatbot tư vấn.
- **Quay về bản trước**: Cloud Run → Revisions → chuyển 100% traffic về revision cũ.

Firestore rules (`firestore.rules`) chỉ ảnh hưởng truy cập trực tiếp từ trình duyệt; dữ liệu trợ lý hội viên đi qua máy chủ. Khi cần cập nhật rules, xem [firestore-deploy.md](firestore-deploy.md).

## Không deploy

`Local Pilot` (SQLite, `npm run local:*`) chỉ để kiểm thử trên máy tin cậy với tài khoản QA. Không đưa database SQLite hoặc file `*.PRIVATE.*` lên GitHub hay cloud.
