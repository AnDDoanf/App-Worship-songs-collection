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
- Bấm tên thư mục để xem tên bài hát, tông đã lưu và nhịp; chọn chỉnh sửa để sửa tên hoặc mã bài.

## Không gian tra cứu và chuẩn bị thờ phượng

- Ô tìm kiếm chính hỗ trợ tên, mã bài, lời và tên gọi khác (`aliases` trong workbook), có thể nhập không dấu. Bắt đầu tìm kiếm sẽ tra trên mọi tuyển tập; có thể giới hạn lại bằng nút tuyển tập hoặc chủ đề.
- Bấm tên bài hoặc nút lời/bản nhạc để mở cùng một không gian đọc: **Lời bài hát**, **Hợp âm**, **Bản nhạc**. Hợp âm nằm trên lời; chế độ đọc được giữ khi chuyển bài. Chỉnh sửa và đổi tông ở đây chỉ lưu trên thiết bị.
- Trong bộ bài hát, chọn **Chỉnh sửa bộ bài hát** để đặt ngày, buổi nhóm, trạng thái, ghi chú từng bài, tông sử dụng và thứ tự. Tông riêng của bộ không thay đổi tông gốc trong thư viện.
- **Nhân bản bộ** giữ nguyên bài hát, thứ tự, ghi chú và bản phối để chuẩn bị buổi nhóm tiếp theo.
- **Sao lưu** tải toàn bộ bộ bài hát thành file JSON. **Khôi phục** thêm các bộ từ file, tự đổi tên khi trùng và giữ nguyên dữ liệu hiện có. Chưa có đồng bộ tài khoản hay chỉnh sửa chung giữa các thiết bị.
- **Lời và hợp âm** dành cho ban hát; **Chiếu lời** là chế độ riêng cho hội chúng, không hiển thị hợp âm. Chuyển trang bằng phím mũi tên hoặc phím cách, **B** để bật/tắt Màn hình trống, **H** để hiện/ẩn điều khiển, **Esc** để đóng. Góc nhìn điều khiển có trang tiếp theo và ghi chú của ban hát.
- Nội dung chưa có lời không được tự tạo lời thay thế khi trình chiếu. Hãy kiểm tra bản phối và các trang chiếu trước buổi nhóm.

## Gợi ý bài hát

Bảng bộ bài hát hiển thị cột **Nhịp** từ `timeSignature`, ví dụ `4/4`, `2/4` hoặc `6/8`.
Nút dấu cộng trên thẻ bài hát mở danh sách bộ để chọn nơi thêm; có thể tạo bộ mới ngay tại đó.
Ô tìm kiếm hoạt động trực tiếp khi gõ và đi kèm các thẻ chủ đề, không có nút tìm hoặc bộ chọn danh sách đích.

Khung **Gợi ý bài hát** dưới thư mục bản nhạc mặc định thu gọn; bấm tiêu đề để mở hoặc đóng.
Lựa chọn được giữ nguyên khi đóng/mở. Khung có hai chế độ:

- **Theo bộ bài hát**: chọn bộ làm cơ sở; gợi ý cập nhật khi thêm hoặc sửa các bài trong bộ.
- **Bài tương tự**: tìm tên hoặc mã bài (có thể nhập không dấu), chọn bài để nhận gợi ý.

Mỗi gợi ý có lý do, nút xem trước và nút mở bộ chọn nơi thêm bài. Bài đã có trong bộ làm cơ sở
được loại ra. Khi chưa đủ dữ liệu, ứng dụng hiển thị trạng thái trống thay vì chọn bài ngẫu nhiên.

Engine chạy trong trình duyệt, không gửi lịch sử sử dụng ra ngoài. Nó dùng weighted KNN chính xác:
cosine trên TF-IDF của tên/lời (50%), chủ đề (25%), khoảng cách tone theo vòng quãng năm (20%)
và nhịp (5%). Các trọng số được chuẩn hóa lại khi thiếu dữ liệu; hợp âm không được tính là lời.
K = 24 cho mỗi bài làm gốc, hiển thị tối đa 4 kết quả. Chế độ danh sách kết hợp các láng giềng và
giảm nhẹ điểm các gợi ý quá giống nhau. Tone đã đổi trong danh sách được dùng khi so sánh.

Đây là gợi ý theo nội dung, chưa có tempo hoặc vai trò trong buổi nhóm; không đảm bảo hai bài sẽ
chuyển tiếp âm nhạc phù hợp. Có thể điều chỉnh trọng số trong
`src/features/recommendations/recommendationEngine.js` sau khi nghe thử các đề xuất.

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
