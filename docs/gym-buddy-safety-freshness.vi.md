# Nối thông điệp an toàn với hiệu lực readiness

Tài liệu này bổ sung cho `gym-buddy-architecture.vi.md` và `gym-buddy-staging.vi.md`. Việc đọc hồ sơ/nhật ký trong chat vẫn chỉ đọc; có một ngoại lệ an toàn hẹp: làm mất hiệu lực xác nhận thể trạng cũ khi chính hội viên báo một lưu ý an toàn mới.

## Vì sao cần nối hai luồng?

Training đã kiểm tra readiness khi bắt đầu kế hoạch. Nếu một hội viên tạo kế hoạch lúc chưa báo đau, sau đó báo đau trong AI Gym Buddy, chỉ hiện cảnh báo ở cửa sổ chat là chưa đủ: kế hoạch training cũ vẫn có thể sử dụng xác nhận trước đó. Điểm nối mới tái sử dụng cách xử lý bảo thủ đã có ở safety chat của Training.

## Điều kiện thực hiện

Chỉ gọi thao tác này khi có token hợp lệ, email xác minh, cờ đọc ngữ cảnh riêng và training đã bật, UID có quyền pilot, hồ sơ thuộc đúng UID và có consent. Khách, tài khoản chưa được cấp quyền và trường hợp hỏi hộ người khác không được đổi readiness của hội viên. Không tin UID hoặc bệnh lý tự gắn vào request body.

`isOwnSafetyReport()` tách câu hỏi khái niệm, câu phủ định, nội dung trích dẫn và một số ngữ cảnh hỏi hộ khỏi thông điệp báo nguy cơ của người nói. Đây vẫn là bộ quy tắc có giới hạn, không phải công cụ chẩn đoán. Cần tiếp tục đánh giá cách nói thực tế trước production.

## Thao tác chính xác

`invalidateOwnTrainingReadiness()` chạy transaction trên `training_members/{uid}`. Khi trạng thái active, chủ hồ sơ và consent hợp lệ, nó chỉ thay `readiness` bằng `null` nếu readiness cũ tồn tại.

Không tạo hồ sơ, chẩn đoán, triệu chứng mới, câu trả lời đau/không đau, kế hoạch mới, nhật ký buổi hoặc bữa ăn. Không sửa `profileRevision`, `historyRevision`, `healthReviewNeeded` hoặc nội dung hồ sơ. Thực hiện lại không có readiness thì trả false.

Khi transaction thành công, phản hồi có reason code `previous_readiness_invalidated` và một thông báo rõ ràng. `saved:false` vẫn có nghĩa chưa ghi hoàn thành buổi/bữa hoặc thực hiện yêu cầu ghi nghiệp vụ; không được diễn giải là tuyệt đối không có thay đổi trạng thái nào trên server.

## Tốc độ và lỗi

Với luồng SSE, nội dung cảnh báo đã kiểm soát được phát trước khi chờ cập nhật freshness, để không trì hoãn hướng dẫn tìm trợ giúp. Không chờ mô hình sinh câu trả lời cho trường hợp khẩn.

Nếu bước kiểm tra quyền hoặc transaction lỗi, phản hồi không báo rằng readiness đã được vô hiệu. Luồng có thể kết thúc bằng error thay vì done sau phần cảnh báo. Nếu mạng ngắt sau khi server đã cập nhật, lần gửi tiếp phải đồng bộ lại phiên; không tự tạo lại readiness cũ.

Thao tác bắt đầu Training vẫn kiểm tra server. Sau khi readiness đã bị vô hiệu hóa, một kế hoạch dự kiến cũ bị từ chối bắt đầu. Một buổi đã bắt đầu vẫn có thể ghi phần thực tế đã xảy ra; việc ghi lại hành động không phải khuyến nghị tiếp tục tập.

## Giới hạn và nghiệm thu

Chưa có dashboard handoff mới hoặc thao tác gửi hồ sơ cho PT. `handoverStatus:suggested` vẫn chỉ là đề nghị chuyển chuyên môn, không phải lịch hẹn hoặc thông báo đã gửi. Không lưu chẩn đoán từ câu chat và không thay thế xác nhận thể trạng mới trong Training.

Bộ kiểm thử riêng bao gồm đúng UID, không thay hồ sơ/lịch sử, lỗi storage, không consent, không profile, hỏi hộ, khách, thiếu quyền, nguồn triệu chứng phủ định, kế hoạch cũ bị khóa và nhật ký buổi đã bắt đầu vẫn ghi được. Các test sử dụng dữ liệu tổng hợp, không tác động hồ sơ doanh nghiệp.
