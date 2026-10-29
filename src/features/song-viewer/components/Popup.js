import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiXCircle } from 'react-icons/fi';
import { parseSheetImageSources } from '../lib/sheetImages';
import ThemeSheet from './ThemeSheet';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';
import { useSheetViewport } from '../../../utils/useSheetViewport';

const SWIPE_THRESHOLD = 50;

function Popup({ image, trigger, setTrigger }) {
  const overlayRef = useRef(null);
  useSheetViewport(overlayRef, trigger);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const images = parseSheetImageSources(image);

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    setActiveIndex(0);

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTrigger(false);
      }

      if (images.length > 1 && event.key === 'ArrowLeft') {
        setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      }

      if (images.length > 1 && event.key === 'ArrowRight') {
        setActiveIndex((currentIndex) => Math.min(currentIndex + 1, images.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, setTrigger, trigger]);

  if (!trigger) {
    return null;
  }

  const handleTouchStart = (event) => {
    const canSwipe = event.touches.length === 1 && (window.visualViewport?.scale ?? 1) <= 1;
    setTouchStartX(canSwipe ? event.touches[0].clientX : null);
  };

  const handleTouchEnd = (event) => {
    if (
      touchStartX === null ||
      event.touches.length > 0 ||
      (window.visualViewport?.scale ?? 1) > 1
    ) {
      setTouchStartX(null);
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchDelta = touchStartX - touchEndX;

    if (Math.abs(touchDelta) > SWIPE_THRESHOLD) {
      if (touchDelta > 0) {
        setActiveIndex((currentIndex) => Math.min(currentIndex + 1, images.length - 1));
      } else {
        setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      }
    }

    setTouchStartX(null);
  };

  const modal = (
    <div ref={overlayRef} className="popup popup-sheet-overlay" onClick={() => setTrigger(false)}>
      <div
        className={`popup-sheet ${images.length === 2 ? 'popup-sheet-dual' : 'popup-sheet-carousel'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="popup-close-button"
          onClick={() => setTrigger(false)}
          aria-label="Close sheet view"
        >
          <FiXCircle />
        </button>
        {images.length === 0 ? (
          <div className="popup-lyric popup-empty-state">No Sheet available</div>
        ) : (
          <>
            {images.length === 2 && (
              <div className="sheet-desktop-grid">
                {images.map((imageSource, index) => (
                  <div className="sheet-desktop-page" key={imageSource.id}>
                    <ThemeSheet className="image-box" source={imageSource.src} label={`Sheet page ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}

            <div
              className={`sheet-carousel ${images.length === 2 ? 'sheet-carousel-mobile-only' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={() => setTouchStartX(null)}
            >
              <div className="sheet-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                {images.map((imageSource, index) => (
                  <div className="sheet-slide" key={imageSource.id}>
                    <ThemeSheet className="image-box" source={imageSource.src} label={`Sheet page ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <div className="sheet-controls">
                <button
                  type="button"
                  className="sheet-nav-button"
                  onClick={() => setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0))}
                  disabled={activeIndex === 0}
                  aria-label="Previous sheet page"
                >
                  <FiChevronLeft />
                </button>
                <div className="sheet-pagination">
                  {images.map((imageSource, index) => (
                    <button
                      type="button"
                      key={`${imageSource.id}-${index}`}
                      className={`sheet-dot ${index === activeIndex ? 'active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`View sheet page ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="sheet-nav-button"
                  onClick={() =>
                    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, images.length - 1))
                  }
                  disabled={activeIndex === images.length - 1}
                  aria-label="Next sheet page"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
            <p className="sheet-hint">
              {images.length === 2
                ? 'Desktop shows both pages together. Swipe on phone to change pages.'
                : 'Swipe left or right on phone to change pages.'}
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default Popup;
