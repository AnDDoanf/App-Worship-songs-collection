import { useState } from 'react';
import { FiFileText, FiList, FiPlus } from 'react-icons/fi';
import AudioPlayer from './AudioPlayer.js';
import Popup from './Popup.js';
import Popup2 from './Popup2.js';

const Song = (props) => {
  const [buttonPopup, setButtonPopup] = useState(false);
  const [buttonPopup2, setButtonPopup2] = useState(false);

  return (
    <div className="song">
      <div className="song-header">
        <b>
          {props.id}. {props.songName}
        </b>
        <small>{props.category}</small>
      </div>
      <div className="song-footer">
        <div className="song-footer-col1">
          <small>Tone {props.tone}</small>
          <small>Nhịp {props.timeSignature}</small>
        </div>
        <div className="song-footer-col2">
          <button className="button-mode song-button" type="button" onClick={() => setButtonPopup(true)}>
            <span className="song-button-label">Sheet</span>
            <FiFileText className="song-button-icon" aria-hidden="true" />
          </button>
          <button
            className="button-mode song-button"
            type="button"
            onClick={() => props.onAddToSlideshow?.(props.id)}
          >
            <span className="song-button-label">Add</span>
            <FiPlus className="song-button-icon" aria-hidden="true" />
          </button>
          <button
            className="button-mode song-button"
            type="button"
            onClick={() => setButtonPopup2(true)}
          >
            <span className="song-button-label">Lyric</span>
            <FiList className="song-button-icon" aria-hidden="true" />
          </button>
        </div>
        <div className="song-footer-col3">
          <AudioPlayer audio={props.audio} />
        </div>
      </div>
      <Popup image={props.image} trigger={buttonPopup} setTrigger={setButtonPopup} />
      <Popup2 lyric={props.lyric} trigger={buttonPopup2} setTrigger={setButtonPopup2} />
    </div>
  );
};

export default Song;
