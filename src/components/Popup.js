import React from 'react'
import { FiXCircle } from "react-icons/fi";
import gallery from './ImageLoader';

function Popup(props) {
  const imageUrls = props.image;
  const hasComma = imageUrls.includes(',');
  let splitString = [];

  if (hasComma) {
    splitString = imageUrls.split(',');
  }

  return (props.trigger) ? (
    <div className='popup'>
      <div className='popup-sheet'>
        {hasComma ? (
          splitString.map((image, index) => (
            <img className='image-box' key={index} src={gallery[image]} alt="Image" />
          ))
        ) : (
          <img className='image-box' src={gallery[imageUrls]} alt="Image" />
        )}
        <FiXCircle className='close-popup' onClick={() => props.setTrigger(false)}/>
      </div>
    </div>
  ) : ""
}

export default Popup
