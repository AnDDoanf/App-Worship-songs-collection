# Song Collections

Ứng dụng tra cứu và trình chiếu bài hát Thánh Ca trên web, tối ưu cho cả máy tính và điện thoại.

Demo: https://anddoanf.github.io/App-Worship-songs-collection/

## Tính năng chính

- Xem nhiều tuyển tập bài hát trong cùng một ứng dụng: `Tôn Vinh Chúa Hằng Hữu`, `Hosanna Việt Nam`, `Bài hát tự do`, `Thánh Ca Xanh`.
- Tìm kiếm bài hát nhanh theo tên bài, mã bài hoặc nội dung lyric.
- Lọc danh sách theo chủ đề, tone và nhịp.
- Tự động hiển thị thêm bài hát khi cuộn, có nút xem thêm dự phòng.
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

## Tự động deploy

Workflow `.github/workflows/deploy.yml` tự động chạy khi push lên `master`: cài dependencies bằng
`npm ci`, chạy tests, build production và deploy thư mục `build` lên GitHub Pages.
Có thể chạy thủ công tại **Actions → Deploy to GitHub Pages → Run workflow**.

Thiết lập một lần trên GitHub trước khi push workflow:

1. Trong **Settings → Pages → Build and deployment**, chọn **Source: GitHub Actions**.
2. Trong **Settings → Environments → github-pages → Deployment branches and tags**, cho phép nhánh `master` deploy.

Workflow sử dụng token mặc định của GitHub Actions, không cần thêm secret.

## SEO và danh mục tĩnh

`npm run build` tự chạy `scripts/generate-seo.js` sau khi React build xong. Thư mục `build`
chứa các trang HTML độc lập, đọc được khi tắt JavaScript:

- `songs/`: danh mục tuyển tập.
- `songs/<id>/`: lời, hợp âm, thông tin và bản nhạc của từng bài hát.
- `collections/<key>/`: danh sách theo tuyển tập, có liên kết phân trang khi trên 100 bài.
- `sitemap.xml`: URL trang chủ, danh mục và toàn bộ bài hát.

Generator ưu tiên workbook công khai đang được cấu hình trong `src/services/remoteWorkbook.js`
hoặc biến `REACT_APP_SONG_WORKBOOK_URL`, giống ứng dụng. Nếu không tải được workbook trong
20 giây, generator dùng dữ liệu local và ghi cảnh báo. Đặt `SEO_REQUIRE_REMOTE=true` để build
thất bại khi workbook lỗi; đặt `SEO_OFFLINE=true` để chỉ dùng dữ liệu local.
Các trang tĩnh là ảnh chụp dữ liệu tại thời điểm build; chỉnh workbook xong cần build/deploy lại.
Các URL workbook riêng trong query hoặc localStorage của từng người không được xuất ra trang tĩnh.

Chạy kiểm tra generator bằng `npm run test:seo`. Workflow deploy cũng chạy bộ kiểm tra này.
Liên kết “Mở bài hát trong ứng dụng” dùng `?song=<id>` để mở lời bài hát tương ứng.

Sau khi deploy, gửi sitemap
`https://anddoanf.github.io/App-Worship-songs-collection/sitemap.xml`
trong Google Search Console và kiểm tra URL trang chủ cùng một trang bài hát.
File `robots.txt` ở gốc domain thuộc repository khác; có thể thêm dòng `Sitemap` trỏ đến URL này
ở đó nếu bạn quản lý domain. Sitemap trong repository này không thay thế robots ở gốc domain.

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
