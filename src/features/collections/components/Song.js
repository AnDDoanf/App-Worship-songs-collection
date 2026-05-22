import { useState } from 'react';
import { FiFileText, FiList, FiPlus } from 'react-icons/fi';
import AudioPlayer from '../../../components/common/AudioPlayer';
import Popup from '../../song-viewer/components/Popup';
import Popup2 from '../../song-viewer/components/Popup2';

function Song(props) {
  const [buttonPopup, setButtonPopup] = useState(false);
  const [buttonPopup2, setButtonPopup2] = useState(false);

  const notifyAction = (message) => {
    props.onShowToast?.(message);
  };

  const handleOpenSheet = () => {
    setButtonPopup(true);
    notifyAction(`Đang mở bản nhạc: ${props.id}`);
  };

  const handleOpenLyric = () => {
    setButtonPopup2(true);
    notifyAction(`Đang mở lời bài hát: ${props.id}`);
  };

  const handleAddToSlideshow = () => {
    const result = props.onAddToSlideshow?.(props.id);

    if (result?.added) {
      notifyAction(`Đã thêm ${props.id} vào danh sách trình chiếu`);
      return;
    }

    notifyAction(`${props.id} đã có trong danh sách trình chiếu`);
  };

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
          <button className="button-mode song-button" type="button" onClick={handleOpenSheet}>
            <span className="song-button-label">Bản nhạc</span>
            <FiFileText className="song-button-icon" aria-hidden="true" />
          </button>
          <button className="button-mode song-button" type="button" onClick={handleAddToSlideshow}>
            <span className="song-button-label">Thêm</span>
            <FiPlus className="song-button-icon" aria-hidden="true" />
          </button>
          <button className="button-mode song-button" type="button" onClick={handleOpenLyric}>
            <span className="song-button-label">Lời</span>
            <FiList className="song-button-icon" aria-hidden="true" />
          </button>
        </div>
        <div className="song-footer-col3">
          <AudioPlayer audio={props.audio} />
        </div>
      </div>
      <Popup image={props.image} trigger={buttonPopup} setTrigger={setButtonPopup} />
      <Popup2
        lyric={props.lyric}
        trigger={buttonPopup2}
        setTrigger={setButtonPopup2}
        songId={props.id}
        onNotify={notifyAction}
      />
    </div>
  );
}

export default Song;
