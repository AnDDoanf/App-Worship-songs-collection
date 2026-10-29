import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiMusic, FiXCircle } from 'react-icons/fi';
import { normalizeLyricText } from '../../../services/songLibrary';
import { hideChords } from '../../../utils/chords';
import ChordLyrics from '../../song-viewer/components/ChordLyrics';

function getLyricLines(lyric) {
  const normalized = normalizeLyricText(lyric);

  if (!normalized) {
    return [];
  }

  return normalized.split('\n').map((line) => line.trimEnd());
}

function LyricsCard({ song, showChords }) {
  const lyricLines = getLyricLines(showChords ? song.lyric : hideChords(normalizeLyricText(song.lyric)));

  return (
    <article className="lyrics-queue-card">
      <header className="lyrics-queue-card-header">
        <strong>{song.id}</strong>
        <span>{song.songName}</span>
      </header>
      {lyricLines.length > 0 ? (
        <div className="lyrics-queue-card-body">
          <ChordLyrics lyric={song.lyric} showChords={showChords} />
        </div>
      ) : (
        <div className="popup-empty-state">Không có lời bài hát</div>
      )}
    </article>
  );
}

function LyricsQueueModal({ songs, trigger, setTrigger }) {
  const [showChords, setShowChords] = useState(true);
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
          <button type="button" className="button-mode chord-visibility-toggle"
            aria-label={showChords ? 'Ẩn hợp âm' : 'Hiện hợp âm'}
            aria-pressed={showChords} onClick={() => setShowChords((value) => !value)}>
            <FiMusic aria-hidden="true" /> Hợp âm
          </button>
        </div>
        <div className="popup-lyrics-queue-grid">
          {songs.map((song) => (
            <LyricsCard key={song.id} song={song} showChords={showChords} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LyricsQueueModal;
