import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiPlus, FiXCircle } from 'react-icons/fi';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';
import { useModalFocus } from '../../../utils/useModalFocus';
import { notifyToast, songAddedToastOptions } from '../../../utils/songToasts';

export default function SetPickerModal({ song, lists, activeListName, onSelect, onCreate, onClose, onNotify }) {
  const ref = useRef(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useModalFocus(ref, Boolean(song));
  useEffect(() => {
    if (!song) return undefined;
    setName(''); setError('');
    const unlock = lockBodyScroll();
    const keydown = (event) => { if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); } };
    window.addEventListener('keydown', keydown, true);
    return () => { unlock(); window.removeEventListener('keydown', keydown, true); };
  }, [onClose, song]);
  if (!song) return null;
  const finish = (result, target) => {
    if (result?.error) { setError(result.error); return; }
    if (!result?.added) { setError('Bài hát đã có trong bộ này.'); return; }
    notifyToast(onNotify, 'success', `Đã thêm ${song.id} vào “${target}”`, songAddedToastOptions(result.undo));
    onClose();
  };
  return createPortal(<div className="popup" onClick={onClose}>
    <div ref={ref} tabIndex={-1} className="popup-list-editor set-picker" role="dialog" aria-modal="true" aria-labelledby="set-picker-heading" onClick={(event) => event.stopPropagation()}>
      <button className="popup-close-button" type="button" aria-label="Đóng danh sách bộ bài hát" onClick={onClose}><FiXCircle /></button>
      <header><h2 id="set-picker-heading">Chọn bộ bài hát</h2><p>Thêm <strong>{song.songName}</strong> <small>({song.id})</small> vào một bộ:</p></header>
      <ul className="set-picker-list">{lists.map((list) => {
        const exists = list.ids.includes(song.id.toUpperCase());
        return <li key={list.name}><button type="button" className="button-mode set-picker-option" data-active={list.name === activeListName} disabled={exists}
          aria-label={exists ? `${list.name}: đã có ${song.id}` : `Thêm vào ${list.name}`} onClick={() => finish(onSelect(list.name), list.name)}>
          <span><strong>{list.name}</strong><small>{list.ids.length} bài hát{exists ? ' · Đã có bài này' : ''}</small></span>{exists ? <FiCheck aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
        </button></li>;
      })}</ul>
      <form className="set-picker-create" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) { setError('Vui lòng nhập tên bộ bài hát.'); return; } finish(onCreate(name.trim()), name.trim()); }}>
        <label htmlFor="new-set-name">Hoặc tạo bộ mới</label>
        <div><input id="new-set-name" className="slideshow-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên bộ bài hát mới" /><button type="submit" className="button-mode">Tạo và thêm</button></div>
      </form>
      {error ? <p role="alert" className="slideshow-error">{error}</p> : null}
    </div>
  </div>, document.body);
}
