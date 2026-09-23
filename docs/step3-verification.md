# Step 3 — Báo cáo kiểm chứng thực tế

Cập nhật: **22/09/2026**. Baseline: main `d40f9d37dff128ab2fdf079276dbaac70c37e0d7`. Nhánh: `feat/member-memory-adaptive-workout`, [PR #2](https://github.com/ducng0611/the-shine-fitness/pull/2), chưa merge hoặc deploy.

## 1. Kết quả mới nhất đã quan sát

Mã ứng dụng và kiểm thử: **`3de8df65e3f0bbb41955b93696b6dd34ab7931d8`**. [GitHub Actions run 35696103670](https://github.com/ducng0611/the-shine-fitness/actions/runs/35696103670) hoàn tất **success** cho cả ba jobs. Các commit tài liệu sau mốc này không thay đổi mã ứng dụng/kiểm thử.

| Hạng mục | Kết quả | Phạm vi |
| --- | --- | --- |
| Domain, service và HTTP tests | **99/99 đạt**, 0 bỏ qua | Ngữ cảnh, planner, ownership, concurrency, router và hồi quy readiness. Dùng dữ liệu tổng hợp, store/verifier thử nghiệm. |
| Firebase Auth + Firestore emulator | **12/12 đạt**, 0 bỏ qua | Token Auth emulator, Admin SDK, transaction trên Firestore emulator, rules và API. |
| Chromium browser flows | **6/6 luồng đạt**, `pageErrors: []` | React thật + API HTTP test harness; desktop 1280 px và viewport mobile 390 px. |
| `npm run typecheck:training` | **Đạt** | Strict TypeScript cho module mới. |
| `npm run lint` | **Đạt** | TypeScript toàn dự án. |
| `npm run build` | **Đạt** | Vite frontend và esbuild backend. Cảnh báo bundle lớn vẫn còn. |

Job IDs: `unit-and-build` **106643200257**; `firebase-emulator` **106643200565**; `browser-smoke` **106643200442**. Đã đọc log TAP, kết quả artifact và step status thực tế, không suy đoán từ sự tồn tại của workflow.

Artifact `training-emulator-results` ID **10680860666** chứa log 12 tests; `training-browser-results` ID **10680621177** chứa `result.json`, `desktop-plan.png`, `mobile-plan.png`, `mobile-history.png`, `safety-stale-plan.png` và log server. Artifact GitHub có thời hạn lưu 7 ngày, không phải lưu trữ vĩnh viễn.

## 2. Lỗi được tái hiện và sửa trong lần tiếp tục

Sau một kế hoạch dự kiến được tạo bằng readiness không đau, `/chat` có thể nhận thông điệp cần kiểm tra an toàn nhưng readiness cũ vẫn hợp lệ ở backend. Nút bắt đầu trên UI cũng vẫn có thể dùng kế hoạch cũ. Đây là lỗi đồng bộ trạng thái, không phải lỗi mất mã nguồn sau khi phiên trợ lý bị gián đoạn.

**Đã thêm kiểm thử trước khi sửa.** Commit `d8fbfc23b42b3c97b95c563419e1a2a9d1f7fc85`, [run 35695646871](https://github.com/ducng0611/the-shine-fitness/actions/runs/35695646871), ghi **92/99 đạt, 7 thất bại**. Một kiểm tra quan trọng quan sát API bắt đầu kế hoạch cũ trả `200` thay vì `409` sau thông điệp an toàn. Đây là các biểu hiện kiểm thử của cùng nhóm lỗi; không phải 7 sự cố production đã được ghi nhận.

Bản sửa:

- `/chat` vô hiệu hóa readiness cũ bằng transaction trên đúng UID khi nhận intent `safety`.
- API phản hồi `readinessInvalidated` riêng. `saved: false` vẫn nghĩa là không ghi nhật ký tập hoặc hội thoại; không được hiểu rằng request không đổi trạng thái freshness.
- Không tự ghi chẩn đoán, không tự đặt `currentPain = true`, không sửa hồ sơ, không thêm buổi tập.
- Giao diện bỏ xác nhận readiness, yêu cầu người dùng trả lời lại và khóa bắt đầu kế hoạch cũ.
- Sửa câu trả lời readiness cũng khóa kế hoạch cũ, kể cả đổi lại giá trị ban đầu; cần xác nhận và lập lại kế hoạch.
- Gọi API trực tiếp sau invalidation đã commit trả `409 context_changed`; tải lại trang không mở lại kế hoạch.
- Nếu phản hồi chat mất mạng, UI khóa thận trọng; lỗi lưu không được báo thành thành công.
- Buổi đã bắt đầu vẫn ghi được phần thực tế đã xảy ra. Ghi nhật ký không đồng nghĩa khuyến nghị tiếp tục tập.

Thêm **8 HTTP tests**, **1 emulator test** và **3 browser flows**. Trong [run 35695933087](https://github.com/ducng0611/the-shine-fitness/actions/runs/35695933087), unit/build và emulator đã đạt, browser dừng vì test harness trả raw fetch error thay vì lỗi `connection_uncertain` như client thật. Đã sửa adapter của harness cho cùng ngữ nghĩa lỗi mất phản hồi, không bỏ assertion hoặc tắt tình huống kiểm thử. Run mới ở mục 1 đã đạt đầy đủ.

Các file mã/kiểm thử sửa trong lần tiếp tục: `server/src/companion/training/router.ts`, `src/components/training/TrainingWorkspace.tsx`, `tests/training/router.test.ts`, `tests/training/emulator.integration.ts`, `tests/training/browser_test.py`, `tests/training/ui-harness.tsx`.

## 3. Firebase emulator đã kiểm tra gì?

Dự án cô lập `demo-shine-training`, không có hội viên thật hoặc database production:

- Token hợp lệ được chấp nhận; token sai và tài khoản vô hiệu hóa bị chặn.
- Hội viên A không đọc/ghi được profile, kế hoạch hoặc lịch sử của B; body không đổi chủ hồ sơ.
- Tạo kế hoạch, bắt đầu và lưu phần thực tế qua HTTP với adapter Firestore thật trong emulator.
- Completion đồng thời chỉ tạo một nhật ký, một lần tăng revision; payload mâu thuẫn trả conflict.
- Client không đọc/ghi trực tiếp được collection riêng tư authoritative hoặc quyền pilot.
- Rules chặn owner fields mâu thuẫn và chuyển quyền sở hữu ở các writes legacy được bảo vệ.
- Readiness báo đau chặn planner.
- Chat an toàn vô hiệu readiness đúng UID, chặn start kế hoạch cũ, không thêm session và không sửa tài khoản khác.
- Catalogue synthetic trong test được dùng đúng điều kiện; trạng thái máy được kiểm tra lại khi bắt đầu.
- Xuất/xóa chỉ tác động dữ liệu Step 3 của chủ tài khoản.

Đây là **emulator**, không phải project Firebase thật của doanh nghiệp. Không dùng kết quả này thay cho nghiệm thu staging.

## 4. Sáu luồng trình duyệt đã chạy

1. Hồ sơ → chat 35 phút tập chân → xác nhận readiness → khung personalized-general không bịa máy → bắt đầu → nhập phần thực tế → lưu đúng một buổi. Layout 390 px không tràn ngang.
2. Server đã lưu completion nhưng phản hồi bị cắt → gửi lại đúng payload → báo đã lưu, không tạo buổi thứ hai.
3. Người dùng xác nhận đau hiện tại → planner tạm dừng, không tạo thẻ kế hoạch.
4. Thay câu trả lời readiness sau khi tạo kế hoạch → nút bắt đầu bị khóa; chỉ tạo kế hoạch mới sau xác nhận mới mở được.
5. Chat an toàn → readiness cũ mất hiệu lực, lựa chọn đau quay về chưa trả lời thay vì tự điền; reload vẫn khóa start.
6. Server xử lý chat an toàn nhưng mất phản hồi → UI khóa kế hoạch; reload không phục hồi readiness cũ.

Đã tải artifact run thành công và mở trực quan ảnh desktop, mobile và trạng thái kế hoạch cũ bị khóa. Đây là ảnh với **dữ liệu tổng hợp trong test harness**, không phải website production hoặc máy gym thật. Harness dùng định danh tổng hợp; kiểm tra Firebase/token thật trong emulator nằm ở suite riêng.

## 5. Cách chạy và giới hạn regression

Các kiểm tra mới nhất được thực hiện trên **GitHub Actions**. Không khẳng định đã chạy lại `npm run dev` toàn ứng dụng bằng tài khoản doanh nghiệp trong lần tiếp tục; browser job khởi động test server riêng `test:training:ui:server`.

CI dùng `contents: read`, không tự commit, merge, deploy, đổi cấu hình API key hoặc nạp dữ liệu production.

Các module RAG, Excel analytics, email và reviews không bị thay thế trong Step 3. Typecheck/build toàn dự án đạt nhưng **không chứng minh** đã thử gửi email thật, Gemini/RAG thật, mọi trang admin hoặc mọi biểu đồ Member Portal. Tab tập mới không ghi kép vào biểu đồ legacy.

Vite vẫn cảnh báo chunk lớn (JS chính khoảng 2.54 MB minified, khoảng 675 kB gzip trong run trên). Log cũng có cảnh báo deprecation của dependency/action; chưa thực hiện dependency/security audit tổng thể hoặc tối ưu hiệu năng.

## 6. Lịch sử kiểm chứng trước lần tiếp tục

Mốc ứng dụng `7399372ecd921f4bc815822f1684ef066319fa94`, [run 35693830453](https://github.com/ducng0611/the-shine-fitness/actions/runs/35693830453), đã đạt 91 tests nghiệp vụ, 11 emulator tests, 3 browser flows, strict/full typecheck và build. Lần đầu trước mốc đó có lỗi accessible label của select năng lượng; đã sửa tên truy cập và kiểm thử.

Số liệu **99 / 12 / 6** ở mục 1 thay thế bộ **91 / 11 / 3** cho phiên bản hiện tại. Không cộng lặp các bộ kiểm thử thành một số thành tích lớn hơn.

## 7. Chưa được kiểm chứng hoặc chưa triển khai

- Chưa dùng hội viên thật, API key thật hoặc Firebase staging/production của doanh nghiệp.
- Chưa thử iPhone/Android vật lý, Safari/WebKit hoặc Google popup login trên domain triển khai.
- Chưa có data máy/khu vực thật và định lượng do người có chuyên môn duyệt.
- Chưa xác minh hợp đồng đã trả phí; quyền hiện tại là quyền pilot server quản lý.
- Chưa audit privacy/security toàn ứng dụng, load test nhiều instance hoặc đánh giá đầy đủ false positive/negative của nhận diện thông điệp an toàn.
- Chưa đồng bộ hai chiều mọi biểu đồ legacy, tối ưu bundle, rate limit phân tán, nâng toàn bộ dependency.
- Chưa merge main, deploy hoặc ghi dữ liệu doanh nghiệp.

**Kết luận đúng phạm vi:** Step 3 và bản sửa readiness đã qua các kiểm thử nêu trên; có thể review và chuẩn bị pilot trên staging. Không coi kết quả CI là kiểm định chuyên môn, chứng nhận an toàn y khoa hoặc bằng chứng rằng toàn bộ hệ thống đã sẵn sàng production.

Xem [kiến trúc tiếng Việt](step3-architecture.vi.md), [kiến trúc kỹ thuật](step3-architecture.md) và [hướng dẫn pilot](step3-pilot-guide.vi.md).
