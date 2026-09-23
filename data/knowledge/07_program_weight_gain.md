---
id: kb-program-weightgain-001
title: Lộ trình tập luyện tăng cân - nguồn tham chiếu chờ duyệt (PT 1:1)
source: Bản chép PT do người dùng cung cấp; đối chiếu nguồn tập luyện và dinh dưỡng
version: "1.0"
effective_date: 2026-09-22
expiry_date: 2027-12-31
owner: Bộ phận Huấn luyện viên - chờ xác nhận người duyệt
category: PROGRAM
review_status: needs_review
content_scope: historical_reference
---

# LỘ TRÌNH TẬP LUYỆN TĂNG CÂN - TĂNG KHỐI CƠ NẠC

Đây là nguồn tham chiếu từ năm giáo án do người dùng chép lại cho The Shine Fitness & Yoga, không phải giáo án được phép áp dụng tự động. Tài liệu phân biệt ba lớp: dữ liệu gốc, phân tích dựa trên dữ liệu và đề xuất chuyên môn đang chờ duyệt. Các số liệu trên giấy không xác nhận buổi đã hoàn thành hoặc hiệu quả tăng cơ.

## 0. Phạm vi sử dụng và quy tắc an toàn bắt buộc

Chatbot chỉ trình bày định hướng tham khảo; giáo án chính thức do huấn luyện viên xây dựng sau đánh giá trực tiếp. Không chẩn đoán, kê thuốc, tính TDEE hoặc calo cụ thể cho từng người, thiết kế thực đơn, chọn liều thực phẩm bổ sung hay sao chép tải của khách cũ. Giá và số buổi gói đang bán phải lấy từ 01_pricing.md còn hiệu lực, không từ gói lịch sử này.

Bản needs_review, content_scope=historical_reference bị chặn khỏi RAG công khai và planner. Đổi tên file hoặc tạo embedding không có nghĩa đã được duyệt. Muốn tư vấn công khai cần bản public_overview được duyệt riêng; giữ toàn bộ giới hạn vị thành niên từ lộ trình trước.

## 1. Chân dung và giới hạn hồ sơ tham chiếu

Nguồn mô tả khách nữ, 21 tuổi, tự khai mục tiêu tăng cân và gói lịch sử PT 1:1 gồm 50 buổi. Chiều cao, cân nặng, số đo và ngày cá nhân được giữ trong bản riêng tư, không commit vào kho công khai. “Không khai báo” bệnh hoặc thuốc là thiếu dữ liệu, không phải xác nhận không có bệnh hoặc không dùng thuốc.

Tần suất 3 buổi/tuần, tập cách ngày là thông tin người dùng cung cấp; năm mốc rời rạc không chứng minh toàn bộ lịch. Ngưỡng BMI dưới 20 trong yêu cầu không tự quyết định ai phù hợp. Theo CDC [R8], BMI chỉ là chỉ số sàng lọc, không phải chẩn đoán; không tự gắn nhãn thiếu cân cho mọi người muốn tăng cân.

## 2. Nguyên tắc khoa học và cách đọc các con số

Phần A của nguồn là giáo án; các khoảng ở mục 2 và 3 dưới đây là thông số được yêu cầu trong prompt, không phải chỉ định ghi trên năm buổi. Mỗi khoảng được giữ để đối chiếu trong scientific-claims.review.json, trạng thái chưa duyệt cho cá nhân. Không gán toàn bộ chúng thành “chuẩn ACSM/NSCA”.

Đối chiếu ngoài nguồn được đánh dấu [R1] đến [R8]. Việc trích dẫn nghiên cứu không chứng minh giáo án này đã được tổ chức đó kiểm định hoặc đã tạo kết quả cho khách tham chiếu.

### 2.1. Thặng dư năng lượng có kiểm soát

Yêu cầu đề xuất thặng dư 250-500 kcal/ngày so với TDEE và tăng 0.25-0.5 kg/tuần; chưa có dữ liệu lượng ăn hoặc xu hướng cân để áp các số này. Không tính một mức năng lượng cho khách từ cân nặng và chiều cao.

Nghiên cứu thặng dư [R3] và hướng dẫn phổ thông [R7] hỗ trợ điều chỉnh thận trọng nhưng không xác lập một mục tiêu đúng cho mọi người. Nhận định “trên 1 kg/tuần thường là nước và mỡ” được giữ như giả thuyết cần review, không phải phép đo thành phần cơ thể hoặc quy tắc chẩn đoán.

### 2.2. Kích thích phì đại cơ

