import React, { useState } from 'react';

function AudioPlayer(props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioUrl = props.audio;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <audio src={audioUrl} controls={true} autoPlay={false} />
    </div>
  );
}

export default AudioPlayer;