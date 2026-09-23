# Nguồn lộ trình chiều cao và tư thế cho thiếu niên

Trạng thái: **needs_review / historical_reference**. Đây là số hóa bản chép người dùng cung cấp, không phải giáo án đang hoạt động, xác nhận y khoa hoặc bộ dữ liệu đã huấn luyện lại mô hình.

## Các tệp

- `source-sessions.json`: 48 dòng của sáu buổi, ánh xạ tên, định lượng nguyên văn, nhóm nguồn và điểm cần kiểm tra. Khóa buổi là `packageCycle + sessionNumber`.
- `scientific-claims.review.json`: phân biệt khẳng định được đề nghị trong prompt, giới hạn nguồn, đối chiếu ngoài nguồn. Không coi mọi câu trong prompt là sự thật khoa học.
- `source-status.json`: số lượng, giới hạn truy cập và trạng thái kiểm duyệt.
- `../../knowledge/09_program_height_posture.md`: tài liệu tham chiếu có frontmatter, không được index thành lời khuyên công khai.
- `../../companion/training_programs.json`: thư viện phiên bản 3, giữ hai chương trình trước và bổ sung chương trình này.

## Điều AI được ghi nhận

Giữ đúng nhóm trò chơi, Plyometrics, Decompression, Resistance, giãn cơ cuối bảng và Cool Down. Giữ đoạn chưa rõ thay vì làm chắc; không điền đơn vị tải, nhịp tempo, volume/rest hoặc thời lượng game. Giữ nhận định từ nguồn và diễn giải có điều kiện ở các trường tách biệt.

Chỉ có gói đầu buổi 21-24 và gói gia hạn buổi 4-5. Không nội suy 1-20, 25 hoặc các buổi gia hạn khác. Không gọi chênh lệch bản chép là tác dụng tập luyện.

## Quyền riêng tư

Không lưu ngày hồ sơ, ngày tập cá nhân, số đo chi tiết, ảnh, định danh trực tiếp hoặc nhật ký ăn/ngủ của trẻ ở đây. Bộ riêng tư được bàn giao ngoài repo để chủ dữ liệu kiểm soát. Không có trường ước lượng năng lượng hay dữ liệu cột đó trong bộ nguồn này. Hai programme trước được giữ nguyên, không sửa lịch sử của chúng.

Thông tin bệnh lý và thuốc có số 0 ở bản khai riêng là lời tự báo, không phải sàng lọc hoặc giấy phép tập. Không xác nhận BMI bình thường, không chẩn đoán hoặc phủ nhận chỉ định y khoa.

## Giới hạn thực tế

`eligibleForPlanner=false`, `ragRetrievalAllowed=false`. Không thêm modal mới, không nhập JSON chương trình như schema PathwaySourceBundle. Muốn công khai phải biên soạn một bản tổng quan được duyệt riêng; giữ bản lịch sử bất biến, không chỉ đổi nhãn để vượt kiểm duyệt.

Mã tham chiếu thiết bị `eq_*` mô tả nhu cầu, không phải bằng chứng máy đang tồn tại hoặc phù hợp với trẻ. Không tự nạp vào Firestore, không nối chương trình lịch sử với tài khoản hội viên.

## Kiểm tra không cần API key

```bash
node --import tsx --test tests/height-posture.test.ts tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-height-posture.ts
npx --no-install tsx scripts/validate-height-posture.ts --report
npm run build:index -- --check
```

Script chuẩn bị mặc định chỉ đọc. `--out <tệp-mới.json>` tạo tệp mới để review, không ghi đè thư viện hoặc ghi cơ sở dữ liệu. `--check` của builder không gọi embedding và không ghi index.
