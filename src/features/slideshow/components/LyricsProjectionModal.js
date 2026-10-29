import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiMaximize, FiXCircle } from 'react-icons/fi';
import { buildLyricSlides } from '../lib/lyricSlides';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';
import { useSheetViewport } from '../../../utils/useSheetViewport';
import { useModalFocus } from '../../../utils/useModalFocus';

export default function LyricsProjectionModal({ songs, trigger, setTrigger }) {
  const slides = useMemo(() => buildLyricSlides(songs), [songs]);
  const [index, setIndex] = useState(0);
  const [blank, setBlank] = useState(false);
  const [operator, setOperator] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const overlayRef = useRef(null);
  const stageRef = useRef(null);
  useSheetViewport(overlayRef, trigger);
  useModalFocus(stageRef, trigger);
  useEffect(() => { if (trigger) { setIndex(0); setBlank(false); setControlsVisible(true); } }, [trigger]);
  useEffect(() => { if (trigger && !controlsVisible) stageRef.current?.focus(); }, [controlsVisible, trigger]);
  useEffect(() => {
    if (!trigger) return undefined;
    const unlock = lockBodyScroll();
    const keydown = (event) => {
      if (event.key === 'Escape') { setTrigger(false); return; }
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) || (event.target.tagName === 'BUTTON' && event.key === ' ')) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); setIndex((value) => Math.min(slides.length - 1, value + 1)); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); setIndex((value) => Math.max(0, value - 1)); }
      if (['b', 'B', '.'].includes(event.key)) setBlank((value) => !value);
      if (['h', 'H'].includes(event.key)) setControlsVisible((value) => !value);
    };
    window.addEventListener('keydown', keydown);
    return () => { unlock(); window.removeEventListener('keydown', keydown); };
  }, [setTrigger, slides.length, trigger]);
  if (!trigger) return null;
  const current = slides[Math.max(0, index)];
  const next = slides[index + 1];
  const missing = songs.filter((song) => !slides.some((slide) => slide.songId === song.id));
  const close = () => {
    if (document.fullscreenElement === stageRef.current) document.exitFullscreen?.().catch(() => {});
    setTrigger(false);
  };
  return createPortal(<div ref={overlayRef} className="popup projection-overlay">
    <div ref={stageRef} tabIndex={-1} className={`lyrics-projection ${operator ? 'operator-view' : ''}`} role="dialog" aria-modal="true" aria-label="Trình chiếu lời bài hát">
      {controlsVisible ? <header className="projection-header">
        <div><strong>Trình chiếu lời</strong><small>{current ? `${current.songId} · ${current.songName} · ${current.part}/${current.total}` : 'Chưa có lời để trình chiếu'}</small></div>
        <button type="button" onClick={() => stageRef.current?.requestFullscreen?.().catch(() => {})}><FiMaximize /> Toàn màn hình</button>
        <button type="button" aria-label="Đóng trình chiếu lời" onClick={close}><FiXCircle /></button>
      </header> : null}
      <div className="projection-stage-layout">
        <section className="projection-audience" aria-label={blank ? 'Màn hình đen' : 'Trang chiếu hiện tại'}>
          {!blank && current ? current.lines.map((line, i) => <p key={i}>{line}</p>) : null}
          {!current && !blank ? <p>Chưa có lời bài hát để trình chiếu.</p> : null}
        </section>
        {operator && controlsVisible ? <aside className="projection-next"><h3>Trang chiếu tiếp theo</h3>{next ? <><small>{next.songName}</small>{next.lines.map((line, i) => <p key={i}>{line}</p>)}</> : <p>Hết bộ bài hát.</p>}{current?.note ? <div className="projection-note"><h3>Ghi chú cho ban hát</h3><p>{current.note}</p></div> : null}</aside> : null}
      </div>
      {controlsVisible ? <footer className="projection-controls">
        <button type="button" aria-label="Trang lời trước" disabled={index <= 0} onClick={() => setIndex(index - 1)}><FiChevronLeft /></button>
        <span>{slides.length ? index + 1 : 0} / {slides.length}</span>
        <button type="button" aria-label="Trang lời tiếp theo" disabled={index >= slides.length - 1} onClick={() => setIndex(index + 1)}><FiChevronRight /></button>
        <select aria-label="Chuyển bài đang trình chiếu" value={current?.songId || ''} onChange={(event) => setIndex(slides.findIndex((slide) => slide.songId === event.target.value))}>
          {!slides.length ? <option value="">Chưa có lời</option> : [...new Map(slides.map((slide) => [slide.songId, slide.songName]))].map(([id, name]) => <option key={id} value={id}>{id}. {name}</option>)}
        </select>
        <button type="button" aria-pressed={blank} onClick={() => setBlank(!blank)}>Màn hình đen <kbd>B</kbd></button>
        <button type="button" aria-pressed={operator} onClick={() => setOperator(!operator)}>Góc nhìn điều khiển</button>
        <button type="button" onClick={() => setControlsVisible(false)}>Ẩn điều khiển <kbd>H</kbd></button>
        <small className="projection-shortcuts">← → hoặc phím cách: chuyển trang · B: màn hình đen · H: hiện/ẩn điều khiển · Esc: đóng</small>
        {missing.length ? <small>{missing.length} bài chưa có lời: {missing.map((song) => song.id).join(', ')}</small> : null}
      </footer> : <button type="button" className="projection-show-controls" onClick={() => setControlsVisible(true)}>Hiện điều khiển · H</button>}
    </div>
  </div>, document.body);
}
