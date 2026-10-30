import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ActionIconButton({ label, icon, onClick, className = '', disabled = false, pressed }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState(null);
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const hideTimerRef = useRef(null);
  const touchPointerRef = useRef(false);
  const showTooltip = () => {
    window.clearTimeout(hideTimerRef.current);
    setVisible(true);
  };
  const scheduleHide = () => {
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 120);
  };

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const updatePosition = () => {
      const button = buttonRef.current;
      const tooltip = tooltipRef.current;
      if (!button || !tooltip) return;
      const bounds = button.getBoundingClientRect();
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const left = Math.min(Math.max(8, bounds.left + bounds.width / 2 - width / 2), window.innerWidth - width - 8);
      const above = bounds.top - height - 8 >= 8;
      setTooltipStyle({ left, top: above ? bounds.top - 8 : bounds.bottom + 8, placement: above ? 'above' : 'below' });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.clearTimeout(hideTimerRef.current);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible]);

  const handlePointerDown = (event) => {
    touchPointerRef.current = event.pointerType === 'touch';
    if (touchPointerRef.current) setVisible(false);
  };
  const handleFocus = () => { if (!touchPointerRef.current) showTooltip(); };
  const handleKeyDown = (event) => {
    touchPointerRef.current = false;
    if (event.key === 'Escape') setVisible(false);
  };

  return <span className="icon-action" onMouseEnter={() => {
    if (!touchPointerRef.current) showTooltip();
  }} onMouseLeave={scheduleHide}>
    <button ref={buttonRef} type="button" className={`button-mode action-icon-button ${className}`} aria-label={label}
      aria-describedby={visible ? id : undefined} aria-pressed={pressed} disabled={disabled} onClick={onClick}
      onPointerDown={handlePointerDown} onFocus={handleFocus} onBlur={() => { touchPointerRef.current = false; setVisible(false); }}
      onKeyDown={handleKeyDown}>
      <span aria-hidden="true">{icon}</span>
    </button>
    {visible ? createPortal(<span ref={tooltipRef} className={`action-tooltip action-tooltip-${tooltipStyle?.placement || 'above'}`} role="tooltip" id={id}
      onMouseEnter={showTooltip} onMouseLeave={scheduleHide}
      style={tooltipStyle ? { left: tooltipStyle.left, top: tooltipStyle.top } : undefined}>{label}</span>, document.body) : null}
  </span>;
}
