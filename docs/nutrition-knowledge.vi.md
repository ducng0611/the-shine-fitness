# AI Gym Buddy: thư viện nguồn dinh dưỡng, phiên bản 1

## 1. Nội dung đã tiếp nhận

Hai tệp `Thông tin dinh dưỡng - meal plan.docx` và `Meal Plan cho các trường hợp.docx` là cơ sở của đợt số hóa. Nguồn thứ nhất có năm phần nguyên tắc, một mẫu meal plan do PT thiết lập và danh sách tài liệu được tác giả nhắc tới. Nguồn thứ hai có năm trường hợp: tăng cân, giảm mỡ, thể lực/linh hoạt, chiều cao, bệnh chuyển hóa. Giữ tên và cách phân nhóm của nguồn; không ghép với khách hàng trong các lộ trình tập trước.

Có 214 đoạn DOCX, kể cả đoạn trống để giữ chỉ số. Sáu mẫu chứa 28 khối bữa và 70 dòng món/đồ uống. Một dòng có thể có nhiều thực phẩm hoặc phép chọn; không gọi 70 dòng là 70 món độc lập. Tên khách và lịch tập cá nhân trong mẫu PT được thay bằng nhãn tách riêng, không khôi phục hoặc đưa DOCX gốc vào GitHub. Bản đã tách định danh vẫn không phải bảo đảm vô danh hóa hoàn toàn.

## 2. Cấu trúc dữ liệu

```text
data/nutrition/
  source-documents.json       Bản chép theo đoạn và marker trích dẫn nguyên dạng
  template-mapping.json       Ánh xạ biên tập đoạn nguồn thành bữa và lựa chọn
  meal-plan-library.json      Sáu mẫu có cấu trúc, sinh từ hai tệp trên
  review-issues.json          Các vấn đề nguồn cần người có chuyên môn rà soát
  learning-contract.json      Hệ thống được học cấu trúc nào và không được suy gì
  product-safety-basis.json   Cơ sở riêng của quy tắc chuyển giao sản phẩm
  README.md

data/knowledge/
  12_nutrition_meal_plan_sources.md
```

`NutritionSourceBundle`, `NutritionTemplate`, `NutritionMeal`, `NutritionSourceLine` nằm tại `shared/nutritionKnowledge.ts`. Đây không phải `TrainingProgram`, không ghi đè `training_programs.json`, không tạo một người dùng từ mẫu. ID nguồn và chỉ số đoạn đưa người rà soát về đúng nội dung ban đầu.

`sourceEnergy` giữ số tác giả công bố với `basis: author_declared_not_calculated`, `personalTarget: false`. `computedDailyKcal`, `computedKcal`, `computedMacros`, `tdee` đều chưa có giá trị. BMR giữ giá trị nguồn nhưng không trở thành mức ăn tối thiểu. Tên nhóm nam/nữ không xác nhận tuổi trưởng thành.

`quantityMentions` giữ chuỗi lượng và đơn vị được thấy, không tách thành công thức nấu, không đổi chén thành gram. Trường `hasInlineAlternative` chỉ ghi việc xuất hiện từ “hoặc”; phân số không được coi là một phép chọn. Món có số thứ tự “Lựa chọn” được nhóm thành chọn một; những dòng bổ sung vẫn riêng vì nguồn chưa giải thích phạm vi của chúng.

Quy tắc cân sống trừ cơm chỉ gắn mẫu PT và mẫu tăng cân có ghi rõ. Không kế thừa sang mẫu giảm mỡ nữ, thể lực, chiều cao hoặc bệnh lý. Thời điểm trước/sau tập và trước ngủ là mốc trong mẫu, không phải lịch cá nhân, giờ hiện tại hoặc thời điểm đã ăn.

## 3. “Học” trong phiên bản này

Luồng là DOCX đã cung cấp → bản chép có nguồn → cấu trúc bữa và khẩu phần → kiểm tra thiếu dữ liệu → rà soát chuyên môn. Không có fine-tuning, training job, embedding hoặc cập nhật trọng số model. Kiến thức sống ở tệp có phiên bản và có thể sửa, không giả vờ mô hình đã ghi nhớ vĩnh viễn.

Phép kiểm tra nguồn không xác nhận nội dung khoa học. Các nhận định về thâm hụt/thặng dư, “tỷ lệ vàng”, BMR, bữa sáng, bổ sung, chiều cao và theo dõi bệnh được giữ là lời tác giả. Các marker `[cite: ...]` chưa có tài liệu đích; không tự gán URL hoặc thay bằng kiến thức chung. Không tính lại thực đơn bằng bảng dinh dưỡng bên ngoài trong đợt này.

## 4. Tích hợp chatbot

`nutritionChatDecision` được gọi trong `/api/chat` sau kiểm tra HEALTH_RISK và yêu cầu chuyển người thật, trước phân loại bằng model và cache. Những câu hỏi dinh dưỡng chưa có mẫu được duyệt nhận trạng thái `insufficient_reviewed_nutrition_data` thay vì Gemini tự dùng một mẫu như chỉ định cá nhân. Intent `NUTRITION` được nhận diện bằng quy tắc; câu hỏi giá thật vẫn giữ `PRICE`.

