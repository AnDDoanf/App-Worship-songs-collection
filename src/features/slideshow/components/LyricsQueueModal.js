import { createPortal } from 'react-dom';
import { FiXCircle } from 'react-icons/fi';
import { normalizeLyricText } from '../../../services/songLibrary';

function getLyricLines(lyric) {
  const normalized = normalizeLyricText(lyric);

  if (!normalized) {
    return [];
  }

  return normalized.split('\n').map((line) => line.trimEnd());
}

function LyricsCard({ song }) {
  const lyricLines = getLyricLines(song.lyric);

  return (
    <article className="lyrics-queue-card">
      <header className="lyrics-queue-card-header">
        <strong>{song.id}</strong>
        <span>{song.songName}</span>
      </header>
      {lyricLines.length > 0 ? (
        <div className="lyrics-queue-card-body">
          {lyricLines.map((line, index) => (
            <p key={`${song.id}-${index}`} className="lyrics-queue-line">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      ) : (
        <div className="popup-empty-state">Không có lời bài hát</div>
      )}
    </article>
  );
}

function LyricsQueueModal({ songs, trigger, setTrigger }) {
  if (!trigger) {
    return null;
  }

  return createPortal(
    <div className="popup" onClick={() => setTrigger(false)}>
      <div className="popup-lyrics-queue" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button"
          onClick={() => setTrigger(false)}
          aria-label="Đóng danh sách lời bài hát"
        >
          <FiXCircle />
        </button>
        <div className="popup-lyrics-queue-header">
          <h2>Lời bài hát trong danh sách</h2>
          <p>{songs.map((song) => song.id).join(', ')}</p>
        </div>
        <div className="popup-lyrics-queue-grid">
          {songs.map((song) => (
            <LyricsCard key={song.id} song={song} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LyricsQueueModal;
