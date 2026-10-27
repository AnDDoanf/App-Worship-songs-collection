import { useEffect, useState } from 'react';
import { isKey, transposeLyrics } from '../utils/chords';

const CHORD_STORAGE_KEY = 'song-collections-chord-preferences';
const CHANGE_EVENT = 'song-chord-preferences-changed';

export function normalizePreferences(value, ids) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  Object.entries(value).forEach(([id, preference]) => {
    const code = id.toUpperCase();
    if (!/^[A-Z]+\d+[A-Z0-9]*$/.test(code) || (ids && !ids.includes(code))) return;
    if (!isKey(preference?.sourceKey) || !isKey(preference?.targetKey)) return;
    result[code] = { sourceKey: preference.sourceKey, targetKey: preference.targetKey };
    if (typeof preference.lyric === 'string') result[code].lyric = preference.lyric;
  });
  return result;
}

export function readChordPreferences() {
  try {
    return normalizePreferences(JSON.parse(window.localStorage.getItem(CHORD_STORAGE_KEY)));
  } catch (_error) {
    return {};
  }
}

export function saveChordPreference(id, preference) {
  const preferences = readChordPreferences();
  const code = id.toUpperCase();
  if (preference) preferences[code] = preference;
  else delete preferences[code];
  try {
    window.localStorage.setItem(CHORD_STORAGE_KEY, JSON.stringify(normalizePreferences(preferences)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch (_error) {
    return false;
  }
}

export function useChordPreferences() {
  const [preferences, setPreferences] = useState(readChordPreferences);
  useEffect(() => {
    const refresh = () => setPreferences(readChordPreferences());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return preferences;
}

export function applyChordPreference(song, preference) {
  if (!preference) return song;
  return {
    ...song,
    tone: preference.targetKey,
    lyric: transposeLyrics(preference.lyric ?? song.lyric, preference.sourceKey, preference.targetKey),
  };
}
