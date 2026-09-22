---
id: kb-program-fatloss-metabolic-001
title: Lộ trình giảm mỡ cho khách hàng có bệnh lý chuyển hóa - nguồn tham chiếu chờ duyệt
source: Bản chép do người dùng cung cấp; đối chiếu ACSM, ADA, AHA và NIDDK
version: "1.0"
effective_date: 2026-09-22
expiry_date: 2027-12-31
owner: Bộ phận Huấn luyện viên - chờ xác nhận người duyệt chuyên môn
category: PROGRAM
review_status: needs_review
content_scope: historical_reference
---

# LỘ TRÌNH GIẢM MỠ CHO KHÁCH HÀNG CÓ BỆNH LÝ CHUYỂN HÓA

Tài liệu lưu sáu bảng giáo án trong bản chép tự chứa do người dùng cung cấp. Dữ liệu tập lịch sử, nhận xét từ các bảng và yêu cầu an toàn cần thẩm định được phân biệt rõ. Đây không phải giáo án được phép cấp cho khách mới, bằng chứng điều trị hoặc xác nhận kết quả giảm mỡ. Bản này đang chờ kiểm duyệt chuyên môn và bị loại khỏi truy xuất RAG công khai.

## 0. Mục đích tài liệu và ranh giới tuyệt đối của trợ lý AI

Mục đích là nhận diện yêu cầu cần chuyển giao, chuẩn bị nội dung tiếp nhận ở mức dịch vụ và lưu tham chiếu cho người phụ trách chuyên môn. Chatbot không trích bài, chọn tải, đặt ngưỡng y khoa, tư vấn thuốc hoặc chế độ ăn cho người có bệnh nền. Luật HEALTH_RISK phải chạy trước phân loại intent, cache và mô hình. Không hứa kết quả theo thời hạn; không nói rằng tập nhẹ chắc chắn an toàn.

Giá và số buổi đang bán phải lấy từ 01_pricing.md còn hiệu lực, không dùng gói trong hồ sơ lịch sử để báo giá. Bản nguồn vẫn là needs_review/historical_reference, không được đổi nhãn để bỏ qua việc duyệt một bản tổng quan dịch vụ riêng.

## 1. Chân dung khách hàng và quy trình tiếp nhận bắt buộc

Nguồn mô tả một người trưởng thành tự khai mục tiêu giảm mỡ, tăng huyết áp và đái tháo đường type 2. Hồ sơ chi tiết và ngày riêng được bàn giao ngoài repository; không nối với bất kỳ tên, địa chỉ, điện thoại hay hồ sơ cũ. Các bệnh là thông tin tự khai, không phải chẩn đoán được hệ thống xác minh. BMI hoặc số buổi mua không xác nhận thể lực, mức an toàn hay mức tải phù hợp.

Dữ liệu hiện thiếu thuốc đang dùng và giấy xác nhận phạm vi vận động. Đây là khoảng trống cần giải quyết trước khi thẩm định lộ trình, không phải bằng chứng khách không dùng thuốc hoặc kết luận về toàn bộ quy trình của doanh nghiệp.

### 1.1. Các trường cần bổ sung qua kênh riêng

Biểu mẫu đề xuất cần ghi danh sách thuốc khách đang dùng, đầu mối bác sĩ điều trị, giấy xác nhận phạm vi vận động và liên hệ khẩn cấp. Chỉ người có quyền mới tiếp nhận; không yêu cầu khách đăng giấy tờ hoặc số liên hệ vào RAG công khai. Cần trạng thái chưa cung cấp, đã nhận và đã được người có trách nhiệm kiểm tra, không dùng một ô tích tự khai để cấp quyền tập.

