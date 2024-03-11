import Song from './Song'

const SongList = ({songs}) => {
    return (
        <div className='song-list'>
            {songs.map((song)=> (
                <Song songName={song.songName} category={song.category} id={song.id} tone={song.tone} timeSignature={song.timeSignature} />
            ))}
        </div>
    )
}

export default SongList