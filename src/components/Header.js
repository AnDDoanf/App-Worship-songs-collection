import React from "react";

const Header = ({ handleMode }) => {
    return(
        <div className="header">
            <h1>Danh sách Thánh ca Tin Lành</h1> 
            <button onClick={()=>handleMode((prevMode)=>!prevMode)} className="button-mode">Mode</button>
        </div>
    )
}

export default Header