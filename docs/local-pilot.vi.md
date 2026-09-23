# The Shine Local Pilot: chạy không dùng Firebase

## 1. Phạm vi
Chế độ nghiệm thu độc lập dùng Node.js, Express, SQLite và lõi AI Gym Buddy hiện có. Khởi động bằng `local:start`, không phải `npm run dev`. Entry point và giao diện local không nạp Firebase. Ứng dụng chính, dữ liệu cloud và trạng thái duyệt giáo án/meal plan được giữ nguyên. Đây không phải di chuyển toàn bộ website/CRM khỏi Firebase.

Nhánh `feat/local-pilot-sqlite`, dựa trên `176ac2f8be90d2c2c4378d03722dc49f7315683b`. Không merge main hoặc triển khai công khai.

## 2. Kiến trúc
```text
React Local Pilot -> đăng nhập email/mật khẩu -> Express LocalAuth
  -> cookie HttpOnly + CSRF + ràng buộc phiên hiển thị
  -> BuddyRouter dùng danh tính server
      -> thư viện kiến thức công khai
      -> TrainingService -> SQLiteTrainingStore -> SQLite
      -> Gemini tùy chọn, mặc định tắt

CLI seed -> hồ sơ nguồn QA riêng theo UID
Giáo án tham chiếu không trở thành buổi đã hoàn thành.
```

SQLite có bảng local_users, local_sessions, local_documents. TrainingStore giữ hợp đồng đọc/truy vấn/transaction của module training. Hàng đợi chung ngăn thao tác đăng nhập xen vào transaction tập luyện; kiểm tra read-before-write, giới hạn truy vấn, rollback và revision vẫn có hiệu lực.

## 3. Chạy từ repo
Đã kiểm tra với Node 22.16.0 và node:sqlite. Chọn bản vá được hỗ trợ tương thích trên máy riêng; không dùng Node 20. SQLite có thể hiện cảnh báo experimental. Chưa kiểm thử Windows/macOS vật lý.

```bash
git fetch origin
git switch feat/local-pilot-sqlite
npm ci --ignore-scripts
npm run local:build
```

File manifest QA nằm ngoài Git. Trong Bash, nhập mật khẩu kín:
```bash
read -r -s -p "Mat khau QA: " SHINE_LOCAL_QA_PASSWORD
printf '\n'
export SHINE_LOCAL_QA_PASSWORD
npm run local:seed -- --manifest /duong/dan/rieng/qa-cases.PRIVATE.json \
  --db /duong/dan/rieng/shine-pilot.sqlite \
  --out /duong/dan/rieng/accounts.CREATED.json
```

Tạo `.env.local-pilot` tại thư mục gốc:
```dotenv
SHINE_LOCAL_DB=/duong/dan/rieng/shine-pilot.sqlite
SHINE_LOCAL_PORT=4176
SHINE_LOCAL_ALLOW_MODEL=false
```

Chạy `npm run local:start`, mở `http://127.0.0.1:4176`. Localhost là chính máy chạy chương trình, không phải website do trợ lý host. Không đổi giữa localhost và 127.0.0.1 khi đang dùng cookie.

Bản ZIP runtime riêng tư đã build có thể chạy bằng `start-local.cmd` hoặc `bash start-local.sh` sau khi cài Node, không cần npm install. Database và tài khoản đã tạo chỉ có trong bộ riêng tư, không có trong public patch/repo.

## 4. Tài khoản và bảo mật
Chỉ tạo tài khoản qua CLI, không có đăng ký công khai. Mật khẩu dùng salt riêng và scrypt N=131072, r=8, p=1; không lưu nguyên văn trong database. Email example.invalid là định danh QA, không phải hộp thư hay xác minh email khách thật.

Cookie ngẫu nhiên chỉ lưu hash trên server, HttpOnly, SameSite=Strict; tối đa 8 giờ và hết hạn sau 30 phút không hoạt động. Có giới hạn đăng nhập, Origin/Host chính xác và CSRF. Server chỉ bind loopback HTTP nên cookie không dùng Secure trong chế độ này. Không mở cổng Internet/LAN hoặc tunnel; triển khai HTTPS cần cấu hình và nghiệm thu riêng.

Mỗi tab gửi mã phiên hiển thị: cookie đã đổi tài khoản mà UI cũ chưa cập nhật thì server từ chối. BroadcastChannel chỉ truyền tín hiệu đổi phiên, không truyền hồ sơ/token. Logout/reset hủy stream và chặn phản hồi muộn; không có transcript/token ở localStorage.

