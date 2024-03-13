import React from 'react'
import { FiXCircle } from "react-icons/fi";

function PrintLine(props) {
    return <p>{ props.text.replace('\'', "").replace('\'', "") }</p>;
}

function Popup2(props) {
  const lyricss = props.lyric.slice(1, -1).split(', ');
  return (props.trigger) ? (    
    <div className='popup'>
      <div className='popup-lyric'>
        <FiXCircle className='close-popup' onClick={() => props.setTrigger(false)}/>
        {lyricss.map((line) => <PrintLine text={line}/>)}
      </div>
    </div>
  ) : ""
}

export default Popup2