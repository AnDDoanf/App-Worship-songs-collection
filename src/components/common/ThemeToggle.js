import { FiMoon, FiSun } from 'react-icons/fi';

function ThemeToggle({ mode, onToggle }) {
  return (
    <button
      type="button"
      className={`theme-toggle ${mode ? 'is-dark' : ''}`}
      onClick={onToggle}
      aria-label={mode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={mode}
      title={mode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <FiSun className="theme-toggle-sun" aria-hidden="true" />
      <FiMoon className="theme-toggle-moon" aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