Prompt yêu cầu 10-20 hiệp mỗi nhóm cơ/tuần, 6-15 lần lặp, dừng còn 1-3 lần trước thất bại (RIR 1-3), nghỉ 60-90 giây ở bài lớn và kích thích mỗi nhóm cơ hai lần/tuần. Đây không phải các giá trị đã đo trong hồ sơ; đặc biệt, nguồn không ghi RIR.

ACSM 2026 [R1] nhấn mạnh tập đều và khối lượng tuần phù hợp mục tiêu; không cần tập tới thất bại cho mọi người. Nghiên cứu thời gian nghỉ [R5] không hỗ trợ coi 60-90 giây là tối ưu phổ quát. Giữ nghỉ gốc 60/70/80 giây như bản chép, không biến thành quy tắc cho người mới.

### 2.3. Tăng tiến tải trọng

Thứ tự kỹ thuật, số lần rồi tải và tăng 2.5-5% sau hai buổi liên tiếp hoàn thành là quy tắc double progression được người dùng đề xuất. Năm giáo án chưa ghi tiêu chí này, chưa xác nhận số lần thực tế, chất lượng kỹ thuật hoặc bước tạ của máy. Do đó không lập lịch tăng tự động.

Mỗi số tải phải gắn với dụng cụ và đơn vị. Mức 15 của Cable Row rồi 12.5 vẫn là ký hiệu máy theo A2, không phải bằng chứng tăng tải hoặc 12.5 kg. Mức của hai bài hay hai máy khác nhau không được so trực tiếp.

### 2.4. Cardio khi mục tiêu là tăng cân

Prompt đề xuất chỉ giữ 10-15 phút, tốc độ 4.0-5.0 km/h sau kháng lực, không HIIT hoặc chạy bền trên 20 phút. Các giới hạn này chưa được HLV phê duyệt và không được quảng bá như lệnh cấm khoa học chung.

Phân tích tổng hợp [R4] không cho thấy mọi hình thức kết hợp cardio với kháng lực đều ngăn tăng cơ; ảnh hưởng tùy mục tiêu và cách sắp buổi. Nguồn thực tế chỉ ghi treadmill 10/15 phút cuối buổi, tốc độ 4.5 không có đơn vị, và treadmill khởi động buổi 13 không có thời lượng.

### 2.5. Phục hồi và giấc ngủ

Yêu cầu đưa ra ngủ 7-9 giờ, cách tối thiểu 48 giờ giữa hai buổi cùng nhóm cơ lớn và deload mỗi 6-8 tuần, giảm 40-50% khối lượng. Đây là các đề xuất chưa được xác nhận trong hồ sơ, không phải lịch ngủ hay giảm tải thực tế.

AASM/SRS [R6] nêu ngủ đều ít nhất 7 giờ ở người trưởng thành và thừa nhận nhu cầu có khác biệt. Không dùng 48 giờ để tuyên bố cơ đã hồi phục; không tự lên deload theo lịch cố định khi chưa biết thể trạng, lịch sử đã hoàn thành và đánh giá của HLV.

## 3. Định hướng dinh dưỡng hỗ trợ tăng cân

Phần dinh dưỡng ở đây là khung thông tin để người có chuyên môn kiểm tra, không phải thực đơn đã sử dụng. Năm giáo án không ghi lượng ăn, TDEE, khẩu phần, dị ứng hay bệnh tiêu hóa. Khách đang điều trị tiểu đường, bệnh thận, bệnh tiêu hóa hoặc rối loạn nội tiết không nhận tư vấn ăn uống cá nhân từ chatbot.

Những khoảng định lượng phía dưới giữ nguyên yêu cầu để truy nguồn; không tự nhân theo cân nặng hoặc cộng thành chế độ ăn. Các quan sát về cân nặng cũng không xác nhận lượng cơ đã tăng.

### 3.1. Phân bổ dưỡng chất đa lượng

Các khoảng được yêu cầu là: đạm 1.6-2.2 g/kg/ngày chia 4-5 bữa, mỗi bữa 20-40 g; tinh bột 4-7 g/kg; chất béo 0.8-1.2 g/kg; nước 35-40 ml/kg. Chúng không tự tạo thành một cấu hình nhất quán cho mọi cân nặng và mức hoạt động.

Đối chiếu ISSN [R2] áp dụng cho người khỏe mạnh có tập luyện, không phải bệnh lý. Khoảng ngày và khoảng mỗi bữa phải được cân nhắc cùng nhau; không lấy mọi cận trên rồi cộng. Các khoảng tinh bột, chất béo và nước trong yêu cầu chưa có nguồn hồ sơ hoặc phê duyệt cá nhân.

### 3.2. Chiến lược ăn cho người khó tăng cân

