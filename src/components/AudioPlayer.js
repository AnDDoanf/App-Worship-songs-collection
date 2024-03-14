import React, { useState } from 'react';

function AudioPlayer(props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const togglePlay = () => {
    if (!audioLoaded) {
      setAudioLoaded(true); // Set audio as loaded when user clicks play button
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      {!audioLoaded && <button className='button-mode' style={{width:'280px'}} onClick={togglePlay}>Audio</button>}
      {audioLoaded && (
        <div>
          <audio src={props.audio} controls={true} autoPlay={false} />
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;