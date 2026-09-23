# Kiểm chứng lộ trình tăng cân

Ngày báo cáo: 22/09/2026. Nhánh `feat/weight-gain-program`, PR #6. Mã nguồn cơ sở kế thừa `feat/fitness-flexibility-program` tại `46684ee8ae926e3f66aee19ee1e69c2fd433ffe3`.

## Mốc đã kiểm tra

Mã ứng dụng, dữ liệu và kiểm thử tại **`9ea06a16b40bdb58e92ebc49f116af777e292316`** đã chạy thành công trong [GitHub Actions 35712282259](https://github.com/ducng0611/the-shine-fitness/actions/runs/35712282259), job **106695472176**. Commit thêm báo cáo này chỉ thay tài liệu, không thay mã hoặc dữ liệu đã kiểm tra.

| Kiểm tra | Kết quả đã đọc từ log |
| --- | --- |
| Tăng cân và thể lực/linh hoạt | **164/164 đạt**: 93 kiểm thử tăng cân mới và 71 kiểm thử thể lực hiện có; không bỏ qua |
| Step 3: nghiệp vụ, service và HTTP | **99/99 đạt**, không bỏ qua |
| Assets và tiếp nhận nguồn pathway | **64/64 đạt**: 27 assets và 37 pathway; không bỏ qua |
| Chuẩn bị và kiểm tra thư viện | Đạt; version 2, 2 chương trình, 51 bài, 22 tham chiếu thiết bị, 98 lần tham chiếu bài |
| Dữ liệu tăng cân | Đủ 51 dòng thuộc buổi 1, 2, 3, 12, 13; 7 cặp liên hoàn đủ và 1 nhóm d1 chưa đầy đủ |
| Markdown tăng cân | **45 chunk**, nhỏ nhất **354**, lớn nhất **865 ký tự**; mọi chunk nằm trong khoảng 200-1500 |
| `npm run build:index -- --check` | Đạt, **0 lần gọi embedding, không ghi index**; cả hai nguồn PROGRAM vẫn không được truy xuất công khai |
| Strict training/pathways và TypeScript toàn dự án | Đạt |
| Build Vite và esbuild | Đạt; cảnh báo bundle lớn và trộn import tĩnh/động còn tồn tại |

Báo cáo artifact `weight-gain-verification`, ID **10686113300**, đã được tải và đọc: `tests.tap`, `validation.json`, `chunks.json`. SHA-256 của ZIP: `1387141667321bb302535f11daaf114b0ab67defd39b81269cfd8237dcd81061`. Artifact GitHub lưu 7 ngày, không phải lưu trữ vĩnh viễn.

Các workflow hồi quy [Step 3 35712282301](https://github.com/ducng0611/the-shine-fitness/actions/runs/35712282301), [pathway 35712282317](https://github.com/ducng0611/the-shine-fitness/actions/runs/35712282317) và [thể lực 35712282341](https://github.com/ducng0611/the-shine-fitness/actions/runs/35712282341) cũng đã hoàn tất thành công. Không cộng lặp các lần chạy cùng bộ kiểm thử thành số kiểm thử mới.

## Kiểm tra bảo toàn dữ liệu

- Dấu kiểm của program thể lực cũ, metadata 31 bài cũ, usage cũ và 15 tham chiếu thiết bị cũ không thay đổi. Chỉ thêm usage của chương trình mới vào bài đã tồn tại.
- Không tin danh sách 40 ID giả định trong prompt: đối chiếu thư viện thực tế có 31 bài, thêm 20 định nghĩa thiếu để tổng thành 51; không tạo trùng.
- Giữ đủ năm cột nguồn và mọi ô trống. Cặp liên hoàn có nghỉ ở cấp cặp, không nhân đôi thời gian nghỉ hoặc tự điền volume vào bài thứ hai.
- Hip Abduction mờ giữ nguyên bản chép, `candidateValue=26`, `value=null`, `needs_review`.
- Cable Row 15 và 12.5 là mức tải máy. Không đổi thành kg hoặc khẳng định tăng tải. Tạ đơn/tạ ấm chỉ có đơn vị kg khi quy ước nguồn xác định; vẫn chưa rõ từng bên hay tổng.
- Không tạo buổi thiếu, không khẳng định hiệu quả, không ghi chương trình như nhật ký đã hoàn thành.
- Tham số khoa học do prompt đề nghị được giữ riêng trong hồ sơ đối chiếu. Không biến thành phép tính calo, phác đồ ăn, tải hoặc điều kiện chẩn đoán đang hoạt động.

Hai tệp bàn giao chính được kiểm tra Git blob hash với repository: Markdown `0478ebf50aed94fdf8d065776dc4e199b7d19efd`, JSON `79ee245d412edbc4b9d318dea9b084b93f754a28`.

## Quyền riêng tư và phạm vi

Không thêm tên, điện thoại, địa chỉ, ngày sinh đầy đủ, chữ ký, tên HLV hoặc giá trị hợp đồng. Hồ sơ chi tiết và ngày cá nhân được bàn giao riêng ngoài repo/ZIP công khai. Không coi việc bỏ định danh trực tiếp là bảo đảm vô danh hoàn toàn.

Bản nguồn mang trạng thái `needs_review` và `historical_reference`. RAG không được lấy giáo án chưa duyệt này để trả lời như lời khuyên áp dụng. Lớp planner chưa được nối với chương trình tăng cân mới. Không sửa modal intake hoặc giả định JSON chương trình cùng schema với PathwaySourceBundle.

Bổ sung nhận diện triệu chứng, thuốc và mục tiêu không phải chẩn đoán. Quy tắc dưới 18 tuổi, kiểm tra thể trạng và quyền truy cập Step 3 vẫn giữ nguyên. Kiểm thử từ khóa chưa chứng minh nhận diện được mọi cách diễn đạt hoặc không có chuyển giao thừa.

## Giới hạn kiểm chứng

Chưa có kiểm duyệt HLV/chuyên gia dinh dưỡng, đối chiếu ảnh gốc của đợt này, xác minh đơn vị còn thiếu hoặc nghiệm thu khách hàng thật. Chưa gọi Gemini/embedding thật, chưa chạy `eval:rag` trực tuyến, chưa ghi Firestore hay thay index hiện tại. Không deploy hoặc merge `main`.

Build toàn dự án không thay thế kiểm thử email, model, mọi trang legacy và mọi thiết bị vật lý. Vite còn cảnh báo JS chính khoảng 2.65 MB minified, 700 kB gzip; chưa audit toàn bộ dependency, bảo mật hoặc tối ưu hiệu năng.

## Tái kiểm tra không cần khóa API

```bash
node --import tsx --test tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-weight-gain.ts
npx --no-install tsx scripts/validate-weight-gain.ts --report
npm run build:index -- --check
npm run test:training
npm run typecheck:training
npx --no-install tsc -p tsconfig.pathways.json --noEmit
npm run lint
npm run build
```

Chi tiết nội dung và những điểm cần xác nhận: [báo cáo bàn giao](weight-gain-review.vi.md). Chỉ tạo embedding sau khi có bản tổng quan riêng được duyệt cho RAG công khai; không đổi nhãn bản lịch sử để bỏ qua kiểm duyệt.
