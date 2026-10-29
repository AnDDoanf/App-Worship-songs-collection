import { hideChords } from '../../../utils/chords';
import { normalizeLyricText } from '../../../services/songLibrary';

export function splitChordLine(line) {
  const pieces = line.split(/(\[[^\u005B\u005D]+\])/g);
  const result = [];
  let pending = [];
  for (const piece of pieces) {
    if (piece.startsWith('[') && hideChords(piece) === '') {
      pending.push(piece.slice(1, -1));
    } else {
      for (const word of piece.split(/(\s+)/).filter(Boolean)) {
        result.push({ chord: pending.join(' '), text: word });
        pending = [];
      }
    }
  }
  if (pending.length) result.push({ chord: pending.join(' '), text: '\u00a0' });
  return result;
}

export default function ChordLyrics({ lyric, showChords = true }) {
  const text = normalizeLyricText(lyric);
  if (!text) return <p className="popup-empty-state">Chưa có lời bài hát.</p>;
  return <div className={`chord-chart ${showChords ? '' : 'lyrics-only'}`}>
    {text.split('\n').map((line, index) => <p className="chord-chart-line" key={index}>
      {showChords ? splitChordLine(line).map((part, i) => <span className="chord-word" key={i}>
        <span className="chord-symbol">{part.chord || '\u00a0'}</span><span className="chord-word-text">{part.text}</span>
      </span>) : hideChords(line) || '\u00a0'}
    </p>)}
  </div>;
}
