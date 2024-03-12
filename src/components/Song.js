import { MdDeleteForever} from 'react-icons/md'

const Song = ({songName, category, id, tone, timeSignature}) => {
    return(
        <div className='song'>
            <div className='song-header'>
                <b>{songName}</b>
                <small>{category}</small>
            </div>
            <div className='song-footer'>
                <small>Tone {tone}</small>
                <small>Nhịp {timeSignature}</small>
                {/* <MdDeleteForever className='delete-icon' size='1.3em'/> */}
            </div>
        </div>
    )
}

export default Song