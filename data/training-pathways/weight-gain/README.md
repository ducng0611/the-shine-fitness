
# Nguồn lộ trình tăng cân

Thư mục này giữ bản chép giáo án và hợp đồng diễn giải cho `prog_weight_gain_pt50`. Nguồn là prompt tự chứa do người dùng cung cấp, không phải ảnh đã được đối chiếu độc lập.

## Các tệp

- `source-sessions.json`: dữ liệu nguồn 51 dòng của đúng buổi 1, 2, 3, 12, 13; quy ước A2, ánh xạ tên bài và metadata lộ trình.
- `scientific-claims.review.json`: 14 nhóm đề xuất khoa học trong yêu cầu, giữ nội dung yêu cầu tách khỏi kết quả đối chiếu ngoài nguồn.
- `source-status.json`: trạng thái, các giới hạn và phạm vi riêng tư.
- `../../companion/training_programs.json`: thư viện ghép từ nguồn này và lộ trình thể lực có sẵn.

## Những gì hệ thống tiếp nhận

Thứ tự khối, tên bài nguồn, ô volume/load/rest, kiểu tải đã được quy ước, mối quan hệ cặp liên hoàn và những chỗ chưa chắc. Hệ thống không tự tạo kết quả buổi tập, mục tiêu calo, lời khuyên y khoa hoặc phê duyệt chuyên môn.

Nguồn quy định cặp a1/a2 nghỉ sau cả cặp. Ô trống ở a2 vẫn trống; định lượng của bài đầu được lưu làm anchor, không được chép xuống bài thứ hai. Cặp d của buổi 12 chỉ có d1. Ký hiệu chữ cái đơn của buổi 3 không phải superset.

Side Kick được liên kết đề xuất với Side Band Kick nhưng không được xác nhận cùng dụng cụ. Tên Standing OH SD dùng ID đẩy vai đứng thực tế của repo, không tạo thêm ID tương tự trong prompt.

## Cách kiểm tra hoặc cập nhật

```bash
npx --no-install tsx scripts/prepare-weight-gain.ts
npx --no-install tsx scripts/validate-weight-gain.ts --report
```

Công cụ chuẩn bị ghép lại có tính lặp an toàn: cùng nguồn không tăng version hoặc tạo usage trùng. Khi nguồn thay đổi, không ghi đè chương trình cùng ID; cần review phiên bản theo quy trình.

Để xem kết quả vào một tệp mới:

```bash
npx --no-install tsx scripts/prepare-weight-gain.ts --out weight-gain-merged.review.json
```

Không đưa tệp nguồn thật vào `public/`, không import như `PathwaySourceBundle` hoặc nạp qua modal catalogue thiết bị. Thư viện này không thay `gym_catalogue.json` và không tạo Firestore documents.

## Riêng tư

Repo chỉ giữ hồ sơ khái quát khách trưởng thành và nguồn giáo án đã bỏ ngày cá nhân. Số đo, ngày hồ sơ và ngày buổi được bàn giao riêng ngoài repo. Tệp riêng tư vẫn cần quyền sử dụng dữ liệu và nơi lưu có kiểm soát. Không khôi phục tên, điện thoại, địa chỉ hoặc chữ ký.

## Trạng thái sử dụng

`needs_review`, `verified=false`, `eligibleForPlanner=false`, `ragRetrievalAllowed=false`. Markdown dùng `historical_reference` và không được index cho khách. Tạo embedding không phải phê duyệt. Chỉ bản tổng quan đã được review riêng mới được đưa vào RAG công khai; mọi cá nhân hóa thực thi còn cần dữ liệu thiết bị, nội dung bài và đánh giá người dùng hiện tại.
