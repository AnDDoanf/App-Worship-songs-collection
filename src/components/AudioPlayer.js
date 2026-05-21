import React, { useState } from 'react';

function AudioPlayer(props) {
  const [audioLoaded, setAudioLoaded] = useState(false);

  return (
    <div className="audio-player">
      {!audioLoaded ? (
        <button type="button" className="button-mode audio-button" onClick={() => setAudioLoaded(true)}>
          Âm thanh
        </button>
      ) : (
        <audio className="audio-control" src={props.audio} controls autoPlay={false} preload="none" />
      )}
    </div>
  );
}

export default AudioPlayer;
