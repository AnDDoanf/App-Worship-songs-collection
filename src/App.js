import React, { useState } from 'react';
import TVCHHComponent from './components/TVCHHComponent';
import HosannaComponent from './components/HosannaComponent';
import BaihattudoComponent from './components/BaihattudoComponent';
import ThanhcaxanhComponent from './components/ThanhcaxanhComponent';
import Header from './components/Header';

function App() {
  const [mode, setMode] = useState(false)
  const [showTVCHHComponent, setShowTVCHHComponent] = useState(true);
  const [showHosannaComponent, setShowHosannaComponent] = useState(false);
  const [showBaihattudoComponent, setShowBaihattudoComponent] = useState(false);

  const handleToggleComponent = (componentNumber) => {
    setShowTVCHHComponent(componentNumber === 1);
    setShowHosannaComponent(componentNumber === 2);
    setShowBaihattudoComponent(componentNumber === 3);
  };

  return (
    <div className={`${mode && 'dark-mode'}`}>
      <div className="container">
        <Header handleMode={setMode} />
        <div className='collection-menu'>
          <div className='menu-item' onClick={() => handleToggleComponent(1)}>Tôn vinh Chúa Hằng Hữu</div>
          <div className='menu-item' onClick={() => handleToggleComponent(2)}>Hosanna Việt Nam</div>
          <div className='menu-item' onClick={() => handleToggleComponent(3)}>Bài hát tự do</div>
        </div>
        {showTVCHHComponent && <TVCHHComponent />}
        {showHosannaComponent && <HosannaComponent />}
        {showBaihattudoComponent && <BaihattudoComponent />}
      </div>
    </div>
  );
}

export default App;