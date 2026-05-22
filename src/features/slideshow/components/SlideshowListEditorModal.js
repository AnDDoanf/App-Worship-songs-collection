import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiSave, FiTrash2, FiXCircle } from 'react-icons/fi';

function SlideshowListEditorModal({
  trigger,
  mode,
  originalName,
  initialName,
  initialDraft,
  setTrigger,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onNotify,
}) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialDraft);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    setName(initialName);
    setDraft(initialDraft);
    setErrorMessage('');

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [initialDraft, initialName, trigger]);

  if (!trigger) {
    return null;
  }

  const handleSave = () => {
    const result =
      mode === 'create'
        ? onCreateList({ name, draft })
        : onUpdateList({ originalName, name, draft });

    if (result.error) {
      setErrorMessage(result.error);
      onNotify?.(result.error);
      return;
    }

    onNotify?.(
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
      onNotify?.(result.error);
      return;
    }

    onNotify?.(`Đã xóa danh sách: ${originalName}`);
    setTrigger(false);
  };

  return createPortal(
    <div className="popup" onClick={() => setTrigger(false)}>
      <div className="popup-list-editor" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button popup-close-button-themed"
          onClick={() => setTrigger(false)}
          aria-label="Đóng trình sửa danh sách"
        >
          <FiXCircle />
        </button>
        <div className="popup-list-editor-header">
          <h2>{mode === 'create' ? 'Tạo danh sách mới' : 'Chỉnh sửa danh sách'}</h2>
          <p>Nhập tên danh sách và các mã bài hát, phân tách bằng dấu phẩy.</p>
        </div>
        <div className="popup-list-editor-form">
          <label className="popup-list-editor-field">
            <span>Tên danh sách</span>
            <input
              type="text"
              className="slideshow-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chương trình Chúa nhật"
            />
          </label>
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
        </div>
        {errorMessage ? <p className="slideshow-error">{errorMessage}</p> : null}
        <div className="popup-list-editor-actions">
          {mode === 'edit' ? (
            <button
              type="button"
              className="button-mode slideshow-list-editor-delete"
              onClick={handleDelete}
            >
              <FiTrash2 aria-hidden="true" />
              <span>Xóa danh sách</span>
            </button>
          ) : null}
          <button type="button" className="button-mode" onClick={handleSave}>
            <FiSave aria-hidden="true" />
            <span>Lưu danh sách</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SlideshowListEditorModal;
