import churchLogo from '../assets/logos/church-logo.svg';
import churchLogoDark from '../assets/logos/church-logo-dark.svg';
import { FiBookOpen } from 'react-icons/fi';
import PalettePicker from '../components/common/PalettePicker';
import ThemeToggle from '../components/common/ThemeToggle';

function Header({ mode, handleMode, palette, onPaletteChange, onOpenGuide }) {
  const activeLogo = mode ? churchLogoDark : churchLogo;

  return (
    <div className="header">
      <div className="header-brand">
        <div className="header-logo-wrap" aria-hidden="true">
          <a href="https://hoithanhnhancap.vn/" target="_blank" rel="noopener noreferrer">
            <img className="header-logo" src={activeLogo} alt="Thánh Ca Hội Thánh" />
          </a>
        </div>
        <div className="header-copy">
          <h1>Thánh Ca Hội Thánh</h1>
          <p className="app-version">Version 2.03</p>
        </div>
      </div>
      <div className="header-controls">
        <button
          type="button"
          className="header-guide-button"
          onClick={onOpenGuide}
          aria-label="Mở hướng dẫn sử dụng"
        >
          <FiBookOpen />
          <span>Cách dùng</span>
        </button>
        <PalettePicker value={palette} onChange={onPaletteChange} />
        <ThemeToggle mode={mode} onToggle={() => handleMode((prevMode) => !prevMode)} />
      </div>
    </div>
  );
}

export default Header;
