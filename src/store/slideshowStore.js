import { normalizePreferences } from './chordPreferences';

export const STORAGE_KEY = 'song-collections-slideshows';
const DEFAULT_SHARED_LIST_NAME = 'Danh sách được chia sẻ';
const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

export function normalizeSetDetails(value = {}, ids = []) {
  value = value && typeof value === 'object' ? value : {};
  return {
    serviceDate: typeof value.serviceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.serviceDate) ? value.serviceDate : '',
    service: typeof value.service === 'string' ? value.service : '',
    status: value.status === 'ready' ? 'ready' : 'draft',
    songNotes: Object.fromEntries(ids.filter((id) => typeof value.songNotes?.[id] === 'string').map((id) => [id, value.songNotes[id]])),
  };
}

function normalizeUniqueIds(ids) {
  return [...new Set((ids || []).map((id) => String(id || '').trim().toUpperCase()).filter(Boolean))];
}

function haveSameIds(leftIds, rightIds) {
  if (leftIds.length !== rightIds.length) {
    return false;
  }

  return leftIds.every((id, index) => id === rightIds[index]);
}

function createUniqueListName(name, existingNames) {
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
    if (typeof listName !== 'string' || !listName.trim() || RESERVED_NAMES.has(listName)) {
      return accumulator;
    }

    const ids = normalizeUniqueIds((Array.isArray(listValue?.ids) ? listValue.ids : []).filter((id) => typeof id === 'string'));
    accumulator[listName] = {
      ...normalizeSetDetails(listValue, ids),
      draft: typeof listValue?.draft === 'string' ? listValue.draft : '',
      chordPreferences: normalizePreferences(listValue?.chordPreferences, ids),
      ids,
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

export function mergeSharedListIntoState(state, { name, ids, chordPreferences }) {
  const normalizedIds = normalizeUniqueIds(ids);
  const preferences = normalizePreferences(chordPreferences, normalizedIds);

  if (normalizedIds.length === 0) {
    return state;
  }

  const requestedName = String(name || '').trim() || DEFAULT_SHARED_LIST_NAME;
  const existingList = state.lists[requestedName];

  if (existingList && haveSameIds(existingList.ids, normalizedIds) &&
      JSON.stringify(normalizePreferences(existingList.chordPreferences, normalizedIds)) === JSON.stringify(preferences)) {
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
        chordPreferences: preferences,
      },
    },
  };
}
