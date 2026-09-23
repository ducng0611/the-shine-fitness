# Bàn giao lộ trình chiều cao và tư thế

## Phạm vi
Bổ sung `prog_height_posture_pt25` dựa trên bản chép A3-A8, không yêu cầu ảnh hay Excel. Sáu buổi gồm `initial:21`, `initial:22`, `initial:23`, `initial:24`, `renewal_1:4`, `renewal_1:5`. Đúng 48 dòng, không đổi số buổi gia hạn hoặc ghi thành nhật ký đã thực hiện.

Nhánh cơ sở `feat/weight-gain-program` tại `49aef462d98756bc3fb3a2d2919df8462d2185a9`. Thư viện gốc có 2 chương trình và 51 bài, không phải số lượng trong prompt. Bản mới version 3: 3 chương trình, 78 định nghĩa bài, 146 lần tham chiếu bài, 27 tham chiếu thiết bị.

Giữ nguyên cả hai object chương trình cũ, metadata và usage cũ của 51 bài, cùng 22 tham chiếu thiết bị gốc. Bốn bài dùng lại: Bird Dog, Dead Bug, Dynamic Warm Up, Lat Pulldown. Có 27 định nghĩa bổ sung, gồm biến thể nhảy xa và hai trò chơi để không gộp mất hoạt động nguồn.

## Định khung
Không biến mục tiêu tự khai của trẻ thành giáo án giảm cân. Tên chiều cao/tư thế được dùng theo yêu cầu nhưng không xác nhận chương trình tăng chiều cao. Nhận định về BMI và chỉ định y khoa được giữ là điều cần kiểm chứng, không kết luận từ tuổi làm tròn. Không dùng ngưỡng người lớn cho trẻ.

Các nhận định về giải nén, tăng trưởng, hormone hoặc tác dụng từ hai ghi chú tuần được tách khỏi số liệu nguồn. Nguồn AAP, NSCA, CDC, AASM và nghiên cứu đối chiếu nằm trong scientific-claims.review.json. Các câu có nguồn nghiên cứu không phải chứng nhận HLV đã duyệt The Shine.

## Quy luật quan sát được
Plyometrics đứng trước các nhóm tải trên các trang có nguồn, nhưng gói gia hạn có khởi động/game đứng trước nó. Các kiểu nhảy thay đổi, không đủ chứng minh mục đích lựa chọn hoặc tránh nhàm chán. Dead Hang + Core từ 3 x 40s sang 3 x 60s là tăng thời lượng kê trên giấy, chưa có kết quả thực hiện.

Không xác nhận chuỗi tăng khó Chin-up/Pull-up/Dead Hang hoặc suy Lat Pulldown là hạ tải. Goblet Squat có thêm tempo và tải số, nhưng tải trước đó trống. Giãn cơ cuối bảng có 3-4 dòng; một dòng là Box Breathing. Hai trang gia hạn có game, không suy ra thống kê toàn gói.

## Các điểm nguồn cần xác nhận
- Khoảng cách Sticky Jump buổi 23 và số lượt Wizard's Path buổi gia hạn 4 chưa đọc chắc.
- `Lung Meridian 2 x 20` chưa xác nhận đơn vị hoặc biến thể.
- `6 lượt + 30 giây` không có nghĩa sáu lượt mỗi lượt 30 giây; `5 điểm` là ghi chú luật.
- Đơn vị của tải số trần và từng pha tempo không có trong A2 nguồn này.
- Dead Hang + Core nằm trong PLYOMETRICS và Box Breathing nằm trong GIÃN CƠ ở buổi gia hạn 5. Dữ liệu giữ nguyên vị trí.
- A1/A9 nói cuối tuần nhưng sáu ngày A3-A8 tương ứng Thứ Ba/Thứ Năm. Không tự giải quyết mâu thuẫn; lịch ngày liền nhau cũng không được tự làm khuyến nghị.
- Chỉ số tên “lực bật Sticky Jump” có đơn vị cm nên chưa rõ đại lượng. Không gọi đó là lực hoặc chiều cao cơ thể, không trừ tầm với.
- Không có chuỗi đo chiều cao độc lập để kết luận đã cao thêm. Giá trị lặp trên đầu trang không được coi là lần đo mới.

## Dữ liệu riêng tư
Repo/ZIP công khai không có ngày cá nhân, số đo chi tiết, ảnh, tên, liên hệ hoặc chữ ký. Bản hồ sơ/Weekly Gym Log riêng được bàn giao ngoài repo. Nội dung theo dõi năng lượng bị loại hoàn toàn khỏi bộ mới, kể cả bản PRIVATE; không lưu giá trị mẫu, ảnh bữa ăn hoặc giờ ăn/ngủ. Không suy giấc ngủ từ timestamp tin nhắn. Chưa có dữ liệu cá nhân nào được ghi lên Firestore trong thao tác này.

## Thay đổi source
`shared/heightPostureProgram.ts`: tạo/kiểm tra bản tham chiếu, giữ khoảng hiệp, mỗi bên, đơn vị chưa rõ, các dòng theo nhóm và chu kỳ gói.

`shared/trainingPrograms.ts`: thêm validator và khóa chống trùng theo chu kỳ + số buổi, vẫn chặn trùng trong cùng gói.

`shared/programSafety.ts`: thêm các từ khóa yêu cầu có và không dấu. Phản hồi cân nặng/ăn uống cho trẻ chuyển chuyên môn nhi, không đưa gợi ý chung. Câu hỏi chiều cao không được cam kết.

`server/src/intentClassifier.ts`: nhận chủ đề HEIGHT_POSTURE trong PROGRAM, không tự xác nhận sức khỏe. PRICE giữ ưu tiên khi có từ giá/gói thật.

`server/src/handoverRules.ts` đã dùng và export chính sách chung, nên không nhân đôi danh sách ở đây. Không thay mô hình hoặc nới quy tắc dưới 18.

## RAG và hạn chế
Markdown có `needs_review/historical_reference`, nên builder và runtime hiện hữu đều loại khỏi RAG công khai. Không có lời gọi embedding, không sửa index.json, không gọi eval:rag trực tuyến, không cập nhật dữ liệu hội viên.

Đây là lớp dữ liệu tham chiếu và rào chắn, không có công cụ phê duyệt/publish chương trình mới hoặc thuật toán cá nhân hóa chương trình lịch sử thành giáo án thực thi. Tất cả thay đổi cần review ở nhánh riêng trước khi merge.
