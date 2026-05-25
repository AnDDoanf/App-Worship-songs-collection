import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'sonner';
import Filter1 from './Filter1';
import Filter2 from './Filter2';
import Filter3 from './Filter3';
import Search from './Search';
import SongList from './SongList';

const DEFAULT_SONGS_PER_PAGE = 12;
const PAGE_SIZE_OPTIONS = [8, 12, 16, 24];

function matchesQuery(song, query) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase();

  return [song.songName, song.id, song.lyric].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery)
  );
}

function CollectionBrowser({ songs, onAddToSlideshow }) {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [songsPerPage, setSongsPerPage] = useState(DEFAULT_SONGS_PER_PAGE);
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

  const totalPages = Math.max(1, Math.ceil(filteredSongs.length / songsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filters.category, filters.timeSignature, filters.tone]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pagedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * songsPerPage;
    return filteredSongs.slice(startIndex, startIndex + songsPerPage);
  }, [currentPage, filteredSongs, songsPerPage]);

  const handlePageSizeChange = (nextPageSize) => {
    const currentStartIndex = (currentPage - 1) * songsPerPage;
    const nextPage = Math.floor(currentStartIndex / nextPageSize) + 1;

    setSongsPerPage(nextPageSize);
    setCurrentPage(nextPage);
  };

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
      <div className="song-pagination">
        <div className="song-pagination-controls">
          <button
            type="button"
            className="button-mode pagination-button"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <FiChevronLeft />
          </button>
          <span className="song-pagination-current">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="button-mode pagination-button"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      <SongList
        songs={pagedSongs}
        onAddToSlideshow={onAddToSlideshow}
        onShowToast={toast}
      />
      <div className="song-page-size-bar">
        <label className="song-page-size" htmlFor="song-page-size-select">
          <span>Hiển thị</span>
          <select
            id="song-page-size-select"
            className="dropdown song-page-size-select"
            value={songsPerPage}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span>bài/trang</span>
        </label>
      </div>
    </>
  );
}

export default CollectionBrowser;
