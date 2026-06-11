import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import BaihattudoCollection from '../features/collections/views/BaihattudoCollection';
import HosannaCollection from '../features/collections/views/HosannaCollection';
import TCXCollection from '../features/collections/views/TCXCollection';
import TVCHHCollection from '../features/collections/views/TVCHHCollection';
import LyricsQueueModal from '../features/slideshow/components/LyricsQueueModal';
import SheetSlideshowModal from '../features/slideshow/components/SheetSlideshowModal';
import SlideshowBuilder from '../features/slideshow/components/SlideshowBuilder';
import {
  createDefaultState,
  DEFAULT_LIST_NAME,
  mergeSharedListIntoState,
  normalizeStoredState,
  STORAGE_KEY,
} from '../store/slideshowStore';
import { consumePendingShareLocation, getAppHomePath } from '../utils/shareLinks';
import { parseSongCodes } from '../utils/slideshow';

const collections = [
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
  const [slideshowState, setSlideshowState] = useState(loadInitialSlideshowState);
  const [isLyricsQueueOpen, setIsLyricsQueueOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartId, setSlideshowStartId] = useState('');
  const [playbackSongs, setPlaybackSongs] = useState([]);
  const hasHandledShareImportRef = useRef(false);

  const allSongs = songLibraryState.songs;

  const songsById = useMemo(
    () =>
      allSongs.reduce((accumulator, song) => {
        accumulator[song.id.toUpperCase()] = song;
        return accumulator;
      }, {}),
    [allSongs]
  );

  const getSongsForIds = useCallback(
    (ids) => ids.map((id) => songsById[id]).filter(Boolean),
    [songsById]
  );

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
      toast('Liên kết chia sẻ không có bài hát hợp lệ để tạo thư mục.');
      return;
    }

    let importedListName = sharedList.name;

    setSlideshowState((currentState) => {
      const nextState = mergeSharedListIntoState(currentState, {
        name: sharedList.name,
        ids: validIds,
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

    if (missingIds.length > 0) {
      toast(
        `Đã tạo thư mục "${importedListName}" từ liên kết chia sẻ. Bỏ qua mã không tìm thấy: ${missingIds.join(', ')}`
      );
      return;
    }

    toast(`Đã tạo thư mục "${importedListName}" từ liên kết chia sẻ.`);
  }, [songLibraryState.isLoading, songsById]);

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
          songs: getSongsForIds(list.ids),
          isNewest: listName === newestListName,
        };
      }),
    [availableLists, getSongsForIds, newestListName, slideshowState.lists]
  );

  const ActiveCollection = useMemo(
    () =>
      collections.find((collection) => collection.id === activeCollectionId)?.component ||
      HosannaCollection,
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

  return (
    <>
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
        workbookUrl={songLibraryState.workbookUrl}
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
    </>
  );
}

export default HomePage;
