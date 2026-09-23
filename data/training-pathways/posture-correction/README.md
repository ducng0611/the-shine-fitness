# Lộ trình tư thế và tính vận động cho người làm việc bàn giấy

## Phạm vi nguồn

Đợt này nhận bản bàn giao tự chứa của người dùng, gồm hồ sơ tham chiếu và ba buổi được gọi là buổi 01, 02, 03. Không có ảnh gốc, ngày từng buổi, kết quả đánh giá, xác nhận thực hiện hay chứng chỉ người phụ trách để đối chiếu. Không gắn vào hội viên, không suy thành điều trị hội chứng chéo trên/chéo dưới đã chẩn đoán.

## Tệp trong thư mục

- `source-sessions.json`: 29 dòng, sáu trường nguồn; cấu trúc khối và thời lượng ghi trên đầu khối.
- `source-status.json`: các giới hạn, thông tin thiếu và việc cần người phụ trách xác nhận.
- `scientific-claims.review.json`: khẳng định từ prompt, nhận xét kiểm chứng có giới hạn và nguồn ngoài.
- `../../knowledge/11_program_posture_correction.md`: tài liệu chờ duyệt, không phải nội dung đang được RAG truy xuất.
- `../../companion/training_programs.json`: thư viện hợp nhất. Chương trình này có ID `prog_posture_correction_pt36`.

Tất cả trường diễn giải được viết bằng tiếng Việt. ID, enum và tên bài gốc được giữ để tương thích mã nguồn. Mô tả chưa rõ vẫn giữ nguyên, không viết tiếp một kỹ thuật mới để lấp khoảng trống.

## Các phân biệt bắt buộc

Nhãn 10 + 15 + 20 + 10 phút ở hai buổi đầu là 55 phút phân bổ; buổi ba 10 + 25 + 10 là 45 phút phân bổ. Chưa có kiểm tra các số lần, thời gian giữ, nghỉ, mỗi bên và chuyển dụng cụ có vừa ngân sách này hay không. Không tự rút ngắn nghỉ hoặc đổi volume.

Tải cáp có `kg` được giữ theo nguồn này. Không mượn quy ước mức máy ở lộ trình chuyển hóa để xóa đơn vị được người dùng ghi rõ. Với `2 DB 6 kg` hoặc `2 DB 8 kg`, giữ số dụng cụ và số ghi trên nguồn, không tự gộp tổng hay coi phạm vi tải đã xác minh.

Cấu trúc NASM bốn bước là mô hình phương pháp; bảng giáo án vẫn giữ các khối kết hợp của nguồn. Không tự chèn bốn khối mới để giáo án khớp mô hình.

## Chuẩn bị và kiểm tra

```bash
npx --no-install tsx scripts/prepare-posture-correction.ts
npx --no-install tsx scripts/validate-posture-correction.ts --report
node --import tsx --test tests/posture-correction.test.ts
npm run build:index -- --check
```

Lệnh mặc định chỉ đọc/kiểm tra. `--out duong-dan-tep-moi.json` tạo file mới bằng chế độ không ghi đè. Không gọi mô hình, embedding hoặc cơ sở dữ liệu. Mọi nguồn vẫn `needs_review`, không đủ điều kiện lập giáo án.

## Hướng dẫn review

Xác nhận nguồn và quyền sử dụng trước. Người có chuyên môn đánh giá phạm vi áp dụng, triệu chứng, kỹ thuật, biến thể và liều lượng thực tế. Xử lý các mục cần review trong `source-status.json`. Nội dung tổng quan dịch vụ cần được duyệt riêng; không chỉ đổi metadata của tài liệu này để mở RAG.

Thông tin số đo và mô tả cá nhân được bàn giao riêng tư ngoài repo; loại định danh trực tiếp không đồng nghĩa vô danh tuyệt đối. Không đưa ảnh, dữ liệu y tế, thông tin bác sĩ hay giấy tờ khách hàng vào GitHub công khai.
