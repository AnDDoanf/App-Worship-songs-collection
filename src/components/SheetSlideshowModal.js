import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiXCircle } from 'react-icons/fi';
import gallery from './ImageLoader';

const SWIPE_THRESHOLD = 50;

function getSongPages(song) {
  if (!song?.image || song.image.includes('Không rõ')) {
    return [];
  }

  return song.image.split(',').map((entry) => entry.trim());
}

function buildDesktopViews(songs) {
  const preparedSongs = songs.map((song) => ({
    song,
    pages: getSongPages(song),
  }));

  const views = [];

  for (let index = 0; index < preparedSongs.length; index += 1) {
    const currentItem = preparedSongs[index];
    const nextItem = preparedSongs[index + 1];

    if (currentItem.pages.length === 1 && nextItem?.pages.length === 1) {
      views.push({
        songs: [currentItem, nextItem],
      });
      index += 1;
      continue;
    }

    views.push({
      songs: [currentItem],
    });
  }

  return views;
}

function SheetSlideshowModal({ songs, trigger, setTrigger, initialSongId }) {
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [mobilePageIndex, setMobilePageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const desktopViews = useMemo(() => buildDesktopViews(songs), [songs]);
  const activeView = desktopViews[activeViewIndex];
  const activeMobilePages = useMemo(
    () =>
      (activeView?.songs || []).flatMap(({ song, pages }) =>
        pages.map((imageKey, pageIndex) => ({
          imageKey,
          song,
          pageIndex,
        }))
      ),
    [activeView]
  );

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    const initialIndex = desktopViews.findIndex((view) =>
      view.songs.some(({ song }) => song.id === initialSongId)
    );

    setActiveViewIndex(initialIndex >= 0 ? initialIndex : 0);
    setMobilePageIndex(0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTrigger(false);
      }

      if (event.key === 'ArrowLeft') {
        setActiveViewIndex((currentIndex) => Math.max(currentIndex - 1, 0));
        setMobilePageIndex(0);
      }

      if (event.key === 'ArrowRight') {
        setActiveViewIndex((currentIndex) => Math.min(currentIndex + 1, desktopViews.length - 1));
        setMobilePageIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopViews, initialSongId, setTrigger, trigger]);

  useEffect(() => {
    setMobilePageIndex(0);
  }, [activeViewIndex]);

  if (!trigger || !activeView) {
    return null;
  }

  const goToPreviousView = () => {
    setActiveViewIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goToNextView = () => {
    setActiveViewIndex((currentIndex) => Math.min(currentIndex + 1, desktopViews.length - 1));
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) {
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchDelta = touchStartX - touchEndX;

    if (Math.abs(touchDelta) > SWIPE_THRESHOLD) {
      if (touchDelta > 0) {
        if (mobilePageIndex < activeMobilePages.length - 1) {
          setMobilePageIndex((currentIndex) => currentIndex + 1);
        } else {
          goToNextView();
        }
      } else if (mobilePageIndex > 0) {
        setMobilePageIndex((currentIndex) => currentIndex - 1);
      } else {
        goToPreviousView();
      }
    }

    setTouchStartX(null);
  };

  const desktopSongCount = activeView.songs.length;
  const metaTitle = activeView.songs.map(({ song }) => song.id).join(', ');
  const metaSubtitle = activeView.songs.map(({ song }) => song.songName).join(' | ');

  const modal = (
    <div className="popup popup-sheet-overlay" onClick={() => setTrigger(false)}>
      <div className="popup-sheet popup-slideshow-sheet" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button"
          onClick={() => setTrigger(false)}
          aria-label="Close slideshow"
        >
          <FiXCircle />
        </button>

        <div className="slideshow-meta-bar">
          <div className="slideshow-meta">
            <strong>{metaTitle}</strong>
            <span>{metaSubtitle}</span>
          </div>
          <div className="slideshow-position">
            {activeViewIndex + 1} / {desktopViews.length}
          </div>
        </div>

        {activeMobilePages.length === 0 ? (
          <div className="popup-lyric popup-empty-state">No Sheet available</div>
        ) : (
          <>
            <div className={`sheet-desktop-grid ${desktopSongCount === 1 ? 'single-song-view' : ''}`}>
              {activeView.songs.map(({ song, pages }) =>
                pages.map((imageKey, index) => (
                  <div className="sheet-desktop-page" key={`${song.id}-${imageKey}`}>
                    <img
                      loading="lazy"
                      className="image-box"
                      src={gallery[imageKey]}
                      alt={`${song.id} page ${index + 1}`}
                    />
                  </div>
                ))
              )}
            </div>

            <div
              className="sheet-carousel sheet-carousel-mobile-only"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="sheet-track"
                style={{ transform: `translateX(-${mobilePageIndex * 100}%)` }}
              >
                {activeMobilePages.map(({ imageKey, song, pageIndex }) => (
                  <div className="sheet-slide" key={`${song.id}-${imageKey}-mobile`}>
                    <img
                      loading="lazy"
                      className="image-box"
                      src={gallery[imageKey]}
                      alt={`${song.id} page ${pageIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="slideshow-nav-bar">
          <button
            type="button"
            className="sheet-nav-button"
            onClick={goToPreviousView}
            disabled={activeViewIndex === 0}
            aria-label="Previous view"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            className="sheet-nav-button"
            onClick={goToNextView}
            disabled={activeViewIndex === desktopViews.length - 1}
            aria-label="Next view"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default SheetSlideshowModal;
