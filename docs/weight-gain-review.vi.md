
# Bàn giao nguồn lộ trình tăng cân

## Phạm vi

Số hóa dữ liệu do người dùng chép từ hồ sơ giấy, giữ nguyên các cột và phân biệt đề xuất của prompt với quan sát từ giáo án. Không có ảnh gốc đính kèm trong đợt này để xác minh lại chữ viết tay. Không fine-tune, không ghi Firestore, không xác nhận buổi hoàn thành, không chạy embedding thật hoặc deploy.

Nhánh cơ sở `feat/fitness-flexibility-program`, commit `46684ee8ae926e3f66aee19ee1e69c2fd433ffe3`. Chỉ bổ sung lộ trình mới, giữ nguyên program thể lực, quy tắc trẻ vị thành niên, metadata của 31 bài và 15 tham chiếu thiết bị cũ.

## Dữ liệu đầu ra

Thư viện tăng từ version 1 lên 2, chứa 2 program, 51 định nghĩa bài, 22 tham chiếu thiết bị và 98 lần tham chiếu bài. Riêng tăng cân có 51 dòng thuộc buổi 1,2,3,12,13. Có 7 cặp liên hoàn đủ a1/a2 và một nhóm d chỉ có d1 ở buổi 12.

Nguồn hiện có 31 ID, không phải 40 ID trong mô tả prompt. Thêm 20 định nghĩa còn thiếu, không tạo trùng. `ex_standing_overhead_shoulder_press` là ID thực tế được tái sử dụng thay cho tên ID giả định; không đổi các tham chiếu của lộ trình cũ. `Side Kick` dùng ID `ex_side_band_kick` như liên kết đề xuất, chưa thêm alias đó vào tập alias đã xác nhận toàn cục.

## Kết quả phân tích từ nguồn

- Plank: 2 x 60 giây thành 3 x 50 giây, tổng kê trên giấy 120 thành 150 giây nhưng thời gian mỗi hiệp giảm.
- Khối kháng lực: 3 dòng ở buổi 1, 5 dòng ở buổi 2-3. Số dòng không đủ tính tổng volume vì nhiều ô trống.
- Bài thăng bằng đổi Step Box, SL Flexion + DB Raises, Pistol Squat. Không có đánh giá kỹ thuật để khẳng định mức khó đã được vượt qua.
- Treadmill cuối buổi từ 10 lên 15 phút; 4.5 không ghi đơn vị. Buổi 13 dùng treadmill khởi động nhưng không có thời lượng.
- Buổi 12-13 có Full Body/FB và cặp liên hoàn; không có buổi 4-11 nên không thể xác định buổi đầu tiên áp cấu trúc này.
- Cable Row 3 x 12 ở mức máy 15 thành 4 x 12 ở mức máy 12.5. Không phải “tăng từ 15 lên 12.5 kg”. Không so trực tiếp tải khác dụng cụ.
- Không có khối Balance riêng ở 12-13 không chứng minh thăng bằng đã đạt chuẩn. Đổi khởi động không chứng minh người tập đã quen vận động.
- Giai đoạn 27-40 và 41-50 chỉ là định hướng do prompt đề nghị. Không tự tạo buổi, tải, thành quả hoặc lịch giảm tải.

## Dữ liệu cần HLV xác nhận

1. Hip Abduction a2 buổi 12: nguyên văn 26 (chữ mờ, cần HLV xác nhận); `value=null`, `candidateValue=26`, `needs_review`.
2. Volume của bài thứ hai trong cặp chưa được điền. A2 xác định nghỉ sau cặp, không tự suy toàn bộ định lượng cho bài sau.
3. Cross Crunch d1 buổi 12 chưa có d2; không tạo bài còn thiếu.
4. Rear Delt Fly, Hip Thrust, Standing OH SD: tên chưa chỉ rõ dụng cụ, nên giữ số với đơn vị chưa biết.
5. Tạ đơn/tạ ấm có kg theo A2 nhưng chưa rõ theo mỗi quả, mỗi tay hay tổng.
6. Side Kick chưa chắc là Side Band Kick có dây. Các tham chiếu eq_* vẫn chưa xác minh với tài sản thật.
7. Chưa có log kết quả, RIR, nhịp tim, tổng thời gian, khẩu phần hoặc số đo theo dõi. Không suy hiệu quả.

