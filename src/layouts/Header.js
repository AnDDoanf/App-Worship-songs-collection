import churchLogo from '../assets/logos/church-logo.svg';
import churchLogoDark from '../assets/logos/church-logo-dark.svg';
import PalettePicker from '../components/common/PalettePicker';
import ThemeToggle from '../components/common/ThemeToggle';

function Header({ mode, handleMode, palette, onPaletteChange }) {
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
      <div className="header-controls">
        <PalettePicker value={palette} onChange={onPaletteChange} />
        <ThemeToggle mode={mode} onToggle={() => handleMode((prevMode) => !prevMode)} />
      </div>
    </div>
  );
}

export default Header;
