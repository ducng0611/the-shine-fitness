# Shine Companion — Kết quả kiểm tra thực tế

Ngày kiểm tra: **22/09/2026 theo Asia/Ho_Chi_Minh** (GitHub ghi log UTC vào tối 21/09/2026).

## Kết quả đã quan sát

[GitHub Actions run 35642723870](https://github.com/ducng0611/the-shine-fitness/actions/runs/35642723870) hoàn tất thành công. Nguồn xác nhận là log/step status của job `verify`, không phải suy đoán từ sự tồn tại của workflow.

| Hạng mục | Kết quả |
| --- | --- |
| Script tích hợp chạy lại | Thành công, không nhân đôi thay đổi |
| Unit tests nghiệp vụ | 49/49 đạt; không có test bỏ qua |
| Khóa dependency | Đã đồng bộ package-lock.json với các dependency có sẵn trong package.json |
| Cài bằng npm ci --ignore-scripts | Thành công |
| npm run lint (tsc --noEmit) | Thành công |
| npm run build (Vite + esbuild backend) | Thành công |

Lần chạy đầu [35642584947](https://github.com/ducng0611/the-shine-fitness/actions/runs/35642584947) có 49 unit tests đạt nhưng bị chặn ở `npm ci`: lockfile cũ thiếu các dependency đã có trong manifest. Lockfile được sửa trên nhánh feature, sau đó lần chạy trên đã cài và build thành công. Không âm thầm bỏ kiểm tra type hoặc bỏ qua lỗi build để báo thành công.

Workflow cuối cùng dùng `contents: read`, cài bằng lockfile và **không tự ghi commit, nâng dependency, merge hoặc deploy**. Các commit tích hợp/đồng bộ lock trong giai đoạn thiết lập chỉ thực hiện trên `feat/shine-ai-companion`.

## Chưa được xác minh bằng lần chạy này

- Chưa chạy app bằng key Gemini, USDA hoặc Google Places của phòng tập.
- Chưa có kiểm thử Firebase emulator/Firestore quyền A/B hoặc race condition end-to-end.
- Chưa kiểm tra giao diện trực quan trên iPhone/Android hoặc thực hiện buổi tập với hội viên thật.
- Chưa xác minh máy, khu vực, chỉ dẫn hoặc định lượng bài tập tại cơ sở.
- Chưa thẩm định mẫu dinh dưỡng bằng chuyên gia của phòng tập.
- Chưa xác minh entitlement hội viên đã thanh toán hoặc đồng bộ tất cả biểu đồ legacy.
- Chưa merge vào main và chưa triển khai lên website đang chạy.

**Kết luận đúng phạm vi:** mã đã qua unit tests, kiểm tra kiểu và build; đây vẫn là pilot cần dữ liệu thật, cấu hình provider và nghiệm thu staging. Không dùng kết quả CI làm bằng chứng về tính chính xác y khoa, dinh dưỡng, bảo mật toàn hệ thống hoặc khả năng đo kcal chính xác từ ảnh.

Xem [kiến trúc](shine-companion-architecture.md) và [checklist triển khai](shine-companion-rollout.md) để tiếp tục review.
