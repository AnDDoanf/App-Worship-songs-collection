import React, { useState } from 'react';

function hasAudioSource(audio) {
  if (typeof audio !== 'string') {
    return false;
  }

  const trimmed = audio.trim();
  return Boolean(trimmed && trimmed !== 'Không rõ' && trimmed !== 'KhÃ´ng rÃµ');
}

function AudioPlayer(props) {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const hasAudio = hasAudioSource(props.audio);

  if (!hasAudio) {
    return (
      <div className="audio-player">
        <button type="button" className="button-mode audio-button" disabled>
          Chưa có âm thanh
        </button>
      </div>
    );
  }

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