Prompt đề xuất tăng mật độ năng lượng thay vì ép khối lượng thức ăn, dùng đồ uống giàu năng lượng, 5-6 bữa nhỏ, ăn trước tập 1.5-2 giờ và sau tập trong 2 giờ, không bỏ bữa sáng. Các ý này được lưu như phương án chờ review, không được diễn đạt thành lịch ăn bắt buộc.

NHS [R7] có gợi ý ăn ít một, thêm bữa và tăng năng lượng bằng thực phẩm phù hợp. Khung thời điểm protein không chỉ là một cửa sổ cứng [R2]. Khả năng dung nạp và tổng lượng ăn cần đánh giá; không hứa đồ uống luôn ít gây no hoặc bảo đảm tăng cân.

### 3.3. Giới hạn tư vấn dinh dưỡng của trợ lý

Chatbot có thể giải thích rằng ăn uống, tập luyện và phục hồi cần được phối hợp, nhưng không tính calo cá nhân, kê thực đơn, chọn thuốc tăng cân hoặc liều whey, creatine, mass gainer. Khi có sụt cân không chủ đích, chán ăn kéo dài hay mô tả gợi ý rối loạn ăn uống, chuyển HEALTH_RISK để được người có chuyên môn hỗ trợ.

Không dùng việc “không khai báo bệnh” làm giấy phép tư vấn. Các trường hợp đang điều trị hoặc dùng thuốc dài hạn cần chuyên gia y tế phù hợp trước khi điều chỉnh chế độ.

## 4. Cấu trúc buổi tập và quy ước bảo toàn nguồn

Buổi 1-3 có Khởi động, Cơ lõi, Thăng bằng, Kháng lực và Thả lỏng. Buổi 12 ghi Full Body, có Cơ lõi nhưng không có khối Thăng bằng; buổi 13 ghi FB và không có khối Cơ lõi/Thăng bằng riêng. Chỉ ghi nhận sự hiện diện trên nguồn, không kết luận hai năng lực đã hoàn thiện.

bw là trọng lượng cơ thể; Rest là giây theo A2. Ô trống giữ trống. Tải tạ đơn/tạ ấm xác định rõ có đơn vị kg theo A2 nhưng chưa rõ theo quả hay tổng; tải máy là ký hiệu không quy đổi. Cặp a1/a2 ở 12-13 nghỉ sau cặp, không tự điền ô trống của bài hai.

## 5. Giai đoạn 1: nền tảng kiểm soát vận động

Khung buổi 1-12 là cách phân kỳ được yêu cầu, chưa phải ghi chú của HLV. Chỉ có dữ liệu buổi 1, 2 và 3 ở phần này; không dựng lại buổi 4-11. Buổi 12 được đặt ở phần chuyển tiếp tiếp theo mà vẫn giữ số buổi 12.

Bảng dưới bảo toàn thứ tự và năm cột nguồn. Tên viết tắt giữ cạnh cách hiểu trong quy ước A2; số hiệp/lần là nội dung giáo án, chưa được xem là kết quả người tập đã hoàn thành.

### 5.1. Giáo án buổi 1

Bản tham chiếu buổi 1. Ô trống là chưa ghi, không kế thừa từ dòng trước. SA là một tay, SL là một chân; KB là tạ ấm. Nguồn ghi cuối buổi treadmill 10 phút, chưa có tốc độ hoặc thời lượng cả buổi.

| Khối | Bài tập ghi trên nguồn | Volume | Load | Rest (giây) |
| :--- | :--- | :--- | :--- | :--- |
| Khởi động | Dynamic Warm Up |  |  |  |
| Cơ lõi | Bracing Core |  |  |  |
| Cơ lõi | Plank | 2 x 60s | bw | 60 |
| Cơ lõi | Dead Bug | 2 x 12 |  |  |
| Thăng bằng | SL Step Box | 2 x 12 | bw | 70 |
| Thăng bằng | SA KB Shoulder Press |  | 4 |  |
| Kháng lực | Squat | 2 x 15 | bw | 80 |
| Kháng lực | Cable Row |  |  |  |
| Kháng lực | Wall Squat | 2 x 40s | bw |  |
| Thả lỏng | Treadmill 10 phút |  |  |  |

### 5.2. Giáo án buổi 2

Bản tham chiếu buổi 2. DB là tạ đơn. Bài Rear Delt Fly chưa xác định máy hay tạ, nên mức 5 chưa được gán kg. Tên Side Band Kick và load bw cùng tồn tại như nguồn, chưa suy loại dây hoặc mức kháng lực.

