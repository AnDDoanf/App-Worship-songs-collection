import React, { useState } from 'react'
import { FiXCircle } from "react-icons/fi";

function PrintLine(props) {
    return <p style={{color:"black"}}>{ props.text.replace('\'', "").replace('\'', "") }</p>;
}

function ShowLyric(props) {
  const lyricss = props.lyric.slice(1, -1).split(', ');
  return (props.lyric.includes('Không rõ')) ? (
    <div className='popup-lyric'>No lyric available</div>
  ) : (lyricss.map((line) => <PrintLine text={line}/>))
}

function Popup2(props) {
  return (props.trigger) ? (    
    <div className='popup'>
      <div className='popup-lyric'>
        <FiXCircle className='close-popup' onClick={() => props.setTrigger(false)}/>
        <ShowLyric lyric={props.lyric}/>
      </div>
    </div>
  ) : ""
}

export default Popup2