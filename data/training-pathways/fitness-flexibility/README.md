# Lộ trình tăng thể lực và linh hoạt

Nguồn của đợt này là văn bản người dùng cung cấp, không phải ảnh đã được hệ thống nhận diện. Có năm buổi tham chiếu cho nhóm dưới 18 tuổi. Số đo, năm sinh và ngày hồ sơ được giữ trong gói riêng tư bàn giao cho người dùng, không commit.

Tệp chính: `data/knowledge/08_program_fitness_flexibility.md` và `data/companion/training_programs.json`. Bản Markdown chứa bảng nguồn, phần phân tích và phần đề xuất chờ duyệt. JSON giữ giá trị trống, ký hiệu tải, lựa chọn thay thế và cấu trúc circuit.

## Trạng thái học dữ liệu
Đây là tiếp nhận tri thức tham chiếu, không fine-tune, không ghi lịch sử hội viên, không phê duyệt chương trình. `verified=false`, `eligibleForPlanner=false`. RAG không lập chỉ mục hoặc trả lại `PROGRAM` dạng `historical_reference`. Nội dung `public_overview` chỉ được sử dụng sau khi có `review_status=verified`.

## Điều cần xác nhận tiếp
HLV cần xác nhận đơn vị/ký hiệu tải theo từng bài, ý nghĩa `bw` ở cable pushdown, biến thể của các tên gần nhau, hướng dẫn và chống chỉ định, sự phù hợp thiết bị với trẻ, người giám hộ, kết quả thực tế và phạm vi áp dụng. Buổi 6-30 chưa được cung cấp. Giai đoạn 2/3 chỉ là định hướng, không phải dữ liệu đã áp dụng.

## Tích hợp với module tiếp nhận
Thư viện chương trình không phải `PathwaySourceBundle` để nhập thẳng vào modal cũ. Đây là lớp tham chiếu khác, chưa có thao tác publish chương trình từ modal. Không ghi JSON này vào `gym_catalogue.json` hoặc collection bài tập đã xác minh. Mã tham chiếu `eq_*` không phải máy đã được kiểm kê.
