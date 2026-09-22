# AI Gym Buddy: bàn giao và kiểm chứng giai đoạn 1-2

Ngày lập báo cáo: 23/09/2026 theo giờ Việt Nam. Các timestamp GitHub bên dưới là UTC.

## 1. Baseline, nhánh và trạng thái

Baseline: `feat/nutrition-knowledge` tại `d3269c43c64e13482e5c8ba423a36a4f62e9962f`. Nhánh thực hiện: `feat/gym-buddy-unified-chat`, [PR #11](https://github.com/ducng0611/the-shine-fitness/pull/11), vẫn draft. Không merge main, deploy, chạy huấn luyện mô hình, gọi model trả phí hoặc nhập dữ liệu hội viên.

Mã ứng dụng và kiểm thử đã xác minh: **`70eb9bca01bd0af96981c79e5758459bc1fc83bb`**. Báo cáo này là thay đổi tài liệu sau mốc mã đó. [Workflow 35791627889](https://github.com/ducng0611/the-shine-fitness/actions/runs/35791627889) thành công cho hai job: verify `106961228314` và browser `106961228614`. Run PR kiểm tra merge ref tạm `078400e0a38aa4028718a8d4829fafb3b60b7865`; đây không phải thao tác merge vào nhánh đích.

## 2. Vấn đề đã xác minh và thành phần tái sử dụng

Chat cũ nhận `memberInfo` từ trình duyệt, lưu lịch sử dưới khóa chung, gửi lịch sử client lên server và trì hoãn hiển thị tối thiểu 600 ms. Prompt CRM ép phản hồi ngắn và upsell. Các từ khóa dinh dưỡng hoặc bệnh lý có thể chuyển giao ngay cả khi người hỏi chỉ cần hiểu khái niệm. Chuỗi classifier/embedding/generation có thể chạy trước khi kiểm tra cache.

Tái sử dụng Firebase Admin, quyền training pilot, consent và `TrainingService`. Không tạo một kho hồ sơ hội viên thứ hai. `ChatbotLegacy.tsx` và `training/legacyRouter.ts` giữ bản cũ nguyên byte, có test SHA bảo vệ. API `/api/chat` cũ vẫn tồn tại cho rollback; không coi PR này là audit hoặc sửa bảo mật toàn bộ ứng dụng.

## 3. Giai đoạn 1 đã triển khai

Lõi mới ở `/api/companion/training/buddy` tự kiểm tra danh tính trước khi xử lý. Guest không cần quyền training để hỏi kiến thức. Token sai, hết hạn hoặc thu hồi không được âm thầm chuyển thành guest. Body không được cấp quyền bằng `uid`, `isMember`, `role`, `memberInfo` hoặc `history` tự tạo.

Phiên có chủ sở hữu server, capability ngẫu nhiên cho guest, revision, khóa lượt đang xử lý, request ID và TTL. Không tự nhập hội thoại guest vào hồ sơ hội viên. UI dùng Firebase identity; đổi tài khoản, đăng xuất, đóng panel hoặc reset hủy stream và chặn kết quả đến muộn. Không lưu transcript hay capability vào localStorage. Logout không xóa lịch sử tập lâu dài.

Đọc ngữ cảnh riêng yêu cầu cờ riêng, training bật, email verified, entitlement pilot, hồ sơ đúng UID và consent. Entitlement được kiểm tra lại khi đọc riêng; quyền admin không tự cho phép đọc hồ sơ của người khác. Mục tiêu, kinh nghiệm và tóm tắt phần tập đã xác nhận được render bằng code từ `TrainingService`, không gửi nguyên hồ sơ cho Gemini.

Ngoại lệ an toàn có giới hạn: báo nguy cơ của chính hội viên có quyền có thể vô hiệu readiness cũ bằng transaction, để kế hoạch cũ không cấp quyền bắt đầu sau khi trạng thái đã thay đổi. Không tự chẩn đoán, xác nhận triệu chứng mới, tăng thành tích, lưu meal hoặc sửa profile. Phản hồi có metadata riêng về sự vô hiệu hóa này; `saved:false` không có nghĩa metadata phiên không đổi. Xem `gym-buddy-safety-freshness.vi.md`.

## 4. Giai đoạn 2 đã triển khai

Một bộ điều phối phân biệt kiến thức gym, kiến thức sức khỏe, dinh dưỡng tổng quát, dữ liệu doanh nghiệp, yêu cầu riêng, yêu cầu ghi nhận, chuyển chuyên gia, dấu hiệu khẩn và ngoài phạm vi. Không ép mọi câu thành bán gói tập. Hỏi Protein/Whey/TDEE/đái tháo đường ở mức khái niệm không tự xác nhận bệnh hoặc yêu cầu onboarding.

Nguồn công khai mới gồm 12 thẻ giáo dục tiếng Việt/Anh có nguồn và hạn dùng tại `data/education/buddy-concepts.json`, tách khỏi archive. Câu giáo dục mở có thể dùng Gemini được cấu hình phía server. Đầu ra mô hình không có nguồn tương ứng được ghi rõ là kiến thức mô hình chưa xác minh theo nguồn, không tạo citation giả. Không có live web search trong runtime.

Thông tin doanh nghiệp đọc từ nguồn The Shine hợp lệ, không lấy giá, máy hoặc năng lực chuyên môn từ mô hình. Nguồn lịch sử và meal plan vẫn chờ duyệt, không được mở vào public RAG hoặc đổi `verified`.

SSE hỗ trợ meta/delta/done/error, tiếng Việt, hủy tác vụ, timeout và fallback có giới hạn trước khi phát nội dung. Tuyến sức khỏe/dinh dưỡng do model sinh được giữ để kiểm tra toàn bộ trước khi gửi; không hứa streaming luôn cải thiện thời gian xuất hiện nội dung ở những tuyến này. Tuyến fitness có kiểm tra từng đoạn/câu. Guard bằng quy tắc là giảm rủi ro, không chứng nhận an toàn y khoa.

## 5. Ma trận hành vi và giới hạn

| Tình huống | Hành vi phiên bản mới |
| --- | --- |
| Khách hỏi Protein là gì | Trả lời thẻ giáo dục có nguồn, không cần token hoặc đọc hồ sơ |
| Tài khoản Firebase chưa được cấp pilot hỏi kiến thức | Vẫn được trả lời kiến thức |
| Tiểu đường type 2 là gì | Giải thích khái niệm, không tạo bệnh trong hồ sơ |
| Tự khai bệnh rồi xin thực đơn cá nhân | Đề nghị chuyên gia, không lấy mẫu làm chỉ định |
| Tự khai nguy cơ rồi hỏi Protein | Vẫn giải thích kiến thức; tín hiệu thận trọng còn liên quan cho yêu cầu cá nhân |
| Trẻ xin ăn kiêng hoặc liều thực phẩm bổ sung | Không đưa mục tiêu năng lượng, liều hay kế hoạch cá nhân |
| Hội viên hỏi hồ sơ hoặc phần tập tuần này | Kiểm tra quyền, trả dữ kiện/tổng hợp đã xác nhận; không phải phân tích y khoa |
| Tôi có 35 phút muốn tập chân | Hướng tới quy trình Training để xác nhận; chưa tạo giáo án mới ngay trong chat |
| Tôi đã ăn/tập xong | Không tự ghi, hướng tới bước xác nhận thích hợp |
| Dấu hiệu nguy cơ cấp tính đang xảy ra | Phản hồi kiểm soát; không chỉ hẹn PT hoặc tự nhận đã gọi cấp cứu |
| Hỏi thông tin The Shine mà nguồn thiếu/hết hạn | Báo thiếu, không suy đoán |

Chuyển giao hiện có `handoverStatus:suggested`: mới là đề nghị, chưa đặt lịch hoặc gửi hồ sơ. PT note được gán, meal plan được gán, hồ sơ y khoa chi tiết và engine điều chỉnh lộ trình chưa được nối trong hai giai đoạn này.

## 6. Lỗi được tái hiện trong lần tiếp tục

Checkpoint trước lần tiếp tục `5dbbdf055b656e6eac14b836b8b3468cf162534e` có 136/136 test mới đạt. Khi rà soát thêm, câu tự báo triệu chứng kèm “vì sao/tại sao” có thể bị xem như hỏi khái niệm: “Tôi đau ngực, vì sao vậy?” bị định tuyến OUT_OF_SCOPE thay vì URGENT_SAFETY.

Đã viết test trước khi sửa tại commit `954f1a816b56e67fa1a27dc020e8393802d61f00`. [Run 35791233550](https://github.com/ducng0611/the-shine-fitness/actions/runs/35791233550) ghi **142/146 đạt, 4 thất bại**. Bốn câu lỗi gồm tự báo đau ngực, khó thở dữ dội, hỏi về con đang đau ngực và đau lưng kèm mất kiểm soát tiểu tiện. Sáu câu đối chứng về khái niệm, phủ định, trích dẫn, giả định và quá khứ không được gán cấp cứu hiện tại.

Bản sửa `70eb9bca...` giữ báo triệu chứng trực tiếp trên nhánh an toàn dù có từ hỏi. Không bỏ các gate phủ định, trích dẫn, giả định hoặc quá khứ. Phiên bản chính sách tăng lên `context-policy-v3`. Giữ nguyên các assertion rồi chạy lại đầy đủ. Đây là sửa một lớp lỗi đã tái hiện, không chứng minh bộ nhận diện bao phủ mọi cách diễn đạt.

## 7. Kết quả kiểm thử thực tế

| Lớp kiểm tra | Kết quả | Phạm vi |
| --- | --- | --- |
| Buddy domain, routing, HTTP, identity, streaming, freshness | **146/146 đạt**, 0 bỏ qua | Bao gồm 10 tình huống hồi quy vừa thêm; verifier/provider tổng hợp ở nơi cần |
| Năm chương trình và luật hiện có | **470/470 đạt** | Không tính thành test mới của chat |
| Training domain/service/HTTP | **99/99 đạt** | Hồi quy module cũ |
| Nutrition, assets và pathway domain/API | **130/130 đạt** | Gồm 66 nutrition và 64 assets/pathway |
| Chromium | **6/6 luồng đạt**, `pageErrors: []` | React và HTTP thật; danh tính và provider tổng hợp |
| Strict buddy/training, TypeScript toàn dự án | **Đạt** | Kiểm tra kiểu dữ liệu |
| `build:index -- --check` | **Đạt** | Không gọi embedding, không sửa index |
| Vite + esbuild | **Đạt** | Còn cảnh báo bundle lớn và mixed imports |

Sáu luồng browser: guest đọc thẻ và nguồn; phân biệt khái niệm/yêu cầu cá nhân; A sang B sang guest; đổi tài khoản khi streaming; reset/cancel và layout 390 px; reload không khôi phục hội thoại riêng. Đã mở trực quan ảnh desktop/mobile. Ảnh ghi rõ SYNTHETIC TEST ONLY, không phải website production.

Không dùng các kết quả trên để khẳng định đã thử Firebase sign-in UI, Gemini thật, Safari/WebKit, điện thoại vật lý hoặc toàn bộ email/analytics cũ. Các workflow emulator hồi quy cũ là lớp riêng; chưa có nghiệm thu Firebase thật xuyên suốt cho Buddy mới.

## 8. Số đo hiệu năng và phần chưa đo

Benchmark run cuối: Linux, Node `v22.23.2`, AMD EPYC 7763; 40 mẫu sau 5 warmup, concurrency 1, mạng `127.0.0.1`. Tuyến guest dùng thẻ nguồn thật và SSE, **0 lời gọi model**, **40 cache hit**.

| Chỉ số | p50 | p95 |
| --- | ---: | ---: |
| Tạo phiên và nhận câu trả lời | 5,08 ms | 7,38 ms |
| Nội dung chat hữu ích đầu tiên | 2,68 ms | 3,88 ms |
| Hoàn tất chat | 2,73 ms | 3,94 ms |
| Công đoạn server | 0,48 ms | 0,80 ms |

Đây là đường đi cục bộ đã làm nóng và có cache, không phải tốc độ Gemini hay tốc độ người dùng ngoài Internet. Không mô phỏng model rồi gọi đó là kết quả model thật. Chưa đo endpoint cũ, mạng di động, cold start, Firebase thật, tải đồng thời hoặc model TTFT. Không tính tỷ lệ cải thiện trước/sau khi thiếu baseline. UI mới đã bỏ sàn chờ giả 600 ms; điều đó không chứng minh mọi câu trả lời nhanh hơn 600 ms.

Mục tiêu FAQ dưới 0,7 giây và nội dung model đầu tiên 1-2 giây vẫn cần kiểm chứng trên staging. Buffer kiểm tra nội dung sức khỏe/dinh dưỡng là đánh đổi có chủ đích. Timeout/abort phía SDK không bảo đảm provider đã ngừng xử lý hoặc không tính phí.

## 9. Cache, metrics và dữ liệu được bảo vệ

Cache công khai có TTL năm phút, tối đa 128 mục, khóa theo câu hỏi/ngôn ngữ/tác vụ/chủ đề/phiên bản nguồn và chính sách. Kiểm tra an toàn và hiệu lực nguồn trước khi dùng cache. Không cache chung đầu ra cá nhân hoặc output mô hình không có nguồn.

Metrics riêng chỉ admin đọc, tối đa 500 mẫu trong process, có phân phối theo tác vụ và thời gian từng giai đoạn. Không chứa UID, token hoặc transcript. Chưa nối bảng metrics này vào dashboard CRM cũ.

Phiên RAM tối đa 512, idle 20 phút, hạn tuyệt đối hai giờ, tối đa 120 lượt và lịch sử rút gọn. Chưa có kho phiên đa instance hoặc lưu hội thoại lâu dài. Restart có thể làm mất phiên chat, không làm mất lịch sử tập. Đây là giới hạn pilot phải xử lý trước khi mở rộng.

## 10. File thay đổi và lý do

Bộ mã đã kiểm tra gồm 38 đường dẫn. Báo cáo này là tài liệu bổ sung sau kiểm thử.

| Nhóm file | Vai trò |
| --- | --- |
| `.env.example`, `tsconfig.buddy.json`, `.github/workflows/unified-chat.yml` | Cờ mặc định tắt, strict typecheck và CI chỉ đọc |
| `shared/buddyChat.ts`, `buddyIdentity.ts`, `buddyPolicy.ts` | Hợp đồng phản hồi, giới hạn danh tính client và định tuyến ngữ cảnh |
| `server/src/buddy/configured.ts`, `router.ts`, `state.ts` | Gắn quyền hiện có, API, phiên, cache, metrics |
| `server/src/buddy/knowledge.ts`, `provider.ts`, `freshness.ts` | Nguồn công khai, adapter Gemini và vô hiệu readiness cũ có quyền |
| `training/router.ts`, `training/legacyRouter.ts` | Gắn Buddy trước middleware training, bảo toàn router cũ |
| `src/components/Chatbot.tsx`, `ChatbotLegacy.tsx` | Chọn UI qua cờ và giữ rollback |
| `src/components/buddy/BuddyChat.tsx`, `BuddyPanel.tsx`, `client.ts`, `buddy.css` | Firebase identity, UI, SSE, hủy phiên và hiển thị nguồn |
| `data/education/buddy-concepts.json` | 12 thẻ kiến thức chung tách archive |
| `tests/buddy/*.test.ts` | Các lớp kiểm thử hành vi, quyền, stream, hồi quy và an toàn |
| `tests/buddy/benchmark.ts`, `browser_test.py`, `ui-harness.tsx`, `ui-server.ts`, `ui.html` | Đo tuyến nguồn, browser và harness tổng hợp |
| `docs/gym-buddy-architecture.vi.md`, `gym-buddy-staging.vi.md`, `gym-buddy-safety-freshness.vi.md` | Kiến trúc, vận hành và phạm vi ngoại lệ an toàn |

Không sửa `training_programs.json`, thư viện meal plan, index RAG hoặc trạng thái kiểm duyệt của các nguồn trước. Không thêm thông tin hội viên thật vào commit.

## 11. Bằng chứng và gói bàn giao

Đã tải artifact `buddy-verification` **10721334295** và `buddy-browser` **10722236604** từ run thành công, đọc TAP/benchmark/build và kiểm tra ảnh. Artifact GitHub có thời hạn bảy ngày. Bản snapshot source đã đối chiếu file sửa với nội dung gửi lên repo.

Patch mã ứng dụng có SHA256 `0e646f1a3e5ae16c8e5c68ab287b138550807151c307f032f434d5025cdd9ded`. Đã áp ngược, áp lại và đối chiếu byte đủ 38 file trong working copy có phạm vi. Đây không phải clone đầy đủ; không tuyên bố build cục bộ toàn repo. Gói bàn giao kèm patch tài liệu riêng khi báo cáo chưa nằm trong artifact CI.

## 12. Bật staging, rollback và phần còn lại

Xem `gym-buddy-staging.vi.md`. Bật công khai bằng `SHINE_CHAT_ENABLED=true`, `VITE_SHINE_CHAT_ENABLED=true`, giữ `SHINE_CHAT_MEMBER_CONTEXT_ENABLED=false` trước. Build lại frontend và restart backend. Không cần tạo embedding cho các thẻ mới.

Chỉ bật context riêng sau khi xác nhận Firebase thật và quyền pilot: cờ member context, training flags, UID được phép, verified email và consent. Model chính/fallback cấu hình phía server; không đưa API key vào VITE hoặc hội thoại. Các cờ trong repo vẫn false.

Rollback bằng tắt cờ mới, build/restart. Quay lại legacy cũng quay lại giới hạn cũ, không phải bảo đảm an toàn toàn ứng dụng. Chưa triển khai môi trường thật trong lần này.

Giai đoạn tiếp theo: nghiệm thu staging thật và ngân sách model; duyệt nguồn công khai/thiết bị; nối kế hoạch và ghi chú đã gán theo đúng quyền; chuẩn hóa khẩu phần và nhật ký bữa xác nhận; rồi mới cân nhắc camera/Places. Chưa có khả năng phân tích đầy đủ mọi lộ trình, meal plan, PT note hoặc bệnh lý cá nhân. Không cam kết trả lời đúng mọi câu hỏi sức khỏe.
