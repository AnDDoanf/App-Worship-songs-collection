export const STORAGE_KEY = 'song-collections-slideshows';
export const DEFAULT_SHARED_LIST_NAME = 'Danh sách được chia sẻ';

function normalizeUniqueIds(ids) {
  return [...new Set((ids || []).map((id) => String(id || '').trim().toUpperCase()).filter(Boolean))];
}

function haveSameIds(leftIds, rightIds) {
  if (leftIds.length !== rightIds.length) {
    return false;
  }

  return leftIds.every((id, index) => id === rightIds[index]);
}

export function createUniqueListName(name, existingNames) {
  const normalizedName = String(name || '').trim() || DEFAULT_SHARED_LIST_NAME;

  if (!existingNames.includes(normalizedName)) {
    return normalizedName;
  }

  let suffix = 2;

  while (existingNames.includes(`${normalizedName} (${suffix})`)) {
    suffix += 1;
  }

  return `${normalizedName} (${suffix})`;
}
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

export function mergeSharedListIntoState(state, { name, ids }) {
  const normalizedIds = normalizeUniqueIds(ids);

  if (normalizedIds.length === 0) {
    return state;
  }

  const requestedName = String(name || '').trim() || DEFAULT_SHARED_LIST_NAME;
  const existingList = state.lists[requestedName];

  if (existingList && haveSameIds(existingList.ids, normalizedIds)) {
    return {
      ...state,
      activeListName: requestedName,
    };
  }

  const nextListName = existingList
    ? createUniqueListName(requestedName, Object.keys(state.lists))
    : requestedName;

  return {
    activeListName: nextListName,
    lists: {
      ...state.lists,
      [nextListName]: {
        draft: normalizedIds.join(', '),
        ids: normalizedIds,
      },
    },
  };
}