| Khối | Bài tập ghi trên nguồn | Volume | Load | Rest (giây) |
| :--- | :--- | :--- | :--- | :--- |
| Khởi động | Dynamic Warm Up |  |  |  |
| Cơ lõi | Side Plank | 2 x 40s | bw | 70 |
| Cơ lõi | Bird Dog | 2 x 12 |  |  |
| Thăng bằng | SL Flexion + DB Raises | 2 x 12 | 1 | 80 |
| Thăng bằng | Side Band Kick |  | bw |  |
| Kháng lực | 1. Hip Hinge | 2 x 15 | bw | 80 |
| Kháng lực | 2. Knee Push Up |  |  |  |
| Kháng lực | 3. Lunge | 2 x 15 |  | 80 |
| Kháng lực | 4. Rear Delt Fly |  | 5 |  |
| Kháng lực | 5. DB Tricep Extension |  | 2 |  |
| Thả lỏng | Treadmill 10 phút |  |  |  |

### 5.3. Giáo án buổi 3

Bản tham chiếu buổi 3. Các nhãn a,b,c,d,e không phải a1/a2 nên chưa suy superset. KB Romanian Deadlift có tải 6 kg theo A2; mức 10 và 15 ở máy không phải kg. Tốc độ treadmill 4.5 chưa có đơn vị.

| Khối | Bài tập ghi trên nguồn | Volume | Load | Rest (giây) |
| :--- | :--- | :--- | :--- | :--- |
| Khởi động | Dynamic Warm Up |  |  |  |
| Cơ lõi | Plank | 3 x 50s | bw | 60 |
| Thăng bằng | Pistol Squat | 2 x 15 |  | 70 |
| Thăng bằng | SA Kettlebell Shoulder Press |  |  |  |
| Kháng lực | a. Kettlebell Romanian Deadlift | 3 x 12 | 6 | 80 |
| Kháng lực | b. Leg Extension |  | 10 |  |
| Kháng lực | c. Cable Row | 3 x 12 | 15 | 80 |
| Kháng lực | d. Cable Tricep Push Down |  |  |  |
| Kháng lực | e. Superman |  |  |  |
| Thả lỏng | Treadmill 15 phút, tốc độ 4.5 |  |  |  |

### 5.4. Phân tích quy luật tăng tiến được nguồn hỗ trợ

Plank từ 2 x 60 giây ở buổi 1 thành 3 x 50 giây ở buổi 3: số hiệp tăng, thời gian từng hiệp giảm; tổng thời gian kê trên giấy là 120 rồi 150 giây. Không mô tả thành mỗi hiệp giữ lâu hơn. Khối kháng lực có 3 dòng ở buổi 1 và 5 dòng ở buổi 2,3; không suy tổng volume khi còn ô trống.

Thăng bằng đổi từ Step Box sang SL Flexion + DB Raises rồi Pistol Squat. Đây là thay đổi tên/yêu cầu động tác, chưa có thang đo chứng minh mức khó hoặc kỹ thuật đã đạt. Cool down từ 10 lên 15 phút. Nguồn có tải tạ 1,2,4,6 kg khi tên dụng cụ rõ, nhưng không có 5 kg được xác nhận ở Rear Delt Fly.

## 6. Giai đoạn 2: chuyển tiếp sang khối lượng và cặp liên hoàn

Khung giai đoạn 2 được đề xuất là buổi 13-26. Để mô tả bước chuyển, phần này đối chiếu cả buổi 12 và 13; JSON dùng phase_wg_02_transition với chú thích buổi 12 là mốc chuyển tiếp, không đổi số buổi.

Nguồn cung cấp rõ quy ước a1/a2, b1/b2 là cặp liên hoàn. Định lượng ở bài đầu được lưu làm anchor của cặp, nghỉ sau cặp theo A2. Không biến ô trống ở bài sau thành số mới, không suy d2 của cặp chưa đủ.

### 6.1. Giáo án buổi 12, mốc chuyển tiếp

Bản tham chiếu buổi 12 ghi Full Body. Giữ chữ mờ 26 ở Hip Abduction để HLV xác nhận; không sử dụng như tải chắc chắn. d1 chưa có d2. Mức 16 ở Hip Thrust và 3 ở Standing OH SD chưa xác định dụng cụ/đơn vị.

