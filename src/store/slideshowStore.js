export const STORAGE_KEY = 'song-collections-slideshows';
export const DEFAULT_LIST_NAME = 'Danh sách mặc định';

export function createDefaultState() {
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

export function normalizeStoredState(value) {
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
