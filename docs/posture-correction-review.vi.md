# Bàn giao nguồn tư thế dân văn phòng và kết nối sau lộ trình chuyển hóa

## Trình tự xử lý

Nguồn giảm mỡ có bệnh lý chuyển hóa đã có ở `feat/fatloss-metabolic-program` (PR #8), đầu nhánh `86aeef946c6f50661b49c086327511d02882e355`. Đợt tư thế kế thừa đúng phiên bản này, không tạo lại chương trình chuyển hóa, không bỏ ba chương trình trước đó và không tự bổ sung lộ trình mông-đùi chưa có trong thư viện thực tế.

Thư viện tăng từ version 4 lên version 5: năm chương trình, 127 định nghĩa bài, 48 tham chiếu dụng cụ và 216 lượt tham chiếu bài. Bốn chương trình cũ cùng metadata và usage cũ được kiểm tra bằng dấu SHA256, không xác minh lại nội dung chuyên môn cũ chỉ vì merge thành công.

## Nguồn tư thế đã ghi nhận

Có ba buổi, 29 dòng. Giữ thông tin khối, thứ tự bài, volume, tải, nghỉ, tempo, giữ đỉnh, mỗi bên, khoảng cách đi bộ và thời lượng thở. Không có ngày tập nên `sourceDate=null`; không có nhật ký hoàn thành nên `completionConfirmed=false`.

Mục tiêu là tư thế và tính vận động của người trưởng thành. Nhãn “chỉnh sửa”, “phục hồi”, hội chứng chéo trên/chéo dưới và diễn giải nguyên nhân đau được giữ trong lớp nguồn/khung tham chiếu, không biến thành chẩn đoán. Chưa có bằng chứng xác nhận hoạt động phục hồi chức năng y tế của doanh nghiệp.

## Phân tích nguồn, không suy thành kết quả

Buổi 1 nhấn mạnh vùng cổ, vai và lồng ngực; buổi 2 vùng hông, khung chậu và kiểm soát động tác bản lề; buổi 3 tích hợp động tác kéo, nâng, mang vật và kiểm soát thân. Đây là thay đổi trọng tâm giữa các buổi khác nhau, không phải phép đo tăng tiến cùng bài hoặc bằng chứng đã “lập trình lại phản xạ”.

Cấu trúc ba giai đoạn 1-12, 13-24, 25-36 là khung do prompt đề nghị. Chỉ ba buổi đầu có dữ liệu. Các buổi còn lại không được sinh thêm. Bảng thời lượng chỉ cộng nhãn thành 55, 55, 45 phút, chưa tính thành thời gian thực hiện được bảo đảm.

## Quy tắc tránh diễn giải sai

- `2 DB 6 kg` và `2 DB 8 kg`: giữ cách ghi và số tạ; không tự biến thành 12/16 kg tổng.
- Dòng Y-T-W 3 x 10 không nhân thành 3 x 30; các dòng lăn nhiều vùng không nhân liều theo số vùng.
- Tempo 3-1-3 và 3-0-1 giữ chuỗi và ba số; tên pha chưa được nguồn quy định.
- Giữ đỉnh 3s, 1s, 2s gắn vào từng lượt theo ghi chú; không biến thành một hiệp giữ tĩnh.
- Farmer's Walk tính quãng đường, không đổi thành thời gian. Thở năm phút không phải giữ hơi năm phút.
- Treadmill có 5p và độ dốc 0; chưa có tốc độ hoặc đơn vị độ dốc.
- Định lượng cáp đã ghi rõ kg ở nguồn tư thế không bị thay bằng quy ước mức máy của nguồn khác.

## Catalogue và định danh

Tạo đủ tám ID người dùng yêu cầu. Ngoài ra cần 15 định nghĩa mới cho những hoạt động còn lại, để toàn bộ 29 dòng có tham chiếu hợp lệ. Tái sử dụng sáu ID sẵn có cho Cow-Cat, Cable Row, treadmill, DB Romanian Deadlift, Bird Dog và Pigeon Pose.

Biến thể face pull có xoay ngoài, glute bridge có dây và deadbug có bóng giữ riêng thay vì âm thầm thay định nghĩa chung. Hướng dẫn bài mới chỉ chép nội dung đã cung cấp với nhãn chưa được chuyên môn duyệt; không thêm mục tiêu cơ, lực lăn hoặc cách điều trị do AI tự viết.

## Đối chiếu chuyên môn có giới hạn

`scientific-claims.review.json` tách nguyên văn ý nguồn khỏi nhận xét và nguồn tham khảo. NASM xác nhận bốn bước của mô hình, nhưng không xác nhận khách này mắc hội chứng. Trang nhà xuất bản về Janda chỉ hỗ trợ nguồn gốc mô hình. Thử nghiệm ITB một lần không chứng minh tác dụng chương trình dài hạn; không suy mọi kỹ thuật lăn đều vô ích hoặc đều “giải phóng mạc”.

NICE NG59 mục đánh giá và lựa chọn hoạt động được đối chiếu qua trích xuất trang chính thức; truy cập trực tiếp có giới hạn. Không viện dẫn một chứng chỉ/chuẩn như bằng chứng doanh nghiệp đã đủ năng lực điều trị. Các mô tả cơ chế về thần kinh giao cảm và tái giáo dục vận động vẫn cần thẩm định, chưa là kết quả đo.

## Chuyển giao

Nhánh chuyển hóa vẫn có `aiRecommendable=false`, không đề xuất bài, thuốc, ngưỡng y khoa hoặc dinh dưỡng bệnh lý. Nhu cầu tư thế không triệu chứng được phân loại PROGRAM mà không tự gán thành mục tiêu tăng chiều cao thiếu niên.

Đau, tê bì, đau lan, thoát vị, trượt đốt sống, vẹo cột sống hoặc viêm cột sống được chuyển HEALTH_RISK. Không dùng ngưỡng Cobb 20 độ để cho phép tư vấn dưới ngưỡng. Tê vùng yên ngựa, triệu chứng bàng quang/ruột kèm đau lưng hoặc yếu hai chân nặng/tăng dần có thông báo cấp cứu có điều kiện, không chờ tư vấn viên.

Bộ nhận diện là quy tắc bảo thủ, không phải chẩn đoán hay hệ thống phân loại cấp cứu đã được kiểm định. Chưa xử lý hoàn hảo mọi phủ định, câu giả định, ngôn ngữ hoặc triệu chứng không dùng từ khóa. Không khẳng định đã gọi cấp cứu thay người dùng.

## Tệp và kiểm tra

Tài liệu chính: `data/knowledge/11_program_posture_correction.md`.
Thư viện: `data/companion/training_programs.json`.
Nguồn: `data/training-pathways/posture-correction/`.
Validator: `shared/postureCorrectionProgram.ts`.
Chuyển giao: `shared/postureSafety.ts` tích hợp qua `shared/programSafety.ts`.
Điểm gọi ở `server/src/handoverRules.ts` dùng shared policy có sẵn, không nhân đôi danh sách.
Bộ kiểm thử: `tests/posture-correction.test.ts`.

Kết quả từng lần chạy và giới hạn được ghi ở báo cáo kiểm chứng khi CI thực sự hoàn tất. Không gọi Gemini/embedding, không cập nhật `index.json`, không ghi Firestore, không merge hoặc deploy.
