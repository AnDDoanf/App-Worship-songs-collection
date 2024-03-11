import React from "react";

const Header = ({ handleMode }) => {
    return(
        <div className="header">
            <h1>Worship Songs Collection</h1>
            <button onClick={()=>handleMode((prevMode)=>!prevMode)} className="button-mode">Change Mode</button>
        </div>
    )
}

export default Header