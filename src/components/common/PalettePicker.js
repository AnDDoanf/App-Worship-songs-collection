import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiDroplet } from 'react-icons/fi';

const PALETTES = [
  {
    id: 'solarized',
    label: 'Solarized',
  },
  {
    id: 'warm-cozy',
    label: 'Cozy',
  },
  {
    id: 'dreamy-calming',
    label: 'Dreamy',
  },
  {
    id: 'fresh-productive',
    label: 'Fresh',
  },
  {
    id: 'minimalist-vintage',
    label: 'Vintage',  },
  {
    id: 'bright-energetic',
    label: 'Contrast',
  },
  {
    id: 'church-logo',
    label: 'Logo',
  },
];

function PalettePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const activePalette = PALETTES.find((palette) => palette.id === value) || PALETTES[0];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      if (!triggerRef.current || !menuRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = viewportWidth <= 560 ? 12 : 16;
      const left = Math.min(
        Math.max(triggerRect.left, margin),
        viewportWidth - menuRect.width - margin
      );

      setMenuStyle({
        left: `${left}px`,
        top: `${triggerRect.bottom + 10}px`,
      });
    };

    const frameId = window.requestAnimationFrame(updateMenuPosition);

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  return (
    <div className="palette-picker" ref={containerRef}>
      <button
        type="button"
        className={`palette-picker-trigger ${isOpen ? 'is-open' : ''}`}
        ref={triggerRef}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={`Chon bang mau. Hien tai: ${activePalette.label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <FiDroplet />
      </button>
      {isOpen ? (
        <div
          className="palette-picker-menu"
          ref={menuRef}
          role="menu"
          aria-label="Cac bang mau giao dien"
          style={menuStyle || undefined}
        >
          <div className="palette-picker-options">
            {PALETTES.map((palette) => {
              const isActive = palette.id === value;

              return (
                <button
                  key={palette.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  data-palette={palette.id}
                  className={`palette-picker-option ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onChange(palette.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="palette-picker-option-copy">
                    <strong>
                      <span>{palette.label}</span>
                      {isActive ? <FiCheck className="palette-picker-check" /> : null}
                    </strong>
                  </span>
                  <span className="palette-picker-option-preview" aria-hidden="true">
                    {['light', 'dark'].map((mode) => (
                      <span
                        key={mode}
                        className="palette-picker-option-swatch"
                        data-preview-palette={palette.id}
                        data-preview-mode={mode}
                      >
                        <span className="palette-picker-option-swatch-panel">
                          <span className="palette-picker-option-swatch-accent" />
                          <span className="palette-picker-option-swatch-line" />
                        </span>
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PalettePicker;
