import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiXCircle } from 'react-icons/fi';
import { parseSheetImageSources } from '../../song-viewer/lib/sheetImages';
import { lockBodyScroll } from '../../../utils/bodyScrollLock';

const SWIPE_THRESHOLD = 50;
const MOBILE_BREAKPOINT = 850;

function getSongPages(song) {
  return parseSheetImageSources(song?.image);
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
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );

  const desktopViews = useMemo(() => buildDesktopViews(songs), [songs]);
  const mobilePages = useMemo(
    () =>
      songs.flatMap((song) =>
        getSongPages(song).map((imageSource, pageIndex) => ({
          imageSource,
          song,
          pageIndex,
        }))
      ),
    [songs]
  );
  const activeView = desktopViews[activeViewIndex];
  const activeMobilePage = mobilePages[mobilePageIndex];

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!trigger) {
      return undefined;
    }

    const initialIndex = desktopViews.findIndex((view) =>
      view.songs.some(({ song }) => song.id === initialSongId)
    );

    setActiveViewIndex(initialIndex >= 0 ? initialIndex : 0);

    const initialMobileIndex = mobilePages.findIndex(({ song }) => song.id === initialSongId);
    setMobilePageIndex(initialMobileIndex >= 0 ? initialMobileIndex : 0);

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTrigger(false);
      }

      if (event.key === 'ArrowLeft') {
        if (isMobileViewport) {
          setMobilePageIndex((currentIndex) => Math.max(currentIndex - 1, 0));
        } else {
          setActiveViewIndex((currentIndex) => Math.max(currentIndex - 1, 0));
          setMobilePageIndex(0);
        }
      }

      if (event.key === 'ArrowRight') {
        if (isMobileViewport) {
          setMobilePageIndex((currentIndex) => Math.min(currentIndex + 1, mobilePages.length - 1));
        } else {
          setActiveViewIndex((currentIndex) => Math.min(currentIndex + 1, desktopViews.length - 1));
          setMobilePageIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [desktopViews, initialSongId, isMobileViewport, mobilePages, setTrigger, trigger]);

  useEffect(() => {
    if (isMobileViewport) {
      return;
    }

    setMobilePageIndex(0);
  }, [activeViewIndex, isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport || !activeMobilePage) {
      return;
    }

    const matchingDesktopIndex = desktopViews.findIndex((view) =>
      view.songs.some(({ song }) => song.id === activeMobilePage.song.id)
    );

    if (matchingDesktopIndex >= 0 && matchingDesktopIndex !== activeViewIndex) {
      setActiveViewIndex(matchingDesktopIndex);
    }
  }, [activeMobilePage, activeViewIndex, desktopViews, isMobileViewport]);

  if (!trigger || !activeView) {
    return null;
  }

  const goToPreviousView = () => {
    setActiveViewIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goToNextView = () => {
    setActiveViewIndex((currentIndex) => Math.min(currentIndex + 1, desktopViews.length - 1));
  };

  const goToPreviousMobilePage = () => {
    setMobilePageIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goToNextMobilePage = () => {
    setMobilePageIndex((currentIndex) => Math.min(currentIndex + 1, mobilePages.length - 1));
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
        if (isMobileViewport) {
          goToNextMobilePage();
        } else if (mobilePageIndex < mobilePages.length - 1) {
          setMobilePageIndex((currentIndex) => currentIndex + 1);
        } else {
          goToNextView();
        }
      } else if (isMobileViewport) {
        goToPreviousMobilePage();
      } else if (mobilePageIndex > 0) {
        setMobilePageIndex((currentIndex) => currentIndex - 1);
      } else {
        goToPreviousView();
      }
    }

    setTouchStartX(null);
  };

  const desktopSongCount = activeView.songs.length;
  const metaTitle = isMobileViewport
    ? activeMobilePage?.song.id || ''
    : activeView.songs.map(({ song }) => song.id).join(', ');
  const metaSubtitle = isMobileViewport
    ? activeMobilePage?.song.songName || ''
    : activeView.songs.map(({ song }) => song.songName).join(' | ');
  const positionLabel = isMobileViewport
    ? `${mobilePageIndex + 1} / ${mobilePages.length}`
    : `${activeViewIndex + 1} / ${desktopViews.length}`;

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
          <div className="slideshow-position">{positionLabel}</div>
        </div>

        {mobilePages.length === 0 ? (
          <div className="popup-lyric popup-empty-state">No Sheet available</div>
        ) : (
          <>
            <div className={`sheet-desktop-grid ${desktopSongCount === 1 ? 'single-song-view' : ''}`}>
              {activeView.songs.map(({ song, pages }) =>
                pages.map((imageSource, index) => (
                  <div className="sheet-desktop-page" key={`${song.id}-${imageSource.id}`}>
                    <img
                      loading="lazy"
                      className="image-box"
                      src={imageSource.src}
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
                {mobilePages.map(({ imageSource, song, pageIndex }) => (
                  <div className="sheet-slide" key={`${song.id}-${imageSource.id}-mobile`}>
                    <img
                      loading="lazy"
                      className="image-box"
                      src={imageSource.src}
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
            onClick={isMobileViewport ? goToPreviousMobilePage : goToPreviousView}
            disabled={isMobileViewport ? mobilePageIndex === 0 : activeViewIndex === 0}
            aria-label={isMobileViewport ? 'Previous page' : 'Previous view'}
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            className="sheet-nav-button"
            onClick={isMobileViewport ? goToNextMobilePage : goToNextView}
            disabled={
              isMobileViewport
                ? mobilePageIndex === mobilePages.length - 1
                : activeViewIndex === desktopViews.length - 1
            }
            aria-label={isMobileViewport ? 'Next page' : 'Next view'}
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
