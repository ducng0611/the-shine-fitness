# AI Gym Buddy: báo cáo kiểm chứng thư viện dinh dưỡng

## 1. Phiên bản và phạm vi

Nhánh `feat/nutrition-knowledge`, PR #10, kế thừa `a5371584dafee52ed0d87da79788ee3089db85a7`. Mã ứng dụng, dữ liệu và kiểm thử đã xác minh tại `efad7cbb5fbfe0c6c0e209e2ce214c6a2b7acc85`. Báo cáo này chỉ bổ sung tài liệu sau mốc mã đó.

[GitHub Actions run 35762834498](https://github.com/ducng0611/the-shine-fitness/actions/runs/35762834498), job `106864899381`, hoàn tất thành công ngày 22/09/2026 UTC. Đã tải artifact `nutrition-verification` ID `10711295801`, đọc TAP, validation và kiểm tra index ngoại tuyến. Artifact trên GitHub lưu 7 ngày.

## 2. Kết quả thực tế

| Lớp kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Nguồn dinh dưỡng và API HTTP | 66/66 đạt, 0 bỏ qua | Dữ liệu nguồn và Express loopback với verifier thử nghiệm |
| Năm chương trình tập và luật an toàn | 470/470 đạt | Hồi quy bộ kiểm thử hiện có, không cộng thành kiểm thử mới |
| Training domain/service/HTTP | 99/99 đạt | Không thay nghiệm thu tài khoản hội viên thật |
| Assets và pathway domain/API | 64/64 đạt | Không phải kiểm thử giao diện hay Firebase production |
| Strict TypeScript dinh dưỡng và training | Đạt | Kiểm tra kiểu dữ liệu |
| TypeScript toàn dự án | Đạt | `npm run lint` hiện chạy TypeScript |
| Kiểm tra index ngoại tuyến | Đạt | Không gọi embedding, không sửa index |
| Vite frontend và esbuild backend | Đạt | Cảnh báo bundle lớn và mixed imports vẫn còn |

Không chạy lại Firebase emulator hoặc trình duyệt riêng cho module dinh dưỡng trong đợt này. Không khẳng định RAG/provider, email, mọi màn hình hoặc dữ liệu doanh nghiệp đã được thử end-to-end.

## 3. Dữ liệu đã số hóa

Hai DOCX có 214 đoạn, gồm đoạn trống để bảo toàn vị trí: nguồn nguyên tắc có 83 đoạn, nguồn các trường hợp có 131 đoạn. Thư viện có 6 mẫu, 28 khối bữa và 70 dòng món/đồ uống. Một dòng có thể chứa nhiều món hoặc phép lựa chọn; không gọi đây là 70 món độc lập.

Tài liệu `12_nutrition_meal_plan_sources.md` có 47 chunk, nhỏ nhất 276 và lớn nhất 537 ký tự. Tất cả chunk của tài liệu mới nằm trong khoảng 200-1500. Các file knowledge cũ không được sửa chỉ để làm đẹp số liệu chunk.

Có 20 vấn đề nguồn cần rà soát và 8 marker trích dẫn chưa có tài liệu đích. Không tự gán các marker vào bài viết hoặc xác nhận tác giả trích đúng nguồn. Các mức năng lượng/BMR chỉ là số được ghi trong tài liệu, không phải tổng tính từ từng món hoặc mục tiêu cá nhân.

Số mẫu được phép cấp thực đơn hiện tại: **0**. Các mẫu giữ `needs_review`, `aiRecommendable=false`, `eligibleForPlanner=false`; archive dinh dưỡng không được đưa vào RAG công khai. Giới hạn này không làm mất bản chép nguồn dành cho người rà soát.

## 4. Bảo toàn nguồn và tệp bàn giao

So sánh độc lập văn bản XML trong DOCX và SHA256: 81/83 đoạn nguồn nguyên tắc giữ nguyên, hai đoạn chỉ thay tên khách và lịch tập cá nhân bằng nhãn tách riêng; 131/131 đoạn nguồn các trường hợp giữ nguyên. Không đưa DOCX gốc, tên khách hoặc lịch cá nhân vào commit. Không ghép nguồn với hồ sơ hội viên hoặc các khách ở lộ trình trước. Việc bỏ định danh trực tiếp không bảo đảm vô danh hóa hoàn toàn.

JSON thư viện do TypeScript sinh trong CI khớp từng byte với bản cục bộ. SHA256: `b98f63ce9191832eb0d6b915ea5f5bd72d7817d3d4bec147b8e1790643481bb1`.

Patch ứng dụng lấy từ CI đã qua `git apply --check`, áp vào bản cơ sở ngoại tuyến có phạm vi và đối chiếu từng byte 24 file. Đây không phải clone trực tiếp của toàn repo. Báo cáo này là file tài liệu bổ sung thứ 25. `training_programs.json` và `data/knowledge/index.json` giữ nguyên.

## 5. Lỗi đã phát hiện và sửa

Run đầu `35762667865` đạt 65/66 kiểm thử dinh dưỡng; một kiểm thử thất bại vì regex nhận diện cảnh báo tiêu thụ khoảng trắng trước cụm từ, khiến câu phủ định không được nhận đúng. Đã sửa vị trí bắt đầu cụm triệu chứng trong `shared/nutritionRouting.ts`, giữ nguyên assertion và chạy lại đầy đủ. Run mới ở mục 1 đạt 66/66.

Lần vận chuyển mã đầu cũng bị từ chối push do token runner không được tạo workflow. Đã tách workflow kiểm thử khỏi phần ứng dụng và tạo qua connector được cấp quyền. Workflow vận chuyển và các phần tạm đã gỡ; workflow xác minh còn lại chỉ đọc. Không tăng quyền runner, force push, merge hoặc deploy.

## 6. Hành vi chatbot và phần chưa triển khai

Chat đã có nhánh nhận diện dinh dưỡng trước model/cache, giữ ưu tiên chuyển giao sức khỏe và câu hỏi giá thật. Câu hỏi meal plan chưa có nội dung được duyệt nhận trạng thái thiếu dữ liệu được duyệt, không bị biến thành thực đơn theo số calo mẫu. Báo đã ăn không tạo nhật ký hoặc tự tính kcal. Bộ từ khóa an toàn có giới hạn, chưa được kiểm định lâm sàng.

API `/api/admin/nutrition` chỉ đọc và xem trước ngữ cảnh mô phỏng, yêu cầu Firebase token, email đã xác minh và ADMIN_EMAILS. Cờ `SHINE_NUTRITION_SOURCE_REVIEW_ENABLED` vẫn false. Bật cờ không phê duyệt nội dung và không mở tư vấn cá nhân. Chưa có modal dinh dưỡng, quyền ghi/duyệt mẫu, bộ tính TDEE, dữ liệu nutrient, USDA, ảnh món ăn, Places hoặc nhật ký bữa ăn.

Đây là tiếp nhận tri thức có cấu trúc, kiểm tra nguồn và kiểm soát hành vi; không phải fine-tuning. Số lần huấn luyện mô hình, gọi embedding, tra bảng dinh dưỡng ngoài và ghi Firestore đều bằng 0. Các nguồn NHS trong `product-safety-basis.json` chỉ làm cơ sở cho cảnh báo dị ứng của sản phẩm, không dùng để sửa hay xác thực lời khuyên trong DOCX.

## 7. Kiểm tra lại

```bash
node --import tsx --test tests/nutrition/domain.test.ts tests/nutrition/router.test.ts
npx --no-install tsx scripts/prepare-nutrition.ts --report
npx --no-install tsc -p tsconfig.nutrition.json --noEmit
npm run build:index -- --check
npm run lint
npm run build
```

Xem `docs/nutrition-knowledge.vi.md` về schema, API và bước chuẩn bị cá nhân hóa. Tiếp theo cần bộ mẫu trưởng thành được duyệt riêng, nguồn thành phần/khẩu phần rõ ràng và luồng xác nhận hội viên, thay vì đổi cờ của archive nguồn. PR vẫn draft, chưa merge main hoặc triển khai production.
