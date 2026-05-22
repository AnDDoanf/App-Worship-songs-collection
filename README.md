# Song Collections

Ứng dụng tra cứu và trình chiếu bài hát Thánh Ca trên web, tối ưu cho cả máy tính và điện thoại.

Demo: https://anddoanf.github.io/App-Worship-songs-collection/

## Tính năng chính

- Xem nhiều tuyển tập bài hát trong cùng một ứng dụng: `Tôn Vinh Chúa Hằng Hữu`, `Hosanna Việt Nam`, `Bài hát tự do`, `Thánh Ca Xanh`.
- Tìm kiếm bài hát nhanh theo tên bài, mã bài hoặc nội dung lyric.
- Lọc danh sách theo chủ đề, tone và nhịp.
- Phân trang danh sách bài hát và tùy chỉnh số bài hiển thị mỗi trang.
- Xem sheet nhạc trực tiếp trong popup.
- Phát audio tham khảo ngay trên từng bài hát khi có dữ liệu.
- Thêm bài hát vào danh sách trình chiếu chỉ với một nút bấm.
- Tạo nhiều danh sách trình chiếu khác nhau, đổi tên, lưu, xóa và chuyển qua lại giữa các danh sách.
- Nhập danh sách mã bài hát để dựng nhanh queue trình chiếu.
- Mở chế độ slideshow để trình chiếu sheet nhạc theo thứ tự đã chọn.
- Hỗ trợ thao tác khác nhau theo thiết bị.
- Desktop: điều hướng bằng nút trái/phải, xem sheet theo bố cục phù hợp màn hình lớn.
- Mobile: giao diện tối ưu cảm ứng, hỗ trợ vuốt để chuyển trang sheet.
- Ghi nhớ trạng thái giao diện và danh sách trình chiếu bằng `localStorage`.
- Hỗ trợ giao diện sáng/tối.

## Công nghệ sử dụng

- React
- React Icons
- Create React App

## Chạy local

```bash
npm install
npm start
```

## Build production

```bash
npm run build
```

## Excel workflow

Xuất workbook từ 4 nguồn dữ liệu hiện tại:

```bash
npm run export:songs
```

File kết quả: `exports/song-collections.xlsx`

Luồng sử dụng đề xuất:

1. Chạy `npm run export:songs`.
2. Upload `exports/song-collections.xlsx` lên Google Drive.
3. Dùng file đó làm nguồn chỉnh sửa lyric/chord.
4. Mở app với query `?workbookUrl=...` trỏ tới URL tải xuống của workbook để app đọc runtime.

Lưu ý: browser chỉ đọc được workbook nếu link Drive/Sheets có thể `fetch` trái nguồn. Nếu file còn private hoặc URL không cho CORS, app sẽ tự quay về dữ liệu local.
