# Bộ nhớ nguồn cá nhân trong SQLite

Thư mục này chỉ chứa hợp đồng nhập và tra cứu dữ liệu. Hồ sơ, bệnh lý, mật khẩu, SQLite và kết quả hội thoại riêng không đặt ở đây.

Ba file nguồn đã số hóa được đọc theo danh sách cho phép trong `source-registry.json`. Công cụ không quét mọi file trong data, không gọi API embedding và không sao chép thêm hồ sơ khách bất kỳ.

Chạy `npm run local:memory -- --db /duong/dan/shine-pilot.sqlite --facts /duong/dan/source-facts.PRIVATE.json --out /duong/dan/import-report.json` từ gốc repo. Database phải có sẵn tài khoản QA. Khi nguồn thay đổi, cần chỉ rõ `--expected-revision N` sau khi xem lại nội dung.

`recorded` là có nội dung trong nguồn. `not_recorded` là để trống/chưa được cung cấp. `not_disclosed` là nguồn ghi không khai báo. `reported_none` là khách ghi không/0, không phải kết luận y khoa. Mỗi trường giữ `raw`, `status`, `sourceRef`.

Chat có thể đọc lại và đối chiếu bản chép gắn với đúng UID; không coi giáo án lịch sử là buổi đã tập. Meal plan mẫu được lưu như tri thức nguồn, không gán theo mục tiêu trùng nhau. Chưa có gán riêng thì chatbot nói rõ thiếu gán, không nói sai rằng chưa có bộ đọc.

Xem `docs/member-source-memory.vi.md` để biết kiến trúc, quyền và giới hạn.
