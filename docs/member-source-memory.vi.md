# Bộ nhớ nguồn cá nhân: từ file data vào SQLite

## 1. Phạm vi bản cập nhật

Bản này nối các nguồn đã số hóa với tài khoản Local Pilot. Không dùng Firebase, không huấn luyện lại trọng số mô hình và không tự duyệt giáo án. Có thể đọc thông tin trong nguồn không có nghĩa là được kê kế hoạch tập hoặc thực đơn mới.

Mã gốc: feat/local-pilot-sqlite, commit bf877207374cc39c67757b25a041b8775b47fe9e. Nhánh feat/member-source-memory đã được tạo, nhưng thao tác ghi tiếp qua công cụ GitHub bị chặn. Chưa có commit hoặc PR mới chứa bản cập nhật này. Mã đã sửa và kiểm tra nằm trong patch và gói bàn giao, không cố vượt chặn.

## 2. Nguồn được nhập

| File | Vai trò |
| --- | --- |
| data/companion/training_programs.json | 5 lộ trình và 127 định nghĩa bài tập |
| data/nutrition/meal-plan-library.json | 6 mẫu meal plan, chưa gán cá nhân |
| data/companion/the-shine-gym-assets.draft.json | 25 bản ghi tài sản thu thập |
| source-facts.PRIVATE.json, ngoài Git | Mục tiêu tự khai, lưu ý sức khỏe, trường thuốc và trạng thái thiếu dữ liệu |

Không quét toàn bộ thư mục data. Công cụ chỉ đọc các đường dẫn đã cho phép. Schema và quy tắc được ghi tại data/member-memory/source-registry.json.

## 3. Mô hình lưu trữ

Các mục bên dưới là namespace logic trong bảng local_documents của SQLite, không phải collection Firestore:

```text
member_source_programs/{programId}
member_source_exercises/{exerciseId}
member_source_meals/{templateId}
member_source_assets/{assetId}
member_source_memory/{uid}
member_source_imports/current
member_source_imports/revision_N
```

Mỗi tài khoản có bản nguồn đúng UID, sourceProgramId, source hash, import revision và các trường có bằng chứng. Các giá trị raw được giữ nguyên. Không sửa local_users, mật khẩu, quyền pilot, consent, lịch sử tập hoặc số đo mới khi import.

Mục tiêu tự khai được lưu riêng với goal kỹ thuật trong phần mềm. Tuổi và số đo là snapshot tại nguồn, không tự cập nhật thành hiện tại.

## 4. Trạng thái trường dữ liệu

Mỗi trường có raw, status và sourceRef:

- recorded: có nội dung nguồn.
- not_recorded: để trống hoặc chưa nhận được.
- not_disclosed: nguồn ghi không khai báo.
- reported_none: khách ghi không hoặc 0; không phải xác minh y khoa.

Thuốc để trống không được chuyển thành không dùng thuốc. Giấy xác nhận chưa có không được chuyển thành đã đủ điều kiện. Bản ghi PT riêng chưa nhận được khác với các ghi chú mô tả nguồn của người số hóa.

## 5. Luồng hội thoại

```text
Cookie local đã xác thực
  -> kiểm tra chủ phiên và an toàn
  -> phân biệt đọc nguồn với yêu cầu hành động mới
  -> MemberSourceReader đọc SQLite theo UID
  -> kiểm tra hash, revision, nguồn được liên kết
  -> trả lời có trích dẫn own_record và trường còn thiếu
```

Không đọc UID từ tin nhắn, không shared cache nguồn cá nhân, không gửi nguồn riêng cho model. Tài khoản QA thiếu niên được xem bản nguồn của chính mình, nhưng không được mở adult planner. Quyền xem nguồn QA và quyền training có phạm vi khác nhau.

Có thể đọc lại tối đa hai buổi nguồn được xác định duy nhất. Số buổi mờ, nhầm gói, đơn vị tải thiếu và ô trống được giữ nguyên. Đối chiếu bảng không phải phép đo tiến bộ hay đơn tập mới.

## 6. Meal plan và máy tập

Cả sáu mẫu meal plan đã được lưu trong DB nhưng không tự gán cho tài khoản. Khi chưa có assigned meal, chatbot nói rõ chưa được giao, không sao chép khẩu phần của người khác. assignedProgramId và mealPlanAssignment vẫn null.

Danh mục tài sản không phải bản đồ vị trí, trạng thái hoạt động hay cảm biến máy trống. Import không ghi vào gym_exercises/gym_equipment hoặc nâng trạng thái verified.

## 7. Nhập và cập nhật

Với bản chạy sẵn, DB đã nạp revision 2. Không cần chạy seed lại. Với database cũ của bạn, dừng server và sao lưu đầy đủ trước khi nhập:

```bash
npm run local:memory -- --db /path/private/pilot.sqlite \
  --facts /path/private/source-facts.PRIVATE.json \
  --out /path/private/import-report.NEW.json
```

Trong gói runtime không cần npm:

```bash
node dist-local/import-memory.mjs --local \
  --db .local-data/shine-pilot.sqlite \
  --facts source-facts.PRIVATE.json \
  --out import-report.NEW.json
```

Nếu nguồn thay đổi, cần xem lại rồi truyền --expected-revision N đúng phiên bản hiện tại. Cùng dữ liệu sẽ trả unchanged, không nhân đôi. Nếu bỏ --facts, các trường riêng đã nhập được giữ, không bị xóa. File báo cáo phải là đường dẫn mới.

## 8. Giới hạn còn lại

Chỉ chạy loopback một process, không Internet/LAN/tunnel. SQLite chưa mã hóa; mật khẩu được băm nhưng bản nguồn vẫn cần bảo vệ ổ đĩa. Chưa có model benchmark, gán meal/PT note đã duyệt qua admin UI, tự tạo giáo án điều trị hay tự ghi bữa ăn.

Năm thẻ giáo dục bổ sung được tách khỏi nguồn lịch sử: superset, Lat Pulldown, Decline Press, RPE và khái niệm đái tháo đường chung. Nguồn đối chiếu ACE, REP Fitness, Mayo Clinic và NIDDK nằm trong từng thẻ. Không gắn nhãn bác sĩ hoặc HLV đã duyệt các thẻ này.
