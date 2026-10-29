import { useMemo, useState } from 'react';
import { FiChevronDown, FiList, FiPlus, FiSearch } from 'react-icons/fi';
import { createRecommendationIndex, normalizeSearch, recommendSongs } from './recommendationEngine';
import { notifyToast, songAddedToastOptions } from '../../utils/songToasts';

function SongRecommendations({ songs, lists, activeListName, onSelectList, onAdd, onRequestAddToSet, onPreview, onNotify, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState('set');
  const [query, setQuery] = useState('');
  const [seedId, setSeedId] = useState('');
  const activeList = lists.find((list) => list.name === activeListName);
  const index = useMemo(() => isLoading ? null : createRecommendationIndex(songs), [isLoading, songs]);
  const seedSong = index?.byId.get(seedId)?.song;
  const results = useMemo(() => recommendSongs(index,
    mode === 'set' ? activeList?.songs || [] : seedSong ? [seedSong] : [],
    { excludeIds: activeList?.ids || [], limit: 4 }
  ), [activeList, index, mode, seedSong]);
  const matches = useMemo(() => {
    const normalized = normalizeSearch(query).trim();
    return normalized && !seedId ? songs.filter((song) =>
      normalizeSearch(`${song.id} ${song.songName}`).includes(normalized)
    ).slice(0, 8) : [];
  }, [query, seedId, songs]);
  const hasSeed = mode === 'set' ? Boolean(activeList?.songs.length) : Boolean(seedSong);

  return (
    <section className="song-recommendations" aria-labelledby="recommendations-heading" aria-busy={isLoading}>
      <div className="recommendations-header">
        <h2 id="recommendations-heading">
          <button className="recommendations-toggle" type="button" aria-expanded={isExpanded}
            aria-controls="recommendations-content" onClick={() => setIsExpanded((expanded) => !expanded)}>
            <span>Gợi ý bài hát</span>
            <FiChevronDown aria-hidden="true" className={isExpanded ? 'is-expanded' : ''} />
          </button>
        </h2>
      </div>
      <div id="recommendations-content" className={`recommendations-collapse ${isExpanded ? 'is-expanded' : ''}`}
        aria-hidden={!isExpanded} inert={isExpanded ? undefined : ''}>
      <div className="recommendations-content-inner">
      <div className="recommendations-header recommendations-content-header">
        <div>
          <p>Khám phá bài hát gần nhau về chủ đề, lời ca, tông và nhịp.</p>
        </div>
        <label className="recommendations-target">
          <span>Thêm vào bộ bài hát</span>
          <select className="dropdown" value={activeListName} onChange={(event) => onSelectList(event.target.value)}>
            {lists.map((list) => <option value={list.name} key={list.name}>{list.name}</option>)}
          </select>
        </label>
      </div>

      <div className="recommendations-modes" role="group" aria-label="Cách gợi ý bài hát">
        <button className="button-mode" type="button" aria-pressed={mode === 'set'} onClick={() => setMode('set')}>Theo bộ bài hát</button>
        <button className="button-mode" type="button" aria-pressed={mode === 'song'} onClick={() => setMode('song')}>Bài tương tự</button>
      </div>

      {isLoading ? <p role="status">Đang chuẩn bị gợi ý…</p> : (
        <>
          {mode === 'song' ? (
            <div className="recommendations-search">
              <label htmlFor="recommendation-search">Chọn bài hát làm gợi ý</label>
              <div className="search">
                <FiSearch aria-hidden="true" />
                <input id="recommendation-search" className="search-input" type="search" value={query}
                  placeholder="Nhập tên bài hoặc mã, ví dụ H18"
                  onChange={(event) => { setQuery(event.target.value); setSeedId(''); }} />
              </div>
              {matches.length ? (
                <ul className="recommendations-search-results" aria-label="Bài hát tìm được">
                  {matches.map((song) => <li key={song.id}>
                    <button type="button" className="button-mode" onClick={() => {
                      setSeedId(song.id.toUpperCase()); setQuery(`${song.id}. ${song.songName}`);
                    }}>{song.id}. {song.songName}</button>
                  </li>)}
                </ul>
              ) : !seedId && query.trim() ? <p role="status">Không tìm thấy bài hát phù hợp.</p> : null}
              {seedSong ? <p className="recommendations-context">Tìm bài tương tự: <strong>{seedSong.id}. {seedSong.songName}</strong></p> : null}
            </div>
          ) : activeList?.songs.length ? (
            <p className="recommendations-context">Dựa trên {activeList.songs.length} bài trong “{activeList.name}”.</p>
          ) : null}

          {!hasSeed ? (
            <div className="recommendations-empty">
              <p>{mode === 'set' ? 'Thêm bài hát đầu tiên vào danh sách để nhận gợi ý cho buổi nhóm.' : 'Tìm và chọn một bài hát để khám phá các bài tương tự.'}</p>
              {mode === 'set' ? <button type="button" className="button-mode" onClick={() => setMode('song')}>Chọn một bài để khám phá</button> : null}
            </div>
          ) : results.length ? (
            <ul className="recommendations-grid" aria-label="Bài hát được gợi ý">
              {results.map(({ song, reasons, matchedSong }) => (
                <li key={song.id} className="recommendation-card">
                  <h3>{song.id}. {song.songName}</h3>
                  <p className="recommendation-reasons">{reasons.length ? reasons.join(' · ') : 'Nội dung gần nhau'}</p>
                  {mode === 'set' && activeList.songs.length > 1 ? <p className="recommendation-match">Gần với {matchedSong.id}. {matchedSong.songName}</p> : null}
                  <div className="recommendation-actions">
                    <button type="button" className="button-mode" onClick={() => onPreview(song)} aria-label={`Xem trước ${song.id}`}><FiList aria-hidden="true" /> Xem trước</button>
                    <button type="button" className="button-mode" onClick={() => {
                      if (onRequestAddToSet) { onRequestAddToSet(song.id); return; }
                      const result = onAdd(song.id);
                      notifyToast(onNotify, result?.added ? 'success' : 'warning', result?.added ? `Đã thêm ${song.id} vào “${activeListName}”` : `${song.id} đã có trong danh sách`,
                        result?.added ? songAddedToastOptions(result.undo) : undefined);
                    }} aria-label={`Thêm gợi ý ${song.id}`}><FiPlus aria-hidden="true" /> Thêm</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p role="status">Chưa đủ dữ liệu để tìm bài gần nhau. Hãy thử một bài khác hoặc thêm bài vào danh sách.</p>}
        </>
      )}
      </div>
      </div>
    </section>
  );
}

export default SongRecommendations;
