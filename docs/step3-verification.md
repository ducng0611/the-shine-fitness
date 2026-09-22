# Step 3 — Báo cáo kiểm chứng thực tế

Ngày kiểm tra: **22/09/2026**. Baseline: main `d40f9d37dff128ab2fdf079276dbaac70c37e0d7`.

Mã ứng dụng được kiểm tra: `7399372ecd921f4bc815822f1684ef066319fa94` trên nhánh `feat/member-memory-adaptive-workout`. Các thay đổi tài liệu sau commit này không làm thay đổi mã ứng dụng.

## 1. Kết quả GitHub Actions đã quan sát

[Run 35693830453 — Step 3 training verification](https://github.com/ducng0611/the-shine-fitness/actions/runs/35693830453) có cả ba jobs hoàn tất **success**. Kết quả được kiểm tra qua step status, log và artifact thực tế; không suy đoán từ việc workflow tồn tại.

| Hạng mục | Kết quả | Phạm vi |
| --- | --- | --- |
| Domain, service và HTTP tests | **91/91 đạt**, không bỏ qua | Logic nghiệp vụ, ngữ cảnh, planner, ownership, concurrency và router; dùng dữ liệu tổng hợp, store/verifier thử nghiệm. |
| Firebase Auth + Firestore emulator | **11/11 đạt**, không bỏ qua | Firebase token trong emulator, Admin SDK, transaction thật trên Firestore emulator, rules và API. |
| Chromium browser flows | **3/3 luồng đạt**, không có page error | React forms thật với API HTTP trong test harness; desktop 1280 px và mobile viewport 390 px. |
| `npm run typecheck:training` | **Đạt** | Strict TypeScript cho module mới. |
| `npm run lint` | **Đạt** | Kiểm tra TypeScript toàn dự án. |
| `npm run build` | **Đạt** | Vite frontend và esbuild backend. Cảnh báo frontend chunk lớn vẫn còn. |

Jobs của run trên: `unit-and-build` 106636328083; `firebase-emulator` 106636328345; `browser-smoke` 106636328397.

## 2. Firebase emulator đã kiểm tra gì?

Dự án cô lập `demo-shine-training`, không có dữ liệu hội viên thật và không dùng database production. Các kiểm tra gồm:

- Token hợp lệ từ Auth emulator được chấp nhận; token sai và tài khoản bị vô hiệu hóa bị chặn.
- Profile, kế hoạch và lịch sử của hội viên A không được đọc/ghi qua tài khoản B.
- Body không chuyển quyền sở hữu hồ sơ sang UID khác.
- Tạo kế hoạch, bắt đầu và xác nhận kết quả qua HTTP API với adapter Firestore thật.
- Nhiều yêu cầu completion đồng thời không tạo nhiều nhật ký cho cùng kế hoạch.
- Client không được đọc/ghi trực tiếp các collection authoritative riêng tư, kể cả chủ sở hữu.
- Firestore rules chặn owner fields mâu thuẫn và đổi chủ ở các writes legacy được bảo vệ.
- Readiness báo đau dừng planner.
- Catalogue synthetic đã duyệt được sử dụng trong test; thay trạng thái máy phải được kiểm tra lại trước khi bắt đầu.
- Xuất/xóa chỉ tác động dữ liệu Step 3 của chủ tài khoản.

Artifact `training-emulator-results` chứa log TAP. Đây là kiểm chứng bằng **emulator**, không phải tài khoản và Firebase project thật của phòng tập. Log có cảnh báo metadata lookup và dependency; các cảnh báo không được che giấu và không làm test thất bại.

## 3. Ba luồng trình duyệt đã chạy

1. Tạo hồ sơ → hiểu câu hỏi 35 phút tập chân → xác nhận readiness → tạo khung personalized-general khi chưa có catalogue → bắt đầu → nhập phần tập thực tế → lưu → lịch sử có đúng một buổi. Kiểm tra layout 390 px không tràn ngang.
2. Server lưu completion thành công nhưng phản hồi bị cắt để mô phỏng mất mạng → bấm gửi lại đúng payload → hiển thị đã lưu trước đó và không tạo thêm buổi.
3. Báo đau hiện tại → tạo kế hoạch → giao diện hiển thị tạm dừng lập kế hoạch, không xuất thẻ buổi tập.

Artifact `training-browser-results` chứa `result.json`, `desktop-plan.png`, `mobile-plan.png`, `mobile-history.png` và log server. `result.json` ghi 3 kết quả `passed: true` và `pageErrors: []`.

Đã mở và kiểm tra trực quan ảnh desktop/mobile được tạo từ run thành công. Đây là ảnh giao diện chạy với **dữ liệu tổng hợp trong test harness**, không phải website production hay máy gym thật.

Lần chạy đầu [35693363703](https://github.com/ducng0611/the-shine-fitness/actions/runs/35693363703) đạt unit/build và emulator, nhưng test trình duyệt dừng ở accessible label của ô chọn năng lượng. Đã thêm tên truy cập rõ ràng cho các select hồ sơ/readiness, cập nhật kiểm thử và chạy lại. Không bỏ qua hoặc tắt test để báo thành công.

## 4. Kiểm tra local và CI

91 tests, strict typecheck và full-project typecheck cũng đạt trong môi trường phát triển. Local build đạt. Trình duyệt trong môi trường phát triển bị chặn bởi chính sách điều hướng doanh nghiệp, nên kết quả browser được lấy từ Chromium chuẩn trên GitHub Actions; không tuyên bố local browser đã đạt.

CI cuối cùng dùng `contents: read`, không tự ghi commit, đổi dependency, merge hoặc deploy. Các workflow chuyển mã/thu thập baseline tạm thời đã được gỡ khỏi đầu nhánh. Lockfile được bổ sung cho dependency manifest hiện có để dùng `npm ci` nhất quán.

## 5. Phạm vi regression

Không thay thế các module RAG, Excel analytics, email automation hoặc customer reviews. Toàn bộ dự án đã qua typecheck/build và các điểm mở tính năng mới có feature flag. Điều này **không đồng nghĩa** đã kiểm thử end-to-end gửi email thật, Gemini/RAG thật, mọi trang admin hay mọi biểu đồ Member Portal.

Nhật ký Step 3 có tab riêng. Hợp nhất hai chiều với mọi biểu đồ legacy chưa được triển khai để tránh ghi kép/đếm trùng.

## 6. Chưa được kiểm chứng hoặc chưa triển khai

- Chưa chạy với hội viên thật, API key thật, Firebase project staging/production của doanh nghiệp.
- Chưa nghiệm thu trực tiếp trên iPhone/Android vật lý, Safari/WebKit hoặc toàn bộ hành trình Google popup login trên domain deploy.
- Chưa có dữ liệu máy/khu vực thật và định lượng bài do người có chuyên môn duyệt.
- Chưa xác minh quyền hợp đồng hội viên đã trả phí; hiện có quyền pilot do server quản lý.
- Chưa thực hiện privacy/security audit toàn ứng dụng hoặc load test nhiều instance.
- Chưa hợp nhất biểu đồ cũ, tối ưu bundle lớn, mở rộng rate limiting phân tán hoặc nâng cấp toàn bộ dependency.
- Chưa merge vào `main`, chưa ghi dữ liệu production và chưa deploy.

**Kết luận:** mã Step 3 đã qua các lớp kiểm thử nêu trên và sẵn sàng review/pilot trên staging. Kết quả kiểm thử không chứng minh tính đúng đắn chuyên môn của giáo án, không phải chứng nhận an toàn y khoa và không thay thế việc nghiệm thu bằng dữ liệu thật.

Xem [kiến trúc tiếng Việt](step3-architecture.vi.md), [kiến trúc kỹ thuật](step3-architecture.md) và [hướng dẫn pilot](step3-pilot-guide.vi.md).
