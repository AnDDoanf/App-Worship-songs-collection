import { MdDeleteForever} from 'react-icons/md'
import Popup from "./Popup.js";
import { useState } from 'react';

const Song = ({songName, category, id, tone, timeSignature}) => {
    const [buttonPopup, setButtonPopup] = useState(false)
    return(
        <div className='song'>
            <div className='song-header'>
                <b onClick={() => setButtonPopup(true)}>{songName}</b>
                <small>{category}</small>
            </div>
            <div className='song-footer'>
                <small>Tone {tone}</small>
                <small>Nhịp {timeSignature}</small>
                {/* <MdDeleteForever className='delete-icon' size='1.3em'/> */}
            </div>
        <Popup trigger={buttonPopup} setTrigger={setButtonPopup}> 
            <h3>Pop Up</h3>
            
        </Popup>
        </div>
    )
}

export default Song