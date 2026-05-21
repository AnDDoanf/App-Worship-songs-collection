import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header = ({ mode, handleMode }) => {
  return (
    <div className="header">
      <div>
        <h1>Danh Sách Thánh Ca Tin Lành</h1>
        <p className="app-version">2.00.00</p>
      </div>
      <ThemeToggle mode={mode} onToggle={() => handleMode((prevMode) => !prevMode)} />
    </div>
  );
};

export default Header;
