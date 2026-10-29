import Song from './Song';

function SongList({ songs, onAddToSlideshow, onShowToast, onOpenReader, onRequestAddToSet }) {
  return (
    <div className="song-list">
      {songs.map((song) => (
        <Song
          key={song.id}
          {...song}
          onOpenReader={onOpenReader}
          onRequestAddToSet={onRequestAddToSet}
          songName={song.songName}
          category={song.category}
          id={song.id}
          tone={song.tone}
          timeSignature={song.timeSignature}
          lyric={song.lyric}
          audio={song.audio}
          image={song.image}
          onAddToSlideshow={onAddToSlideshow}
          onShowToast={onShowToast}
        />
      ))}
    </div>
  );
}

export default SongList;
