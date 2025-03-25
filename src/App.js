import React, { useState } from 'react';
import TVCHHComponent from './components/TVCHHComponent';
import HosannaComponent from './components/HosannaComponent';
import BaihattudoComponent from './components/BaihattudoComponent';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const [mode, setMode] = useState(false);
  const [activeComponent, setActiveComponent] = useState(2); // Default active component

  const handleToggleComponent = (componentNumber) => {
    setActiveComponent(componentNumber);
  };

  return (
    <div className={`${mode && 'dark-mode'}`}>
      <div className="container">
        <Header handleMode={setMode} />
        <p className="fontSize:10px">1.0013</p>
        <div className="collection-menu">
          <div 
            className={`menu-item ${activeComponent === 1 ? 'active' : ''}`} 
            onClick={() => handleToggleComponent(1)}
          >
            Tôn vinh Chúa Hằng Hữu
          </div>
          <div 
            className={`menu-item ${activeComponent === 2 ? 'active' : ''}`} 
            onClick={() => handleToggleComponent(2)}
          >
            Hosanna Việt Nam
          </div>
          <div 
            className={`menu-item ${activeComponent === 3 ? 'active' : ''}`} 
            onClick={() => handleToggleComponent(3)}
          >
            Bài hát tự do
          </div>
        </div>
        {activeComponent === 1 && <TVCHHComponent />}
        {activeComponent === 2 && <HosannaComponent />}
        {activeComponent === 3 && <BaihattudoComponent />}
        <ScrollToTop/>
      </div>
    </div>
  );
}

export default App;
