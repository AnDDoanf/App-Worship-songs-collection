import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import BaihattudoCollection from '../features/collections/views/BaihattudoCollection';
import HosannaCollection from '../features/collections/views/HosannaCollection';
import TCXCollection from '../features/collections/views/TCXCollection';
import TVCHHCollection from '../features/collections/views/TVCHHCollection';
import SlideshowBuilder from '../features/slideshow/components/SlideshowBuilder';
import SongRecommendations from '../features/recommendations/SongRecommendationsPanel';
import { normalizeLyricText } from '../services/songLibrary';
import Popup2 from '../features/song-viewer/components/Popup2';
import LyricsProjectionModal from '../features/slideshow/components/LyricsProjectionModal';
import SetPickerModal from '../features/slideshow/components/SetPickerModal';
import {
  createDefaultState,
  DEFAULT_LIST_NAME,
  mergeSharedListIntoState,
  normalizeStoredState,
  normalizeSetDetails,
  STORAGE_KEY,
} from '../store/slideshowStore';
import { consumePendingShareLocation, getAppHomePath } from '../utils/shareLinks';
import { parseSongCodes } from '../utils/slideshow';
import { parseSheetImageSources } from '../features/song-viewer/lib/sheetImages';
import { applyChordPreference, normalizePreferences, useChordPreferences } from '../store/chordPreferences';
import { inferKey } from '../utils/chords';
import { normalizeSearch } from '../utils/songSearch';
import { downloadSetlists, mergeSetlistBackup, parseSetlistBackup } from '../utils/setlistBackup';

const collections = [
  { id: 0, key: 'all', label: 'Tất cả', component: HosannaCollection },
  {
    id: 1,
    key: 'tvchh',
    label: 'Tôn Vinh Chúa Hằng Hữu',
    component: TVCHHCollection,
  },
  {
    id: 2,
    key: 'hosanna',
    label: 'Hosanna Việt Nam',
    component: HosannaCollection,
  },
  {
    id: 3,
    key: 'free',
    label: 'Bài hát tự do',
    component: BaihattudoCollection,
  },
  {
    id: 4,
    key: 'tcx',
    label: 'Thánh Ca Xanh',
    component: TCXCollection,
  },
];

function loadInitialSlideshowState() {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  const savedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!savedValue) {
    return createDefaultState();
  }

  try {
    return normalizeStoredState(JSON.parse(savedValue));
  } catch (_error) {
    window.localStorage.removeItem(STORAGE_KEY);
    return createDefaultState();
  }
}

