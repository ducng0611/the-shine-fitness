# Kiểm chứng lộ trình tư thế dân văn phòng và hồi quy nguồn chuyển hóa

Ngày lập: 22/09/2026. Nhánh `feat/posture-correction-program`, [PR #9](https://github.com/ducng0611/the-shine-fitness/pull/9), kế thừa nguồn chuyển hóa ở [PR #8](https://github.com/ducng0611/the-shine-fitness/pull/8). Cơ sở: `86aeef946c6f50661b49c086327511d02882e355`. Chưa merge, deploy hoặc ghi dữ liệu khách hàng.

## 1. Mã và lần chạy đã kiểm chứng

Mã ứng dụng, dữ liệu và kiểm thử: **`99f9a64cf801c0854e804e38e9104c05c1120ede`**. [Run 35723373385](https://github.com/ducng0611/the-shine-fitness/actions/runs/35723373385), job **106731165739**, hoàn tất thành công. Hai commit tiếp theo chỉ gỡ các workflow vận chuyển tạm; đầu nhánh trước báo cáo là `68828725c4d262941312693893e94dde180dfb83`.

[Run PR 35723494065](https://github.com/ducng0611/the-shine-fitness/actions/runs/35723494065) tại đầu nhánh trên cũng hoàn tất thành công. Các workflow Step 3, private pathway, chuyển hóa, chiều cao, tăng cân và thể lực tại cùng commit đều thành công. Không cộng trùng các lần chạy thành tổng số kiểm thử lớn hơn.

| Lớp kiểm tra | Kết quả thực tế |
| --- | --- |
| Năm nguồn chương trình và luật an toàn | **470/470 đạt**, 0 bỏ qua: 71 tư thế mới và 399 hiện có |
| Training domain/service/HTTP | **99/99 đạt** |
| Assets và pathway domain/API | **64/64 đạt**, gồm 27 assets và 37 pathway |
| Chuẩn bị, kiểm tra cả nguồn tư thế và chuyển hóa | Đạt |
| `npm run build:index -- --check` | Đạt; không gọi embedding, không ghi index |
| Strict TypeScript training và pathways | Đạt |
| `npm run lint` | Đạt, TypeScript toàn dự án |
| `npm run build` | Đạt, Vite frontend và esbuild backend |

Artifact **10692103723** của run chính có `tests.tap`, `validation.json`, `chunks.json`, báo cáo validator chuyển hóa và `metabolic-base.patch`. Đã tải và đọc nội dung; artifact trên GitHub có thời hạn lưu bảy ngày.

Không chạy lại toàn bộ ứng dụng bằng tài khoản doanh nghiệp hoặc API key thật trong lần này. Các kết quả trình duyệt/Firebase emulator là hồi quy của workflow hiện có; không có modal tư thế mới hoặc phép đo lâm sàng được kiểm thử.

## 2. Kết quả dữ liệu

Thư viện **version 5** có **5 chương trình, 127 định nghĩa bài, 48 tham chiếu thiết bị và 216 lần tham chiếu bài**. Bốn chương trình cũ, metadata bài cũ, usage cũ và tham chiếu thiết bị cũ được bảo toàn bằng dấu kiểm.

Nguồn tư thế: **3 buổi, 29 dòng**, đủ tám ID được yêu cầu và thêm 15 định nghĩa cho những hoạt động còn lại. Sáu ID hiện có được tái sử dụng. Nhãn thời lượng khối cộng thành **55, 55, 45 phút**; `actualDurationsVerified=false`, không coi đây là thời gian thực tế đã kiểm tra.

Tài liệu `11_program_posture_correction.md`: **50 chunk, nhỏ nhất 371, lớn nhất 793 ký tự**. Nguồn chuyển hóa được giữ: **6 tài liệu buổi, 41 dòng**, số buổi chắc chắn 24-27 và hai số buổi chưa xác nhận; **39 chunk, nhỏ nhất 353, lớn nhất 813 ký tự**.

Mọi ID bài không trùng và mọi `exerciseId` có định nghĩa. Tham chiếu dụng cụ không chứng minh phòng tập có máy hoặc máy phù hợp người tập.

## 3. Trung thực với nguồn

Giữ rõ kg trên bài cáp khi chính nguồn này ghi kg; không kế thừa quy ước mức máy từ nguồn khác. Hai tạ đơn và số 6/8 được giữ với ghi chú cách tính từng bên/tổng chưa được tự khẳng định. Số lần mỗi bên, thời gian giữ đỉnh, nhịp 3-1-3/3-0-1, khoảng đi 30 mét và thời lượng thở không bị đánh đồng.

Không nhân Y-T-W thành ba lần volume; không nhân thời gian lăn theo số vùng. Không tạo tốc độ treadmill hoặc ngày tập. Ba giai đoạn 1-12, 13-24 và 25-36 là cấu trúc đề nghị trong prompt; không dựng giáo án buổi 4-36 hoặc kết quả điều trị.

Nguồn chuyển hóa vẫn giữ chữ mờ, số buổi và năm chưa chắc chắn, ô trống và cặp liên hoàn. Không dùng superset làm bằng chứng an toàn với tăng huyết áp hoặc suy tải tương đương giữa máy Smith và tạ đòn.

## 4. Mã nguồn và kiểm thử mới

`shared/postureCorrectionProgram.ts` đọc nguồn, chuẩn hóa, ghép không ghi đè và kiểm tra bảo toàn. `shared/postureSafety.ts` nối vào chính sách dùng chung hiện có; không tạo tuyến tư vấn y khoa mới. Nhánh PROGRAM nhận mục tiêu tư thế người trưởng thành riêng với chiều cao thiếu niên; PRICE vẫn ưu tiên, HEALTH_RISK được kiểm tra trước mô hình/cache.

Các dấu hiệu đau, tê, đau lan, bệnh lý cột sống chuyển đánh giá phù hợp. Triệu chứng có thể cấp tính nhận cảnh báo tìm trợ giúp y tế khẩn, không chỉ hẹn tư vấn viên. Đây là quy tắc văn bản bảo thủ, chưa phải hệ thống phân loại cấp cứu đã kiểm định và không khẳng định đã gọi cấp cứu.

Archive tư thế và chuyển hóa vẫn bị chặn khỏi RAG công khai, kể cả chỉ đổi nhãn thành verified/public_overview. Hai nguồn không được nối vào planner thực thi. Không nạp chương trình vào hồ sơ hội viên hoặc modal PathwaySourceBundle.

Kiểm tra cũ của nguồn chuyển hóa được giới hạn đúng tập bài thuộc lần bổ sung đó và các usage của tập chương trình gốc, để thư viện có thể mở rộng mà vẫn phát hiện sửa dữ liệu cũ. Không xóa kiểm thử hoặc giảm điều kiện bảo toàn.

## 5. Bảo mật, tác dụng phụ và cảnh báo

Không đưa hồ sơ số đo, ngày cá nhân, tên, số điện thoại, hợp đồng hoặc ảnh gốc vào commit mới. Không có credential hoặc dữ liệu khách hàng được ghi Firestore. Bản PRIVATE ngoài repository không thuộc gói bàn giao công khai.

Workflow vận chuyển patch và xuất ngữ cảnh tạm đã gỡ khỏi đầu nhánh. Workflow xác minh còn lại chỉ có quyền đọc. Mã lập chỉ mục chỉ chạy `--check`, chưa có `eval:rag` trực tuyến hoặc thay đổi `index.json`.

Build vẫn có cảnh báo static/dynamic Firebase import và bundle lớn: JS chính khoảng 2.648 MB minified, 699.54 kB gzip trong run trên. Dependency có cảnh báo deprecation. Chưa thực hiện security audit toàn dự án, tối ưu bundle, kiểm thử tải hoặc xác minh quy trình trên điện thoại thật.

## 6. Giới hạn trước khi dùng thật

Nội dung vẫn `needs_review / historical_reference`, `verified=false`, `eligibleForPlanner=false`. Nguồn chuyển hóa còn `aiRecommendable=false`. Số hóa đúng nguồn không có nghĩa dữ liệu đã được chuyên gia duyệt.

NASM/Janda là khung tham chiếu, không chẩn đoán hội chứng chéo trên/dưới hoặc chứng minh người làm văn phòng đều có cùng nhóm cơ yếu. Chưa có đánh giá trực tiếp, bằng chứng hiệu quả ba buổi hoặc năng lực phục hồi chức năng y tế của doanh nghiệp. Chưa kiểm chứng bài/lực lăn phù hợp từng người.

Kết quả CI chứng minh các kiểm tra cấu trúc, logic và build đã nêu, không chứng nhận an toàn y khoa hoặc sẵn sàng production.

## 7. Kiểm tra lại ngoại tuyến

```bash
node --import tsx --test tests/posture-correction.test.ts tests/fatloss-metabolic.test.ts tests/height-posture.test.ts tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-posture-correction.ts
npx --no-install tsx scripts/validate-posture-correction.ts --report
npx --no-install tsx scripts/validate-fatloss-metabolic.ts --report
npm run build:index -- --check
npm run typecheck:training
npm run lint
npm run build
```

Lệnh chuẩn bị mặc định chỉ đọc. Dùng `--out` tạo tệp mới chứ không ghi đè. Chỉ xây embedding khi đã có nội dung tổng quan riêng được duyệt; không đổi nhãn bản giáo án lịch sử để bỏ qua review. Nếu index thực tế được thay đổi ở đợt sau, cần khởi động lại Express.
