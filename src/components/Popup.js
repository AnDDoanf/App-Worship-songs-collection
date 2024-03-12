import React from 'react'

function Popup(props) {
  return (props.trigger) ? (
    <div className='popup'>
      <div className='popup-inner'>
        {/* {props.children} */}
        <img className='image-box' src={require('../data/page0.jpg')} />
        <button className='close-popup' onClick={() => props.setTrigger(false)}>Close</button>
      </div>
    </div>
  ) : ""
}

export default Popup
