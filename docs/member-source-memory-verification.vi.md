# Báo cáo kiểm chứng: nhúng nguồn vào SQLite

## Kết quả chính

Đã nhập 5 lộ trình, 127 bài tập, 6 mẫu meal plan, 25 bản ghi tài sản và 5 bộ nhớ nguồn theo UID vào bản SQLite riêng tư được bàn giao. Revision import hiện tại là 2, gồm 171 tài liệu nguồn/receipt trong local_documents. Không có Firebase hoặc API embedding tham gia.

## Kiểm tra mã nguồn

| Bộ kiểm tra | Kết quả |
| --- | --- |
| Local SQLite, auth, import, đọc nguồn, quyền | 65/65 |
| Buddy hồi quy | 146/146 |
| Training hồi quy | 99/99 |
| Nutrition, assets, pathway | 130/130 |
| Năm chương trình | 470/470 |
| Strict TypeScript local/Buddy, TypeScript toàn dự án | Đạt |
| Build local và ứng dụng chính | Đạt |

Đây là kết quả chạy trong working container, Node 22.16.0, không phải CI mới trên GitHub. Các bộ test không bỏ qua trường hợp nào. Build chính vẫn có cảnh báo bundle lớn và mixed imports. Build local xác nhận 0 Firebase runtime imports.

## 75 câu hỏi cũ được chạy lại

Đăng nhập local thực, cookie và SQLite thực, tạo 63 session trên runtime đã đóng gói. Kết quả theo bộ assertion cũ: **74/75 đạt, 1 chưa đạt**. Nguyên bản kết quả được giữ, không sửa thành xanh.

CTX06 trước đây yêu cầu phản hồi phải nói “chưa có bộ đọc”. Hiện bộ đọc đã có: hệ thống trả đúng rằng chưa nhận ghi chú PT riêng, tách nó với ghi chú mô tả nguồn, có citation own_record và saved=false. Bản contract-review.vi.json ghi rõ thay đổi này. Đối chiếu các phản hồi đã ghi theo tiêu chí mới: **75/75**. Đây không phải một lần chạy mô hình mới hay chứng nhận y khoa.

Trong rà soát nội dung, đã phát hiện thêm câu hỏi tiếp nhận bệnh nền bị trả bằng thông tin tiện ích, và câu trích dẫn về tiểu đường chưa được giải thích đúng. Đã thêm 2 test trước khi sửa, xác nhận 2 test đỏ, sửa và chạy lại toàn bộ. Không bỏ test để báo đạt.

## Năm tài khoản và planner

43/43 kiểm tra bổ sung đối chiếu nguồn trên đủ 5 tài khoản đạt, tạo thêm 5 session. Đã kiểm tra mục tiêu tự khai, bệnh lý, thuốc, clearance, PT note, meal assignment và lộ trình đúng chủ. Truy cập chéo session và giả UID bị từ chối.

15/15 kiểm tra kỹ thuật trong runner 75 câu và 3/3 kiểm tra planner trực tiếp đạt. Chọn readiness không đau không vượt được cờ cần chuyên môn. Báo triệu chứng cảnh báo vô hiệu readiness QA cũ mà không tạo chẩn đoán, buổi tập hoặc số đo.

## Dữ liệu sau khi dọn phiên

Integrity check = ok; 5 user được giữ nguyên cả hash mật khẩu. Còn 0 phiên xác thực test, 0 buổi tập thực tự tạo, 0 số đo mới, 0 gán kế hoạch. Một trường metadata id do bước test readiness thêm vào root đã được gỡ đúng trường sau khi so sánh backup. Các tài liệu ngoài namespace nguồn sau cleanup trùng khớp backup trước import.

## Giới hạn nghiệm thu

0 Firebase calls, 0 model calls. Chưa benchmark Gemini, không tính độ trễ localhost thành tốc độ AI trên Internet. Lần thử Chromium mới bị chặn ERR_BLOCKED_BY_ADMINISTRATOR. Không vượt chặn, không dùng ảnh cũ để báo UI mới đạt. Các kiểm tra HTTP và SQLite vẫn là chạy thực.

Công cụ GitHub chặn thao tác ghi tiếp. Chưa có commit, PR, CI hoặc deployment mới cho bản này. Gói mã nguồn kèm patch để review và áp dụng từ baseline, không chứa DB hay dữ liệu riêng.
