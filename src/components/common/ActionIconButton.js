import { useId, useState } from 'react';

export default function ActionIconButton({ label, icon, onClick, className = '', disabled = false, pressed }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return <span className="icon-action" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
    <button type="button" className={`button-mode action-icon-button ${className}`} aria-label={label}
      aria-describedby={visible ? id : undefined} aria-pressed={pressed} disabled={disabled} onClick={onClick}
      onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}
      onKeyDown={(event) => { if (event.key === 'Escape') setVisible(false); }}>
      <span aria-hidden="true">{icon}</span>
    </button>
    {visible ? <span className="action-tooltip" role="tooltip" id={id}>{label}</span> : null}
  </span>;
}
