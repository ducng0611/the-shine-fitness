# Việc cần làm để publish (dành cho chủ dự án)

Đánh dấu `[x]` khi xong. Chi tiết kỹ thuật: [deploy-ai-studio.vi.md](deploy-ai-studio.vi.md).

## A. Trên GitHub

- [ ] **Chuyển repo sang Private**: GitHub → `the-shine-fitness` → Settings → General → Danger Zone → Change visibility → Private. Lịch sử cũ vẫn còn tin nhắn Facebook đã gỡ.
- [ ] **Merge PR `integration/all-features` → `main`** khi CI xanh. AI Studio lấy code từ `main`.

## B. Trên Google AI Studio

- [ ] Build → **+** → **Import from GitHub** → chọn `the-shine-fitness` → dán **Prompt 1** vào ô chat → Import.
- [ ] **Publish / Deploy** (Cloud Run).
- [ ] Mở web vừa publish, kiểm tra theo mục "Kiểm tra nhanh" bên dưới.

## C. Email SMTP (làm sau, khi có hộp thư gửi)

- [ ] Chọn hộp Gmail dùng để gửi (ví dụ `theshinefitness.cskh@gmail.com`). Bật **xác minh 2 bước** cho tài khoản đó.
- [ ] Tạo **mật khẩu ứng dụng**: https://myaccount.google.com/apppasswords → đặt tên "The Shine Web" → Google hiện 16 ký tự. Chép lại ngay (Google chỉ hiện một lần).
- [ ] AI Studio → dự án → **Settings → Secrets**, thêm:
  - `ADMIN_EMAIL` = địa chỉ Gmail gửi
  - `GMAIL_APP_PASSWORD` = 16 ký tự vừa tạo (bỏ dấu cách)
- [ ] Dán **Prompt 2** vào khung chat AI Studio rồi publish lại.
- [ ] Kiểm tra: gửi thử form **Liên hệ** trên website → hộp thư `ADMIN_EMAIL` nhận được thư.

Không dán mật khẩu ứng dụng vào khung chat, vào code, hay vào `.env.production`.

## D. Không bắt buộc

- [ ] `USDA_FDC_API_KEY` (tra calo món ăn) và `GOOGLE_PLACES_API_KEY` (quán gần đây): thêm vào Secrets nếu muốn dùng.
- [ ] Ghi vị trí thực tế từng máy (tầng/khu, cách tìm) trong Shine Companion → **Quản trị gym**. Hiện trợ lý ghi "hỏi lễ tân hoặc HLV" thay cho vị trí.
- [ ] Nếu đăng nhập báo `auth/unauthorized-domain`: Firebase Console → Authentication → Settings → Authorized domains → thêm tên miền web.

## Kiểm tra nhanh sau khi publish

1. Chưa đăng nhập: mở chatbot, hỏi "Giá gói tập 1 tháng?" → có câu trả lời.
2. Đăng nhập hội viên (email đã xác minh) → có nút **Shine Companion**.
3. Tab **Hỏi đáp**: hỏi "Protein là gì?" → có trả lời kèm nguồn.
4. Tab **Hồ sơ**: tạo hồ sơ, đồng ý quyền riêng tư → tab **Đồng hành** → "Tạo buổi tập cho tôi" → ra buổi tập theo máy của phòng. Đánh dấu một máy "đang bận" → bài đổi sang máy khác tương tự.
5. Đăng xuất → chatbot quay về chế độ khách.

---

## Prompt 1 — dán khi Import from GitHub

```text
Đây là dự án full-stack có sẵn (React + Vite, máy chủ Express trong server/src, build bằng "npm run build", chạy bằng "npm start" trên PORT, mặc định 3000). Code đã được kiểm thử; hãy chạy đúng như hiện có.

Yêu cầu:
- KHÔNG refactor, đổi cấu trúc thư mục, đổi framework hay viết lại file.
- KHÔNG sửa hoặc xóa: .env.production, firebase-applet-config.json, firestore.rules, package-lock.json, thư mục data/ và tests/.
- Giữ Firebase project hiện có trong firebase-applet-config.json; không tạo project Firebase mới.
- GEMINI_API_KEY chỉ dùng phía máy chủ; không đưa vào biến VITE_* hay code phía trình duyệt.
- Nếu build lỗi, báo lỗi và file liên quan cho tôi trước khi sửa; chỉ sửa tối thiểu để build chạy.
- Không cần bật hay tắt tính năng nào: cấu hình mặc định nằm trong .env.production.
```

## Prompt 2 — dán khi đã thêm Secrets email

```text
Tôi đã thêm hai Secrets: ADMIN_EMAIL (Gmail gửi thư) và GMAIL_APP_PASSWORD (mật khẩu ứng dụng Google). Code gửi email đã có sẵn trong server/src/index.ts (hàm getEmailTransporter, dùng nodemailer service "gmail"); khi có GMAIL_APP_PASSWORD máy chủ tự dùng Gmail thay cho chế độ chỉ ghi log.

Yêu cầu:
- KHÔNG sửa code gửi email và không in giá trị Secrets ra log hay giao diện.
- Kiểm tra máy chủ đọc được ADMIN_EMAIL và GMAIL_APP_PASSWORD sau khi khởi động lại (chỉ báo "có/không có", không in giá trị).
- Publish lại, sau đó hướng dẫn tôi gửi thử form Liên hệ để xác nhận thư đến hộp ADMIN_EMAIL.
- Nếu gửi lỗi (ví dụ 535 Username and Password not accepted), giải thích nguyên nhân thường gặp: chưa bật xác minh 2 bước, sai mật khẩu ứng dụng, hoặc còn dấu cách trong mật khẩu.
```
