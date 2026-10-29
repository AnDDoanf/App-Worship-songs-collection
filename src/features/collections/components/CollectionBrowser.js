import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Filter1 from './Filter1';
import Filter2 from './Filter2';
import Filter3 from './Filter3';
import Search from './Search';
import SongList from './SongList';
import SongListSkeleton from './SongListSkeleton';

const SONG_BATCH_SIZE = 12;

function matchesQuery(song, query) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase();

  return [song.songName, song.id, song.lyric].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery)
  );
}

function CollectionBrowser({ songs, isLoading = false, onAddToSlideshow }) {
  const [searchText, setSearchText] = useState('');
  const [visibleCount, setVisibleCount] = useState(SONG_BATCH_SIZE);
  const loadMoreRef = useRef(null);
  const [filters, setFilters] = useState({
    category: '',
    tone: '',
    timeSignature: '',
  });
  const filteredSongs = useMemo(
    () =>
      songs.filter(
        (song) =>
          matchesQuery(song, searchText) &&
          song.category
            .toLocaleLowerCase()
            .includes(filters.category.toLocaleLowerCase()) &&
          song.tone.toLocaleLowerCase().includes(filters.tone.toLocaleLowerCase()) &&
          song.timeSignature
            .toLocaleLowerCase()
            .includes(filters.timeSignature.toLocaleLowerCase())
      ),
    [filters.category, filters.timeSignature, filters.tone, searchText, songs]
  );

  useEffect(() => {
    setVisibleCount(SONG_BATCH_SIZE);
  }, [searchText, filters.category, filters.timeSignature, filters.tone, songs]);

  const visibleSongs = filteredSongs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSongs.length;

  useEffect(() => {
    if (isLoading || !hasMore || !loadMoreRef.current || !window.IntersectionObserver) {
      return;
    }

    let active = true;
    const observer = new window.IntersectionObserver((entries) => {
      if (active && entries.some((entry) => entry.isIntersecting)) {
        active = false;
        observer.disconnect();
        setVisibleCount((count) => Math.min(count + SONG_BATCH_SIZE, filteredSongs.length));
      }
    }, { rootMargin: '300px 0px' });

    observer.observe(loadMoreRef.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [filteredSongs, hasMore, isLoading, visibleCount]);

  return (
    <>
      <Search handleSearchNote={setSearchText} />
      <div className="filter-row">
        <Filter1
          handleFilter1={(value) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              category: value,
            }))
          }
        />
        <Filter2
          handleFilter2={(value) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              tone: value,
            }))
          }
        />
        <Filter3
          handleFilter3={(value) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              timeSignature: value,
            }))
          }
        />
      </div>
      <section aria-label="Danh sách bài hát" aria-busy={isLoading}>
        {isLoading ? <SongListSkeleton /> : (
          <>
            <SongList
              songs={visibleSongs}
              onAddToSlideshow={onAddToSlideshow}
              onShowToast={toast}
            />
            <div className="song-list-progress">
              <p role="status">
                {filteredSongs.length === 0
                  ? 'Không tìm thấy bài hát phù hợp.'
                  : `Đang hiển thị ${visibleSongs.length} / ${filteredSongs.length} bài hát${hasMore ? '' : ' · Đã hiển thị tất cả'}`}
              </p>
              {hasMore ? (
                <div ref={loadMoreRef}>
                  <button
                    type="button"
                    className="button-mode"
                    onClick={() => setVisibleCount((count) => Math.min(count + SONG_BATCH_SIZE, filteredSongs.length))}
                  >
                    Xem thêm bài hát
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default CollectionBrowser;