| Khối | Bài tập ghi trên nguồn | Volume | Load | Rest (giây) |
| :--- | :--- | :--- | :--- | :--- |
| Khởi động | Dynamic Warm Up |  |  |  |
| Cơ lõi | Side Plank | 2 x 40s | bw | 60 |
| Kháng lực | a1. Side Kick | 3 x 15 | bw | 80 |
| Kháng lực | a2. Hip Abduction |  | 26 (chữ mờ, cần HLV xác nhận) |  |
| Kháng lực | b1. Cable Row | 4 x 12 | 12.5 | 80 |
| Kháng lực | b2. Straight Arm Pushdown |  | 5 |  |
| Kháng lực | c1. Hip Thrust | 3 x 12 | 16 | 80 |
| Kháng lực | c2. Standing OH SD |  | 3 |  |
| Kháng lực | d1. Cross Crunch |  | bw |  |
| Thả lỏng | Treadmill 15 phút |  |  |  |

### 6.2. Giáo án buổi 13

Bản tham chiếu buổi 13 ghi FB (toàn thân). Treadmill khởi động không có số phút. DB Romanian Deadlift là biến thể tạ đơn, không gộp với tạ ấm. Cặp liên hoàn nghỉ sau cả cặp theo A2; volume/rest bài thứ hai vẫn để trống.

| Khối | Bài tập ghi trên nguồn | Volume | Load | Rest (giây) |
| :--- | :--- | :--- | :--- | :--- |
| Khởi động | Treadmill (khởi động trên máy chạy) |  |  |  |
| Kháng lực | a1. Dumbbell Sumo Deadlift | 4 x 12 | 17.5 | 80 |
| Kháng lực | a2. Dumbbell Row |  | 4 |  |
| Kháng lực | b1. Standing OH Shoulder Press | 4 x 12 | 3 | 80 |
| Kháng lực | b2. DB Romanian Deadlift |  | 6 |  |
| Kháng lực | c1. Lat Pulldown | 3 x 15 | 26 | 80 |
| Kháng lực | c2. Face Pull |  | 10 |  |
| Kháng lực | d1. Rope Tricep Extension | 3 x 15 | 10 | 80 |
| Kháng lực | d2. Crunch |  | bw |  |
| Thả lỏng | Treadmill 15 phút |  |  |  |

### 6.3. Bước chuyển quan sát được và giới hạn kết luận

Buổi 12-13 có nhãn Full Body/FB, các cặp liên hoàn và 4 hiệp ở Cable Row, Sumo Deadlift, Standing OH Shoulder Press. Khối Thăng bằng không còn ghi riêng. Buổi 13 thêm Lat Pulldown, Face Pull, Dumbbell Row và đổi tên phần khởi động thành treadmill. Không có dữ liệu 4-11 nên chỉ nói “được quan sát ở buổi 12”, không khẳng định bắt đầu chính xác tại đó.

Cặp liên hoàn có thể thay cách phân bổ hoạt động/nghỉ; thiếu thời gian cả buổi nên chưa đo được mật độ. Cable Row ghi 15 rồi 12.5, đều mức máy, không phải tăng từ 15 lên 12.5 kg. Hip Thrust 16 và Lat Pulldown 26 không so trực tiếp với DB Sumo Deadlift 17.5 kg.

### 6.4. Những diễn giải chưa đủ căn cứ

Prompt gợi ý rằng mất khối Balance nghĩa là hoàn thành nền tảng và treadmill khởi động phản ánh đã quen vận động. Nguồn chỉ chứng minh thay đổi bố cục/tên bài, không ghi ý định HLV hay đánh giá năng lực. Hai diễn giải này được giữ ở trạng thái giả thuyết, không trở thành quy tắc tự động.

Các buổi đầu cũng có nhiều vùng cơ, nên nhãn Full Body muộn không chứng minh trước đó là split khác. Rear Delt Fly, Rear Delt Pec Fly và Side Kick/Side Band Kick không được xác nhận cùng biến thể chỉ vì tên gần nhau.

## 7. Giai đoạn 3: định hướng tăng tiến tải trọng

Buổi 27-40 không có giáo án nguồn. Chỉ đề xuất quy trình thảo luận: HLV đánh giá kỹ thuật, thành tích đã xác nhận, mức gắng sức, điều kiện thiết bị và phục hồi trước khi thay khối lượng/tải. Không tạo danh sách buổi, mức tạ hoặc tuần tăng tải như dữ liệu đã áp dụng.

Nguyên tắc double progression và tỷ lệ tăng trong yêu cầu nằm ở lớp đề xuất chờ duyệt. Bước nhảy của từng máy hoặc quả tạ có thể khác nhau; công cụ không được tăng 2.5-5% chỉ vì đã đến buổi 27.

## 8. Giai đoạn 4: định hướng củng cố và duy trì

