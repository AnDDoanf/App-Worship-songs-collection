import React from 'react'
import { FiXCircle } from "react-icons/fi";
import gallery from './ImageLoader';

function Popup(props) {
  function ShowSheet(props) {
    const imageURL = props.image
    const hasComma = imageURL.includes(',');
    let splitString = [];
    if (hasComma) {
      splitString = imageURL.split(',');
    }
    return (imageURL.includes('Không rõ')) ? (
      <div className='popup-lyric'>No Sheet available</div>
    ) : (hasComma ? (
          splitString.map((image, index) => (
            <img className='image-box' key={index} src={gallery[image]} alt="Image" />
          ))
          ) : (
          <img className='image-box' src={gallery[props.image]} alt="Image" />
    ))
  }

  return (props.trigger) ? (
    <div className='popup'>
      <div className='popup-sheet'>
        <ShowSheet image = {props.image}/>
        <FiXCircle className='close-popup' onClick={() => props.setTrigger(false)}/>
      </div>
    </div>
  ) : ""
}

export default Popup
