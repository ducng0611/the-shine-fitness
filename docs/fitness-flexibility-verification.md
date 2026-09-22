# Kiểm chứng lộ trình tăng thể lực và linh hoạt

Ngày kiểm tra: 22/09/2026. Nhánh: `feat/fitness-flexibility-program`. PR #5, chưa merge hoặc deploy. Nhánh cơ sở: `feat/training-pathway-intake` tại `56398e0b78ae3504d9ff9c9474cce1997ba66051`.

## 1. Kết quả thực tế

Mã nguồn đã kiểm tra: `84ddc6ab844b3fb01d99618b357187b4245b5841`. Báo cáo này là commit tài liệu sau mốc kiểm tra, không đổi mã ứng dụng.

[Fitness-flexibility knowledge verification, run 35708929946](https://github.com/ducng0611/the-shine-fitness/actions/runs/35708929946), job `106684514136`, hoàn tất thành công. Đã đọc log đầy đủ và tải artifact `fitness-flexibility-verification`, ID `10685957269`, gồm `tests.tap` và `validation.json`.

| Kiểm tra | Kết quả |
| --- | --- |
| Kiểm thử mới về nguồn, tuổi, chuyển giao, phân loại, RAG và ghép dữ liệu | 71/71 đạt, 0 bỏ qua |
| Step 3 nghiệp vụ, service và HTTP | 99/99 đạt |
| Assets và pathway domain/API | 64/64 đạt: 27 assets + 37 pathway |
| Strict TypeScript training và pathways | Đạt |
| TypeScript toàn dự án | Đạt |
| Vite frontend và esbuild backend | Đạt, còn cảnh báo hiệu năng |
| Kiểm tra RAG nguồn ngoại tuyến | Đạt, không gọi embedding và không ghi index |

[Step 3 regression, run 35708929874](https://github.com/ducng0611/the-shine-fitness/actions/runs/35708929874) và [Private pathway intake regression, run 35708929885](https://github.com/ducng0611/the-shine-fitness/actions/runs/35708929885) đều hoàn tất thành công ở các job unit/build, Firebase emulator và Chromium. Đây là bộ kiểm tra cô lập, không phải hồ sơ doanh nghiệp hoặc điện thoại thật. Không cộng lặp các lần chạy cùng suite thành số lượng kiểm thử mới.

## 2. Kết quả dữ liệu và chia đoạn

File `data/knowledge/08_program_fitness_flexibility.md` có đủ 8 trường frontmatter bắt buộc, cộng trạng thái kiểm duyệt. Theo thuật toán chia đoạn của builder và script B2:

- Tổng số đoạn: **35**.
- Đoạn ngắn nhất: **326 ký tự**.
- Đoạn dài nhất: **1074 ký tự**.
- Không có đoạn chỉ chứa tiêu đề hoặc vượt khoảng 200-1500 ký tự trong file mới.

Các file knowledge cũ vẫn có một số đoạn ngắn dưới 200 ký tự. Báo cáo không tuyên bố đã sửa hoặc chuẩn hóa tất cả tài liệu cũ.

`training_programs.json` hợp lệ, có **1 chương trình, 31 định nghĩa bài tập, 47 lần tham chiếu bài và 15 tham chiếu loại thiết bị**. Không có ID bài trùng; mọi exerciseId và requiredEquipmentId có định nghĩa. Tham chiếu thiết bị chưa phải tài sản đã kiểm kê hoặc xác minh khả năng sử dụng.

Nhánh cơ sở thực tế chưa có `training_programs.json`, `prog_weight_gain_pt50` hoặc bộ 24 bài được giả định trong prompt. Vì vậy khởi tạo version 1, không tạo giả chương trình tăng cân. Công cụ ghép được kiểm thử giữ chương trình cũ và metadata bài cũ, chỉ bổ sung usage không trùng; yêu cầu trùng ID nhưng khác nội dung chương trình bị từ chối.

## 3. Trung thực với nguồn

Giữ đủ năm giáo án, tên bài, con số, ô trống, lựa chọn đạp xe HOẶC treadmill, thiếu cool down của buổi 3, ký hiệu bw và tốc độ 4.0 chưa có đơn vị. Load số trần không đổi thành kg. Cable Tricep Push Down ghi 2 set và bw được giữ để chờ giải thích, không tự sửa.

Buổi 5 mang sessionType CARDIO_CIRCUIT, gồm 5 trạm, 3 vòng, mỗi trạm 60 giây. 900 giây là phần hoạt động tính từ nguồn, chưa gồm nghỉ, chuyển trạm hoặc khởi động.

Quan sát Plank 30 lên 50 giây rồi giữ 50; Squat và Leg Extension thay 2 x 15 thành 3 x 12; marker tải Leg Extension vẫn 10. Sự thay đổi tên bài thăng bằng không chứng minh kỹ thuật đã thành thạo. Không đủ dữ liệu để khẳng định mọi mức tải nhẹ, mật độ tăng liên tục, hiệu quả đã đạt hoặc định lượng buổi 6-30. Những giai đoạn sau được ghi là định hướng cần duyệt.

## 4. Hành vi an toàn và trạng thái RAG

HEALTH_RISK được kiểm tra trước mô hình và cache, với từ khóa tiếng Việt có/không dấu, tuổi/lớp học, ngữ cảnh phụ huynh, bệnh lý và chất bổ sung. Lịch sử chỉ dùng lời người dùng; lời chatbot không tự xác nhận tuổi. PRICE vẫn ưu tiên khi có yêu cầu giá, nhưng từ giáo án không còn bị khớp nhầm với giá. Bộ nhận diện quy tắc chưa chứng minh bắt mọi cách diễn đạt, phủ định hoặc đối tượng được nhắc đến.

Bản Markdown là `needs_review` và `historical_reference`. **publicRetrievalAllowed=false**. Builder không index bản nguồn này; runtime cũng loại chương trình chưa được duyệt hoặc không thuộc public_overview, kể cả index cũ chứa đoạn tương tự cao. Kiểm thử vector là dữ liệu tổng hợp, không phải đánh giá chất lượng embedding thật.

Thư viện program cũng `verified=false`, chưa được nối thành giáo án cá nhân tự động. Các trường kỹ thuật/chống chỉ định không có nguồn HLV được giữ trống thay vì tự sáng tác. Tài liệu đã phân biệt giới hạn chatbot với chuẩn khoa học: cấm tạo 1RM là chính sách sản phẩm, không gán thành lệnh cấm phổ quát AAP; thời lượng ngủ tham chiếu đúng nhóm tuổi AASM. Liên kết nghiên cứu nằm ở cuối file knowledge.

## 5. Bảo mật và phạm vi bàn giao

Bản công khai không bổ sung tên, địa chỉ, số điện thoại, ngày sinh hoặc chữ ký. Số đo chi tiết và ngày lập hồ sơ của trẻ không được đưa vào repo; bản nguồn đầy đủ được giữ riêng tư. Việc loại định danh trực tiếp không phải chứng nhận vô danh hóa hoàn toàn. Bản riêng tư không thuộc ZIP mã nguồn công khai và không được index.

Đợt này không nạp Firestore, sửa dữ liệu hội viên, ghi nhật ký hoàn thành, gọi API AI, tạo embedding, chạy eval:rag với provider thật, bật feature flag, merge main hoặc deploy. Không có modal publish chương trình mới; JSON chương trình không phải schema PathwaySourceBundle của modal tiếp nhận nguồn.

## 6. Cách kiểm tra lại

```bash
npm ci --ignore-scripts
node --import tsx --test tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/validate-fitness-flexibility.ts --report
npm run build:index -- --check
npm run test:training
npm run lint
npm run build
```

Lệnh build:index có --check không cần API key và không ghi index. Sau này chỉ xây embedding khi đã duyệt bản tổng quan dùng cho khách; bản historical_reference vẫn bị bỏ qua có chủ ý. Khởi động lại Express sau lần lập chỉ mục thật.

## 7. Giới hạn còn lại

Chưa kiểm thử mô hình/provider thật, Firebase staging của doanh nghiệp, Safari hoặc điện thoại vật lý; chưa audit bảo mật toàn ứng dụng hay thẩm định chuyên môn. Build còn cảnh báo dynamic/static import và bundle JavaScript khoảng 2.65 MB minified, 700 kB gzip. Biên dịch thành công không xác nhận email, RAG trực tuyến hoặc mọi trang legacy đã hoạt động end-to-end. Artifact CI lưu 7 ngày.

Kết luận: dữ liệu và mã trong phạm vi này đã qua kiểm tra nguồn, cấu trúc, hành vi an toàn và các suite hồi quy nêu trên. Bản chương trình vẫn là nguồn tham chiếu chờ duyệt, chưa phải giáo án được phép tự áp dụng cho trẻ.
