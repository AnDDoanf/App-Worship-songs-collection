import { useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { parseSheetImageSources } from '../lib/sheetImages';

import ThemeSheet from './ThemeSheet';

export default function SheetPages({ image, songName, pairedSong, page, onPageChange, allowPageNavigation, onPreviousSong, onNextSong }) {
  const images = parseSheetImageSources(image);
  const pairedImages = parseSheetImageSources(pairedSong?.image);
  const pairItems = images.length === 2
    ? images.map((source, index) => ({ source, label: `${songName || 'Sheet'} page ${index + 1}` }))
    : images.length === 1 && pairedImages.length === 1
      ? [
          { source: images[0], label: songName || 'Sheet' },
          { source: pairedImages[0], label: pairedSong?.songName || pairedSong?.id || 'Sheet' },
        ]
      : null;
  useEffect(() => {
    const handleKey = (event) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight') {
        if (allowPageNavigation && page < images.length - 1) onPageChange(page + 1);
        else onNextSong?.();
      }
      if (event.key === 'ArrowLeft') {
        if (allowPageNavigation && page > 0) onPageChange(page - 1);
        else onPreviousSong?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [allowPageNavigation, images.length, onNextSong, onPageChange, onPreviousSong, page]);
  if (!images.length) return <p>Chưa có bản nhạc cho bài hát này.</p>;
  return <div className="workspace-sheet" data-dual={Boolean(pairItems)}>
    {pairItems ? <div className="workspace-sheet-pair">{pairItems.map(({ source, label }) => <ThemeSheet key={source.id} source={source.src} label={label} />)}</div> : null}
    <div className="workspace-sheet-single">
      <div className="workspace-sheet-image">
        <ThemeSheet source={images[page]?.src} label={`${songName || 'Sheet'} page ${page + 1}`} />
        {allowPageNavigation ? <div className="workspace-page-controls">
          <button type="button" className="button-mode" aria-label="Trang nhạc trước" disabled={page === 0 && !onPreviousSong} onClick={() => page > 0 ? onPageChange(page - 1) : onPreviousSong?.()}><FiChevronLeft /></button>
          <button type="button" className="button-mode" aria-label="Trang nhạc tiếp theo" disabled={page === images.length - 1 && !onNextSong} onClick={() => page < images.length - 1 ? onPageChange(page + 1) : onNextSong?.()}><FiChevronRight /></button>
        </div> : null}
      </div>
    </div>
    <small className="workspace-sheet-help">Chụm hai ngón tay để phóng to · Chọn chế độ toàn màn hình để đọc bản nhạc.</small>
  </div>;
}
