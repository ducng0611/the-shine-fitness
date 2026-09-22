# Training Pathway Intake — kết quả kiểm chứng

Ngày: 22/09/2026. Nhánh `feat/training-pathway-intake`, PR #4, base `feat/gym-assets-onboarding` (`cdb898481d10f071ce37201993b4ebe3f4b9dfec`). Chưa merge hoặc deploy.

## 1. Mốc mã được kiểm tra

[Private pathway intake verification — run 35703639170](https://github.com/ducng0611/the-shine-fitness/actions/runs/35703639170), head `92ad9d595b391b4273f2ba6ba5ce2d147b06c066`, đã hoàn tất thành công ở cả ba jobs. Code sửa cuối tại `06119770659a2d9ec44e97e7bcc7579c1f0d0bd6`; commit tiếp theo chỉ xóa workflow sửa tạm thời. Các bổ sung manifest số lượng và tài liệu sau đó không đổi logic ứng dụng.

| Kiểm tra | Kết quả thực tế | Phạm vi |
| --- | --- | --- |
| Pathway domain + HTTP API | 37/37 đạt, không bỏ qua | Validation, nguồn/tọa độ, blank/dash/uncertainty, quyền admin, owner isolation, revision, retry, bản gốc/bản sửa, source review và xóa |
| Python tracker extractor | 4/4 đạt | Layout tổng hợp, nguồn lặp, loại header định danh, không chạy công thức, layout thiếu |
| Firebase Auth + Firestore emulator | 7/7 đạt, không bỏ qua | Token emulator, transaction thật trong emulator, rules, cách ly hai admin, source-review gate và deletion tombstone |
| Chromium modal flows | 4/4 đạt, pageErrors trống | Preview không ghi, đồng ý riêng tư, mất phản hồi/gửi lại, chặn duyệt nguồn chưa liên kết, modal 390 px, sửa JSON hủy preview cũ |
| Strict pathways TypeScript | Đạt | `npx --no-install tsc -p tsconfig.pathways.json --noEmit` |
| Step 3 domain/service/HTTP | 99/99 đạt | Bộ nhớ, planner và các luồng cũ đã có kiểm thử |
| TypeScript toàn dự án | Đạt | `npm run lint` thực chất chạy `tsc --noEmit` |
| Vite + esbuild | Đạt | Frontend và backend; cảnh báo bundle lớn/dynamic import vẫn còn |

Jobs: `tests-and-build` 106667253187, `emulator` 106667253519, `browser` 106667253591.

Đã đọc log thực tế, tải và mở artifact: `pathway-browser-results` 10683975760 (`result.json`, `desktop.png`, `mobile.png`, log server), `pathway-emulator-results` 10683317505 (TAP). Artifact lưu 7 ngày; đây không phải bản lưu hồ sơ khách hàng.

[Step 3 regression run 35703639219](https://github.com/ducng0611/the-shine-fitness/actions/runs/35703639219) cũng đã hoàn tất success ở unit/build, Firebase emulator và browser-smoke. Không cộng lặp các bộ kiểm thử để tăng số liệu.

## 2. Các lỗi đã phát hiện và sửa

Run đầu `35702890748` không đạt toàn bộ. Domain/API và Python đạt; strict TypeScript phát hiện kiểu case ID quá hẹp, thiếu declaration React DOM, và trường UID bị ghi đè trong danh sách admin cũ. Browser phát hiện nội dung modal tràn ngang ở 390 px.

Đã sửa:

- Case ID dùng kiểu string được kiểm tra ở server, thay vì bị giới hạn bởi kiểu suy ra của UUID mới tạo.
- Thêm đúng dependency phát triển `@types/react-dom@19.0.2` và lockfile. Không thêm shim any hoặc tắt strict checking; kiểm tra dependency bảo đảm các gói đã khóa không bị cập nhật ngoài ý muốn.
- UID hiển thị từ document admin dùng document key sau phép spread, không để trường dữ liệu ghi đè ID. Đây không phải thay thế cơ chế xác thực/phân quyền admin.
- Grid mobile dùng `minmax(0,1fr)`, giới hạn min-width của con, file inputs và ngắt dòng; bảng có vùng cuộn riêng. Không bỏ kiểm tra overflow để báo thành công.

Công cụ chuyển code/sửa tạm thời đã được gỡ khỏi đầu nhánh. Workflow cuối chỉ có quyền đọc repository, không tự commit, merge, deploy hoặc nạp dữ liệu khách hàng. Một lần chuyển code đầu tiên bị GitHub từ chối thao tác workflow bằng token chỉ có quyền content; đã tách thao tác workflow sang connector được cấp quyền, không tăng quyền của runtime hoặc dùng thông tin bí mật.

## 3. Dữ liệu thật được xử lý ở đâu?

Các ảnh và workbook do người dùng cung cấp chỉ được xử lý trong môi trường làm việc riêng của cuộc trò chuyện. Workbook đọc offline bằng openpyxl; ảnh được chép bằng quan sát, không thực hiện OCR hàng loạt hoặc gửi đến một provider qua ứng dụng.

Bộ riêng tư có 3 nguồn, 90 dòng quan sát và 460 trường CSV; 9 trường được đánh dấu chưa đọc chắc chắn. Các khối lặp được giữ nguyên để đối chiếu, không đếm thành tiến bộ mới. Bộ đã qua executable schema và kiểm tra CSV. Đây là kiểm tra cấu trúc/bảo toàn dữ liệu, không phải xác nhận mọi chữ viết tay đã đọc đúng.

Các trường định danh trực tiếp đã bị loại khỏi bản trích xuất; bản còn lại vẫn nhạy cảm, không được coi là dữ liệu vô danh. Không có tên, bệnh lý, số đo, nhật ký thật, ảnh, workbook gốc hay chữ ký được thêm vào GitHub. `data/training-pathways/intake-batches/intake-001.structure.json` chỉ chứa số lượng và loại nguồn được kiểm soát, không chứa giá trị nguồn.

Không có bản ghi khách hàng nào được nạp vào Firestore bởi nhiệm vụ triển khai này. Import/lưu riêng tư cần người dùng thực hiện trên staging với đúng quyền và sự xác nhận.

## 4. Các ranh giới chưa được kiểm chứng hoặc chưa xây

- Chưa kiểm thử với tài khoản Firebase staging/production của doanh nghiệp, provider AI thật hoặc hồ sơ thật trong hệ thống triển khai.
- Chưa tự động nhận diện chữ viết tay từ ảnh trong modal; ảnh chỉ là tham chiếu cục bộ. Excel hiện cần script offline đúng layout, không phải parser mọi workbook.
- Chưa thử iPhone/Android vật lý, Safari/WebKit, tải nhiều instance hoặc audit riêng tư/bảo mật toàn bộ app.
- Chưa có chia sẻ/ủy quyền giữa admin cho từng case; case hiện chỉ thuộc admin nhập.
- Chưa có bộ mẫu lộ trình được duyệt chuyên môn, automatic case matching, liên kết hội viên, cá nhân hóa giáo án nhiều tuần hoặc fine-tuning.
- Chưa chạy end-to-end RAG/provider/email thật hoặc mọi màn hình legacy. Build thành công không đồng nghĩa mọi chức năng cũ đều được nghiệm thu.
- Còn cảnh báo frontend chunk lớn, Firebase dynamic/static import và dependency/action deprecation. Không giấu hoặc tắt các cảnh báo này.

`source_reviewed` chỉ nghĩa là đã kiểm tra bản chép, không phải giáo án được phép sử dụng. `eligibleForPlanner` vẫn false. Kiểm thử phần mềm không xác nhận nội dung tập luyện là phù hợp y khoa.