Buổi 41-50 cũng chưa có nguồn. Định hướng là đối chiếu các kết quả thật, khả năng duy trì, lịch sinh hoạt và nhu cầu hỗ trợ để HLV điều chỉnh mục tiêu. Không cam kết đạt số kg, số đo vòng hoặc một mức sức mạnh vào cuối 50 buổi.

Việc chuyển sang tự tập, giảm tần suất PT hoặc lặp giáo án phải do người có thẩm quyền đánh giá. Gói lịch sử 50 buổi không chứng minh dịch vụ hiện còn bán hoặc giá hiện tại; mọi tư vấn thương mại vẫn tra nguồn PRICE còn hiệu lực.

## 9. Bộ chỉ số theo dõi tiến độ

Bảng sau là thiết kế theo dõi được yêu cầu, chưa chứa kết quả của khách. Phải lưu ngày đo, đơn vị, nguồn tự báo/đo trực tiếp và trạng thái đã xác nhận; không lấy số trên giáo án làm thành tích thực tế.

| Chỉ số | Tần suất đề xuất | Giới hạn diễn giải |
| :--- | :--- | :--- |
| Cân nặng | Hằng tuần, điều kiện đo nhất quán | Không suy số kg cơ từ cân |
| Vòng tay, vòng đùi | 4 tuần một lần | Không tự kết luận phì đại |
| Thành tích bài chính | Sau buổi xác nhận | Cùng biến thể, dụng cụ và đơn vị |
| Chất lượng giấc ngủ | Tự báo khi đồng ý | Không chẩn đoán |
| Đau cơ xuất hiện muộn | Tự báo sau buổi | Đau không phải bằng chứng hiệu quả |

### 9.1. Mục tiêu cân nặng và xử lý chững cân

Mốc 0.25-0.5 kg/tuần là đề xuất của prompt, không phải goodRange đã duyệt cho hồ sơ này. Cân buổi sáng trước ăn là cách chuẩn hóa được yêu cầu; ưu tiên điều kiện lặp lại và không gây khó chịu, không biến việc nhịn thành mục tiêu.

Khi xu hướng chững, xác minh phép đo trước, rồi hỏi ăn uống thực tế, vận động, giấc ngủ và triệu chứng. Không tự tăng volume hoặc giảm/tăng cardio. Câu “tuyệt đối không tăng cardio” được lưu để review, không phải quy tắc chung. Sụt cân không rõ nguyên nhân hoặc chán ăn kéo dài chuyển chuyên môn.

## 10. Thư viện bài tập và ánh xạ thiết bị

Thư viện JSON dùng ID thật đang có trong repo, không giả định danh sách 40 ID trong prompt đã tồn tại. Bài dùng lại chỉ được thêm programUsage với nguyên văn tên, volume, load và số buổi. Hướng dẫn, nhóm cơ và chống chỉ định chưa có nguồn chuyên môn giữ là chưa được xác minh.

Mã eq_* là nhu cầu dụng cụ chưa đối chiếu, không phải máy mới đã kiểm kê. Không tự nạp định nghĩa bài vào gym_exercises hoặc biến chương trình này thành trainingPrescription đã duyệt.

### 10.1. Bài mới ở bước chuyển

Nguồn buổi 12-13 bổ sung Hip Abduction, Straight Arm Pushdown, Hip Thrust, Cross Crunch, Dumbbell Sumo Deadlift, Dumbbell Row, DB Romanian Deadlift, Lat Pulldown, Face Pull và Rope Tricep Extension. Tên tạ đơn Romanian Deadlift được giữ riêng với bản tạ ấm.

Side Kick liên kết đề xuất tới ex_side_band_kick theo người dùng, nhưng chưa coi có dây là sự thật. Standing OH SD dùng ID đẩy vai đứng thực tế đã có; các alias khác chỉ chuẩn hóa tên, không chứng minh dụng cụ, mức tải hoặc kỹ thuật giống nhau.

## 11. Chống chỉ định và điều kiện chuyển giao

Nguồn không cung cấp bảng chống chỉ định theo từng bài, nên không tạo danh sách y khoa giả rồi gắn nhãn HLV đã duyệt. Bệnh tim mạch, huyết áp, tiểu đường, bệnh thận, hen suyễn, rối loạn nội tiết/tuyến giáp, chấn thương đang điều trị, tiền sử phẫu thuật xương khớp, mang thai, cho con bú hoặc dùng thuốc dài hạn đều kích hoạt HEALTH_RISK theo giới hạn sản phẩm.

Người dưới 18 tuổi hoặc câu hỏi thuốc, thực phẩm bổ sung cũng được chuyển. Đây là quy tắc chuyển người có chuyên môn, không phải tuyên bố các tình trạng này cấm mọi vận động.

