# Lộ trình chiều cao và tư thế: báo cáo kiểm chứng

Cập nhật ngày 22/09/2026. Nhánh `feat/height-posture-program`, PR #7. Nhánh cơ sở `feat/weight-gain-program` tại `49aef462d98756bc3fb3a2d2919df8462d2185a9`. Không merge `main`, deploy, ghi dữ liệu khách hàng vào Firestore hoặc gọi dịch vụ mô hình.

## Mã và lần chạy đã kiểm tra

Mã ứng dụng/kiểm thử: **`8842e5314095a4489b43a747793c1c4defe52802`**.

[GitHub Actions run 35715790894](https://github.com/ducng0611/the-shine-fitness/actions/runs/35715790894), job `106706847310`, đã hoàn tất thành công. Các commit tài liệu sau mốc này không thay đổi mã ứng dụng hoặc dữ liệu chương trình.

| Lớp kiểm tra | Kết quả quan sát |
| --- | --- |
| Chiều cao/tư thế + tăng cân + thể lực/linh hoạt | 259/259 đạt: 95 mới + 93 tăng cân + 71 thể lực; 0 bỏ qua |
| Training domain/service/HTTP | 99/99 đạt |
| Assets + pathway domain/API | 64/64 đạt: 27 + 37 |
| Kiểm tra nguồn và thư viện ghép | Đạt |
| Strict TypeScript cho training/pathways | Đạt |
| TypeScript toàn dự án | Đạt |
| Vite frontend và esbuild backend | Đạt, còn cảnh báo bundle/import |
| `npm run build:index -- --check` | Đạt, không gọi embedding và không ghi index |

Đã tải và đọc artifact `height-posture-verification`, ID `10689134374`, gồm `tests.tap`, `validation.json`, `chunks.json`. Artifact CI có thời hạn lưu 7 ngày. Các workflow hồi quy Step 3, private pathway intake, weight gain và fitness-flexibility ở cùng commit cũng hoàn tất thành công. Không cộng lại cùng bộ test qua nhiều workflow.

Không chạy đánh giá RAG trực tuyến hoặc tư vấn trên tài khoản thật. Các kiểm tra hồi quy giao diện/emulator không phải nghiệm thu hiệu quả hay an toàn chuyên môn của giáo án.

## Kiểm tra dữ liệu

| Hạng mục | Kết quả |
| --- | --- |
| Version thư viện | 3 |
| Số chương trình | 3, giữ nguyên hai chương trình cũ |
| Định nghĩa bài tập | 78, trong đó 27 định nghĩa bổ sung |
| Tổng lần tham chiếu bài | 146 |
| Tham chiếu thiết bị | 27, không đồng nghĩa tài sản đã xác minh |
| Nguồn mới | 6 buổi, 48 dòng |
| Khóa buổi | `initial:21`, `initial:22`, `initial:23`, `initial:24`, `renewal_1:4`, `renewal_1:5` |
| Chunk Markdown | 53 |
| Chunk nhỏ nhất | 369 ký tự |
| Chunk lớn nhất | 822 ký tự |
| Truy xuất công khai chương trình mới | Không |
| Gọi embedding hoặc ghi Firestore trong kiểm tra | 0 |

Hash kiểm tra đảm bảo nội dung hai chương trình cũ, metadata bài cũ, usage cũ và thiết bị cũ không bị thay đổi. Chỉ thêm usage cho những bài dùng lại. JSON không có ID bài trùng; mọi `exerciseId` và tham chiếu thiết bị đều có định nghĩa phù hợp.

Mỗi dòng giữ nguyên nhóm nguồn, tên bài, volume, load, rest và thứ tự. Các giá trị chưa biết không bị điền từ dòng kế tiếp, chương trình khác hoặc kiến thức phổ thông. Số buổi là khóa kết hợp với chu kỳ gói để không nhầm gói gia hạn với gói đầu.

## Lỗi phát hiện và cách xử lý

Lần kiểm thử đầu `35715523798` tại `b4f3fc298942adfaf24bbab0e2085f4583b5fd17` có **258/259 đạt, 1 thất bại**. Kiểm tra cũ của chương trình tăng cân đang áp điều kiện `instructions` phải trống lên cả những bài mới thuộc nguồn chiều cao/tư thế. Các bài giãn cơ mới lưu câu “Ghi nhận nguồn:” để giữ thời lượng và thông tin mỗi bên từ bản chép, không phải hướng dẫn chuyên môn được sáng tác.

Đã giới hạn kiểm tra cũ vào đúng 20 bài từng được chương trình tăng cân bổ sung, thêm assertion xác nhận số lượng đó và giữ mọi điều kiện về trạng thái chưa duyệt, hướng dẫn/cues/chống chỉ định không có nguồn. Kiểm thử chương trình mới kiểm tra riêng nội dung ghi nhận nguyên văn. Không bỏ qua test, không xóa assertion bảo vệ nguồn hoặc tắt validation.

Workflow ứng dụng patch đầu tiên `35715254677` bị GitHub từ chối bước push vì quyền `contents` không cho sửa workflow. Không có commit lỗi nào được đẩy từ lần chạy đó. Đã tách cập nhật mã/dữ liệu khỏi cập nhật workflow, giữ đúng quyền của từng thao tác. Lần áp dụng mã/dữ liệu `35715345267` thành công. Workflow tạm và các đoạn vận chuyển đã được gỡ khỏi đầu nhánh; workflow xác minh còn lại chỉ có quyền đọc repository.

## Các điều kiện dữ liệu được giữ

- `3-4 x 10` giữ khoảng số hiệp; không ép thành 3 hoặc 4 hiệp.
- Sticky Jump giữ 3 giây sau lượt nhảy không bị biến thành ba giây cho cả hiệp. Khoảng cách chưa rõ vẫn cần HLV xác nhận.
- `2 x 20` của Lung Meridian chưa được gán thành giây hoặc lần lặp; tên/biến thể cần đối chiếu.
- Game `6 lượt + 30 giây` không bị nhân thành một tổng thời gian; điểm trò chơi không được coi là điểm khách đạt được.
- Số tải trần không được đổi thành kg; không dùng quy ước tải từ chương trình tăng cân cho nguồn này.
- Dead Hang + Core và Box Breathing giữ vị trí đúng bảng nguồn, không tự phân loại lại vì tên bài.
- Lịch cuối tuần trên hồ sơ/tracker và ngày giáo án được lưu như mâu thuẫn cần đối chiếu; không biến lịch quan sát thành khuyến nghị.
- Các chỉ số tuần không được coi là chiều cao cơ thể, chẩn đoán hoặc bằng chứng nhân quả.

## Quyền riêng tư và rà soát khoa học

Repo/ZIP công khai không có hồ sơ số đo chi tiết, ngày cá nhân, ghi chú theo dõi riêng, tên, điện thoại, địa chỉ, chữ ký hoặc ảnh gốc của trẻ. Thông tin riêng được bàn giao tách biệt và không phải dữ liệu vô danh tuyệt đối. Dữ liệu theo dõi năng lượng ăn vào bị loại, kể cả trong bản riêng tư; không có phép tính năng lượng cho trẻ.

Những từ khóa về dinh dưỡng/calo trong chính sách chuyển giao là mã kiểm soát hành vi, không phải dữ liệu theo dõi cá nhân. Kiểm tra tự động không phải chứng nhận pháp lý về vô danh hóa.

Các nhận định trong prompt được giữ riêng trong `scientific-claims.review.json` với trạng thái và nguồn đối chiếu. Không coi BMI đơn lẻ là kết luận y khoa, không coi tên nhóm Decompression là xác nhận giải nén trị liệu hoặc kéo dài xương, không cam kết tăng centimet và không chứng minh hiệu quả chương trình bằng hai ghi chú quan sát. “Tầm vóc thấp” trong nghiên cứu trẻ được chọn mẫu không đồng nghĩa suy dinh dưỡng của khách nguồn này.

## Cách kiểm tra lại

```bash
node --import tsx --test tests/height-posture.test.ts tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-height-posture.ts
npx --no-install tsx scripts/validate-height-posture.ts --report
npm run build:index -- --check
npm run lint
npm run build
```

`prepare-height-posture.ts` mặc định kiểm tra, không ghi đè file. Tùy chọn `--out` tạo file mới theo chế độ không ghi đè. Không dùng việc build thành công để đổi chương trình nguồn thành verified.

## Giới hạn còn lại

Chưa có xác nhận HLV cho các chỗ thiếu/không rõ, đánh giá nhi khoa, phê duyệt tái sử dụng chương trình, giáo án các buổi không được cung cấp hoặc dữ liệu chứng minh tăng trưởng. Chưa có tích hợp chương trình tham chiếu này thành giáo án thực thi cho hội viên. Không tạo modal mới; JSON thư viện không phải schema nhập nguồn của modal cũ.

Chưa chạy model/provider thật, tạo embedding, đánh giá `eval:rag` trực tuyến, nghiệm thu dữ liệu doanh nghiệp hoặc audit toàn hệ thống. Không khởi động `npm run dev` toàn ứng dụng bằng credentials thật trong lần này. Vite vẫn cảnh báo import động/tĩnh và bundle lớn; không gọi là đã tối ưu hiệu năng.

Kết luận: bộ nguồn và tích hợp có kiểm soát đã qua các kiểm tra nêu trên. Nội dung giữ trạng thái **needs_review / historical_reference**, không được index công khai và không cấp quyền lập giáo án tự động cho trẻ.
