import { createPortal } from 'react-dom';
import { FiXCircle } from 'react-icons/fi';

function PrintLine(props) {
  return <p style={{ color: 'black' }}>{props.text.replace("'", '').replace("'", '')}</p>;
}

function ShowLyric(props) {
  const lyricss = props.lyric.slice(1, -1).split(', ');
  return props.lyric.includes('Không rõ') ? (
    <div className="popup-lyric">No lyric available</div>
  ) : (
    lyricss.map((line, index) => <PrintLine key={`${line}-${index}`} text={line} />)
  );
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
          aria-label="Close lyric view"
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
