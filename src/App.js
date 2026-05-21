import React, { useEffect, useMemo, useState } from 'react';
import BaihattudoComponent from './components/BaihattudoComponent';
import Header from './components/Header';
import HosannaComponent from './components/HosannaComponent';
import ScrollToTop from './components/ScrollToTop';
import SheetSlideshowModal from './components/SheetSlideshowModal';
import SlideshowBuilder from './components/SlideshowBuilder';
import TCXComponent from './components/TCXComponent';
import TVCHHComponent from './components/TVCHHComponent';
import songData from './data/song-data.json';
import song2Data from './data/song2-data.json';
import song3Data from './data/song3-data.json';
import song4Data from './data/song4-data';

const STORAGE_KEY = 'song-collections-slideshows';
const THEME_STORAGE_KEY = 'song-collections-theme';
const DEFAULT_LIST_NAME = 'Danh sách mặc định';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const collections = [
  {
    id: 1,
    label: 'Tôn Vinh Chúa Hằng Hữu',
    component: TVCHHComponent,
  },
  {
    id: 2,
    label: 'Hosanna Việt Nam',
    component: HosannaComponent,
  },
  {
    id: 3,
    label: 'Bài hát tự do',
    component: BaihattudoComponent,
  },
  {
    id: 4,
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

  const nextActiveListName =
    typeof value.activeListName === 'string' && nextLists[value.activeListName]
      ? value.activeListName
      : Object.keys(nextLists)[0];

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
  const [activeListNameInput, setActiveListNameInput] = useState(DEFAULT_LIST_NAME);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartId, setSlideshowStartId] = useState('');

  const mode = themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';

  const allSongs = useMemo(
    () => [...songData, ...song2Data, ...song3Data, ...song4Data],
    []
  );

  const songsById = useMemo(
    () =>
      allSongs.reduce((accumulator, song) => {
        accumulator[song.id.toUpperCase()] = song;
        return accumulator;
      }, {}),
    [allSongs]
  );

  useEffect(() => {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return;
    }

    try {
      const parsedValue = normalizeStoredState(JSON.parse(savedValue));
      setSlideshowState(parsedValue);
      setActiveListNameInput(parsedValue.activeListName);
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

  const activeList = slideshowState.lists[slideshowState.activeListName] || {
    draft: '',
    ids: [],
  };

  const availableLists = useMemo(() => Object.keys(slideshowState.lists), [slideshowState.lists]);

  const slideshowSongs = useMemo(
    () => activeList.ids.map((id) => songsById[id]).filter(Boolean),
    [activeList.ids, songsById]
  );

  const ActiveCollection = useMemo(
    () =>
      collections.find((collection) => collection.id === activeCollectionId)?.component ||
      HosannaComponent,
    [activeCollectionId]
  );

  const updateActiveList = (updater) => {
    setSlideshowState((currentState) => {
      const currentList = currentState.lists[currentState.activeListName] || { draft: '', ids: [] };
      const nextList = typeof updater === 'function' ? updater(currentList) : updater;

      return {
        ...currentState,
        lists: {
          ...currentState.lists,
          [currentState.activeListName]: nextList,
        },
      };
    });
  };

  const handleDraftChange = (value) => {
    updateActiveList((currentList) => ({
      ...currentList,
      draft: value,
    }));
  };

  const addSongToSlideshow = (songId) => {
    const normalizedId = songId.toUpperCase();
    let wasAdded = false;

    updateActiveList((currentList) => {
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

  const buildQueueFromDraft = (value) => {
    const parsedCodes = parseSongCodes(value);

    if (parsedCodes.length === 0) {
      updateActiveList((currentList) => ({
        ...currentList,
        ids: [],
        draft: value,
      }));
      return { error: '' };
    }

    const missingCodes = parsedCodes.filter((code) => !songsById[code]);

    if (missingCodes.length > 0) {
      return {
        error: `Không tìm thấy mã bài hát: ${missingCodes.join(', ')}`,
      };
    }

    const uniqueCodes = parsedCodes.filter((code, index) => parsedCodes.indexOf(code) === index);

    updateActiveList({
      draft: value,
      ids: uniqueCodes,
    });

    return { error: '' };
  };

  const saveActiveList = () => {
    const trimmedName = activeListNameInput.trim();

    if (!trimmedName) {
      return { error: 'Vui lòng nhập tên danh sách.' };
    }

    if (trimmedName !== slideshowState.activeListName && slideshowState.lists[trimmedName]) {
      return { error: 'Tên danh sách này đã tồn tại.' };
    }

    setSlideshowState((currentState) => {
      const currentList = currentState.lists[currentState.activeListName];

      if (trimmedName === currentState.activeListName || currentState.lists[trimmedName]) {
        return currentState;
      }

      return {
        activeListName: trimmedName,
        lists: {
          ...currentState.lists,
          [trimmedName]: currentList,
        },
      };
    });

    setActiveListNameInput(trimmedName);

    return { error: '' };
  };

  const createNewList = () => {
    const trimmedName = activeListNameInput.trim();

    if (!trimmedName) {
      return { error: 'Vui lòng nhập tên danh sách.' };
    }

    if (slideshowState.lists[trimmedName]) {
      return { error: 'Tên danh sách này đã tồn tại.' };
    }

    setSlideshowState((currentState) => ({
      activeListName: trimmedName,
      lists: {
        ...currentState.lists,
        [trimmedName]: {
          draft: '',
          ids: [],
        },
      },
    }));

    setActiveListNameInput(trimmedName);

    return { error: '' };
  };

  const selectList = (listName) => {
    if (!slideshowState.lists[listName]) {
      return;
    }

    setSlideshowState((currentState) => ({
      ...currentState,
      activeListName: listName,
    }));
    setActiveListNameInput(listName);
  };

  const clearSlideshow = () => {
    updateActiveList({
      draft: '',
      ids: [],
    });
  };

  const deleteActiveList = () => {
    setSlideshowState((currentState) => {
      const listNames = Object.keys(currentState.lists);

      if (listNames.length <= 1) {
        return currentState;
      }

      const nextLists = { ...currentState.lists };
      delete nextLists[currentState.activeListName];

      const nextActiveListName = Object.keys(nextLists)[0];
      setActiveListNameInput(nextActiveListName);

      return {
        activeListName: nextActiveListName,
        lists: nextLists,
      };
    });
  };

  const openSlideshow = (startId = '') => {
    if (slideshowSongs.length === 0) {
      return;
    }

    setSlideshowStartId(startId || slideshowSongs[0].id);
    setIsSlideshowOpen(true);
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
        <SlideshowBuilder
          selectedListName={slideshowState.activeListName}
          listNameInput={activeListNameInput}
          availableLists={availableLists}
          draftValue={activeList.draft}
          onDraftChange={handleDraftChange}
          onSelectList={selectList}
          onListNameChange={setActiveListNameInput}
          onCreateList={createNewList}
          onSaveList={saveActiveList}
          onBuildQueue={buildQueueFromDraft}
          queueSongs={slideshowSongs}
          onOpenSlideshow={() => openSlideshow()}
          onClearQueue={clearSlideshow}
          onDeleteList={deleteActiveList}
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
        <ActiveCollection onAddToSlideshow={addSongToSlideshow} />
        <SheetSlideshowModal
          songs={slideshowSongs}
          trigger={isSlideshowOpen}
          setTrigger={setIsSlideshowOpen}
          initialSongId={slideshowStartId}
        />
        <ScrollToTop />
      </div>
    </div>
  );
}

export default App;
