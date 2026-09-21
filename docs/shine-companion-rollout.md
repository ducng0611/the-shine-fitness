# Shine Companion — Triển khai pilot, demo và nghiệm thu

Đọc [kiến trúc chi tiết](shine-companion-architecture.md) trước khi bật tính năng. Mã được phát triển trên nhánh riêng; không tự bật production hoặc đổi cấu hình dịch vụ trả phí.

## 1. Thiết lập

```bash
git checkout feat/shine-ai-companion
node scripts/integrate_companion.mjs
node --test tests/companion.test.mjs
npm install
npm run lint
npm run build
```

Script tích hợp chạy lại được, không chèn lặp import/route/README. Nếu cấu trúc file gốc thay đổi ngoài dấu mốc đã kiểm tra, script dừng thay vì sửa nhầm vị trí. Với bản checkout đã được workflow tích hợp, chạy lại chỉ xác nhận trạng thái.

Biến máy chủ:

```dotenv
SHINE_COMPANION_ENABLED=true
GEMINI_API_KEY=<key máy chủ đang dùng hoặc key đã phê duyệt>
SHINE_GEMINI_MODEL=<model thực sự có trong dự án và hỗ trợ structured output + image>
USDA_FDC_API_KEY=<key FoodData Central>
GOOGLE_PLACES_API_KEY=<key máy chủ đã bật Places API New>
ADMIN_EMAILS=<email quản trị được xác minh>
```

Biến build frontend:

```dotenv
VITE_SHINE_COMPANION_ENABLED=true
```

Mặc định trong `.env.example` là **false**. Vite đọc cờ tại build, nên cần build lại khi đổi. Không đưa API key vào biến `VITE_*`. Không commit `.env`, service-account key hoặc dữ liệu cá nhân. Chọn model bằng cấu hình thay vì khẳng định tên model trong README cũ vẫn khả dụng.

Các nguồn ngoài có thể có quota/chi phí và yêu cầu điều khoản riêng. Chưa có key USDA thì vẫn ghi món từ nhãn/công thức; chưa có Gemini thì biểu mẫu tạo buổi tập trực tiếp và ghi nhãn vẫn dùng được sau khi server hiện hữu đã được cấu hình. Chưa có Places thì báo chưa cấu hình, không hiện quán giả.

## 2. Xác thực và tài khoản thử nghiệm

Dùng tài khoản Google/Firebase thật. `AuthModal` cũ có luồng OTP mô phỏng phía client; Companion không dùng luồng đó để cấp quyền dữ liệu riêng. Firebase UID phải khớp hội viên đang được chọn trong app. Hồ sơ đăng nhập mô phỏng hoặc localStorage không thay thế token.

Firebase Admin phải được cấu hình như backend hiện tại. Collection Companion chỉ truy cập qua máy chủ; triển khai và kiểm tra Firestore rules đúng database đang dùng. Không tự tạo rule “mọi người đăng nhập đều đọc được mọi hồ sơ”.

Pilot nên giới hạn người dùng thử do phòng tập lựa chọn. Xác thực Firebase trong bản này không xác minh hợp đồng/đã thanh toán; cần entitlement quản lý phía server trước khi bán quyền truy cập.

## 3. Nhập dữ liệu gym thật

Repo hiện có tài liệu `data/knowledge/04_facility.md` ghi rõ còn thiếu sơ đồ và danh mục máy chi tiết. Vì vậy không có bộ máy thật được tự động seed.

Quản trị đăng nhập bằng email có trong ADMIN_EMAILS, mở **Quản trị gym → Tải danh mục hiện tại**. Sao chép cấu trúc từ `data/companion/catalogue.template.json`, thay toàn bộ ví dụ bằng thông tin đã kiểm tra:

- Mỗi máy/vị trí: ID ổn định, tên tại chỗ, khu/tầng, hướng dẫn từ mốc dễ nhận biết, trạng thái operational/maintenance/retired.
- Mỗi bài: stationId đúng, nhóm cơ, pattern động tác, trình độ tối thiểu, số hiệp/lần, thời gian nghỉ/chuyển máy và cues được HLV duyệt.
- Mẫu ăn: tên, nội dung, mục tiêu/chế độ ăn áp dụng, timing, nguồn và người có chuyên môn duyệt.

Chỉ đặt `verified=true` cho mục đã kiểm tra; sau cùng bật verified cấp danh mục. Chọn **Kiểm tra cấu trúc và lưu**. Hệ thống kiểm tra schema, ID tham chiếu và revision; không thể tự xác nhận điều ghi trong JSON là đúng ngoài đời.

Các số set/reps/rest trong file mẫu chỉ minh họa cấu trúc, không phải giáo án khuyến nghị. Không trình diễn máy giả như máy thật của phòng tập. Có thể dùng dữ liệu synthetic trong unit test, nhưng không nạp vào production.

## 4. Kịch bản demo có thể trình bày

### A. Người dùng có 35 phút và muốn tập chân

Đăng nhập thật → hoàn tất hồ sơ và consent → xác nhận readiness → nhập “Tôi có 35 phút, hôm nay muốn tập chân”.

Kỳ vọng: chỉ các bài thuộc thư viện đã duyệt, phù hợp máy hiện có, không vượt thời gian; thẻ hiển thị khu/máy và hướng dẫn. Báo một máy bận rồi tạo lại: máy đó bị loại. Nếu lịch sử vừa ghi chân trong 48 giờ hoặc đang đau, hệ thống không ép tạo lịch chân.

Ghi một hiệp thực tế, bỏ trống phần còn lại rồi xác nhận. Nhật ký phải là **partial**, không ghi toàn bộ giáo án. Tạo buổi sau để kiểm tra dữ liệu lịch sử đã ảnh hưởng lựa chọn và phần đối chiếu thành tích.

