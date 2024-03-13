import React from 'react'
import { FiXCircle } from "react-icons/fi";

function Popup(props) {
  return (props.trigger) ? (
    <div className='popup'>
      <div className='popup-sheet'>
        <img className='image-box' src={require('../data/page0.jpg')} />
        <FiXCircle className='close-popup' onClick={() => props.setTrigger(false)}/>
      </div>
    </div>
  ) : ""
}

export default Popup
