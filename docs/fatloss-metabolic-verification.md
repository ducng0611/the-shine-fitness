# Kiểm chứng lộ trình giảm mỡ có bệnh lý chuyển hóa

Ngày lập báo cáo: 22/09/2026. Nhánh `feat/fatloss-metabolic-program`, [PR #8](https://github.com/ducng0611/the-shine-fitness/pull/8), cơ sở `aa1e57951a42f97065ce8e9421078e88ec17ea3a`.

## Kết quả thực tế

Mã ứng dụng, dữ liệu và kiểm thử đã xác minh: **`e9d30d5103d18076f778627bbf9725cccad192ad`**. [GitHub Actions run 35719976715](https://github.com/ducng0611/the-shine-fitness/actions/runs/35719976715), job **106720340270**, hoàn tất thành công. Đây là run của PR, checkout bản ghép thử `a3d81a8ffd6ce959bdb0a82eb5eea66e6d24bba1` với nhánh cơ sở, không phải đã merge. Commit bổ sung báo cáo sau mốc này không thay mã ứng dụng.

| Kiểm tra | Kết quả |
| --- | --- |
| Nguồn chương trình và luật chuyển giao | **399/399 đạt**, 0 bỏ qua: 140 mới + 95 chiều cao + 93 tăng cân + 71 thể lực |
| Step 3 domain/service/HTTP | **99/99 đạt** |
| Assets và private pathway domain/API | **64/64 đạt**, gồm 27 assets và 37 pathway |
| Chuẩn bị, ghép thư viện, kiểm tra nguồn và chunk | Đạt |
| `npm run build:index -- --check` | Đạt; 0 lần gọi embedding, không ghi index |
| Strict TypeScript training và pathways | Đạt |
| `npm run lint` | Đạt |
| Vite frontend và esbuild backend | Đạt; còn cảnh báo bundle lớn và mixed imports |

Đã đọc log và tải artifact **10691370147**, gồm `tests.tap`, `validation.json`, `chunks.json`; thời hạn lưu GitHub là 7 ngày. Không cộng lặp các suite cũ. Các workflow hồi quy liên kết cùng commit cũng thành công: training **35719976625**, private pathway **35719976563**, chiều cao **35719976614**, tăng cân **35719976557**, thể lực **35719976550**. Emulator và trình duyệt dùng môi trường kiểm thử, không phải tài khoản doanh nghiệp.

## Dữ liệu đã kiểm tra

Thư viện version **4**: **4 chương trình, 104 định nghĩa bài, 187 lần tham chiếu bài, 42 tham chiếu thiết bị**. Không trùng ID, mọi exerciseId có định nghĩa. Ba chương trình cũ cùng metadata và usage được bảo toàn bằng dấu kiểm. Bổ sung 26 định nghĩa; tham chiếu dụng cụ không phải tài sản gym đã xác minh.

Nguồn mới có **6 bảng, 41 dòng**, gồm bốn số buổi đã đọc chắc 24, 25, 26, 27 và hai số buổi null với ứng viên 19/29, 20/30. Có **15 cặp superset, 5 dòng d1 đơn lẻ, 6 trạm circuit và 3 vòng**. Không tự sửa năm, chọn số buổi, gán tên máy mờ, kế thừa volume hoặc tạo thời gian nghỉ.

Markdown có **39 chunk**, nhỏ nhất **353**, lớn nhất **813 ký tự**, đủ frontmatter, PROGRAM, `needs_review/historical_reference`. Bản này vẫn không được truy xuất công khai kể cả chỉ đổi nhãn tổng quan. `aiRecommendable`, `eligibleForPlanner`, `ragRetrievalAllowed` đều false.

## Phạm vi các kiểm thử mới

Kiểm tra số buổi chưa rõ, tải có ghi chú, nguồn kg/mức máy/chưa biết, ô trống, dữ liệu bài thứ hai, d1 đơn lẻ và circuit thiếu thời lượng. Các phép ghép không được sửa metadata cũ hoặc tăng version khi nhập lại cùng dữ liệu.

Luật chuyển giao nhận bệnh chuyển hóa, câu hỏi thuốc, ngưỡng và giấy tờ có/không dấu. HEALTH_RISK được kiểm tra trước intent/cache/mô hình. Câu hỏi dịch vụ chỉ mô tả tiếp nhận có điều kiện; không xác nhận nhân sự được chứng nhận khi chưa có nguồn. Dấu hiệu cấp tính không phải chờ hàng đợi. Gợi ý sơ cứu không cho người bất tỉnh hoặc không nuốt an toàn ăn/uống; không khẳng định đã gọi cấp cứu.

Năm câu bắt buộc đã được thêm vào `docs/test-checklist.md`, kèm các tình huống cấp tính, lịch sử bệnh và người không khai bệnh. Phần checklist cũ được giữ nguyên; kết quả và thông tin thương mại cũ không được xác nhận lại trong nhiệm vụ này.

## Điều chưa được xác minh

Chưa kiểm duyệt chuyên môn, xác minh giấy bác sĩ/thuốc, kiểm tra ảnh gốc, giải quyết chữ mờ, tạo giáo án còn thiếu, đo hiệu quả giảm mỡ hoặc tích hợp nguồn vào kế hoạch của hội viên. Nhận diện từ khóa không phải bộ phân loại cấp cứu đã được kiểm định.

Chưa chạy model, embedding, `eval:rag` trực tuyến hoặc tài khoản Firebase thật. Chưa kiểm tra điện thoại vật lý, tải nhiều instance hoặc audit toàn bộ hệ thống. Build còn cảnh báo frontend khoảng 2.65 MB minified, khoảng 700 kB gzip và dependency/action deprecation. Không dùng build thành công thay kiểm định y khoa.

Không commit định danh trực tiếp, số đo chi tiết, ngày cá nhân, ảnh gốc hoặc thuốc được suy đoán. Bản hồ sơ riêng vẫn là dữ liệu nhạy cảm. Không ghép với các hồ sơ nguồn cũ. Không ghi Firestore, deploy hoặc merge main; workflow áp patch tạm thời đã gỡ, workflow xác minh chỉ đọc.

## Kiểm tra lại không cần API key

```bash
node --import tsx --test tests/fatloss-metabolic.test.ts tests/height-posture.test.ts tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-fatloss-metabolic.ts
npx --no-install tsx scripts/validate-fatloss-metabolic.ts --report
npm run build:index -- --check
```

Chỉ bản tổng quan dịch vụ được duyệt riêng mới có thể được đưa vào RAG. Không đổi nhãn tài liệu giáo án y khoa lịch sử để bỏ qua kiểm duyệt.
