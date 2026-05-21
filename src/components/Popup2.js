import { createPortal } from 'react-dom';
import { FiXCircle } from 'react-icons/fi';

function normalizeLyricLines(lyric) {
  if (typeof lyric !== 'string') {
    return [];
  }

  const trimmed = lyric.trim();

  if (!trimmed || trimmed === 'Không rõ' || trimmed === 'KhÃ´ng rÃµ') {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(/',\s*'|",\s*"|',\s*"|",\s*'/)
      .map((line) => line.replace(/^['"]|['"]$/g, '').trim())
      .filter(Boolean);
  }

  return [trimmed];
}

function ShowLyric({ lyric }) {
  const lyricLines = normalizeLyricLines(lyric);

  if (lyricLines.length === 0) {
    return <div className="popup-empty-state">Không có lời bài hát</div>;
  }

  return lyricLines.map((line, index) => (
    <p key={`${line}-${index}`} style={{ color: 'black' }}>
      {line}
    </p>
  ));
}

function Popup2(props) {
  if (!props.trigger) {
    return null;
  }

  return createPortal(
    <div className="popup" onClick={() => props.setTrigger(false)}>
      <div className="popup-lyric" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button"
          onClick={() => props.setTrigger(false)}
          aria-label="Đóng phần lời bài hát"
        >
          <FiXCircle />
        </button>
        <ShowLyric lyric={props.lyric} />
      </div>
    </div>,
    document.body
  );
}

export default Popup2;
