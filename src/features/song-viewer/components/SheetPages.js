import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { parseSheetImageSources } from '../lib/sheetImages';

export default function SheetPages({ image, songName }) {
  const images = parseSheetImageSources(image);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [image]);
  useEffect(() => {
    const handleKey = (event) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight') setPage((value) => Math.min(value + 1, images.length - 1));
      if (event.key === 'ArrowLeft') setPage((value) => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length]);
  if (!images.length) return <p>Chưa có bản nhạc cho bài hát này.</p>;
  return <div className="workspace-sheet" data-dual={images.length === 2}>
    {images.length === 2 ? <div className="workspace-sheet-pair">{images.map((source, i) => <img key={source.id} src={source.src} alt={`${songName || 'Bản nhạc'} — trang ${i + 1}`} />)}</div> : null}
    <div className="workspace-sheet-single">
      <div className="workspace-sheet-image"><img src={images[page]?.src} alt={`${songName || 'Bản nhạc'} — trang ${page + 1}`} /></div>
      {images.length > 1 ? <div className="workspace-page-controls">
        <button type="button" className="button-mode" aria-label="Trang nhạc trước" disabled={page === 0} onClick={() => setPage(page - 1)}><FiChevronLeft /></button>
        <span>Trang {page + 1} / {images.length}</span>
        <button type="button" className="button-mode" aria-label="Trang nhạc tiếp theo" disabled={page === images.length - 1} onClick={() => setPage(page + 1)}><FiChevronRight /></button>
      </div> : null}
    </div>
    <small className="workspace-sheet-help">Chụm hai ngón tay để phóng to · Chọn chế độ toàn màn hình để đọc bản nhạc.</small>
  </div>;
}