## Đề xuất khoa học và thông tin đã đối chiếu

Tệp `scientific-claims.review.json` giữ đủ 14 nhóm thông số được yêu cầu, gồm năng lượng, tốc độ tăng cân, số hiệp, lần lặp, RIR, nghỉ, double progression, cardio, ngủ, phục hồi, deload, dưỡng chất, nước và thời điểm ăn.

Các thông số này không được tự đưa vào trường đang hoạt động: `calorieSurplusKcalPerDay`, `targetWeightGainKgPerWeek`, `proteinGramPerKgBodyweight`, `hypertrophyRepRange` và `reserveInReps` giữ null. Ngưỡng BMI không cấp quyền áp mẫu. Chỉ dẫn nguồn ngoài được ghi bằng URL và giới hạn trong file review; không thay đổi dữ liệu giáo án.

Đặc biệt không gán cấm HIIT/chạy trên 20 phút, nghỉ 60-90 giây cho mọi bài lớn hoặc deload bắt buộc mỗi 6-8 tuần thành kết luận đã được nguồn chứng minh. Cơ chế chuyển HEALTH_RISK không đồng nghĩa chẩn đoán hoặc cấm mọi vận động.

## Mã nguồn cập nhật

`shared/programSafety.ts` là nguồn từ khóa an toàn dùng chung, được `server/src/handoverRules.ts` xuất lại. Bổ sung cả bản có dấu và chuẩn hóa không dấu: thuốc tăng cân, chán ăn, sụt cân, nội tiết, đĩa đệm, thoát vị, bệnh tiêu hóa. Giữ nhóm supplement, bệnh nền và vị thành niên trước đó. Từ khóa có thể chuyển thận trọng câu phủ định, nên không biến phân loại thành hồ sơ bệnh.

`server/src/intentClassifier.ts` bổ sung PROGRAM cho tăng cân, tăng cơ, người gầy, khó tăng cân, tập bao lâu, lean bulk. PRICE vẫn trước PROGRAM, còn HEALTH_RISK vẫn được router xử lý trước model/cache. Tăng cơ không bị mặc định là tăng cân; câu nhiều mục tiêu hoặc phủ định cần xác nhận.

`shared/weightGainProgram.ts` tạo phần bổ sung và kiểm tra quy ước. `shared/trainingPrograms.ts` gọi validator mới khi gặp program tăng cân. Script chuẩn bị không ghi đè tệp và không tăng version khi chạy lại cùng nguồn.

Các tests thể lực được cô lập theo program thể lực, giữ nguyên kiểm tra 31 bài/47 tham chiếu và không làm yếu assertions. Tests mới xác nhận dấu kiểm program/metadata/usage cũ và thư viện ghép đầy đủ.

## Quyền riêng tư và giới hạn

Không đưa tên, điện thoại, địa chỉ, ngày sinh đầy đủ, chữ ký hoặc giá trị hợp đồng vào file. Ngày cá nhân và số đo chi tiết chỉ bàn giao trong bản riêng tư, không thuộc ZIP công khai. Xóa định danh trực tiếp chưa bảo đảm không tái nhận diện, cần quản lý quyền sử dụng và nơi lưu.

Không có modal mới trong đợt này. JSON program không cùng schema với modal PathwaySourceBundle. Chưa triển khai review/publish mẫu tái sử dụng hoặc liên kết lộ trình vào planner thực thi. Bản ghi vẫn needs_review và bị chặn khỏi RAG công khai.

## Cách kiểm tra không cần API key

```bash
node --import tsx --test tests/weight-gain.test.ts tests/fitness-flexibility.test.ts
npx --no-install tsx scripts/prepare-weight-gain.ts
npx --no-install tsx scripts/validate-weight-gain.ts --report
npm run build:index -- --check
npm run typecheck:training
npm run lint
npm run build
```

Chỉ sau khi có bản `verified/public_overview` được duyệt riêng mới tạo embedding, chạy đánh giá RAG trực tuyến và restart Express. Không chỉ đổi frontmatter của hồ sơ lịch sử để bỏ qua bước review.