Nguồn RAG có category `PROGRAM` để tương thích bảy category hiện tại, nhưng `needs_review/historical_reference` và ID archive khiến nó không đủ điều kiện index/truy xuất, kể cả chỉ đổi hai nhãn thành verified/public_overview. Không đổi `index.json`.

Báo “đã ăn” trả `saved: false`, không tính năng lượng và không ghi nhật ký. Không có camera tính kcal, USDA, Places, TDEE calculator, đồng bộ bữa ăn, thực đơn chữa bệnh hoặc công thức Oresol tự động. Đây là giới hạn thực tế, không phải những tính năng đã chạy.

## 5. Mô phỏng ngữ cảnh riêng cho quản trị

API nguồn dùng Firebase ID token với kiểm tra thu hồi ở server, email đã xác minh và `ADMIN_EMAILS`. Cờ `SHINE_NUTRITION_SOURCE_REVIEW_ENABLED` mặc định false. API đặt `Cache-Control: no-store`, giới hạn request, chỉ đọc tệp và mô phỏng.

- `GET /api/admin/nutrition/library`: sáu mẫu và thống kê sau kiểm tra nguồn.
- `POST /api/admin/nutrition/preview`: kiểm tra một bộ ngữ cảnh mô phỏng, không phải tư vấn hội viên.

Body preview:

```json
{
  "context": {
    "ageBand": "adult",
    "goal": "weight_gain",
    "timing": "before_workout",
    "allergyStatus": "none_reported",
    "clinicalReview": "not_reported",
    "contextConfirmed": true
  }
}
```

Chỉ số sức khỏe thật không gửi vào công cụ mô phỏng này. API không nhận UID tùy ý, không lưu ngữ cảnh, không có route duyệt, sửa, gán mẫu hoặc ghi bữa ăn. Trường chưa rõ phải dùng `unknown`; lời “không báo bệnh” không phải xác nhận khỏe mạnh. Thiếu dữ liệu trả `needs_input`, cần chuyên môn trả `needs_professional_review`; đủ ngữ cảnh nhưng chưa có mẫu duyệt vẫn không cấp thực đơn.

Chưa có modal dinh dưỡng riêng. Modal Pathway Intake hiện tại không nhận JSON thư viện meal plan; không nhập nhầm hai schema. API này chuẩn bị lớp dữ liệu cho giao diện rà soát tiếp theo.

## 6. An toàn tách khỏi bản chép

Các giới hạn trẻ em, bệnh chuyển hóa và bổ sung đã có tiếp tục áp dụng. Đợt này thêm nhận diện dị ứng/không dung nạp, Oresol và một số sản phẩm cần chuyên môn. Quy tắc chỉ kiểm soát hành vi sản phẩm, không xác nhận các lời khuyên trong DOCX.

Nguồn tham khảo ngoài duy nhất cho cảnh báo dị ứng cấp tính: NHS, Food allergy và Anaphylaxis. Sưng lưỡi/họng hoặc sưng môi kèm khó thở/khó nuốt nhận lời khuyên tìm hỗ trợ khẩn có điều kiện, không chờ tư vấn viên; không chẩn đoán hoặc nói đã gọi thay. Cơ chế từ khóa vẫn có thể bỏ sót hoặc bắt nhầm, chưa được kiểm định như hệ thống cấp cứu. URL và phạm vi dùng được ghi trong product-safety-basis.json.

## 7. Kiểm tra và bước tiếp theo

```bash
npx --no-install tsx scripts/prepare-nutrition.ts --report
node --import tsx --test tests/nutrition/domain.test.ts tests/nutrition/router.test.ts
npx --no-install tsc -p tsconfig.nutrition.json --noEmit
npm run build:index -- --check
npm run lint
npm run build
```

Chỉ `--write` sinh lại JSON nguồn nháp; nó không ghi Firestore hay thay quyền sử dụng. Chưa chạy `build:index` online hoặc `eval:rag` cần provider thật. Tệp nguồn cần rà soát thành phần, khẩu phần, tình trạng sống/chín, liên kết tài liệu và khả năng áp dụng. Sau đó tạo **một tập mẫu trưởng thành được duyệt riêng**, không đổi cờ của bản lưu nguồn để bỏ qua quy trình.

Cá nhân hóa thực thi về sau cần đọc hồ sơ đúng Firebase UID, sự đồng ý, thời điểm tập thật, sở thích/hạn chế thực phẩm, nguồn nutrient và nhật ký đã ăn được xác nhận. API mô phỏng hiện tại chưa làm các việc đó. Không dùng chung mục tiêu hoặc giới tính để gán mẫu hoặc suy bệnh. Chưa merge main, deploy, bật cờ hoặc ghi hồ sơ khách.