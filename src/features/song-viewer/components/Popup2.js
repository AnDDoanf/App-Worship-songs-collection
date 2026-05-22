import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiClipboard, FiEdit3, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { normalizeLyricText } from '../../../services/songLibrary';

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

function ShowLyric({ lyric }) {
  const lyricText = normalizeLyricText(lyric);

  if (!lyricText) {
    return <div className="popup-empty-state">Không có lời bài hát</div>;
  }

  return lyricText.split('\n').map((line, index) => (
    <p key={`${line}-${index}`} className="popup-lyric-line">
      {line}
    </p>
  ));
}

function Popup2({ lyric, trigger, setTrigger, songId, onNotify }) {
  const initialEditableLyric = normalizeLyricText(lyric);
  const [draftLyric, setDraftLyric] = useState(initialEditableLyric);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    setDraftLyric(initialEditableLyric);
    setIsSuggesting(false);
  }, [initialEditableLyric, trigger]);

  if (!trigger) {
    return null;
  }

  const handleCopy = async () => {
    if (!draftLyric.trim()) {
      onNotify?.(`Chưa có lời để sao chép cho ${songId}`);
      return;
    }

    try {
      await copyTextToClipboard(draftLyric);
      onNotify?.(`Đã sao chép lời hoặc hợp âm của ${songId}`);
    } catch (_error) {
      onNotify?.(`Không thể sao chép nội dung của ${songId}`);
    }
  };

  return createPortal(
    <div className="popup" onClick={() => setTrigger(false)}>
      <div className="popup-lyric" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button"
          onClick={() => setTrigger(false)}
          aria-label="Đóng phần lời bài hát"
        >
          <FiXCircle />
        </button>
        <p className="popup-lyric-helper">
          Chỉnh sửa lời hoặc hợp âm rồi bấm Copy để dán vào file Excel trên Drive.
        </p>
        <div className="popup-lyric-actions">
          <button
            type="button"
            className="button-mode"
            onClick={() => setIsSuggesting((currentValue) => !currentValue)}
          >
            <FiEdit3 aria-hidden="true" />
            <span>Sửa lời</span>
          </button>
          <button
            type="button"
            className="button-mode"
            onClick={() => setDraftLyric(initialEditableLyric)}
          >
            <FiRefreshCw aria-hidden="true" />
            <span>Reset</span>
          </button>
          <button type="button" className="button-mode" onClick={handleCopy}>
            <FiClipboard aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
        <div className="popup-lyric-body">
          {isSuggesting ? (
            <textarea
              className="popup-lyric-editor"
              value={draftLyric}
              onChange={(event) => setDraftLyric(event.target.value)}
              placeholder="Nhập lời hoặc hợp âm đã chỉnh sửa..."
              spellCheck="false"
            />
          ) : (
            <ShowLyric lyric={draftLyric} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Popup2;
