# Local Pilot SQLite: bàn giao và kiểm chứng

## 1. Phiên bản
Ngày 23/09/2026. Baseline `176ac2f8be90d2c2c4378d03722dc49f7315683b`, nhánh `feat/local-pilot-sqlite`, PR #12. Mã triển khai `8ba85c6ce087ddb4ce9c5efc5991e03ad8607315`; bản test browser sửa CSP `aabb55ca2026f8c9b26d7bade69f56d17d13992f`. Chưa merge hoặc deploy. Commit tài liệu/cleanup CI sau mốc này không đổi mã ứng dụng.

Có entry point/UI riêng, SQLite trên đĩa và email/mật khẩu thật. Không cần Firebase, không giả token. Không gọi đây là đã di chuyển toàn bộ website/CRM khỏi Firebase.

## 2. Năm trường hợp nguồn trong vùng riêng tư
Đã tạo 5 tài khoản SQLite từ manifest QA riêng được cho phép. Mật khẩu băm riêng; database và danh sách tài khoản không ở GitHub. Không tạo hộp thư Gmail hoặc xác minh email khách thật.

Bản runtime đóng gói đã khởi động trên loopback Node22.16.0, đăng nhập HTTP/cookie thật, tạo **27 session** và **45/45 kiểm tra đạt**. Firebase calls **0**; model calls **0**. Bộ này không dùng mock authentication. Phiên dùng nghiệm thu được dọn sau chạy.

Các ca: guest giáo dục; năm case đăng nhập, đọc đúng source, kiến thức có nguồn, khái niệm bệnh không thành chẩn đoán; profile người lớn/thiếu niên; không đếm giáo án là lịch sử; chặn chỉ định theo cờ nguồn; không giả lưu meal; cách ly session, CSRF, token Firebase giả và UID tự chèn.

Đây không phải đánh giá Gemini thật. Không có meal/program thực thi được tự gán. Ba nguồn người lớn giữ yêu cầu review và hai nguồn thiếu niên không có adult planner. Không thay tuổi hoặc nguồn để có test xanh.

## 3. GitHub Actions
Run: https://github.com/ducng0611/the-shine-fitness/actions/runs/35803398245
Head `aabb55ca2026f8c9b26d7bade69f56d17d13992f`. Job verify `106998646274`, browser `106998646596`, đều success.

| Lớp | Kết quả |
| --- | --- |
| Local SQLite/password/API/policy | 27/27 đạt |
| Buddy | 146/146 đạt |
| Training | 99/99 đạt |
| Nutrition, assets, pathway | 130/130 đạt |
| Năm chương trình | 470/470 đạt |
| Chromium local UI | 6/6 luồng đạt |
| HTTP acceptance trong CI | 29/29 đạt; 17 session; 3 tài khoản tổng hợp |
| Strict local/Buddy, TypeScript toàn dự án | Đạt |
| Local build và build chính | Đạt; build chính còn cảnh báo chunk lớn |

Không bỏ qua test. Không cộng 45 case riêng với 29 case CI rồi gọi là một tập khách thật. CI dùng fixture tổng hợp, SQLite/password thật, không mock auth.

Đã tải artifact verification **10726518995**, browser **10726293125**, đọc TAP/result/build. Thời hạn bảy ngày. Đối chiếu patch ngược: mã ứng dụng/test khớp working copy. Thay đổi workflow sau đó chỉ cleanup PID có điều kiện.

## 4. Sáu luồng browser
1. Guest hỏi Protein có nội dung/nguồn.
2. Ba tài khoản CI đăng nhập, hỏi, xem đúng source và logout xóa chat.
3. Viewport390 không tràn ngang, gửi câu hỏi.
4. Reload giữ cookie nhưng không transcript/localStorage.
5. Giữ phản hồi thật đang về, đổi tài khoản ở tab khác, không hiển thị dữ liệu cũ.
6. Không request ngoài local/Firebase, không page error.

Đã mở ảnh desktop/mobile trực quan. Ảnh ở chế độ guest; email còn trong ô nhập mobile là danh tính CI tổng hợp. Không xuất ảnh có bệnh lý/số đo source thật lên Actions.

Container làm việc bị chính sách browser chặn truy cập; không tắt chính sách. Vì vậy browser chạy trên Actions, còn 5 case nguồn được test bằng HTTP thật trong container riêng. Chưa thử Windows/macOS/iPhone/Android vật lý.

## 5. Lỗi đã tái hiện và sửa
HTTP đầu với năm nguồn đạt42/45. Ba câu đọc profile bị policy coi là chỉ định vì từ "tôi muốn" và healthConcern. Đã thêm8 test phân biệt đọc-only/mixed clinical; trước sửa có3 test thất bại. Bản sửa chỉ mở tuyến đọc dữ kiện đúng quyền, giữ gate cấp cứu/thuốc/chỉ định. Sau đó45/45 đạt, Buddy146/146 vẫn đạt.

CI đầu `35803065494`: verify đạt, browser dừng vì string eval trong test bị CSP chặn. Đổi sang locator assertion, không thêm unsafe-eval hoặc hạ CSP. Run tiếp theo đạt đầy đủ.

Một lệnh gom nhiều nhóm test cũ trong container từng treo sau một nhóm. Script verify chạy từng file tuần tự, không bỏ assertion/nhóm test. Kết quả trên là từ run đầy đủ đã kết thúc.

## 6. Bảo mật và bàn giao
Database riêng chứa5 QA user, không Firebase user/admin/hộp thư. Mật khẩu chung theo yêu cầu chỉ choQA. Không có mật khẩu này trong code/public patch/Actions.

SQLite không mã hóa. Quyền file và loopback không thay mã hóa ổ đĩa. Người đọc database có thể đọc snapshot; bảo vệ máy và bản sao. Không mở Internet/LAN/tunnel. Chưa audit an ninh tổng thể, backup tự động, đa instance hoặc reset password.

Bộ công khai: patch, tài liệu, kiểm chứng, ảnh guest. Runtime PRIVATE: server/client build, SQLite đã tạo, danh sách tài khoản, báo cáo riêng. Cần Node tương thích nhưng không cần npm install. Runtime này đã được khởi động và chạy lại45/45HTTP. Starter Windows/macOS cung cấp nhưng chưa test thiết bị thật.

Dừng server trước sao lưu/đóng gói. Không để lại dịch vụ chạy nền thay người dùng. Pilot người lớn có hạn7ngày, không tự xóa account; gia hạn cần review. Không hứa người dùng truy cập localhost của container từ máy khác.

## 7. Chưa thực hiện
Model thật, latencyGemini, meal/PTnote được gán, phân tích y khoa, tự tăng tạ, toàn bộ TrainingUI, đồng bộ Firebase/SQLite hoặc migrationcloud.

Catalogue gym không tự được nhập/duyệt vàoSQLite. Thiếu catalogue thì planner trả khung giới hạn hoặc báo thiếu, không bịa máy. Nguồn giáo án/meal giữ trạng thái cũ. Báo cáo riêng không có token/password/toàn văn hội thoại sức khỏe.
