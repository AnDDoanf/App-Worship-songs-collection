import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BaihattudoComponent from './components/BaihattudoComponent';
import churchLogo from './church-logo.svg';
import churchLogoDark from './church-logo-dark.svg';
import Header from './components/Header';
import HosannaComponent from './components/HosannaComponent';
import LyricsQueueModal from './components/LyricsQueueModal';
import ScrollToTop from './components/ScrollToTop';
import SheetSlideshowModal from './components/SheetSlideshowModal';
import SlideshowBuilder from './components/SlideshowBuilder';
import TCXComponent from './components/TCXComponent';
import TVCHHComponent from './components/TVCHHComponent';
import { loadSongLibrary } from './utils/songLibrary';

const STORAGE_KEY = 'song-collections-slideshows';
const THEME_STORAGE_KEY = 'song-collections-theme';
const DEFAULT_LIST_NAME = 'Danh sách mặc định';
const APP_TITLE = 'Thánh Ca Hội Thánh';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function setHeadLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

const collections = [
  {
    id: 1,
    key: 'tvchh',
    label: 'Tôn Vinh Chúa Hằng Hữu',
    component: TVCHHComponent,
  },
  {
    id: 2,
    key: 'hosanna',
    label: 'Hosanna Việt Nam',
    component: HosannaComponent,
  },
  {
    id: 3,
    key: 'free',
    label: 'Bài hát tự do',
    component: BaihattudoComponent,
  },
  {
    id: 4,
    key: 'tcx',
    label: 'Thánh Ca Xanh',
    component: TCXComponent,
  },
];

function parseSongCodes(value) {
  return value
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
}

function createDefaultState() {
  return {
    activeListName: DEFAULT_LIST_NAME,
    lists: {
      [DEFAULT_LIST_NAME]: {
        draft: '',
        ids: [],
      },
    },
  };
}

function normalizeStoredState(value) {
  if (!value || typeof value !== 'object') {
    return createDefaultState();
  }

  const nextLists = Object.entries(value.lists || {}).reduce((accumulator, [listName, listValue]) => {
    if (typeof listName !== 'string' || !listName.trim()) {
      return accumulator;
    }

    accumulator[listName] = {
      draft: typeof listValue?.draft === 'string' ? listValue.draft : '',
      ids: Array.isArray(listValue?.ids)
        ? listValue.ids.filter((id) => typeof id === 'string').map((id) => id.toUpperCase())
        : [],
    };

    return accumulator;
  }, {});

  if (Object.keys(nextLists).length === 0) {
    return createDefaultState();
  }

  const listNames = Object.keys(nextLists);
  const nextActiveListName =
    typeof value.activeListName === 'string' && nextLists[value.activeListName]
      ? value.activeListName
      : listNames[listNames.length - 1];

  return {
    activeListName: nextActiveListName,
    lists: nextLists,
  };
}

