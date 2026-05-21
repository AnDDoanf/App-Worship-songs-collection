import Song from './Song';

const SongList = ({ songs, onAddToSlideshow }) => {
  return (
    <div className="song-list">
      {songs.map((song) => (
        <Song
          key={song.id}
          songName={song.songName}
          category={song.category}
          id={song.id}
          tone={song.tone}
          timeSignature={song.timeSignature}
          lyric={song.lyric}
          audio={song.audio}
          image={song.image}
          onAddToSlideshow={onAddToSlideshow}
        />
      ))}
    </div>
  );
};

export default SongList;
