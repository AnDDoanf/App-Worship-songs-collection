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
      <span
        className={`theme-toggle-option ${!mode ? 'active' : ''}`}
        title="Sáng"
        aria-label="Chế độ sáng"
      >
        <FiSun />
        <span className="theme-toggle-text">Sáng</span>
      </span>
      <span
        className={`theme-toggle-option ${mode ? 'active' : ''}`}
        title="Tối"
        aria-label="Chế độ tối"
      >
        <FiMoon />
        <span className="theme-toggle-text">Tối</span>
      </span>
      <span className={`theme-toggle-thumb ${mode ? 'is-dark' : ''}`} />
    </button>
  );
}

export default ThemeToggle;