### B. Chuẩn bị đi tập, hỏi ăn trước và sau

Nhập “Tôi chuẩn bị đến gym, nên ăn gì trước và sau tập?” hoặc chọn số phút trong thẻ ăn uống. Kỳ vọng: chọn mẫu đã duyệt theo mục tiêu/chế độ ăn/thời điểm, hiển thị tổng đã ghi trong ngày; không tự đặt mức giảm kcal, không thêm món dự kiến vào nhật ký.

Nhấn Quán gần đây, cho phép vị trí một lần. Nếu không cho quyền hoặc chưa có key, nhận thông báo rõ. Kết quả từ Google không được mô tả là đã kiểm tra menu, kcal hoặc dị ứng.

Ăn xong → gửi “Tôi đã ăn…” → kiểm tra draft, nguồn và gram → xác nhận. Tổng ngày tăng theo bản ghi đã xác nhận, không theo đề xuất lúc trước.

### C. Chụp món ăn

Bật consent ảnh trong Hồ sơ → chọn ảnh JPEG/PNG/WebP → nhận món/khẩu phần dự kiến. Sửa tên, cooked/raw, lượng ăn và các phần dầu/sốt chưa xác định. Không có bản ghi phù hợp thì nhập nguồn nhãn/công thức hoặc chưa lưu; tuyệt đối không dùng 0 để lấp thiếu dữ liệu.

Xác nhận hai lần cùng requestId do mạng gửi lại không được tạo hai bữa. Kcal trong diary có nguồn và khoảng do khẩu phần; không giới thiệu đây là máy đo calories chính xác từ một ảnh.

## 5. Kiểm thử đã cung cấp và phạm vi

`tests/companion.test.mjs` là **unit tests cho hàm nghiệp vụ thuần**, không phải integration test Firebase, kiểm thử lâm sàng hoặc chứng nhận bảo mật. Fixtures máy/khu đều gắn nhãn synthetic.

Các nhóm kiểm thử: consent và sàng lọc; schema/ID; loại máy bận/bảo trì/chưa xác minh; giới hạn 15/35 phút; lịch sử và ê mỏi; đối chiếu thành tích không tự tăng tạ; actual sets/partial; kcal, nguồn và khoảng; tổng ngày/múi giờ/DST; lọc mẫu ăn và personality.

Workflow `Shine Companion integration and checks` thực hiện script tích hợp, chạy unit tests, kiểm tra TypeScript và build. **Trạng thái pass/fail phải đọc từ lần chạy thực tế**, không suy ra từ việc có file workflow. Cần phân biệt lỗi tính năng mới và lỗi dependency/type đã có sẵn trong repository.

## 6. Những kiểm tra staging bắt buộc trước production

| Kiểm tra | Tiêu chí |
| --- | --- |
| Hai người dùng A/B | A không thể đọc/ghi/export/xóa dữ liệu B qua API hoặc Firestore |
| Token thiếu/sai/hết hạn | Trả lỗi xác thực, không dùng UID gửi trong body làm phương án dự phòng |
| Ghi trùng và race condition | Gửi đồng thời cùng planId/requestId chỉ có một bản ghi; payload khác báo conflict |
| Xóa dữ liệu khi đang ghi | Root deleting chặn ghi/khôi phục hồ sơ trong quá trình xóa |
| Profile thay đổi | Plan cũ/revision cũ không được dùng để xác nhận giáo án mới |
| Provider lỗi/thiếu quota | Báo thiếu nguồn; không invent menu, máy hoặc dinh dưỡng |
| Ảnh | Sai định dạng/quá lớn/thiếu consent bị chặn; kiểm tra bỏ EXIF trên trình duyệt mục tiêu |
| Nhật ký qua nửa đêm | Tổng đúng timezone của hồ sơ; ghi thiếu không được gọi là tổng ăn thật |
| Smartphone | Chụp ảnh, bàn phím, scroll, nhập set, đổi tab và retry trên iOS/Android |
| Prompt injection | Tin nhắn hoặc chữ trong ảnh không vượt schema, quyền đọc/ghi và confirmation |
| HLV | Thẩm định thư viện bài, cue, set/reps/rest, vị trí máy và nguyên tắc chọn nhóm cơ |
| Dinh dưỡng | Thẩm định template, dị ứng, lượng ăn và cách báo sai số |
| Entitlement | Quyền dùng tính năng do server/admin quyết định, không từ hồ sơ client tự sửa |
| Vận hành | Rate limit nhiều instance, ngân sách/quota, retention, thông báo lỗi không chứa dữ liệu riêng |

Chưa triển khai tự động trong bản này: wearable/IoT, nhận diện tư thế, occupancy cảm biến, sơ đồ indoor tương tác, giáo án periodization nhiều tuần, tự tăng tạ, khẩu phần điều trị hoặc đo macro đầy đủ, thông báo HLV từ handover mới, đồng bộ tất cả biểu đồ MemberPortal legacy.

## 7. Rollback và dữ liệu

Tắt `SHINE_COMPANION_ENABLED` để chặn API; tắt `VITE_SHINE_COMPANION_ENABLED` rồi build lại để trả UI về bot dịch vụ. Không xóa collection chỉ để rollback giao diện. Dữ liệu vẫn thuộc người dùng và được quản lý theo chính sách consent/retention đã thông báo.

Mọi thay đổi trong nhánh/PR phải được review trước khi merge và triển khai. Không coi việc tạo PR, lint hoặc build thành công là bằng chứng các key, Firestore rules và dịch vụ ngoài đã chạy thật trên môi trường của phòng tập.
