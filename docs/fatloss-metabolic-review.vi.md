# Tiếp nhận lộ trình giảm mỡ có bệnh lý chuyển hóa

## Nguồn và phạm vi

Nhánh bổ sung kế thừa `feat/height-posture-program` tại `aa1e57951a42f97065ce8e9421078e88ec17ea3a`. Nhánh cơ sở có ba chương trình và 78 định nghĩa bài, không phải bốn chương trình/40 bài như giả định trong prompt. Bổ sung này là chương trình thứ tư trong `training_programs.json`, version 4.

Bản chép tự chứa là nguồn của 41 dòng giáo án. Không có ảnh gốc để kiểm tra chữ viết tay. Tên, ngày sinh, địa chỉ, điện thoại, nghề nghiệp, giá trị hợp đồng, tên huấn luyện viên hoặc chữ ký không được khôi phục. Hồ sơ số đo và ngày cá nhân chỉ xuất riêng tư ngoài repo.

## Không làm phẳng những chỗ chưa rõ

- A7: số đọc được 19 hoặc 29, không dùng thứ tự ngày để chọn 29. Năm 2025 là giá trị được báo từ sổ; 2026 là đề nghị đính chính chưa xác nhận.
- A8: số đọc được 20 hoặc 30. Không tự mở rộng vấn đề năm của A7 sang A8.
- Barbell Incline Press có tải 10 và ghi chú 7.5. Giữ cả hai ở trường nguồn, tải định lượng để null cho đến khi biết ý nghĩa.
- Máy hỗ trợ A7 c2 và trạm thứ hai A8 chưa nhận diện. ID giữ chỗ bảo toàn tham chiếu, không cho phép dùng trong planner.
- Quy ước A2 nói volume ở bài đầu, nhưng nhiều dòng bài thứ hai có volume. Giữ từng ô như bảng, không xóa hoặc kế thừa.
- Các bảng không có thời gian nghỉ. Superset giữ vị trí nghỉ sau cặp, số giây là null. Năm dòng d1 không được tạo thêm d2.
- Circuit có sáu trạm và ba vòng nhưng không có thời gian mỗi trạm, nghỉ hoặc số lần. Không kế thừa 60 giây từ chương trình khác.
- Tải BB/DB/KB có kg theo quy ước nguồn, chưa rõ tổng hay từng dụng cụ. Máy giữ mức máy; động tác không nêu dụng cụ giữ đơn vị chưa biết.

## Quan sát khác với nhận định cần thẩm định

Năm bảng kháng lực tạo 15 cặp đầy đủ và 5 dòng d1. Các ô có số lần ghi rõ nằm trong vùng 10-15; ô thiếu không được suy ra cùng vùng. Decline Kettlebell Press ghi 3 x 12 rồi 5 x 12 ở cùng mức 20, nhưng trang A7 lại ghi 3 x 12 và chưa chắc số buổi. Tạ đòn tự do 5 và Smith 10 là hai biến thể, không chứng minh tải tăng gấp đôi.

Không có dữ liệu chứng minh hiệu quả giảm mỡ, phản ứng huyết áp, nguy cơ đã được kiểm soát hoặc thuốc đang dùng. Không gọi superset là lựa chọn an toàn/thông minh cho tăng huyết áp chỉ vì tăng mật độ hoặc số lần cao. Tài liệu khoa học đối chiếu được lưu ở scientific-claims.review.json, có nguồn và giới hạn; không thay người điều trị.

## Ranh giới sản phẩm

`aiRecommendable=false`, `eligibleForPlanner=false`, `verified=false`, `ragRetrievalAllowed=false`. Giấy bác sĩ được yêu cầu theo quy trình lộ trình do người dùng đề xuất; dữ liệu không có giấy và cũng không chứng minh chính sách đã ban hành. Không gán quy trình này thành quy tắc ACSM/ADA áp cho mọi người mắc đái tháo đường.

Chatbot chỉ chuyển chuyên môn và mô tả tiếp nhận, không nhận trách nhiệm y khoa, không cho ngưỡng, thời điểm uống thuốc, thực đơn hoặc ví dụ bài tập. Triệu chứng cấp tính có phản hồi dừng tập/gọi cấp cứu, không chờ hàng đợi. Phản hồi không nói đã gọi thay người dùng.

## Mã nguồn

- shared/fatlossMetabolicProgram.ts: bộ chuyển nguồn, validator và ngoại lệ số buổi chưa rõ giới hạn đúng hai nguồn.
- shared/trainingPrograms.ts: gọi validator mới, giữ kiểm tra số buổi bình thường cho mọi chương trình khác.
- shared/programSafety.ts: từ khóa có/không dấu, phân biệt thuốc/ngưỡng/dịch vụ và ưu tiên triệu chứng cấp tính.
- shared/ragDocument.ts: chặn riêng mã tài liệu y khoa lịch sử dù nhãn bị sửa.
- server/src/intentClassifier.ts: nhận giảm mỡ ở PROGRAM sau PRICE; không gán bệnh từ mục tiêu.
- docs/test-checklist.md: bổ sung câu hỏi bắt buộc; không xác nhận lại các số liệu/địa chỉ cũ.
- Không nhân đôi danh sách trong handoverRules.ts vì module này đã dùng shared policy. /api/chat đang xét HEALTH_RISK trước classifier/cache; không đổi runtime provider.

Bài cũ giữ nguyên metadata và chỉ thêm programUsage với lưu ý y khoa riêng. Bài mới có contraindications dạng lưu ý thẩm định, không là chống chỉ định tuyệt đối; chưa tự viết hướng dẫn kỹ thuật.

## Các giới hạn chưa hoàn tất

Chưa thẩm định y khoa, chưa xác nhận máy/tên mờ/đơn vị, chưa nối vào chương trình cá nhân, chưa ghi hồ sơ, chưa tạo modal mới. Chưa gọi provider hoặc eval:rag trực tuyến, chưa deploy. Từ khóa có thể nhận nhầm phủ định/giả định/phạm vi câu chuyện; không phải công cụ phân loại cấp cứu đã kiểm định. Hồi quy build và unit không thay thử người dùng thật, đánh giá quyền riêng tư toàn ứng dụng hoặc thẩm định chuyên môn.