function HomePage({ songLibraryState }) {
  const [activeCollectionId, setActiveCollectionId] = useState(2);
  const [searchText, setSearchText] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [readerSongId, setReaderSongId] = useState('');
  const [readerInitialView, setReaderInitialView] = useState();
  const [readerScopeSongs, setReaderScopeSongs] = useState(null);
  const [pendingAddSongId, setPendingAddSongId] = useState('');
  const [slideshowState, setSlideshowState] = useState(loadInitialSlideshowState);
  const [isProjectionOpen, setIsProjectionOpen] = useState(false);
  const [playbackSongs, setPlaybackSongs] = useState([]);
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => window.innerWidth <= 560);
  const hasHandledShareImportRef = useRef(false);
  const hasHandledSongLinkRef = useRef(false);

  const allSongs = songLibraryState.songs;
  const chordPreferences = useChordPreferences();

  const songsById = useMemo(
    () =>
      allSongs.reduce((accumulator, song) => {
        accumulator[song.id.toUpperCase()] = song;
        return accumulator;
      }, {}),
    [allSongs]
  );

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 560px)');
    const update = () => setIsNarrowViewport(media ? media.matches : window.innerWidth <= 560);
    update();
    media?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      media?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (songLibraryState.isLoading || hasHandledSongLinkRef.current) return;
    hasHandledSongLinkRef.current = true;
    const id = new URL(window.location.href).searchParams.get('song')?.toUpperCase();
    if (!id) return;
    const song = songsById[id];
    if (!song) {
      toast.warning(`Không tìm thấy mã bài hát: ${id}`);
      return;
    }
    const collection = collections.find((item) => item.key === song.sourceCollectionKey);
    if (collection) setActiveCollectionId(collection.id);
    setReaderSongId(song.id.toUpperCase());
  }, [songLibraryState.isLoading, songsById]);

  const getSongsForIds = useCallback(
    (ids, preferences = {}) => ids.map((id) => songsById[id]).filter(Boolean)
      .map((song) => applyChordPreference(song, preferences[song.id.toUpperCase()] || chordPreferences[song.id.toUpperCase()])),
    [songsById, chordPreferences]
  );

  const snapshotPreferences = (ids, existing = {}) => normalizePreferences(Object.fromEntries(ids.map((id) => {
    const key = inferKey(songsById[id]?.lyric, songsById[id]?.tone);
    return [id, existing[id] || chordPreferences[id] || { sourceKey: key, targetKey: key }];
  })), ids);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slideshowState));
  }, [slideshowState]);

  useEffect(() => {
    if (hasHandledShareImportRef.current || songLibraryState.isLoading) {
      return;
    }

    hasHandledShareImportRef.current = true;

    const sharedList = consumePendingShareLocation();

    if (!sharedList) {
      return;
    }

    const validIds = [];
    const missingIds = [];

    sharedList.ids.forEach((id) => {
      if (songsById[id]) {
        if (!validIds.includes(id)) {
          validIds.push(id);
        }
        return;
      }

      missingIds.push(id);
    });

    window.history.replaceState({}, document.title, getAppHomePath());

    if (validIds.length === 0) {
      toast.warning('Liên kết chia sẻ không có bài hát hợp lệ để tạo thư mục.');
      return;
    }

    const sharedSongs = validIds.map((id) => applyChordPreference(songsById[id], sharedList.chordPreferences?.[id]));
    let importedListName = sharedList.name;

    setSlideshowState((currentState) => {
      const nextState = mergeSharedListIntoState(currentState, {
        name: sharedList.name,
        ids: validIds,
        chordPreferences: sharedList.chordPreferences,
      });

      importedListName = nextState.activeListName;
      return nextState;
    });

    const firstSong = songsById[validIds[0]];
    const matchingCollection = collections.find(
      (collection) => collection.key === firstSong?.sourceCollectionKey
    );

    if (matchingCollection) {
      setActiveCollectionId(matchingCollection.id);
    }

    setReaderScopeSongs(sharedSongs);
    setReaderSongId(sharedSongs[0].id.toUpperCase());
    setReaderInitialView('sheet');

    if (missingIds.length > 0) {
      toast.warning(
        `Đã tạo thư mục "${importedListName}" từ liên kết chia sẻ. Bỏ qua mã không tìm thấy: ${missingIds.join(', ')}`
      );
      return;
    }

    toast.success(`Đã tạo thư mục "${importedListName}" từ liên kết chia sẻ.`);
  }, [songLibraryState.isLoading, songsById]);

  const availableLists = Object.keys(slideshowState.lists);
  const newestListName = availableLists[availableLists.length - 1] || DEFAULT_LIST_NAME;

  const getSongsForListName = (listName) => {
    const list = slideshowState.lists[listName];

    if (!list) {
      return [];
    }

    return getSongsForIds(list.ids, list.chordPreferences).map((song) => ({ ...song, setNote: list.songNotes?.[song.id] || '' }));
  };

  const listSummaries = [...availableLists].reverse().map((listName) => {
    const list = slideshowState.lists[listName];
    const codes = list.draft.trim() || list.ids.join(', ');

    return {
      ...normalizeSetDetails(list, list.ids),
      name: listName,
      draft: list.draft,
      ids: list.ids,
      chordPreferences: snapshotPreferences(list.ids, list.chordPreferences),
      codesLabel: codes || 'Chưa có bài trong danh sách',
      songs: getSongsForListName(listName),
      isNewest: listName === newestListName,
    };
  });

  const activeCollection = collections.find((collection) => collection.id === activeCollectionId);
  const ActiveCollection = activeCollection?.component || HosannaCollection;
  const activeCollectionKey = activeCollection?.key || 'hosanna';
  const activeCollectionSongs = useMemo(
    () => activeCollectionKey === 'all' ? allSongs : allSongs.filter((song) => song.sourceCollectionKey === activeCollectionKey),
    [allSongs, activeCollectionKey]
  );

  const updateListByName = (listName, updater) => {
    setSlideshowState((currentState) => {
      const currentList = currentState.lists[listName];

      if (!currentList) {
        return currentState;
      }

      const nextList = typeof updater === 'function' ? updater(currentList) : updater;

      return {
        ...currentState,
        lists: {
          ...currentState.lists,
          [listName]: nextList,
        },
      };
    });
  };

  const validateDraft = (draft) => {
    const parsedCodes = parseSongCodes(draft);

    if (parsedCodes.length === 0) {
      return {
        error: '',
        ids: [],
      };
    }

    const missingCodes = parsedCodes.filter((code) => !songsById[code]);

    if (missingCodes.length > 0) {
      return {
        error: `Không tìm thấy mã bài hát: ${missingCodes.join(', ')}`,
        ids: [],
      };
    }

    return {
      error: '',
      ids: parsedCodes.filter((code, index) => parsedCodes.indexOf(code) === index),
    };
  };

  const saveListDefinition = ({ originalName = '', name, draft, serviceDate, service, status, songNotes, chordPreferences: editedPreferences }) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { error: 'Vui lòng nhập tên danh sách.' };
    }
    if (['__proto__', 'constructor', 'prototype'].includes(trimmedName)) return { error: 'Vui lòng chọn tên bộ khác.' };

    if (trimmedName !== originalName && slideshowState.lists[trimmedName]) {
      return { error: 'Tên danh sách này đã tồn tại.' };
    }

    const draftResult = validateDraft(draft);

    if (draftResult.error) {
      return draftResult;
    }

    setSlideshowState((currentState) => {
      const nextLists = { ...currentState.lists };

      if (originalName && originalName !== trimmedName) {
        delete nextLists[originalName];
      }

      nextLists[trimmedName] = {
        ...normalizeSetDetails({ ...currentState.lists[originalName],
          ...(serviceDate !== undefined ? { serviceDate } : {}), ...(service !== undefined ? { service } : {}),
          ...(status !== undefined ? { status } : {}), ...(songNotes !== undefined ? { songNotes } : {}) }, draftResult.ids),
        draft,
        ids: draftResult.ids,
        chordPreferences: snapshotPreferences(draftResult.ids, editedPreferences || currentState.lists[originalName]?.chordPreferences),
      };

      return {
        activeListName: trimmedName,
        lists: nextLists,
      };
    });

    return { error: '' };
  };

  const createList = (definition) => saveListDefinition(definition);

  const updateList = (definition) => saveListDefinition(definition);

  const duplicateList = (name) => {
    const source = slideshowState.lists[name];
    if (!source) return { error: 'Không tìm thấy bộ bài hát.' };
    const imported = { lists: { [`${name} (bản sao)`]: JSON.parse(JSON.stringify(source)) } };
    setSlideshowState((current) => mergeSetlistBackup(current, imported));
    return { error: '' };
  };

  const importLists = (text) => {
    const imported = parseSetlistBackup(text);
    setSlideshowState((current) => mergeSetlistBackup(current, imported));
    return Object.keys(imported.lists).length;
  };

  const deleteListByName = (listName) => {
    if (!slideshowState.lists[listName]) {
      return { error: '' };
    }

    if (availableLists.length <= 1) {
      return { error: 'Cần giữ lại ít nhất một danh sách.' };
    }

    setSlideshowState((currentState) => {
      const nextLists = { ...currentState.lists };
      delete nextLists[listName];

      const nextNames = Object.keys(nextLists);
      const nextActiveListName =
        currentState.activeListName === listName
          ? nextNames[nextNames.length - 1]
          : currentState.activeListName;

      return {
        activeListName: nextActiveListName,
        lists: nextLists,
      };
    });

    return { error: '' };
  };

  const undoAddition = (targetListName, normalizedId) => {
    let undone = false;
    return () => {
      if (undone) return;
      undone = true;
      updateListByName(targetListName, (currentList) => {
        if (!currentList.ids.includes(normalizedId)) return currentList;
        const chordPreferences = { ...currentList.chordPreferences };
        const songNotes = { ...currentList.songNotes };
        delete chordPreferences[normalizedId]; delete songNotes[normalizedId];
        return { ...currentList, ids: currentList.ids.filter((id) => id !== normalizedId),
          draft: parseSongCodes(currentList.draft).filter((id) => id !== normalizedId).join(', '), chordPreferences, songNotes };
      });
    };
  };

  const addSongToSlideshow = (songId, chosenListName) => {
    const normalizedId = songId.toUpperCase();
    const targetListName = chosenListName || slideshowState.activeListName || newestListName;
    const targetList = slideshowState.lists[targetListName];
    if (!targetList || targetList.ids.includes(normalizedId)) return { added: false };

    updateListByName(targetListName, (currentList) => {
      if (currentList.ids.includes(normalizedId)) {
        return currentList;
      }

      const parsedCodes = parseSongCodes(currentList.draft);
      const nextDraft = parsedCodes.includes(normalizedId)
        ? currentList.draft
        : [...parsedCodes, normalizedId].join(', ');

      return {
        ...currentList,
        draft: nextDraft,
        ids: [...currentList.ids, normalizedId],
        chordPreferences: snapshotPreferences([...currentList.ids, normalizedId], currentList.chordPreferences),
      };
    });

    return { added: true, undo: undoAddition(targetListName, normalizedId) };
  };

  const openSlideshowForList = (listName) => {
    const songs = getSongsForListName(listName);

    if (songs.length === 0) {
      return;
    }

    setSlideshowState((currentState) => ({
      ...currentState,
      activeListName: listName,
    }));
    setReaderScopeSongs(songs);
    setReaderSongId(songs[0].id.toUpperCase());
    setReaderInitialView('sheet');
  };

  const readerSongs = readerScopeSongs || allSongs;
  const readerSongIndex = readerSongs.findIndex((song) => song.id.toUpperCase() === readerSongId);
  const readerSong = readerSongs[readerSongIndex];
  const readerSheetPageCount = parseSheetImageSources(readerSong?.image).length;
  const nextReaderSong = readerSongs[readerSongIndex + 1];
  const previousReaderSong = readerSongs[readerSongIndex - 1];
  const pairedSheetSong = readerScopeSongs && readerInitialView === 'sheet' && !isNarrowViewport
    && readerSheetPageCount === 1 && parseSheetImageSources(nextReaderSong?.image).length === 1
    ? nextReaderSong
    : null;
  const previousReaderIndex = readerScopeSongs && readerInitialView === 'sheet' && !isNarrowViewport
    && parseSheetImageSources(previousReaderSong?.image).length === 1
    && parseSheetImageSources(readerSongs[readerSongIndex - 2]?.image).length === 1
    ? readerSongIndex - 2
    : readerSongIndex - 1;
  const nextReaderIndex = readerSongIndex + (pairedSheetSong ? 2 : 1);

  return (
    <>
      {!songLibraryState.isLoading && songLibraryState.source === 'fallback' ? (
        <div className="data-source-banner data-source-banner-warning">
          Không thể cập nhật thư viện. Bạn đang xem dữ liệu có sẵn trên thiết bị.
          <button type="button" className="button-mode" onClick={() => window.location.reload()}>Thử tải lại</button>
        </div>
      ) : null}

      <section className="discovery-hero discovery-standalone" id="library" aria-label="Tìm kiếm bài hát">
        <label className="visually-hidden" htmlFor="global-song-search">Tìm theo tên, mã bài hoặc lời bài hát</label>
        <form className="search discovery-search" role="search" onSubmit={(event) => {
          event.preventDefault();
          const heading = document.getElementById('song-results-heading');
          heading?.focus({ preventScroll: true });
          heading?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        }}>
          <input id="global-song-search" type="search" className="search-input" value={searchText}
            placeholder="Nhập tên, mã bài hoặc lời bài hát…"
            onChange={(event) => {
              setSearchText(event.target.value);
              if (event.target.value.trim() && !searchText.trim()) setActiveCollectionId(0);
            }} />
        </form>
        <div className="discovery-bottom">
          <div className="theme-discovery" role="group" aria-label="Khám phá theo chủ đề">
            {['Ngợi khen', 'Cảm tạ', 'Giáng Sinh', 'Phục Sinh', 'Tiệc Thánh', 'Hôn nhân'].filter((theme) => allSongs.some((song) => normalizeSearch(song.category).includes(normalizeSearch(theme)))).map((theme) => (
              <button type="button" className="button-mode" key={theme} aria-pressed={themeFilter === theme}
                onClick={() => { setThemeFilter(themeFilter === theme ? '' : theme); setActiveCollectionId(0); }}>{theme}</button>
            ))}
          </div>
        </div>
      </section>

      <section id="sets" className="set-workspace" aria-label="Chuẩn bị bộ bài hát">
      <SlideshowBuilder
        onOpenLyricsProjection={(name) => {
          setPlaybackSongs(getSongsForListName(name));
          setSlideshowState((current) => ({ ...current, activeListName: name }));
          setIsProjectionOpen(true);
        }}
        onDuplicateList={duplicateList}
        onExportLists={() => downloadSetlists(slideshowState)}
        onImportLists={importLists}
        songLibrary={allSongs}
        lists={listSummaries}
        newestListName={newestListName}
        onCreateList={createList}
        onUpdateList={updateList}
        onDeleteList={deleteListByName}
        onOpenSlideshow={openSlideshowForList}
      />

      <SongRecommendations
        onRequestAddToSet={(id) => setPendingAddSongId(id.toUpperCase())}
        songs={allSongs}
        lists={listSummaries}
        activeListName={slideshowState.activeListName}
        isLoading={songLibraryState.isLoading}
        onSelectList={(name) => setSlideshowState((current) => ({ ...current, activeListName: name }))}
        onAdd={addSongToSlideshow}
        onNotify={toast}
        onPreview={(song) => {
          setReaderSongId(song.id.toUpperCase());
          setReaderInitialView(normalizeLyricText(song.lyric) ? 'chords' : 'sheet');
        }}
      />

      </section>

      <div className="collection-menu-wrapper">
        <label className="collection-menu-mobile-label" htmlFor="collection-menu-mobile">
          Chọn tuyển tập
        </label>
        <select
          id="collection-menu-mobile"
          className="dropdown collection-menu-mobile"
          value={activeCollectionId}
          onChange={(event) => setActiveCollectionId(Number(event.target.value))}
          aria-label="Chọn tuyển tập bài hát"
        >
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.label}
            </option>
          ))}
        </select>
      </div>

      <h2 id="song-results-heading" className="library-results-heading" tabIndex={-1}>{searchText ? 'Kết quả tìm kiếm' : 'Duyệt tuyển tập'}</h2>
      <div className="collection-menu" role="tablist" aria-label="Các tuyển tập bài hát">
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className={`menu-item ${activeCollectionId === collection.id ? 'active' : ''}`}
            onClick={() => setActiveCollectionId(collection.id)}
            role="tab"
            aria-selected={activeCollectionId === collection.id}
          >
            {collection.label}
          </button>
        ))}
      </div>

      <ActiveCollection
        onRequestAddToSet={(id) => setPendingAddSongId(id.toUpperCase())}
        onOpenReader={(id, view) => { setReaderScopeSongs(null); setReaderSongId(id.toUpperCase()); setReaderInitialView(view); }}
        key={`${activeCollectionKey}:${themeFilter}`}
        hideSearch
        searchText={searchText}
        categoryFilter={themeFilter}
        songs={activeCollectionSongs}
        isLoading={songLibraryState.isLoading}
        onAddToSlideshow={addSongToSlideshow}
      />



      <Popup2
        {...readerSong}
        songId={readerSongId}
        trigger={Boolean(readerSong)}
        setTrigger={(open) => { if (!open) { setReaderSongId(''); setReaderScopeSongs(null); } }}
        initialView={readerInitialView}
        onNotify={toast}
        pairedSheetSong={pairedSheetSong}
        isSetView={Boolean(readerScopeSongs)}
        onPrevious={readerSongIndex > 0 ? () => setReaderSongId(readerSongs[previousReaderIndex].id.toUpperCase()) : undefined}
        onNext={nextReaderIndex < readerSongs.length ? () => setReaderSongId(readerSongs[nextReaderIndex].id.toUpperCase()) : undefined}
        onAdd={() => setPendingAddSongId(readerSongId)}
      />
      <SetPickerModal song={songsById[pendingAddSongId]} lists={listSummaries} activeListName={slideshowState.activeListName}
        onNotify={toast} onClose={() => setPendingAddSongId('')}
        onSelect={(name) => {
          const result = addSongToSlideshow(pendingAddSongId, name);
          if (result.added) setSlideshowState((current) => ({ ...current, activeListName: name }));
          return result;
        }}
        onCreate={(name) => {
          const result = createList({ name, draft: pendingAddSongId });
          if (result.error) return result;
          return { added: true, undo: undoAddition(name, pendingAddSongId) };
        }} />

      <LyricsProjectionModal songs={playbackSongs} trigger={isProjectionOpen} setTrigger={setIsProjectionOpen} />
    </>
  );
}

export default HomePage;
