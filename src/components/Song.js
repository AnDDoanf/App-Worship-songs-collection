import Popup from "./Popup.js";
import Popup2 from './Popup2.js';
import { useState } from 'react';
import AudioPlayer from './AudioPlayer.js';
const Song = (props) => {
    const [buttonPopup, setButtonPopup] = useState(false)
    const [buttonPopup2, setButtonPopup2] = useState(false)
    return(
        <div className='song'>
            <div className='song-header'>
                <b>{props.id}. {props.songName}</b>
                <small>{props.category}</small>
            </div>
            <div className='song-footer'>
                <div className='song-footer-col1'>
                    <small>Tone {props.tone}</small>
                    <small>Nhịp {props.timeSignature}</small>
                </div>
                <div className='song-footer-col2'>
                    <button className='button-mode song-button' onClick={() => setButtonPopup(true)}>Sheet</button>
                    <button className='button-mode song-button' onClick={() => setButtonPopup2(true)}>Lyric</button>
                </div>
                <div className='song-footer-col3'>
                    <AudioPlayer audio={props.audio}/>
                </div>
            </div>
            <Popup image={props.image} trigger={buttonPopup} setTrigger={setButtonPopup}></Popup>
            <Popup2 lyric={props.lyric} trigger={buttonPopup2} setTrigger={setButtonPopup2}></Popup2>
        </div>
    )
}

export default Song