# Bàn giao lộ trình tăng thể lực và linh hoạt

## Phạm vi và khác biệt với prompt
Kiểm tra snapshot `56398e0b78ae3504d9ff9c9474cce1997ba66051`: chưa có `data/companion/training_programs.json`, chưa có `prog_weight_gain_pt50` và bộ 24 ID được mô tả trong prompt. Khởi tạo version 1, không tạo giả dữ liệu tăng cân. Tạo 31 định nghĩa tên bài nguồn để 47 tham chiếu đều có đích. Không có ID trùng; một số tên gần nhau vẫn cần HLV kiểm tra tương đương.

Bộ đọc index và runtime trước đó chỉ cho sáu category. Bổ sung PROGRAM ở builder, RAG, classifier prompt/schema/allowlist/fallback. Sửa so khớp để “giáo án” không bị nhận thành “giá”; PRICE vẫn ưu tiên khi có từ giá/gói thật. Không thay model runtime, không gọi API AI hoặc tạo embedding giả.

## Dữ liệu riêng tư
Kho GitHub là công khai. Bản đưa vào repo bỏ số đo, năm sinh và lịch ngày cá nhân; giữ độ tuổi cần thiết cho giới hạn tư vấn. Bản nguồn đầy đủ không chứa tên/địa chỉ/điện thoại nhưng vẫn là dữ liệu nhạy cảm của trẻ, được bàn giao riêng, không đưa vào RAG hoặc Git.

## Quy tắc nguồn được giữ
Ô trống không kế thừa. Load 3, 4, 5, 10 không đổi thành kg. Tốc độ 4.0 không có đơn vị. Cable Tricep Push Down ghi 2 set và bw được giữ nguyên, chờ giải thích. Buổi 1 là xe 15 phút HOẶC treadmill 10 phút. Buổi 3 không ghi cool down. Circuit có 5 trạm x 3 vòng x 60 giây, bằng 15 phút hoạt động chưa gồm nghỉ, khởi động và chuyển trạm.

## Điều chỉnh có công bố sau đối chiếu
- Không gán quy tắc cấm 1RM của sản phẩm thành tuyên bố khoa học phổ quát. AAP 2020 có bối cảnh kiểm tra dưới giám sát đủ chuyên môn.
- Không gọi tải cố định 2-5 kg là an toàn cho mọi trẻ; cần kiểm soát kỹ thuật và đánh giá theo từng trường hợp.
- AASM/AAP: 6-12 tuổi 9-12 giờ, 13-18 tuổi 8-10 giờ ngủ. Các nhóm 6-13/14-17 và 9-11 giờ trong prompt là cách phân nhóm khác.
- Năm buổi cho thấy thay đổi trên giáo án, chưa chứng minh tiến bộ, mức tải nhẹ hoặc mật độ tăng liên tục.
- 45-60 phút, khoảng 12 tuần và tần suất một circuit mỗi 4-5 buổi không phải dữ liệu đã đo. 30 buổi ở 2-3 buổi/tuần tương ứng khoảng 10-15 tuần khi không gián đoạn.
- Không tạo hướng dẫn kỹ thuật/chống chỉ định theo từng bài như thể nguồn đã có. Các trường chưa được HLV cung cấp giữ trống, có ghi chú rõ.

Nguồn: các liên kết AAP, NSCA, AASM ở cuối `08_program_fitness_flexibility.md`, đối chiếu ngày 22/09/2026.

## Chuyển giao
Từ khóa có dấu/không dấu, tuổi tự khai, lớp học, phụ huynh và lịch sử lời người dùng được kiểm tra trước mô hình/cache. Không dùng lời bot để gán tuổi. Quy tắc mới cũng chặn đường phân loại intent của Training. Đây vẫn là bộ nhận diện quy tắc bảo thủ, không chứng minh bắt mọi cách diễn đạt, phủ định hoặc yêu cầu giả mạo tuổi.

Không tắt hàng rào chỉ vì điểm tương đồng RAG cao. Bản ghi ở chương trình không được sử dụng cho cá nhân hóa khi thiếu phê duyệt. Mã nguồn không tự mở tài khoản dưới 18 tuổi.

## Kiểm tra
```bash
npm ci --ignore-scripts
node --import tsx --test tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/validate-fitness-flexibility.ts --report
npm run build:index -- --check
npm run test:training
npm run lint
npm run build
```

Khi đã có nội dung tổng quan được duyệt và GEMINI_API_KEY phía server, có thể chạy `npm run build:index`. Bản archive hiện tại vẫn được bỏ qua có chủ ý. Khởi động lại Express sau khi lập chỉ mục thực tế. Không coi báo cáo so khớp từ vựng dự phòng của `eval:rag` là đánh giá embedding; chất lượng truy xuất và provider thật chưa được xác minh trong đợt này.

## Ghép thư viện từ một workspace khác
Không chép đè file mới nếu AI Studio đã có program tăng cân mà GitHub chưa có. Dùng `scripts/merge-training-programs.ts` để tạo đầu ra mới, kiểm tra rồi mới thay thế. Program cùng ID khác nội dung báo conflict; bài cùng ID chỉ nhận usage mới, không mất metadata HLV cũ.

## Chưa triển khai
Chưa merge, deploy, ghi Firestore, liên kết hồ sơ thật, cập nhật index.json, gọi provider, mở tự động giáo án trẻ hoặc cung cấp chương trình nhiều tuần đã duyệt. Chưa tạo luồng duyệt/publish chương trình mới trong modal.
