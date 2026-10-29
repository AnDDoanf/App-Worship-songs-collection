import { useState } from 'react';
import { FiFileText, FiPlus } from 'react-icons/fi';
import AudioPlayer from '../../../components/common/AudioPlayer';
import Popup2 from '../../song-viewer/components/Popup2';
import { getAppHomePath } from '../../../utils/shareLinks';
import { notifyToast, songAddedToastOptions } from '../../../utils/songToasts';
import ActionIconButton from '../../../components/common/ActionIconButton';

function Song(props) {
  const [buttonPopup2, setButtonPopup2] = useState(false);

  const notifyAction = (message, options, type) => {
    notifyToast(props.onShowToast, type, message, options);
  };

  const openReader = () => {
    if (props.onOpenReader) props.onOpenReader(props.id);
    else setButtonPopup2(true);
  };

  const handleAddToSlideshow = () => {
    if (props.onRequestAddToSet) { props.onRequestAddToSet(props.id); return; }
    const result = props.onAddToSlideshow?.(props.id);

    if (result?.added) {
      notifyAction(`Đã thêm ${props.id} vào bộ bài hát`, songAddedToastOptions(result.undo), 'success');
      return;
    }

    notifyAction(`${props.id} đã có trong bộ bài hát`, undefined, 'warning');
  };

  return (
    <div className="song">
      <div className="song-header">
        <h2 className="song-title">
          <a href={`${getAppHomePath()}songs/${encodeURIComponent(props.id)}/`} onClick={(event) => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); openReader();
          }}>
            {props.songName}
          </a>
          <small className="song-code-label">{props.id}{props.collection ? ` · ${props.collection}` : ''}</small>
        </h2>
        <small>{props.category}</small>
      </div>
      <div className="song-footer">
        <div className="song-footer-col1">
          <small>Tone {props.tone}</small>
          <small>Nhịp {props.timeSignature}</small>
        </div>
        <div className="song-footer-col2">
          <ActionIconButton label={`Xem bài hát ${props.id}`} icon={<FiFileText />} onClick={openReader} />
          <ActionIconButton label={`Thêm ${props.id} vào bộ bài hát`} icon={<FiPlus />} onClick={handleAddToSlideshow} />
        </div>
        <div className="song-footer-col3">
          <AudioPlayer audio={props.audio} />
        </div>
      </div>
      <Popup2
        songName={props.songName}
        image={props.image}
        collection={props.collection}
        category={props.category}
        timeSignature={props.timeSignature}
        tempo={props.tempo}
        lyric={props.lyric}
        tone={props.tone}
        trigger={buttonPopup2}
        setTrigger={setButtonPopup2}
        songId={props.id}
        onNotify={props.onShowToast}
      />
    </div>
  );
}

export default Song;
