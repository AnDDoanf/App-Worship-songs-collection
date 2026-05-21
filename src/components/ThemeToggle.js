import { FiMoon, FiSun } from 'react-icons/fi';

function ThemeToggle({ mode, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={mode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={mode}
    >
      <span className={`theme-toggle-option ${!mode ? 'active' : ''}`}>
        <FiSun />
        Sáng
      </span>
      <span className={`theme-toggle-option ${mode ? 'active' : ''}`}>
        <FiMoon />
        Tối
      </span>
      <span className={`theme-toggle-thumb ${mode ? 'is-dark' : ''}`} />
    </button>
  );
}

export default ThemeToggle;
