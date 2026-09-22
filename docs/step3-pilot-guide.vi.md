# Bước 3: hướng dẫn bật pilot

Bản này dùng nhánh `feat/member-memory-adaptive-workout`, dựa trên `main` có Gym Knowledge mới. Không cần merge nhánh Companion cũ. Chưa triển khai production.

## 1. Kiểm tra mã nguồn

```bash
npm ci --ignore-scripts
npm run test:training
npm run typecheck:training
npm run lint
npm run build
```

## 2. Cấu hình trên staging

```dotenv
SHINE_TRAINING_ENABLED=true
VITE_SHINE_TRAINING_ENABLED=true
SHINE_TRAINING_PILOT_UIDS=<Firebase UID duoc phep thu nghiem>
SHINE_TRAINING_INTENT_MODEL=
```

Hai cờ bật mặc định `false`. Sau khi đổi biến `VITE_*`, cần build lại. Không đưa API key vào biến `VITE_*`.

Dùng Firebase Admin của backend hiện tại. Đăng nhập Firebase thật với email đã xác minh; OTP mô phỏng phía trình duyệt không đủ quyền. UID hội viên đang chọn phải khớp UID Firebase.

`SHINE_TRAINING_PILOT_UIDS` là danh sách UID cách nhau bằng dấu phẩy. Cách khác: quản trị tạo `training_access/{uid}` với `enabled: true`, có thể thêm `expiresAt` dạng ISO. Đây là quyền pilot, không phải bằng chứng đã thanh toán.

Để trống model vẫn dùng được các câu lệnh cơ bản và biểu mẫu. Khi bật Gemini, dùng `GEMINI_API_KEY` phía server và model có thật trong tài khoản; không dựa vào tên model cũ trong README.

## 3. Firestore

Review và triển khai `firestore.rules` đúng database staging. Gộp các index trong `firestore.training.indexes.json` vào cấu hình index hiện có; không ghi đè danh sách index khác. Đợi index hoàn tất rồi thử đọc lịch sử cũ. Lỗi nguồn cũ được báo rõ, không coi là hội viên chưa từng tập.

Không deploy `firebase.training-test.json` lên production: đây là cấu hình emulator cô lập.

## 4. Luồng thử khi chưa có data gym

Mở Member Portal → tab Training, hoặc nút Training trong chatbot sau khi đăng nhập thật. Hoàn tất hồ sơ, đồng ý lưu dữ liệu, nhập mục tiêu và trình độ.

Hỏi: “Tôi có 35 phút, hôm nay muốn tập chân”. Trợ lý điền gợi ý thời gian/nhóm cơ; bạn tự xác nhận năng lượng, đau và ê mỏi. Nhấn tạo kế hoạch.

Kết quả đúng khi chưa có data: khung tập cá nhân hóa theo nhóm cơ và thời gian, ghi rõ chưa gắn máy The Shine. Không có máy, vị trí, số hiệp/lần hay hướng dẫn giả. Đây chưa phải giáo án bài tập được HLV duyệt.

Bấm bắt đầu, sau đó ghi đúng hoạt động đã thực hiện. Để trống mức tạ khi không biết; `0` nghĩa là không có tạ ngoài. Lưu một lần, thử gửi lại và kiểm tra không nhân đôi lịch sử.

## 5. Khi có data thật

Nhập/xác minh Zone, Equipment, Exercise tại Gym Knowledge. Sau đó vào phần duyệt định lượng bài tập, điền số hiệp/lần/nghỉ/mục tiêu do người có chuyên môn duyệt. Mẫu có `SAMPLE_DATA_ONLY` không được duyệt cho hội viên. Bản duyệt mất hiệu lực khi bài tập đổi revision.

## 6. Dữ liệu và giới hạn

Dữ liệu bước 3 nằm trong `training_members/{uid}`; xem ở tab Training. Các biểu đồ cũ chưa tự đồng bộ hai chiều. Nút xóa chỉ xóa dữ liệu bước 3, không xóa hồ sơ thành viên/hợp đồng/lịch sử cũ; giữ dấu revision tối thiểu để chặn yêu cầu gửi lại.

Trước khi mở rộng, thử hai tài khoản thật trên staging; kiểm tra quyền, đổi tài khoản, lỗi mạng, xóa/xuất dữ liệu và thiết bị di động. Không coi build thành công là kiểm định chuyên môn.
