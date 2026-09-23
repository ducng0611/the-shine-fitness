# Dữ liệu dinh dưỡng thu thập từ tài liệu The Shine

Đợt 1 có hai DOCX, sáu mẫu meal plan, 28 khối bữa và 70 dòng món. Đây là bản nguồn chờ rà soát, không phải thực đơn đã được duyệt cho hội viên hoặc dữ liệu đã fine-tune vào Gemini.

`source-documents.json` giữ từng đoạn và ký hiệu trích dẫn. `template-mapping.json` ánh xạ các đoạn sang mẫu, bữa, lựa chọn và thời điểm. `meal-plan-library.json` là bản được sinh lại bằng `scripts/prepare-nutrition.ts`; không chỉnh bằng tay hoặc tự đổi cờ verified.

Tên khách và lịch tập cá nhân của mẫu PT đã tách khỏi bản công khai, có dấu tại đúng chỉ số đoạn. Không commit DOCX gốc, bản PRIVATE hoặc ảnh bữa ăn. Không khẳng định bản tách định danh là vô danh hóa hoàn toàn.

`review-issues.json` giữ vấn đề chưa rõ. Các nhận định dinh dưỡng trong tài liệu chưa được kiểm chứng ở bước này; không sửa lén hoặc thay bằng kiến thức bên ngoài. `product-safety-basis.json` chỉ hỗ trợ quy tắc chuyển giao sản phẩm, không phải xác nhận nguồn DOCX.

Chạy từ thư mục gốc repo:

```bash
npx --no-install tsx scripts/prepare-nutrition.ts --report
# Chỉ sinh lại JSON nháp, không ghi cơ sở dữ liệu:
npx --no-install tsx scripts/prepare-nutrition.ts --write
```

Tài liệu kỹ thuật và những chức năng còn thiếu: `docs/nutrition-knowledge.vi.md`. API quản trị cần cờ `SHINE_NUTRITION_SOURCE_REVIEW_ENABLED=true`, Firebase admin thật và email đã xác minh. Chưa có modal dinh dưỡng riêng; không nhập thư viện này vào modal Pathway Intake vốn dùng schema khác.