### 11.1. Những bài cần kiểm tra điều kiện trước khi hướng dẫn

Pistol Squat và bài một chân cần HLV xác minh biến thể, hỗ trợ và khả năng kiểm soát. Hip Hinge, các dạng Deadlift, Hip Thrust, đẩy vai và các bài cáp cần xác nhận dụng cụ, cách đặt tải, biên độ được hướng dẫn và các hạn chế đã được chuyên gia ghi nhận.

Đây là danh sách câu hỏi kiểm duyệt, không phải chống chỉ định mới do AI đặt ra. Nếu khách báo đau lưng, đau gối, đau vai, đĩa đệm/thoát vị hoặc đang điều trị, không tự thay bài như một phác đồ; chuyển HEALTH_RISK.

### 11.2. Tín hiệu riêng liên quan tăng cân

Sụt cân không rõ nguyên nhân, chán ăn kéo dài hoặc mô tả gợi ý rối loạn ăn uống không được xử lý bằng công thức “ăn thêm, tập nặng hơn”. NHS [R7] khuyến nghị đánh giá y tế khi giảm cân bất ngờ/không chủ đích hoặc vấn đề với kiểm soát ăn uống.

Chatbot không chẩn đoán nguyên nhân và không kê chế độ cho người đang điều trị bệnh tiêu hóa, tiểu đường, bệnh thận hoặc nội tiết. Bộ so từ khóa có thể chuyển thận trọng cả câu hỏi chung hoặc phủ định; không dùng nhãn chuyển giao như chẩn đoán lưu vào hồ sơ.

## 12. Hỏi đáp mẫu cho trợ lý AI

Các câu sau là lời thoại mẫu chờ review, xưng “em” với khách. Chúng không xác nhận đã đặt lịch, gửi ticket hay liên hệ thành công khi backend chưa báo kết quả. Với ca cần chuyên môn, giới thiệu bước liên hệ phù hợp; không đưa giáo án, thực đơn hoặc mức tạ thay thế.

Dù câu có yêu cầu báo giá, việc kiểm tra HEALTH_RISK vẫn chạy trước model và cache. Phân loại PRICE chỉ quyết định nhánh nhu cầu, không được vượt qua lớp an toàn.

### 12.1. Tôi muốn tăng cân thì bắt đầu thế nào?

Hỏi: Tôi muốn tăng cân thì bắt đầu thế nào?

Trả lời mẫu: “Em có thể giới thiệu định hướng kết hợp tập luyện, ăn uống và phục hồi. Trước khi có giáo án chính thức, HLV cần đánh giá trực tiếp mục tiêu, kinh nghiệm và tình trạng hiện tại của anh/chị. Nguồn tham chiếu có các buổi nền tảng rồi buổi toàn thân dạng cặp, nhưng em không sao chép mức tạ của khách cũ sang anh/chị.”

### 12.2. Tại sao chuyển sang cặp a1/a2?

Hỏi: Tại sao chuyển sang cặp a1/a2?

Trả lời mẫu: “Trong bản chép, buổi 12 và 13 dùng cặp liên hoàn, làm bài thứ nhất rồi bài thứ hai và nghỉ sau cặp theo quy ước nguồn. Đây là thay đổi cách sắp bài có thể ảnh hưởng phân bổ thời gian, nhưng chưa có log để kết luận hiệu quả hoặc mật độ tăng bao nhiêu. Ý định cụ thể và định lượng cần HLV xác nhận.”

### 12.3. Cable Row từ 15 thành 12.5 kg là tăng tải đúng không?

Hỏi: Cable Row từ 15 thành 12.5 kg là tăng tải đúng không?

Trả lời mẫu: “Em chưa thể kết luận như vậy. Nguồn ghi 15 rồi 12.5 và quy ước đây là mức trên máy, không phải kg; số hiệp đổi từ 3 lên 4. Cần biết máy, đơn vị và kết quả thực hiện trước khi so sánh. Em giữ nguyên hai số và không tự gọi đó là tăng tải.”

### 12.4. Tôi nên dùng sữa tăng cân hoặc whey bao nhiêu?

Hỏi: Tôi nên dùng sữa tăng cân hoặc whey bao nhiêu?

Trả lời mẫu: “Câu hỏi về sữa tăng cân, whey hoặc liều thực phẩm bổ sung cần chuyên gia phù hợp xem xét tình trạng và khẩu phần hiện tại. Em không chọn sản phẩm hoặc kê liều qua chat. Em đề nghị chuyển yêu cầu tới bộ phận chuyên môn để hướng dẫn bước hỗ trợ; không dùng dữ liệu khách tham chiếu để tính cho anh/chị.”