Yêu cầu có giấy trước buổi đầu là quy trình do prompt đề nghị cho lộ trình này, chưa chứng minh đã ban hành. Hướng dẫn y khoa sàng lọc theo nguy cơ và mức hoạt động, không đòi giấy cho mọi người mắc đái tháo đường trong mọi tình huống. Đối chiếu: [IHS](https://www.ihs.gov/diabetes/clinician-resources/soc/physical-activity1/).

## 2. Chuẩn an toàn với đái tháo đường type 2

Phần này phục vụ thẩm định nội bộ, không phải nội dung thuốc hoặc bài tập để chatbot hướng dẫn khách. Thuốc, biến chứng, lịch ăn và tình trạng hiện tại có thể thay đổi nguy cơ. Nguồn không có những dữ liệu đủ để xác nhận giáo án đang an toàn; không tự gắn insulin, biến chứng bàn chân hay mức đường huyết cho người trong hồ sơ. HLV cần phối hợp đầu mối y tế, không thay bác sĩ điều trị.

### 2.1. Yêu cầu trước khi nhận tập

Giữ yêu cầu giấy xác nhận và danh sách thuốc theo chính sách lộ trình được đề nghị. Nguồn phân biệt insulin và sulfonylurea với metformin về nguy cơ hạ đường huyết; metformin không đồng nghĩa toàn bộ tình trạng của khách ít nguy cơ. Đây chỉ là bối cảnh để phát hiện thiếu dữ liệu, không là cơ sở kê hoặc đổi thuốc. Ngưỡng vận động và cách theo dõi phải do người điều trị cá nhân hóa.

Đối chiếu: [ADA 2026, mục 5](https://diabetesjournals.org/care/article/49/Supplement_1/S89/163932/5-Facilitating-Positive-Health-Behaviors-and-Well). Không đưa ngưỡng cụ thể hoặc lời khuyên giờ uống thuốc vào câu trả lời của chatbot.

### 2.2. Nhận diện và xử trí hạ đường huyết

Nguồn liệt kê run tay, vã mồ hôi lạnh, hoa mắt, tim đập nhanh, lú lẫn và đói cồn cào. Khi xuất hiện cần dừng buổi và gọi hỗ trợ sơ cứu; các dấu hiệu không đủ để chatbot chẩn đoán nguyên nhân. Chỉ dùng ăn/uống theo kế hoạch xử trí cá nhân khi người đó tỉnh và nuốt an toàn. Nếu bất tỉnh, co giật hoặc không nuốt an toàn, không cho thức ăn hay nước vào miệng và cần gọi cấp cứu, không chờ hàng đợi tư vấn.

Đối chiếu ranh giới sơ cứu: [ADA](https://diabetesjournals.org/clinical/article/30/1/38/35419/Hypoglycemia-Low-Blood-Glucose-Low-Blood-Sugar). Bản này không cấp liều đường hoặc thuốc; nhân sự sơ cứu cần được đào tạo và có quy trình đã duyệt.

### 2.3. Chăm sóc bàn chân và theo dõi sau buổi

Prompt yêu cầu kiểm tra bàn chân trước và sau tập, giày vừa chân và tất phù hợp. Giữ đây là bước quy trình cần được cá nhân hóa, không kết luận khách đã có giảm cảm giác, vết loét hay tổn thương thần kinh. Việc phát hiện bất thường cần báo người phụ trách và người điều trị. Đối chiếu: [NIDDK, Diabetes & Foot Problems](https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/foot-problems).

Mốc 24 giờ trong prompt chỉ là lưu ý về nguy cơ muộn sau tập, không là thời điểm bảo đảm hết nguy cơ. Kế hoạch theo dõi tại nhà do người điều trị hướng dẫn; thiếu dữ liệu thuốc không được tự đặt lịch hay ngưỡng kiểm tra.

## 3. Chuẩn an toàn với tăng huyết áp

Giáo án lịch sử không ghi huyết áp nghỉ, thuốc, triệu chứng, cảm nhận gắng sức hoặc nội dung giấy bác sĩ. Số lần lặp trong bảng không thay thế các dữ liệu đó. Yêu cầu không nín thở gắng sức, không dùng tải tối đa và rà soát tư thế được giữ ở lớp thẩm định; không suy từ mức tải ghi trên giấy rằng cường độ đã phù hợp hoặc đã có giám sát đầy đủ.

### 3.1. Quy tắc thở và giới hạn gắng sức

Giữ quy tắc trong prompt: không dùng nín thở gắng sức, thở ra khi thực hiện phần gắng sức và hít vào khi trở lại theo hướng dẫn trực tiếp phù hợp. Lộ trình không dùng để kiểm tra 1RM, nâng tải tối đa hoặc tập tới kiệt sức. Đây là giới hạn bảo thủ của sản phẩm cần người có chuyên môn duyệt, không phải kết luận rằng tất cả người tăng huyết áp có cùng giới hạn.

Khởi động/thả lỏng và việc tránh dừng gắng sức đột ngột cần được xây theo đánh giá cá nhân. Không tự thêm thời lượng vào bảng nguồn đang thiếu. Đối chiếu: [AHA](https://www.heart.org/en/health-topics/high-blood-pressure/changes-you-can-make-to-manage-high-blood-pressure/getting-active-to-control-high-blood-pressure).

### 3.2. Tư thế và bài cần rà soát riêng

Decline Kettlebell Press được nguồn yêu cầu rà soát do tư thế dốc xuống, có thể đặt đầu thấp hơn thân. Cần xác nhận góc ghế và đánh giá của người điều trị; không ghi thành chống chỉ định tuyệt đối cho mọi người tăng huyết áp. Hanging Leg Raises cần đánh giá vai, tay, khả năng treo và các biến chứng liên quan; BMI đơn lẻ không xác định khả năng chịu tải.

Hai cờ này đi cùng ID bài trong medicalSafetyProtocol và từng lần sử dụng. Cờ rà soát không xác nhận đã có bác sĩ duyệt và không được bỏ chỉ vì tên bài từng xuất hiện trong một chương trình khác.

### 3.3. Theo dõi cường độ khi dùng thuốc chẹn beta

Chẹn beta có thể làm đáp ứng nhịp tim khác dự kiến; không dùng một công thức nhịp tim chung để tự quyết định cường độ. Người điều trị có thể hướng dẫn cách dùng cảm nhận gắng sức hoặc đánh giá phù hợp khác. Nguồn không có tên thuốc, thang RPE hay mức mục tiêu nên mọi giá trị đó phải để chưa xác định.

Đối chiếu: [AHA, beta blockers và vận động](https://www.heart.org/en/health-topics/consumer-healthcare/medication-information/how-do-beta-blocker-drugs-affect-exercise). Chatbot chỉ chuyển câu hỏi tới bác sĩ, không bàn giờ uống hoặc điều chỉnh liều.

## 4. Chuẩn an toàn với béo phì và bảo vệ khớp

Prompt đề nghị ưu tiên tác động thấp, điểm tựa, điều kiện thoáng và lưu ý nhiệt. Lưu các đề nghị để người có chuyên môn lựa chọn theo chức năng, đau, biến chứng và hiện trạng, không lấy BMI làm căn cứ duy nhất. Lượng nước cũng không được tự đặt khi chưa biết bệnh tim/thận hoặc chỉ định hạn chế dịch.

Đề nghị 0.5-1 kg mỗi tuần và 5-10% trong sáu tháng trong prompt không tương đương về số học, không trở thành ngưỡng tự động. Mục tiêu cân nặng phải do người điều trị xác định; bản này không cam kết tốc độ giảm hoặc thay đổi thành phần cơ thể.

## 5. Cấu trúc buổi tập và cách chia nhóm cơ

A3-A6 có nhãn thân trên đẩy, thân trên kéo, thân dưới rồi thân trên đẩy. Mỗi bảng có a1/a2, b1/b2, c1/c2 và một d1. Theo A2, nghỉ sau cặp, nhưng tất cả bảng đều thiếu số giây nghỉ. Một số bài thứ hai có volume riêng, trái với mô tả tổng quát “chỉ bài đầu có volume”; dữ liệu phải giữ đúng ô thay vì áp một quy tắc kế thừa.

A8 là buổi circuit riêng với sáu trạm, ba vòng, không có thời gian mỗi trạm, số lần hoặc nghỉ. Không gộp circuit thành khối cuối cùng của một buổi kháng lực khác và không mượn 60 giây từ lộ trình thể lực trước.

## 6. Giáo án nguồn được cung cấp

Các bảng dưới đây giữ đủ tên bài, nhãn cặp, volume, load và ô trống từ A3-A8. Dấu “Không ghi” là cách hiển thị ô null, không phải số không hoặc “làm như trên”. Đơn vị kg chỉ được gắn theo quy ước khi nguồn xác định tạ BB/DB/KB; mức máy giữ là ký hiệu máy. Chưa rõ mỗi bên, mỗi dụng cụ, bánh thêm hay tổng tải.

Không có ảnh gốc trong đợt này; số buổi/năm chưa rõ không được tự sửa bằng suy luận thời gian. Các bảng là nguồn lịch sử, không xác nhận khách đã hoàn thành hoặc được phép áp dụng lại.

### 6.1. Buổi 24, thân trên đẩy

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp. Decline Kettlebell Press có cờ yêu cầu rà soát y khoa theo nguồn.

| Cặp | Bài tập nguồn | Volume | Load |
| :--- | :--- | :--- | :--- |
| a1 | Barbell Bench Press | 3 x 12 | 5 |
| a2 | Kettlebell Front Raises | Không ghi | 10 |
| b1 | Decline Kettlebell Press | 3 x 12 | 20 |
| b2 | Dumbbell Lateral Raises | Không ghi | 7.5 |
| c1 | Straight Arm Pullover | Không ghi | Không ghi |
| c2 | Tricep Extension | 3 x 12 | Không ghi |
| d1 | V-up | 3 x 15 | Không ghi |

### 6.2. Buổi 25, thân trên kéo

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp. Hanging Leg Raises có cờ đánh giá vai, tay và khả năng treo.

| Cặp | Bài tập nguồn | Volume | Load |
| :--- | :--- | :--- | :--- |
| a1 | Hyper Extension | 3 x 12 | 10 |
| a2 | Seated Machine Row | Không ghi | 20 |
| b1 | Lat Pulldown | 3 x 12 | 35 |
| b2 | Rear Delt Fly | Không ghi | 24 |
| c1 | Face Pull | 3 x 15 | Không ghi |
| c2 | Cable Bicep Curl | 3 x 12 | 10 |
| d1 | Hanging Leg Raises | 3 x 15 | Không ghi |

### 6.3. Buổi 26, thân dưới

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp.

| Cặp | Bài tập nguồn | Volume | Load |
| :--- | :--- | :--- | :--- |
| a1 | Single Leg Deadlift | 3 x 12 | 6 |
| a2 | Single Leg Step Up | 3 x 15 | 10 |
| b1 | Kettlebell Good Morning | 3 x 12 | 15 |
| b2 | Bulgarian Split Squat | 3 x 10 | bw |
| c1 | Walking Lunge | 3 x 10 | 10 |
| c2 | Standing Calf Raises | 3 x 15 | 10 |
| d1 | Heel Touches | 3 x 15 | Không ghi |

### 6.4. Buổi 27, thân trên đẩy

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp. Decline Kettlebell Press có cờ yêu cầu rà soát y khoa theo nguồn.

| Cặp | Bài tập nguồn | Volume | Load |
| :--- | :--- | :--- | :--- |
| a1 | Smith Machine Barbell Bench Press | 3 x 12 | 10 |
| a2 | Kettlebell Overhead Press | Không ghi | 12.5 |
| b1 | Decline Kettlebell Press | 5 x 12 | 20 |
| b2 | Kettlebell Halos | Không ghi | 15 |
| c1 | Straight Arm Pullover | 3 x 12 | 10 |
| c2 | Cable Tricep Pushdown | Không ghi | 20 |
| d1 | Crunch Machine | 3 x 15 | Không ghi |

### 6.5. Nguồn A7, số buổi 19 hoặc 29 chưa xác nhận

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp. Decline Kettlebell Press có cờ yêu cầu rà soát y khoa theo nguồn. Năm trên sổ được báo là 2025; 2026 mới là đề nghị đính chính. Tên máy hỗ trợ và ý nghĩa ghi chú tải còn chờ xác nhận.

| Cặp | Bài tập nguồn | Volume | Load |
| :--- | :--- | :--- | :--- |
| a1 | Barbell Incline Press | 3 x 12 | 10 (ghi chú 7.5) |
| a2 | Kettlebell Halos | Không ghi | 26 |
| b1 | Decline Kettlebell Press | 3 x 12 | 20 |
| b2 | Kettlebell Front Raises | 3 x 12 | 10 |
| c1 | Dumbbell Tricep Extension | 3 x 12 | 17.5 |
| c2 | Máy hỗ trợ (tên máy chữ mờ, cần xác nhận) | Không ghi | bw |
| d1 | Crunch Machine | 3 x 12 | Không ghi |

### 6.6. Nguồn A8, số buổi 20 hoặc 30 chưa xác nhận

Bản chép tham chiếu, không dùng làm lời khuyên cho khách có bệnh nền. Ô không ghi không được kế thừa từ bài đầu cặp. Theo nguồn: 3 vòng, 6 trạm đều thuộc mô tả trọng lượng cơ thể. Không có thời gian hay số lần mỗi trạm.

| Trạm | Nội dung nguồn |
| :--- | :--- |
| 1 | Bodyweight Squat Overhead |
| 2 | Trạm thứ hai chữ mờ, cần xác nhận |
| 3 | Thigh to Knee |
| 4 | Bodyweight Squat |
| 5 | Mountain Climber |
| 6 | Bicycle Crunch |

### 6.7. Phân tích logic chia buổi và mức độ suy luận

Quan sát chắc chắn là thứ tự nhãn đẩy, kéo, thân dưới, đẩy trong bốn bảng đầu, có các cặp a/b/c và một d1. Tổng cộng năm bảng kháng lực có 15 cặp đầy đủ và 5 dòng d1 riêng; circuit không dùng cấu trúc cặp. Mọi ô có số lần ghi rõ nằm trong khoảng 10-15, nhưng nhiều ô không ghi, nên không thể nói mọi bài đều có đủ định lượng hoặc không có cách thực hiện khác.

Cặp liên hoàn có thể là công cụ tổ chức buổi; nguồn không đủ chứng minh tăng tiêu hao, tránh tải nặng hoặc an toàn với tăng huyết áp. Thiếu nghỉ, RPE, phản ứng huyết áp/đường huyết và thuốc nên các diễn giải đó phải chờ chuyên môn.

### 6.8. Những thay đổi tải và số hiệp thực sự quan sát được

Decline Kettlebell Press giữ ký hiệu tải 20 và chuyển 3 x 12 ở buổi 24 sang 5 x 12 ở buổi 27; trang A7 lại ghi 3 x 12 nhưng số buổi/năm chưa chắc. Không đủ để gọi toàn lộ trình tăng tiến đơn điệu. Barbell Bench Press tải 5 và Smith Machine Barbell Bench Press tải 10 là hai biến thể, không chứng minh lực cản hay sức mạnh đã tăng gấp đôi.

Straight Arm Pullover từ ô trống sang 3 x 12, tải 10 chỉ chứng minh lần sau có thêm ghi chép; không biết tải ban đầu. KB Halos từ 15 sang 26 trong trang chưa rõ số cần đối chiếu; không tự sửa hoặc gọi là tải nhẹ. Không có kết quả giảm mỡ được cung cấp.

## 7. Bộ chỉ số theo dõi tiến độ

Các chỉ số dưới đây là yêu cầu theo dõi cần được duyệt, không phải dữ liệu khách đã đạt. Cân nặng và vòng eo không thay cho đánh giá lâm sàng; vòng eo không đo trực tiếp mỡ nội tạng. Mục tiêu và giới hạn cá nhân không được suy từ bảng giáo án.

| Chỉ số | Tần suất hoặc trách nhiệm | Giới hạn |
| :--- | :--- | :--- |
| Cân nặng | Theo tuần theo đề nghị nguồn | Mục tiêu do người điều trị |
| Vòng eo | Chưa quy định | Giữ phương pháp đo nhất quán |
| Cảm nhận gắng sức | Trong buổi | Thang và mức cần duyệt |
| Phục hồi | Giữa các buổi | Không suy từ số ngày nghỉ |
| Đường huyết, HbA1c, huyết áp | Người điều trị theo dõi | Gym chỉ ghi nếu khách chủ động cung cấp đúng kênh |

Đợt số hóa này không mở chức năng thu thập chỉ số y khoa hoặc sao chép hồ sơ vào tài khoản hội viên.

## 8. Thư viện bài tập của lộ trình

Tái sử dụng ID thực tế trong thư viện, không dựa trên danh sách 40 bài đã cũ của prompt. Lat Pulldown, Face Pull và Walking Lunges đã tồn tại nên không tạo thêm bản cùng tên. Single Leg Step Up dùng liên kết đề xuất tới ex_sl_step_box, còn Rear Delt Fly dùng ID cũ nhưng ghi rõ nguồn này nói tải máy; không sửa metadata chương trình trước.

Định nghĩa mới có lưu ý kiểm duyệt trong contraindications. Với bài cũ, lưu ý riêng nằm ở programUsage.contextContraindications để không biến rủi ro của một hồ sơ thành chống chỉ định toàn cục. Mảng hướng dẫn chưa có nguồn vẫn trống, không phải xác nhận an toàn.

### 8.1. Nhóm đẩy, vai và tay mới

Các tên mới gồm Barbell Bench Press, Smith Machine Bench Press, Barbell Incline Press, Kettlebell Front Raises, Decline Kettlebell Press, Dumbbell Lateral Raises, Kettlebell Overhead Press và Kettlebell Halos. Straight Arm Pullover chưa xác định dụng cụ; Tricep Extension chưa xác định biến thể nên không gộp vào bản DB hoặc cable.

Đây là định nghĩa để giữ tham chiếu nguồn, không là hướng dẫn kỹ thuật. Các tải lịch sử có đơn vị theo nguồn vẫn cần xác nhận phạm vi đo; lưu ý tránh nín thở gắng sức không thay giấy bác sĩ hay đánh giá trực tiếp.

### 8.2. Nhóm kéo, chân và cơ lõi mới

Các tên mới còn có Hyper Extension, Seated Machine Row, Cable Bicep Curl, Hanging Leg Raises, Single Leg Deadlift, Kettlebell Good Morning, Bulgarian Split Squat, Standing Calf Raises, Heel Touches, V-up và Crunch Machine. Mỗi bản có lưu ý cần thẩm định bệnh lý, khả năng chịu tải và biến thể, không chẩn đoán chống chỉ định chỉ từ tên bài hoặc BMI.

Thông tin máy/dụng cụ chỉ là equipmentReferences chưa xác minh. Không gán vị trí, thông số, tình trạng hoạt động hoặc mặc định ghế decline và máy bụng có trong danh mục tài sản thật.

### 8.3. Circuit và tên chưa nhận diện

Bodyweight Squat Overhead, Thigh to Knee và Bicycle Crunch được lưu bằng tên nguồn. Thigh to Knee chưa rõ biến thể nên không tự viết động tác. Trạm thứ hai A8 và máy hỗ trợ A7 c2 có ID giữ chỗ riêng, nhãn unresolved_source_name; ID này chỉ đại diện ô chưa đọc được, không tạo ra một bài tập mới để khách thực hiện.

Ba vòng không đủ tính tổng thời gian hoặc năng lượng tiêu hao. Không thay trạm mờ bằng Squat, MTC hoặc bài khác, không đưa placeholder vào planner. Các tên chưa rõ cần huấn luyện viên đối chiếu nguồn gốc.

## 9. Dấu hiệu phải dừng buổi tập ngay lập tức

Nguồn liệt kê đau ngực, khó thở bất thường, choáng váng, mồ hôi lạnh kèm run tay, nhìn mờ, đau đầu dữ dội, buồn nôn và tê hoặc yếu một bên. Khi đang xảy ra cần dừng vận động và gọi hỗ trợ. Đau ngực, dấu hiệu đột quỵ, mất ý thức, co giật hoặc khó thở nghiêm trọng cần gọi cấp cứu, không chờ xử lý HEALTH_RISK theo hàng đợi thông thường.

Tại Việt Nam gọi 115; nơi khác dùng số cấp cứu địa phương. Không tự lái xe khi có dấu hiệu nguy hiểm; làm theo tổng đài. Chỉ thực hiện sơ cứu/CPR/AED theo đào tạo hoặc hướng dẫn trực tiếp. Chatbot không chẩn đoán, không tuyên bố đã gọi thay khách.

### 9.1. Phân biệt cấp cứu và chuyển chuyên môn thường

Bộ nhận diện hiện ưu tiên triệu chứng nguy hiểm trong tin nhắn hiện tại, sau đó mới xử lý bệnh nền, thuốc hoặc nhu cầu dịch vụ. Nhắc một bệnh mạn tính không tự trở thành cấp cứu; nội dung do bot nói không dùng làm bằng chứng người hỏi có triệu chứng. Nhận diện từ khóa vẫn có giới hạn, không phải hệ thống phân loại cấp cứu đã được kiểm định.

Đối chiếu dấu hiệu: [AHA](https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms). Đối chiếu số 115: [hệ thống cấp cứu địa phương](https://bvxuyena.com.vn/tin-tuc/tram-ve-tinh-cap-cuu-115-benh-vien-da-khoa-xuyen-a).

## 10. Chống chỉ định và điều kiện bắt buộc chuyển giao

Các bệnh nền, thuốc, biến chứng và yêu cầu ngưỡng đường huyết/huyết áp kích hoạt HEALTH_RISK trước PROGRAM. Không gợi ý giáo án, ví dụ bài, thực đơn hoặc trấn an tập nhẹ. Không nói liều, giờ uống hoặc ảnh hưởng vận động lên liều thuốc. Các chống chỉ định cá nhân phải do người điều trị xác định, không được bịa thêm vào thư viện.

Câu hỏi dịch vụ về tiếp nhận bệnh nền cũng giữ tag HEALTH_RISK nhưng được trả lời quy trình an toàn. Nguồn chưa kèm xác nhận năng lực HLV, không được quảng cáo chứng chỉ hoặc tự nhận điều trị. Giấy khám sức khỏe không tự cấp quyền dùng giáo án lịch sử.

## 11. Bộ hỏi đáp mẫu cho trợ lý AI

Các mẫu dưới đây là cách phản hồi theo quy tắc sản phẩm, không phải nội dung được tạo bằng truy xuất giáo án. Mọi trường hợp bệnh nền vẫn chuyển HEALTH_RISK, kể cả câu hỏi dịch vụ. Trường hợp có triệu chứng cấp tính dùng ưu tiên cấp cứu trước. Xưng “em” với khách, không cam kết đã liên hệ bác sĩ, có chỗ trống hoặc đã xác nhận đủ điều kiện nếu hệ thống chưa thực hiện.

### 11.1. Khách tự khai tiểu đường và muốn giảm mỡ

Hỏi: Em bị tiểu đường type 2, muốn giảm mỡ thì tập gì?

Đáp: Dạ, em không chọn bài hoặc đưa giáo án giảm mỡ khi có bệnh nền qua chat. Anh/chị cần người điều trị xác nhận phạm vi vận động và cung cấp danh sách thuốc qua kênh riêng cho người phụ trách. Em xin chuyển yêu cầu chuyên môn để xác nhận quy trình tiếp nhận; chưa thể kết luận kế hoạch phù hợp chỉ từ thông tin này. Tag: HEALTH_RISK.

### 11.2. Khách hỏi dịch vụ tiếp nhận

Hỏi: Bên mình có nhận khách bị bệnh nền không?

Đáp: Dạ, em có thể tiếp nhận yêu cầu để bộ phận chuyên môn xác nhận khả năng hỗ trợ. Quy trình đề nghị cần giấy bác sĩ về phạm vi vận động và danh sách thuốc, sau đó người phụ trách đánh giá trực tiếp trước khi quyết định nhận tập. Em chưa xác nhận đủ điều kiện hoặc HLV chuyên trách cho trường hợp cụ thể này. Tag: HEALTH_RISK, phản hồi chỉ ở mức dịch vụ.

### 11.3. Khách hỏi giờ uống thuốc

Hỏi: Nên uống thuốc tiểu đường trước hay sau khi tập?

Đáp: Dạ, em không hướng dẫn giờ uống, đổi liều hoặc ngưng thuốc qua chat. Anh/chị hãy hỏi bác sĩ điều trị hoặc dược sĩ đang phụ trách đơn thuốc; không điều chỉnh theo giáo án của người khác. Em xin chuyển yêu cầu chuyên môn, không đưa bài tập hoặc giải thích liều thay cho chỉ định. Tag: HEALTH_RISK.

### 11.4. Khách hỏi thời hạn và kết quả

Hỏi: Tập bao lâu thì giảm được bao nhiêu cân nếu có cao huyết áp?

Đáp: Dạ, em không cam kết số cân hoặc thời hạn cho người có bệnh nền. Mục tiêu cần người điều trị xác định sau đánh giá; nhật ký nguồn không chứng minh một tốc độ giảm cụ thể. Em xin chuyển yêu cầu để người phụ trách xác nhận quy trình, không dùng gói 255 buổi trong hồ sơ cũ để báo giá hoặc bảo đảm kết quả. Tag: HEALTH_RISK.

### 11.5. Khách muốn xuống cân nhanh

Hỏi: Người béo phì tập gì cho nhanh xuống cân?

Đáp: Dạ, em chưa chọn bài hay chế độ ăn chỉ từ mô tả cân nặng. Anh/chị cần đánh giá y tế và khả năng vận động trước khi xây kế hoạch; không dùng BMI hoặc mức tạ của người khác để quyết định. Em xin chuyển yêu cầu chuyên môn, không khuyến nghị giảm nhanh hoặc tăng cường độ qua chat. Tag: HEALTH_RISK.

### 11.6. Khách hỏi ngưỡng trước tập

Hỏi: Đường huyết bao nhiêu thì không nên tập?

Đáp: Dạ, em không đặt ngưỡng đường huyết hoặc huyết áp cho anh/chị. Các ngưỡng, cách theo dõi và kế hoạch xử trí cần do bác sĩ điều trị hướng dẫn riêng. Em xin chuyển yêu cầu chuyên môn; giấy hoặc số đo tự gửi chưa đủ để chatbot cho phép bắt đầu tập. Tag: HEALTH_RISK.

### 11.7. Khách đang có triệu chứng nguy hiểm

Hỏi: Tôi đang tập thì đau ngực, khó thở bất thường.

Đáp: Anh/chị hãy dừng tập, nhờ người gần đó hỗ trợ và gọi 115 ở Việt Nam hoặc cấp cứu địa phương ngay. Đừng chờ tư vấn viên phản hồi hoặc tự lái xe. Em không thể xác định nguyên nhân qua chat và chưa gọi cấp cứu thay anh/chị. Nếu người bệnh bất tỉnh hoặc không nuốt an toàn, không cho ăn/uống. Tag: HEALTH_RISK, ưu tiên cấp cứu.
