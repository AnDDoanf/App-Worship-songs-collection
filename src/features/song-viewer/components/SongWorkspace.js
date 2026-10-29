import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { createRecommendationIndex, recommendSongs } from '../../recommendations/recommendationEngine';
import ChordLyrics from './ChordLyrics';
import SheetPages from './SheetPages';

const VIEW_KEY = 'song-reader-view';
const VIEWS = ['lyrics', 'chords', 'sheet'];
function preferredView() {
  try { const view = localStorage.getItem(VIEW_KEY); return VIEWS.includes(view) ? view : 'chords'; } catch { return 'chords'; }
}

export default function SongWorkspace({ lyric, tone, trigger, setTrigger, songId = '', songName, image, category, collection,
  timeSignature, tempo, initialView, onNotify, onAdd, onPrevious, onNext, onNavigate, librarySongs = [] }) {
  const initialLyric = normalizeLyricText(lyric);
  const [draft, setDraft] = useState(initialLyric);
  const [sourceKey, setSourceKey] = useState('');
  const [targetKey, setTargetKey] = useState('');
  const [view, setView] = useState(preferredView);
  const [editing, setEditing] = useState(false);
  const [reading, setReading] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const readerId = useId();
  useSheetViewport(overlayRef, trigger);
  useModalFocus(dialogRef, trigger);
  const displayed = transposeLyrics(draft, sourceKey, targetKey);
  const originalKey = inferKey(initialLyric, tone);
  const relatedIndex = useMemo(() => trigger && relatedOpen ? createRecommendationIndex(librarySongs) : null, [librarySongs, relatedOpen, trigger]);
  const related = useMemo(() => recommendSongs(relatedIndex, [{ id: songId, tone: targetKey }]), [relatedIndex, songId, targetKey]);

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

  useEffect(() => {
    if (!trigger) return undefined;
    const unlock = lockBodyScroll();
    const keydown = (event) => { if (event.key === 'Escape' && !document.fullscreenElement) setTrigger(false); };
    const fullscreen = () => { if (!document.fullscreenElement) setReading(false); };
    window.addEventListener('keydown', keydown);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => { unlock(); window.removeEventListener('keydown', keydown); document.removeEventListener('fullscreenchange', fullscreen); };
  }, [setTrigger, trigger]);

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
  const known = (value) => value && value !== 'Không rõ';
  const englishNavigation = document.documentElement.lang.toLowerCase().startsWith('en');

  return createPortal(<div ref={overlayRef} className="popup workspace-overlay" onClick={close}>
    <div ref={dialogRef} tabIndex={-1} className={`popup-lyric popup-lyric-dialog workspace-dialog ${view === 'sheet' ? 'workspace-sheet-mode' : ''} ${reading ? 'workspace-reading' : ''}`} role="dialog" aria-modal="true" aria-label="Lời bài hát" onClick={(event) => event.stopPropagation()}>
      {!reading ? <button type="button" className="popup-close-button" onClick={close} aria-label="Đóng phần lời bài hát"><FiXCircle /></button> : null}
      <header className="workspace-song-header">
        <h2>{songName || songId}</h2><p>{[songId, collection].filter(Boolean).join(' · ')}</p>
        <div className="song-metadata-chips"><span>Tông gốc <b data-testid="popup-original-key">{originalKey || 'Chưa có'}</b></span>{known(timeSignature) ? <span>Nhịp {timeSignature}</span> : null}{known(tempo) ? <span>Tempo {tempo}</span> : null}{known(category) ? <span>{category}</span> : null}</div>
      </header>
      <div className="workspace-reader-bar">
        <div className="workspace-view-modes" role="tablist" aria-label="Chế độ đọc">
          {VIEWS.map((mode) => <button key={mode} type="button" role="tab" id={`${readerId}-${mode}`} aria-selected={view === mode} aria-controls={`${readerId}-panel`} tabIndex={view === mode ? 0 : -1} onClick={() => chooseView(mode)} onKeyDown={(event) => handleTabKeyDown(event, mode)}><span aria-hidden="true">{({ lyrics: <FiAlignLeft />, chords: <FiMusic />, sheet: <FiFileText /> })[mode]}</span>{({ lyrics: 'Lời bài hát', chords: 'Hợp âm', sheet: 'Bản nhạc' })[mode]}</button>)}
        </div>
      </div>
      <div role="tabpanel" id={`${readerId}-panel`} aria-labelledby={`${readerId}-${view}`} tabIndex={0} className={`popup-lyric-body workspace-reader-content ${view === 'sheet' ? 'workspace-reader-sheet' : ''}`}>
        <div className="workspace-content-expand"><ActionIconButton label={reading ? 'Thu gọn' : 'Toàn màn hình'} icon={reading ? <FiMinimize /> : <FiMaximize />} onClick={fullscreen} pressed={reading} /></div>
        {view === 'sheet' ? <SheetPages image={image} songName={songName} /> : editing ? <div className="workspace-local-editor"><p>Bản chỉnh sửa chỉ lưu trên thiết bị này; lời gốc trong thư viện được giữ nguyên.</p><textarea className="popup-lyric-editor" aria-label="Lời và hợp âm" value={displayed} onChange={(event) => { setDraft(event.target.value); setSourceKey(targetKey); persist(targetKey, targetKey, event.target.value); }} spellCheck="false" /></div> : <ChordLyrics lyric={displayed} showChords={view === 'chords'} />}
      {view !== 'sheet' ? <div className="workspace-musician-tools">
        {view === 'chords' ? <label><select className="dropdown" aria-label="Chuyển sang tông" value={targetKey} disabled={!sourceKey} onChange={(event) => { setTargetKey(event.target.value); persist(sourceKey, event.target.value); }}><option value={originalKey}>{englishNavigation ? 'Origin' : 'Gốc'} ({originalKey || 'Tone'})</option>{KEY_OPTIONS.filter((key) => key !== originalKey && key.endsWith('m') === sourceKey.endsWith('m')).map((key) => <option key={key}>{key}</option>)}</select></label> : null}
        <ActionIconButton label="Sửa lời" icon={<FiEdit3 />} pressed={editing} onClick={() => setEditing(!editing)} />
        <ActionIconButton label="Khôi phục bản gốc" icon={<FiRefreshCw />} onClick={reset} />
        <ActionIconButton label="Sao chép lời" icon={<FiClipboard />} onClick={copy} />
        {onAdd ? <ActionIconButton label="Thêm vào bộ" icon={<FiPlus />} onClick={onAdd} /> : null}
      </div> : null}
      {onNavigate && librarySongs.length && !reading ? <details className="workspace-related" onToggle={(event) => setRelatedOpen(event.currentTarget.open)}><summary>Bài hát tương tự</summary>
        {related.length ? <ul>{related.map((item) => <li key={item.song.id}><button className="workspace-text-button" type="button" onClick={() => onNavigate(item.song.id)}>{item.song.songName} <small>{item.reasons.join(' · ')}</small></button></li>)}</ul> : <p>Chưa đủ dữ liệu để gợi ý bài tương tự.</p>}
      </details> : null}
      {(onPrevious || onNext) ? <nav className="workspace-song-navigation" aria-label={englishNavigation ? 'Song navigation' : 'Chuyển bài hát'}><button type="button" aria-label={englishNavigation ? 'Previous song' : 'Bài trước'} disabled={!onPrevious} onClick={onPrevious}><FiChevronLeft aria-hidden="true" />{englishNavigation ? 'Prev' : 'Trước'}</button><span>{songId}</span><button type="button" aria-label={englishNavigation ? 'Next song' : 'Bài tiếp'} disabled={!onNext} onClick={onNext}>{englishNavigation ? 'Next' : 'Sau'}<FiChevronRight aria-hidden="true" /></button></nav> : null}
      </div>
    </div>
  </div>, document.body);
}