### 12.5. Tôi sụt cân dù không ăn kiêng và chán ăn nhiều tuần?

Hỏi: Tôi sụt cân dù không ăn kiêng và chán ăn nhiều tuần?

Trả lời mẫu: “Em ghi nhận điều anh/chị mô tả, nhưng không thể xác định nguyên nhân hoặc khuyên tăng tải/ăn thêm theo công thức. Anh/chị nên được chuyên gia y tế đánh giá; yêu cầu thuộc nhóm HEALTH_RISK. Em không chẩn đoán hoặc thiết kế thực đơn điều trị từ những thông tin này.”

### 12.6. Em 16 tuổi muốn áp lộ trình tăng cân này?

Hỏi: Em 16 tuổi muốn áp lộ trình tăng cân này?

Trả lời mẫu: “Lộ trình này là nguồn tham chiếu của người trưởng thành, không được áp cho người dưới 18 tuổi. Em chưa thể chọn mức tạ, lịch tập hay khẩu phần cho bạn qua chat. Bạn hãy nhờ bố mẹ hoặc người giám hộ liên hệ bộ phận chuyên môn để đánh giá trực tiếp và xác nhận hình thức giám sát phù hợp.”

### 12.7. Gói 50 buổi hiện giá bao nhiêu?

Hỏi: Gói 50 buổi hiện giá bao nhiêu?

Trả lời mẫu: “Con số 50 buổi trong tài liệu là gói lịch sử, không xác nhận gói hiện đang bán. Em cần tra bảng giá còn hiệu lực của The Shine trước khi báo số buổi và chi phí. Nếu nguồn giá chưa có hoặc hết hạn, em sẽ đề nghị tư vấn viên kiểm tra, không suy giá từ giáo án.”

## 13. Nguồn đối chiếu và trách nhiệm kiểm duyệt

Nguồn giáo án là Phần A của prompt tự chứa do người dùng cung cấp; chưa có ảnh gốc được đối chiếu trong đợt này. Các tài liệu bên ngoài dưới đây chỉ dùng kiểm tra nhận định tổng quát, không thay đổi số liệu nguồn và không cấp quyền áp dụng giáo án.

Danh mục đầy đủ, URL và trạng thái từng nhận định nằm trong data/training-pathways/weight-gain/scientific-claims.review.json. Ngày đối chiếu 22/09/2026 không phải ngày bác sĩ hoặc HLV phê duyệt.

### 13.1. Nguồn tập luyện

[R1] ACSM 2026: Resistance training guidelines. Khuyến nghị tổng quan cho người trưởng thành khỏe mạnh; không phải quy trình duyệt từng giáo án. Nguồn: https://acsm.org/resistance-training-guidelines-update-2026/

[R4] Schumann và cộng sự, 2022: Concurrent aerobic and strength training. Tổng hợp nghiên cứu tập sức bền kết hợp kháng lực; không phải lệnh cấm cardio khi tăng cân. Nguồn: https://doi.org/10.1007/s40279-021-01587-7

[R5] Schoenfeld và cộng sự, 2016: Longer interset rest. Thử nghiệm 1 phút và 3 phút nghỉ trên nam đã tập; không áp trực tiếp cho hồ sơ nữ này. Nguồn: https://pubmed.ncbi.nlm.nih.gov/26605807/

### 13.2. Nguồn dinh dưỡng và thặng dư

[R2] ISSN 2017: Protein and exercise. Dinh dưỡng cho người khỏe mạnh có tập luyện; không thay tư vấn bệnh lý. Nguồn: https://doi.org/10.1186/s12970-017-0177-8

[R3] Helms và cộng sự, 2023: Small and large energy surpluses. Nghiên cứu trên người đã tập kháng lực; không chứng minh một tốc độ tăng cân tối ưu cho mọi người. Nguồn: https://doi.org/10.1186/s40798-023-00651-y

[R7] NHS: Healthy ways to gain weight. Thông tin phổ thông; cần khám khi sụt cân không chủ đích hoặc có vấn đề với kiểm soát ăn uống. Nguồn: https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/

### 13.3. Nguồn giấc ngủ và chỉ số cơ thể

[R6] AASM/SRS: Adult sleep duration consensus. Khuyến nghị giấc ngủ cho người lớn, khác với khẳng định phục hồi đủ sau một số giờ cố định. Nguồn: https://pmc.ncbi.nlm.nih.gov/articles/PMC4442216/

[R8] CDC: Adult BMI categories. BMI là công cụ sàng lọc, không phải chẩn đoán hoặc điều kiện tự cấp giáo án. Nguồn: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html
