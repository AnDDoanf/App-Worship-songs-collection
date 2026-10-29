import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiClipboard, FiEdit3, FiMusic, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { normalizeLyricText } from '../../../services/songLibrary';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { hideChords, inferKey, KEY_OPTIONS, transposeLyrics } from '../../../utils/chords';
import { readChordPreferences, saveChordPreference } from '../../../store/chordPreferences';

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

function Popup2({ lyric, tone, trigger, setTrigger, songId, onNotify }) {
  const initialEditableLyric = normalizeLyricText(lyric);
  const [draftLyric, setDraftLyric] = useState(initialEditableLyric);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [sourceKey, setSourceKey] = useState('');
  const [targetKey, setTargetKey] = useState('');
  const displayedLyric = transposeLyrics(draftLyric, sourceKey, targetKey);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    const saved = readChordPreferences()[songId.toUpperCase()];
    const originalKey = inferKey(initialEditableLyric, tone);
    setDraftLyric(saved?.lyric ?? initialEditableLyric);
    setSourceKey(saved?.sourceKey || originalKey);
    setTargetKey(saved?.targetKey || originalKey);
    setIsSuggesting(false);
  }, [initialEditableLyric, trigger, songId, tone]);

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [trigger]);

  if (!trigger) {
    return null;
  }

  const persist = (nextSource, nextTarget, nextLyric = draftLyric) => {
    if (!saveChordPreference(songId, {
      sourceKey: nextSource,
      targetKey: nextTarget,
      ...(nextLyric !== initialEditableLyric ? { lyric: nextLyric } : {}),
    })) onNotify?.('Không thể lưu tông đã chọn trên thiết bị này.');
  };

  const handleReset = () => {
    const originalKey = inferKey(initialEditableLyric, tone);
    setDraftLyric(initialEditableLyric);
    setSourceKey(originalKey);
    setTargetKey(originalKey);
    if (!saveChordPreference(songId, null)) onNotify?.('Không thể xóa tông đã lưu trên thiết bị này.');
  };

  const handleCopy = async () => {
    if (!draftLyric.trim()) {
      onNotify?.(`Chưa có lời để sao chép cho ${songId}`);
      return;
    }

    try {
      await copyTextToClipboard(displayedLyric);
      onNotify?.(`Đã sao chép lời hoặc hợp âm của ${songId}`);
    } catch (_error) {
      onNotify?.(`Không thể sao chép nội dung của ${songId}`);
    }
  };

  return createPortal(
    <div className="popup popup-lyric-overlay">
      <div className="popup-lyric popup-lyric-dialog" role="dialog" aria-modal="true" aria-label="Lời bài hát" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button"
          onClick={() => setTrigger(false)}
          aria-label="Đóng phần lời bài hát"
        >
          <FiXCircle />
        </button>
        <div className="popup-lyric-toolbar">
        <div className="popup-lyric-actions">
          <button type="button" className="button-mode chord-visibility-toggle"
            aria-label={showChords ? 'Ẩn hợp âm' : 'Hiện hợp âm'}
            title={showChords ? 'Ẩn hợp âm' : 'Hiện hợp âm'}
            aria-pressed={showChords} disabled={isSuggesting}
            onClick={() => setShowChords((value) => !value)}>
            <FiMusic aria-hidden="true" /><span>Hợp âm</span>
          </button>
          <button
            type="button"
            className="button-mode"
            aria-label="Sửa lời"
            title="Sửa lời"
            onClick={() => setIsSuggesting((currentValue) => !currentValue)}
          >
            <FiEdit3 aria-hidden="true" />
            <span>Sửa lời</span>
          </button>
          <button
            type="button"
            className="button-mode"
            aria-label="Reset"
            title="Reset"
            onClick={handleReset}
          >
            <FiRefreshCw aria-hidden="true" />
            <span>Reset</span>
          </button>
          <button type="button" className="button-mode" aria-label="Copy" title="Copy" onClick={handleCopy}>
            <FiClipboard aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
        <div className="popup-transpose-controls">
          <div className="popup-original-key">
            Gốc
            <span data-testid="popup-original-key">{inferKey(initialEditableLyric, tone) || 'Không rõ'}</span>
          </div>
          <label>
            <span aria-hidden="true">→</span>
            <select aria-label="Chuyển sang tông" value={targetKey} disabled={!sourceKey} onChange={(event) => {
              setTargetKey(event.target.value);
              persist(sourceKey, event.target.value);
            }}>
              <option value="" disabled>Chọn tông</option>
              {KEY_OPTIONS.filter((key) => key.endsWith('m') === sourceKey.endsWith('m'))
                .map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>
        </div>
        </div>
        <div className="popup-lyric-body">
          {isSuggesting ? (
            <textarea
              className="popup-lyric-editor"
              aria-label="Lời và hợp âm"
              value={displayedLyric}
              onChange={(event) => {
                setDraftLyric(event.target.value);
                setSourceKey(targetKey);
                persist(targetKey, targetKey, event.target.value);
              }}
              placeholder="Nhập lời hoặc hợp âm đã chỉnh sửa..."
              spellCheck="false"
            />
          ) : (
            <ShowLyric lyric={showChords ? displayedLyric : hideChords(displayedLyric)} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Popup2;