function App() {
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return getSystemPrefersDark();
  });
  const [activeCollectionId, setActiveCollectionId] = useState(2);
  const [slideshowState, setSlideshowState] = useState(createDefaultState);
  const [isLyricsQueueOpen, setIsLyricsQueueOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartId, setSlideshowStartId] = useState('');
  const [playbackSongs, setPlaybackSongs] = useState([]);
  const [songLibraryState, setSongLibraryState] = useState({
    songs: [],
    source: 'local',
    workbookUrl: '',
    resolvedWorkbookUrl: '',
    error: '',
    isLoading: true,
  });

  const mode = themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';
  const allSongs = songLibraryState.songs;

  const songsById = useMemo(
    () =>
      allSongs.reduce((accumulator, song) => {
        accumulator[song.id.toUpperCase()] = song;
        return accumulator;
      }, {}),
    [allSongs]
  );

  const getSongsForIds = useCallback((ids) => ids.map((id) => songsById[id]).filter(Boolean), [songsById]);

  useEffect(() => {
    let isMounted = true;

    loadSongLibrary().then((result) => {
      if (!isMounted) {
        return;
      }

      setSongLibraryState({
        ...result,
        isLoading: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return;
    }

    try {
      setSlideshowState(normalizeStoredState(JSON.parse(savedValue)));
    } catch (_error) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slideshowState));
  }, [slideshowState]);

  useEffect(() => {
    if (themePreference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', mode);
    document.title = APP_TITLE;

    const activeLogo = mode ? churchLogoDark : churchLogo;
    setHeadLink('icon', activeLogo);
    setHeadLink('apple-touch-icon', activeLogo);
  }, [mode]);

  const availableLists = useMemo(() => Object.keys(slideshowState.lists), [slideshowState.lists]);
  const newestListName = availableLists[availableLists.length - 1] || DEFAULT_LIST_NAME;

  const getSongsForListName = (listName) => {
    const list = slideshowState.lists[listName];

    if (!list) {
      return [];
    }

    return getSongsForIds(list.ids);
  };

  const listSummaries = useMemo(
    () =>
      [...availableLists].reverse().map((listName) => {
        const list = slideshowState.lists[listName];
        const codes = list.draft.trim() || list.ids.join(', ');

        return {
          name: listName,
          draft: list.draft,
          ids: list.ids,
          codesLabel: codes || 'Chưa có bài trong danh sách',
          songCount: list.ids.length,
          songs: getSongsForIds(list.ids),
          isNewest: listName === newestListName,
        };
      }),
    [availableLists, getSongsForIds, newestListName, slideshowState.lists]
  );

  const ActiveCollection = useMemo(
    () =>
      collections.find((collection) => collection.id === activeCollectionId)?.component ||
      HosannaComponent,
    [activeCollectionId]
  );

  const activeCollectionKey = useMemo(
    () => collections.find((collection) => collection.id === activeCollectionId)?.key || 'hosanna',
    [activeCollectionId]
  );

  const activeCollectionSongs = useMemo(
    () => allSongs.filter((song) => song.sourceCollectionKey === activeCollectionKey),
    [activeCollectionKey, allSongs]
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

  const saveListDefinition = ({ originalName = '', name, draft }) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { error: 'Vui lòng nhập tên danh sách.' };
    }

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
        draft,
        ids: draftResult.ids,
      };

      return {
        activeListName: trimmedName,
        lists: nextLists,
      };
    });

    return { error: '' };
  };

  const createList = ({ name, draft }) => saveListDefinition({ name, draft });

  const updateList = ({ originalName, name, draft }) =>
    saveListDefinition({ originalName, name, draft });

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

  const addSongToSlideshow = (songId) => {
    const normalizedId = songId.toUpperCase();
    const targetListName = slideshowState.activeListName || newestListName;
    let wasAdded = false;

    updateListByName(targetListName, (currentList) => {
      if (currentList.ids.includes(normalizedId)) {
        return currentList;
      }

      wasAdded = true;

      const parsedCodes = parseSongCodes(currentList.draft);
      const nextDraft = parsedCodes.includes(normalizedId)
        ? currentList.draft
        : [...parsedCodes, normalizedId].join(', ');

      return {
        draft: nextDraft,
        ids: [...currentList.ids, normalizedId],
      };
    });

    return { added: wasAdded };
  };

  const openSlideshowForList = (listName, startId = '') => {
    const songs = getSongsForListName(listName);

    if (songs.length === 0) {
      return;
    }

    setSlideshowState((currentState) => ({
      ...currentState,
      activeListName: listName,
    }));
    setPlaybackSongs(songs);
    setSlideshowStartId(startId || songs[0].id);
    setIsSlideshowOpen(true);
  };

  const openLyricsQueueForList = (listName) => {
    const songs = getSongsForListName(listName);

    if (songs.length === 0) {
      return;
    }

    setSlideshowState((currentState) => ({
      ...currentState,
      activeListName: listName,
    }));
    setPlaybackSongs(songs);
    setIsLyricsQueueOpen(true);
  };

  const handleMode = (updater) => {
    setThemePreference((currentPreference) => {
      const currentMode =
        currentPreference === 'system' ? systemPrefersDark : currentPreference === 'dark';
      const nextMode = typeof updater === 'function' ? updater(currentMode) : updater;

      return nextMode ? 'dark' : 'light';
    });
  };

  return (
    <div className={`app-shell ${mode ? 'dark-mode' : ''}`}>
      <div className="container">
        <Header mode={mode} handleMode={handleMode} />
        {songLibraryState.isLoading ? (
          <div className="data-source-banner">Đang tải kho bài hát...</div>
        ) : null}
        {!songLibraryState.isLoading && songLibraryState.source === 'remote' ? (
          <div className="data-source-banner">Đang đọc dữ liệu từ file Excel trên Drive.</div>
        ) : null}
        {!songLibraryState.isLoading && songLibraryState.source === 'fallback' ? (
          <div className="data-source-banner data-source-banner-warning">
            Không tải được file Excel trên Drive ({songLibraryState.error}). Ứng dụng đang dùng dữ
            liệu local.
            {songLibraryState.resolvedWorkbookUrl
              ? ` URL đã chuẩn hóa: ${songLibraryState.resolvedWorkbookUrl}`
              : ''}
          </div>
        ) : null}
        <SlideshowBuilder
          lists={listSummaries}
          newestListName={newestListName}
          onCreateList={createList}
          onUpdateList={updateList}
          onDeleteList={deleteListByName}
          onOpenSlideshow={openSlideshowForList}
          onOpenLyricsQueue={openLyricsQueueForList}
        />
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
        <ActiveCollection songs={activeCollectionSongs} onAddToSlideshow={addSongToSlideshow} />
        <SheetSlideshowModal
          songs={playbackSongs}
          trigger={isSlideshowOpen}
          setTrigger={setIsSlideshowOpen}
          initialSongId={slideshowStartId}
        />
        <LyricsQueueModal
          songs={playbackSongs}
          trigger={isLyricsQueueOpen}
          setTrigger={setIsLyricsQueueOpen}
        />
        <ScrollToTop />
      </div>
    </div>
  );
}

export default App;
