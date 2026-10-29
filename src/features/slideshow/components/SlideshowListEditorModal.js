import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowDown, FiArrowUp, FiCopy, FiEdit3, FiSave, FiTrash2, FiXCircle } from 'react-icons/fi';
import { parseSongCodes } from '../../../utils/slideshow';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';
import { notifyToast } from '../../../utils/songToasts';
import { inferKey, isKey, KEY_OPTIONS } from '../../../utils/chords';
import { normalizeSetDetails } from '../../../store/slideshowStore';
import { useModalFocus } from '../../../utils/useModalFocus';

function metadataValue(value, fallback = 'Chưa có') {
  const text = String(value || '').trim();
  return !text || /^(Không rõ|unknown|n\/a)$/i.test(text) ? fallback : text;
}

function SlideshowListEditorModal({
  trigger,
  mode,
  originalName,
  initialName,
  initialDraft,
  initialIds = [],
  songs = [],
  listSongs = [],
  initialDetails,
  onDuplicateList,
  setTrigger,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onNotify,
}) {
  const [name, setName] = useState(initialName);
  const dialogRef = useRef(null);
  useModalFocus(dialogRef, trigger);
  const [draft, setDraft] = useState(initialDraft);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState({ serviceDate: '', service: '', status: 'draft', songNotes: {}, chordPreferences: {} });
  const detailsKey = JSON.stringify(initialDetails || {});
  const initialCodes = initialDraft || initialIds.join(', ');
  const showForm = mode !== 'view' || isEditing;
  const songLookup = useMemo(() => new Map([...songs, ...listSongs].map((song) => [song.id.toUpperCase(), song])), [listSongs, songs]);
  const songIds = [...new Set(parseSongCodes(draft || ''))];

  useEffect(() => {
    if (!trigger) return;
    setName(initialName);
    setDraft(initialCodes);
    setErrorMessage('');
    setIsEditing(false);
    const initial = JSON.parse(detailsKey);
    setDetails({ ...normalizeSetDetails(initial, parseSongCodes(initialCodes)), chordPreferences: initial.chordPreferences || {} });
  }, [detailsKey, initialCodes, initialName, trigger]);

  useEffect(() => {
    if (!trigger) return undefined;
    const unlock = lockBodyScroll();
    const handleKeyDown = (event) => { if (event.key === 'Escape') setTrigger(false); };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlock();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTrigger, trigger]);

  if (!trigger) {
    return null;
  }

  const handleSave = () => {
    const result =
      mode === 'create'
        ? onCreateList({ name, draft, ...details })
        : onUpdateList({ originalName, name, draft, ...details });

    if (result.error) {
      setErrorMessage(result.error);
      notifyToast(onNotify, 'error', result.error);
      return;
    }

    notifyToast(onNotify, 'success',
      mode === 'create'
        ? `Đã tạo danh sách: ${name.trim()}`
        : `Đã lưu danh sách: ${name.trim()}`
    );
    setTrigger(false);
  };

  const handleDelete = () => {
    const result = onDeleteList(originalName);

    if (result.error) {
      setErrorMessage(result.error);
      notifyToast(onNotify, 'error', result.error);
      return;
    }

    notifyToast(onNotify, 'success', `Đã xóa danh sách: ${originalName}`);
    setTrigger(false);
  };

  return createPortal(
    <div className="popup" onClick={() => setTrigger(false)}>
      <div ref={dialogRef} tabIndex={-1} className="popup-list-editor" role="dialog" aria-modal="true" aria-labelledby="list-details-heading" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button popup-close-button-themed"
          onClick={() => setTrigger(false)}
          aria-label="Đóng trình sửa danh sách"
        >
          <FiXCircle />
        </button>
        <div className="popup-list-editor-header">
          <h2 id="list-details-heading">{showForm ? mode === 'create' ? 'Tạo bộ bài hát mới' : 'Chỉnh sửa bộ bài hát' : initialName}</h2>
          <p>{showForm ? 'Nhập tên danh sách và các mã bài hát, phân tách bằng dấu phẩy.' : `${songIds.length} bài hát trong thư mục`}</p>
        </div>
        {showForm ? <div className="popup-list-editor-form">
          <label className="popup-list-editor-field">
            <span>Tên bộ bài hát</span>
            <input
              type="text"
              className="slideshow-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chương trình Chúa nhật"
            />
          </label>
          <div className="set-details-fields">
            <label className="popup-list-editor-field"><span>Ngày nhóm</span><input className="slideshow-input" type="date" value={details.serviceDate} onChange={(event) => setDetails((current) => ({ ...current, serviceDate: event.target.value }))} /></label>
            <label className="popup-list-editor-field"><span>Buổi nhóm / ban hát</span><input className="slideshow-input" value={details.service} placeholder="Thờ phượng sáng Chúa nhật" onChange={(event) => setDetails((current) => ({ ...current, service: event.target.value }))} /></label>
            <label className="popup-list-editor-field"><span>Trạng thái</span><select className="dropdown" value={details.status} onChange={(event) => setDetails((current) => ({ ...current, status: event.target.value }))}><option value="draft">Đang chuẩn bị</option><option value="ready">Sẵn sàng trình chiếu</option></select></label>
          </div>
          <label className="popup-list-editor-field">
            <span>Mã bài hát</span>
            <textarea
              className="popup-lyric-editor popup-list-editor-textarea"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="T12, H122, TCX001"
              spellCheck="false"
            />
          </label>
        </div> : <p className="set-service-summary">{[details.serviceDate, details.service, details.status === 'ready' ? 'Sẵn sàng trình chiếu' : 'Đang chuẩn bị'].filter(Boolean).join(' · ')}</p>}
        {songIds.length ? (
          <div className="folder-songs-table-wrapper">
            <table className="folder-songs-table" aria-label="Bài hát trong thư mục">
              <thead><tr><th scope="col">Bài hát / ghi chú</th><th scope="col">Tone</th><th scope="col">Nhịp</th>{showForm ? <th scope="col">Thứ tự</th> : null}</tr></thead>
              <tbody>{songIds.map((id, index) => {
                const song = songLookup.get(id);
                const original = songs.find((item) => item.id.toUpperCase() === id) || song;
                const sourceKey = details.chordPreferences[id]?.sourceKey || inferKey(original?.lyric, original?.tone);
                const targetKey = details.chordPreferences[id]?.targetKey || (isKey(song?.tone) ? song.tone : sourceKey);
                const move = (offset) => {
                  const reordered = [...songIds];
                  [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
                  setDraft(reordered.join(', '));
                };
                return <tr key={id}>
                  <td><strong>{song?.songName || 'Không tìm thấy bài hát'}</strong><small>{id}</small>
                    {showForm ? <input className="set-note-input" aria-label={`Ghi chú ${id}`} placeholder="Câu hát, phối khí, chuyển bài…" value={details.songNotes[id] || ''}
                      onChange={(event) => setDetails((current) => ({ ...current, songNotes: { ...current.songNotes, [id]: event.target.value } }))} />
                      : details.songNotes[id] ? <p className="set-song-note">{details.songNotes[id]}</p> : null}
                  </td>
                  <td>{showForm ? <select className="dropdown set-key-select" aria-label={`Tone ${id}`} value={targetKey || ''} disabled={!sourceKey}
                    onChange={(event) => setDetails((current) => ({ ...current, chordPreferences: { ...current.chordPreferences, [id]: { ...current.chordPreferences[id], sourceKey, targetKey: event.target.value } } }))}>
                    <option value="" disabled>—</option>{KEY_OPTIONS.filter((key) => key.endsWith('m') === sourceKey.endsWith('m')).map((key) => <option key={key}>{key}</option>)}
                  </select> : metadataValue(targetKey, '—')}</td>
                  <td>{metadataValue(song?.timeSignature)}</td>
                  {showForm ? <td><div className="set-reorder-actions"><button type="button" className="button-mode" aria-label={`Đưa ${id} lên`} disabled={index === 0} onClick={() => move(-1)}><FiArrowUp /></button><button type="button" className="button-mode" aria-label={`Đưa ${id} xuống`} disabled={index === songIds.length - 1} onClick={() => move(1)}><FiArrowDown /></button></div></td> : null}
                </tr>;
              })}</tbody>
            </table>
          </div>
        ) : !showForm ? <p>Thư mục chưa có bài hát. Chọn chỉnh sửa để thêm mã bài hát.</p> : null}
        {errorMessage ? <p className="slideshow-error">{errorMessage}</p> : null}
        <div className="popup-list-editor-actions">
          {!showForm && onDuplicateList ? <button className="button-mode" type="button" onClick={() => {
            const result = onDuplicateList(originalName);
            if (result?.error) { notifyToast(onNotify, 'error', result.error); return; }
            notifyToast(onNotify, 'success', 'Đã tạo bản sao bộ bài hát'); setTrigger(false);
          }}><FiCopy aria-hidden="true" /> Nhân bản bộ</button> : null}
          {showForm && mode !== 'create' ? (
            <button
              type="button"
              className="button-mode slideshow-list-editor-delete"
              onClick={handleDelete}
            >
              <FiTrash2 aria-hidden="true" className="pr-2" />
              <span>Xóa</span>
            </button>
          ) : null}
          {showForm ? <button type="button" className="button-mode" onClick={handleSave}>
            <FiSave aria-hidden="true" className="pr-2" />
            <span>Lưu</span>
          </button> : <button type="button" className="button-mode" onClick={() => setIsEditing(true)}>
            <FiEdit3 aria-hidden="true" className="pr-2" />Chỉnh sửa bộ bài hát
          </button>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SlideshowListEditorModal;