SQLite không mã hóa. Quyền file/thư mục không thay mã hóa ổ đĩa. Người đọc được database có thể đọc snapshot. Bảo vệ máy và bản sao; không upload database hoặc ZIP riêng tư lên GitHub. Không cấp quyền admin cho tài khoản QA.

## 5. Dữ liệu nguồn và phạm vi sử dụng
Năm trường hợp là bản sao QA được phép dùng, không khôi phục định danh khách. Tuổi/số đo là snapshot nguồn, không phải measurement hiện tại.

Hồ sơ người lớn có defaults QA được ghi rõ: beginner, 35 phút, consent của người nghiệm thu. Không giả là lời đồng ý của khách thật hay chỉ dẫn PT. Trường hợp chưa sàng lọc hiện tại hoặc có lưu ý sức khỏe giữ yêu cầu review, không phải chẩn đoán.

Thiếu niên giữ đúng tuổi, không có profile người lớn và không được cấp adult planner. Họ vẫn hỏi kiến thức chung và xem snapshot của chính case qua cổng QA. Cờ tuổi/review do server đọc, không phụ thuộc câu test có tự khai tuổi.

programId chỉ liên kết nguồn. assignedProgramId và mealPlanAssignment vẫn null. Không seed buổi tập/measurement mới, không gán meal theo mục tiêu, không biến giáo án thành lịch sử hoàn thành. Đọc PT notes/meal plan được gán và điều chỉnh lộ trình chưa được tích hợp.

Pilot người lớn có hạn bảy ngày từ lúc tạo. Hết hạn không xóa account nhưng chặn đọc training. Seed lại không gia hạn, reset mật khẩu hoặc ghi đè nguồn; thay đổi cần quản trị review riêng.

## 6. Gemini
Model mặc định tắt; hỏi thẻ kiến thức và đọc dữ kiện vẫn hoạt động, câu ngoài nguồn báo thiếu. Để chủ động thử model, cấu hình server riêng:
```dotenv
SHINE_LOCAL_ALLOW_MODEL=true
GEMINI_API_KEY=<key-cua-ban>
SHINE_CHAT_MODEL=<model-kha-dung-trong-tai-khoan>
SHINE_CHAT_FALLBACK_MODEL=
```
Khởi động lại. Không đặt key trong VITE, Git hoặc file công khai. Kết quả bàn giao chưa đánh giá chất lượng/latency Gemini thật.

## 7. Kiểm thử
```bash
npm run local:test
bash scripts/local/verify.sh
node scripts/local/acceptance.mjs --local \
  --accounts /duong/dan/rieng/accounts.CREATED.json \
  --origin http://127.0.0.1:4176 \
  --out /duong/dan/rieng/acceptance.RESULT.json
unset SHINE_LOCAL_QA_PASSWORD
```

Acceptance đăng nhập thật local, tạo session, gửi câu hỏi và kiểm tra cách ly. Không giả token Firebase, không ghi câu test thành bệnh/buổi tập. Báo cáo không chứa token/mật khẩu/toàn bộ hội thoại sức khỏe.

Browser suite tests/local/browser.py kiểm tra UI đã build, cookie thật, hồ sơ riêng, reload, logout, đổi tab và mobile390. CI chỉ dùng dữ liệu tổng hợp và password ngẫu nhiên trong database tạm. Không nhập PRIVATE vào Actions.

## 8. Tắt và quay lại hệ thống cũ
Dừng Ctrl+C trước khi sao lưu SQLite; không copy một mình file khi WAL đang ghi. Không upload database lên repo. Chạy entry point npm run dev với cấu hình cũ để dùng Firebase; không có fallback ngầm giữa hai hệ thống.

Chưa có reset mật khẩu/email, backup tự động, đa instance, quản lý bệnh án, meal planner đầy đủ hoặc toàn bộ Training UI trong local. API training có kiểm thử riêng; màn hình snapshot không giả là form hoàn thành workout.

## 9. Tài liệu kỹ thuật
- https://nodejs.org/download/release/v22.16.0/docs/api/sqlite.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

Đây là tài liệu tham khảo thiết kế, không phải chứng nhận audit. Xem local-pilot-verification.vi.md để biết lớp nào đã thực sự chạy.
