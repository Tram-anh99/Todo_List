# Goal Planner & Todo List

Ứng dụng quản lý mục tiêu và công việc cá nhân, xây dựng bằng React, TypeScript và Vite.

## Chức năng

- Thêm, sửa, xóa và đánh dấu hoàn thành công việc
- Mức ưu tiên, danh mục và hạn chót
- Lọc, tìm kiếm và sắp xếp
- Thống kê tổng quan và xóa các việc đã hoàn thành
- Lưu dữ liệu và giao diện sáng/tối bằng `localStorage`
- Responsive cho desktop, tablet và mobile
- Dashboard theo dõi mục tiêu năm, quý, tháng và tuần
- Mục tiêu phân cấp và tự động tổng hợp tiến độ từ mục tiêu con, Todo
- Kế hoạch tuần, cảnh báo trễ hạn và biểu đồ tiến độ
- Liên kết từng Todo với mục tiêu cụ thể
- Deadline được đối chiếu với kỳ mục tiêu và có cảnh báo khi nằm ngoài kỳ
- Đồng hồ đếm ngược, thông báo hoàn thành sớm, đúng hạn hoặc muộn
- Mỗi tab chỉ hiển thị đúng cấp mục tiêu năm, quý, tháng, tuần hoặc ngày
- Theo dõi thêm mục tiêu Ngày trong chuỗi Năm → Quý → Tháng → Tuần → Ngày
- Biểu đồ chính của thời điểm được đặt đầu tiên, mục tiêu cấp nhỏ hơn hiển thị chi tiết bên dưới
- Mục tiêu con bắt buộc liên kết với đúng cấp cha liền kề; tiến độ chỉ tổng hợp qua liên kết cha–con
- Thẻ mục tiêu Quý liên kết với mục tiêu Năm và tổng hợp đầy đủ các mục tiêu Tháng, Tuần, Ngày thuộc đúng Quý
- Đường dẫn Năm → Quý → Tháng → Tuần → Ngày được hiển thị trên từng mục tiêu chi tiết

## Công nghệ

- React 19 và TypeScript
- Vite
- Lucide React
- CSS responsive và SVG/CSS chart
- Local Storage
- ESLint

## Chạy project

```bash
npm install
npm run dev
```

Kiểm tra bản production:

```bash
npm run build
npm run preview
```
