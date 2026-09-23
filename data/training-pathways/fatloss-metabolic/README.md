# Nguồn giảm mỡ có bệnh lý chuyển hóa

Đây là nguồn tham chiếu lịch sử do người dùng cung cấp, không phải chương trình được AI phép đề xuất.

## Thành phần

`source-sessions.json` giữ 41 dòng của sáu tài liệu, ánh xạ tên bài, ký hiệu nguồn và yêu cầu thẩm định. `source-status.json` ghi các khoảng trống. `scientific-claims.review.json` tách nhận định trong prompt khỏi đối chiếu nghiên cứu. `checklist-append.md` là nội dung bổ sung vào bộ kiểm thử thủ công, không phải giáo án.

Số 19/29 và 20/30 chưa được giải quyết. `sessionNumber` để null, có `sourceId` ổn định và danh sách ứng viên. Năm trên nguồn A7 và năm đề nghị đính chính được lưu riêng. ID giữ chỗ cho máy/trạm mờ không phải một bài tập đã xác minh.

## Quyền sử dụng dữ liệu

Hồ sơ cá nhân, ngày phiên tập cụ thể và số đo không được commit. Bản riêng tư bàn giao ngoài repo vẫn là dữ liệu sức khỏe, không được coi đã vô danh hoàn toàn. Lần này chỉ dùng bản chép hiện tại, không suy lại tên hoặc ghép hồ sơ từ các cuộc trao đổi trước.

Không có thao tác ghi Firestore, tạo giáo án cho hội viên, gọi embedding hoặc sửa index.json. Dữ liệu chương trình không phải PathwaySourceBundle của modal intake.

## Chuẩn bị và kiểm tra

Chạy `npx --no-install tsx scripts/prepare-fatloss-metabolic.ts` để kiểm tra phép ghép idempotent. Dùng `--out <tệp mới>` khi cần xuất bản ghép để review; lệnh không ghi đè file có sẵn. Chạy `npx --no-install tsx scripts/validate-fatloss-metabolic.ts --report` để kiểm tra nguồn, hash chương trình trước và chunk.

Không đổi nhãn tài liệu y khoa lịch sử thành verified/public_overview. Mã tài liệu này bị chặn riêng khỏi RAG; một bản tổng quan dịch vụ phải được tạo, duyệt và kiểm tra riêng.
