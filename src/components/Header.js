import React from 'react';
import churchLogo from '../church-logo.svg';
import churchLogoDark from '../church-logo-dark.svg';
import ThemeToggle from './ThemeToggle';

const Header = ({ mode, handleMode }) => {
  const activeLogo = mode ? churchLogoDark : churchLogo;

  return (
    <div className="header">
      <div className="header-brand">
        <div className="header-logo-wrap" aria-hidden="true">
          <img className="header-logo" src={activeLogo} alt="" />
        </div>
        <div className="header-copy">
          <h1>Thánh Ca Hội Thánh</h1>
          <p className="app-version">Version 2.03</p>
        </div>
      </div>
      <ThemeToggle mode={mode} onToggle={() => handleMode((prevMode) => !prevMode)} />
    </div>
  );
};

export default Header;
