import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAlignLeft, FiChevronLeft, FiChevronRight, FiClipboard, FiEdit3, FiFileText, FiMaximize, FiMinimize, FiMusic, FiPlus, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import ActionIconButton from '../../../components/common/ActionIconButton';
import { normalizeLyricText } from '../../../services/songLibrary';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { hideChords, inferKey, KEY_OPTIONS, transposeLyrics } from '../../../utils/chords';
import { readChordPreferences, saveChordPreference } from '../../../store/chordPreferences';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';
import { useSheetViewport } from '../../../utils/useSheetViewport';
import { useModalFocus } from '../../../utils/useModalFocus';
import { notifyToast } from '../../../utils/songToasts';
import { parseSheetImageSources } from '../lib/sheetImages';
import ChordLyrics from './ChordLyrics';
import SheetPages from './SheetPages';

const VIEW_KEY = 'song-reader-view';
const VIEWS = ['lyrics', 'chords', 'sheet'];
function preferredView() {
  try { const view = localStorage.getItem(VIEW_KEY); return VIEWS.includes(view) ? view : 'chords'; } catch { return 'chords'; }
}

export default function SongWorkspace({ lyric, tone, trigger, setTrigger, songId = '', songName, image, category, collection,
  timeSignature, tempo, initialView, onNotify, onAdd, onPrevious, onNext, pairedSheetSong, isSetView = false }) {
  const initialLyric = normalizeLyricText(lyric);
  const [draft, setDraft] = useState(initialLyric);
  const [sourceKey, setSourceKey] = useState('');
  const [targetKey, setTargetKey] = useState('');
  const [view, setView] = useState(preferredView);
  const [editing, setEditing] = useState(false);
  const [reading, setReading] = useState(false);
  const [readerZoom, setReaderZoom] = useState(1);
  const [sheetPage, setSheetPage] = useState(0);
  const [narrowSheetView, setNarrowSheetView] = useState(() => window.matchMedia?.('(max-width: 560px)').matches ?? window.innerWidth <= 560);
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const gestureZoomStart = useRef(1);
  const readerId = useId();
  useSheetViewport(overlayRef, trigger);
  useModalFocus(dialogRef, trigger);
  const displayed = transposeLyrics(draft, sourceKey, targetKey);
  const originalKey = inferKey(initialLyric, tone);
  const pairedOriginalKey = pairedSheetSong
    ? inferKey(normalizeLyricText(pairedSheetSong.lyric), pairedSheetSong.tone)
    : '';
  const sheetPageCount = parseSheetImageSources(image).length;
  const canNavigateSheetPages = view === 'sheet' && sheetPageCount > 1 && (sheetPageCount !== 2 || narrowSheetView);

  useEffect(() => {
    if (!trigger) return;
    const saved = readChordPreferences()[songId.toUpperCase()];
    setDraft(saved?.lyric ?? initialLyric);
    setSourceKey(saved?.sourceKey || originalKey);
    setTargetKey(saved?.targetKey || originalKey);
    setEditing(false);
  }, [initialLyric, originalKey, songId, trigger]);

  useEffect(() => {
    if (trigger) setView(VIEWS.includes(initialView) ? initialView : preferredView());
  }, [initialView, trigger]);

  useEffect(() => setSheetPage(0), [image, songId]);

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 560px)');
    const update = () => setNarrowSheetView(media ? media.matches : window.innerWidth <= 560);
    update();
    media?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      media?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (!trigger) return undefined;
    const unlock = lockBodyScroll();
    const keydown = (event) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setTrigger(false);
      if (event.defaultPrevented || view === 'sheet') return;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(event.target.tagName) || event.target.isContentEditable) return;
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    const fullscreen = () => { if (!document.fullscreenElement) setReading(false); };
    window.addEventListener('keydown', keydown);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => { unlock(); window.removeEventListener('keydown', keydown); document.removeEventListener('fullscreenchange', fullscreen); };
  }, [onNext, onPrevious, setTrigger, trigger, view]);

  if (!trigger) return null;
  const chooseView = (next) => { setView(next); setEditing(false); try { localStorage.setItem(VIEW_KEY, next); } catch {} };
  const handleTabKeyDown = (event, mode) => {
    const index = VIEWS.indexOf(mode);
    const nextIndex = ({ ArrowRight: (index + 1) % VIEWS.length, ArrowLeft: (index + VIEWS.length - 1) % VIEWS.length, Home: 0, End: VIEWS.length - 1 })[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    chooseView(VIEWS[nextIndex]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
  };
  const persist = (nextSource, nextTarget, text = draft) => {
    if (!saveChordPreference(songId, { sourceKey: nextSource, targetKey: nextTarget, ...(text !== initialLyric ? { lyric: text } : {}) })) {
      notifyToast(onNotify, 'error', 'Không thể lưu bản chỉnh sửa trên thiết bị này.');
    }
  };
  const reset = () => { setDraft(initialLyric); setSourceKey(originalKey); setTargetKey(originalKey); saveChordPreference(songId, null); };
  const copy = async () => {
    try {
      if (!displayed.trim()) { notifyToast(onNotify, 'warning', 'Chưa có lời để sao chép.'); return; }
      await copyTextToClipboard(view === 'lyrics' ? hideChords(displayed) : displayed);
      notifyToast(onNotify, 'success', `Đã sao chép nội dung của ${songId}`);
    } catch { notifyToast(onNotify, 'error', 'Không thể sao chép nội dung.'); }
  };
  const close = () => { if (document.fullscreenElement === dialogRef.current) document.exitFullscreen?.().catch(() => {}); setReading(false); setTrigger(false); };
  const fullscreen = () => {
    if (reading) { document.exitFullscreen?.().catch(() => {}); setReading(false); }
    else { setReading(true); dialogRef.current?.requestFullscreen?.().catch(() => {}); }
  };
  const handleReaderZoom = (event) => {
    if (!reading || !event.ctrlKey) return;
    event.preventDefault();
    setReaderZoom((zoom) => Math.max(1, Math.min(2.5, zoom + (event.deltaY < 0 ? 0.1 : -0.1))));
  };
  const handleGestureStart = (event) => {
    if (!reading) return;
    event.preventDefault();
    gestureZoomStart.current = readerZoom;
  };
  const handleGestureChange = (event) => {
    if (!reading) return;
    event.preventDefault();
    setReaderZoom(Math.max(1, Math.min(2.5, gestureZoomStart.current * event.scale)));
  };
  const navigatePrevious = () => {
    if (canNavigateSheetPages && sheetPage > 0) setSheetPage(sheetPage - 1);
    else onPrevious?.();
  };
  const navigateNext = () => {
    if (canNavigateSheetPages && sheetPage < sheetPageCount - 1) setSheetPage(sheetPage + 1);
    else onNext?.();
  };
  const known = (value) => value && value !== 'Không rõ';
  const englishNavigation = document.documentElement.lang.toLowerCase().startsWith('en');

  return createPortal(<div ref={overlayRef} className="popup workspace-overlay" onClick={close}>
    <div ref={dialogRef} tabIndex={-1} className={`popup-lyric popup-lyric-dialog workspace-dialog ${view === 'sheet' ? 'workspace-sheet-mode' : ''} ${reading ? 'workspace-reading' : ''} ${isSetView ? 'workspace-set-view' : ''}`} role="dialog" aria-modal="true" aria-label="Lời bài hát" onClick={(event) => event.stopPropagation()} onWheel={handleReaderZoom} onGestureStart={handleGestureStart} onGestureChange={handleGestureChange}>
      {!reading ? <button type="button" className="popup-close-button" onClick={close} aria-label="Đóng phần lời bài hát"><FiXCircle /></button> : null}
      <header className="workspace-song-header">
        <h2>{songName || songId}{pairedSheetSong ? ` · ${pairedSheetSong.songName || pairedSheetSong.id}` : ''}</h2>
        <div className="song-metadata-chips"><span className="workspace-key-chip" data-label="Tông gốc"><b data-testid="popup-original-key">{originalKey || 'Chưa có'}</b></span>{known(timeSignature) ? <span className="workspace-time-chip" data-label="Nhịp">{timeSignature}</span> : null}{pairedSheetSong ? <><span className="workspace-key-chip" data-label="Tông gốc"><b>{pairedOriginalKey || 'Chưa có'}</b></span>{known(pairedSheetSong.timeSignature) ? <span className="workspace-time-chip" data-label="Nhịp">{pairedSheetSong.timeSignature}</span> : null}</> : null}{known(tempo) ? <span className="workspace-tempo-chip">Tempo {tempo}</span> : null}{!isSetView && known(category) ? <span className="workspace-subject-chip">{category}</span> : null}</div>
      </header>
      <div className="workspace-reader-bar">
        <div className="workspace-view-modes" role="tablist" aria-label="Chế độ đọc">
          {VIEWS.map((mode) => <button key={mode} type="button" role="tab" id={`${readerId}-${mode}`} aria-selected={view === mode} aria-controls={`${readerId}-panel`} tabIndex={view === mode ? 0 : -1} onClick={() => chooseView(mode)} onKeyDown={(event) => handleTabKeyDown(event, mode)}><span aria-hidden="true">{({ lyrics: <FiAlignLeft />, chords: <FiMusic />, sheet: <FiFileText /> })[mode]}</span>{({ lyrics: 'Lời bài hát', chords: 'Hợp âm', sheet: 'Bản nhạc' })[mode]}</button>)}
        </div>
      </div>
      <div className="workspace-content-expand"><ActionIconButton label={reading ? 'Thu gọn' : 'Toàn màn hình'} icon={reading ? <FiMinimize /> : <FiMaximize />} onClick={fullscreen} pressed={reading} /></div>
      <div role="tabpanel" id={`${readerId}-panel`} aria-labelledby={`${readerId}-${view}`} tabIndex={0} className={`popup-lyric-body workspace-reader-content ${view === 'sheet' ? 'workspace-reader-sheet' : ''}`} style={{ zoom: reading ? readerZoom : 1 }}>
        {view === 'sheet' ? <SheetPages image={image} songName={songName} pairedSong={pairedSheetSong} page={sheetPage} onPageChange={setSheetPage} allowPageNavigation={canNavigateSheetPages} onPreviousSong={onPrevious} onNextSong={onNext} /> : editing ? <div className="workspace-local-editor"><p>Bản chỉnh sửa chỉ lưu trên thiết bị này; lời gốc trong thư viện được giữ nguyên.</p><textarea className="popup-lyric-editor" aria-label="Lời và hợp âm" value={displayed} onChange={(event) => { setDraft(event.target.value); setSourceKey(targetKey); persist(targetKey, targetKey, event.target.value); }} spellCheck="false" /></div> : <ChordLyrics lyric={displayed} showChords={view === 'chords'} />}
      {view !== 'sheet' ? <div className="workspace-musician-tools">
        {view === 'chords' ? <label><select className="dropdown" aria-label="Chuyển sang tông" value={targetKey} disabled={!sourceKey} onChange={(event) => { setTargetKey(event.target.value); persist(sourceKey, event.target.value); }}><option value={originalKey}>{englishNavigation ? 'Origin' : 'Gốc'} ({originalKey || 'Tone'})</option>{KEY_OPTIONS.filter((key) => key !== originalKey && key.endsWith('m') === sourceKey.endsWith('m')).map((key) => <option key={key}>{key}</option>)}</select></label> : null}
        <ActionIconButton label="Sửa lời" icon={<FiEdit3 />} pressed={editing} onClick={() => setEditing(!editing)} />
        <ActionIconButton label="Khôi phục bản gốc" icon={<FiRefreshCw />} onClick={reset} />
        <ActionIconButton label="Sao chép lời" icon={<FiClipboard />} onClick={copy} />
        {onAdd ? <ActionIconButton label="Thêm vào bộ" icon={<FiPlus />} onClick={onAdd} /> : null}
      </div> : null}
      </div>
      {(onPrevious || onNext) && !reading ? <footer className="workspace-navigation-footer"><nav className="workspace-song-navigation" aria-label={englishNavigation ? 'Song navigation' : 'Chuyển bài hát'}><button type="button" aria-label={canNavigateSheetPages && sheetPage > 0 ? 'Previous sheet page' : englishNavigation ? 'Previous song' : 'Bài trước'} disabled={canNavigateSheetPages && sheetPage > 0 ? false : !onPrevious} onClick={navigatePrevious}><FiChevronLeft aria-hidden="true" />{englishNavigation ? 'Prev' : 'Trước'}</button><span>{songId}</span><button type="button" aria-label={canNavigateSheetPages && sheetPage < sheetPageCount - 1 ? 'Next sheet page' : englishNavigation ? 'Next song' : 'Bài tiếp'} disabled={canNavigateSheetPages && sheetPage < sheetPageCount - 1 ? false : !onNext} onClick={navigateNext}>{englishNavigation ? 'Next' : 'Sau'}<FiChevronRight aria-hidden="true" /></button></nav></footer> : null}
    </div>
  </div>, document.body);
}
