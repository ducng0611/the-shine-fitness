# Quy Trình Deploy Firestore Rules An Toàn (The Shine Fitness)

Tài liệu hướng dẫn quy trình 5 bước triển khai tập luật bảo mật `firestore.rules` lên môi trường Production mà không gây gián đoạn dịch vụ hoặc hỏng dữ liệu.

---

## 📋 Danh Sách Chuẩn Bị & Cờ Kiểm Tra
- [ ] Quyền Quản trị viên (Firebase Admin / Owner Project)
- [ ] Cài đặt sẵn Firebase CLI (`npm install -g firebase-tools` & `firebase login`)
- [ ] Nguồn lưu giữ file `firestore.rules` dự phòng (Rollback Source)

---

## 🚀 Quy Trình Deploy 5 Bước

### Bước 1: Kiểm Tra Backup Dữ Liệu Tự Động (Hoặc Manual Export)
Trước khi áp dụng bất kỳ thay đổi về phân quyền rules, hãy đảm bảo hệ thống đã có bản sao lưu Firestore:
1. Truy cập [Firebase Console](https://console.firebase.google.com) > **Firestore Database** > **Backups**.
2. Kiểm tra bản sao lưu tự động gần nhất trong vòng 24 giờ.
3. *(Tùy chọn)* Thực hiện gcloud export nếu cần sao lưu thủ công:
   ```bash
   gcloud firestore export gs://[YOUR_BUCKET_NAME]/backups/pre-rules-deploy
   ```

---

### Bước 2: Chạy Script Chuẩn Bổ Sung Khóa Chủ Sở Hữu (Backfill Owner Fields)
Một số document cũ trong các collection như `member_progress`, `workout_logs`, `check_ins` có thể thiếu trường `userId` hoặc `uid`. Run script backfill để cập nhật:

1. **Chạy thử nghiệm (Dry-Run Mode):**
   ```bash
   npm run backfill:owner
   ```
   *Mục đích:* Kiểm tra số lượng document cần cập nhật, danh sách collection ảnh hưởng mà KHÔNG ghi bất kỳ dữ liệu nào.

2. **Áp dụng cập nhật thật (Apply Mode):**
   ```bash
   npm run backfill:owner -- --apply
   ```
   *Ghi chú:* Script sẽ tự động xuất dữ liệu backup cũ ra `data/backup/owner_backfill_<timestamp>.json` trước khi ghi batch vào Firestore.

---

### Bước 3: Triển Khai Tập Luật Firestore Rules
Thực hiện deploy tập luật bảo mật lên Firebase Cloud Project:
```bash
firebase deploy --only firestore:rules
```
*Thời gian có hiệu lực:* Thường từ 10 - 30 giây sau khi lệnh deploy hoàn tất thành công.

---

### Bước 4: Kiểm Tra Smoke Test
Tiến hành kiểm tra các chức năng trọng yếu theo tài liệu checklist `docs/test-checklist.md`:
1. **Khách vô danh / Khách vãng lai:**
   - Đăng ký tập thử 3 ngày (Ghi `registrations`): ✅ Phải thành công.
   - Làm bài đánh giá sức khỏe InBody (Ghi `health_assessments`): ✅ Phải thành công.
   - Truy cập danh sách hội viên / Admin: ❌ Phải bị từ chối (403 / Permission Denied).
2. **Hội viên đã đăng nhập:**
   - Xem và ghi `member_progress` cá nhân: ✅ Phải thành công.
   - Xem và ghi `workout_logs` cá nhân: ✅ Phải thành công.
   - Thử xóa hoặc sửa `member_progress` của hội viên khác: ❌ Phải bị từ chối.
3. **Ban Quản Lý / Admin:**
   - Xem danh sách CRM khách hàng (`/api/admin/customers/unified`): ✅ Phải thành công qua Express Server Admin SDK.
   - Thao tác gói tập, khuyến mãi, chiến dịch email: ✅ Thành công qua Server Endpoint.

---

### Bước 5: Phương Án Rollback Nhanh Khi Có Sự Cố
Nếu phát hiện lỗi hệ thống trong quá trình smoke test:
1. File rules dự phòng khẩn cấp được lưu trữ tại `firestore.rules.bak` (hoặc commit Git trước đó).
2. Khôi phục nhanh rules cũ qua Firebase CLI:
   ```bash
   cp firestore.rules.bak firestore.rules
   firebase deploy --only firestore:rules
   ```
3. Nếu cần khôi phục dữ liệu từ backup script:
   - File JSON backup nằm tại: `data/backup/owner_backfill_<timestamp>.json`.

---

*Tài liệu thuộc Quy trình Bàn giao Hệ thống The Shine Fitness - Giai đoạn 9.*
