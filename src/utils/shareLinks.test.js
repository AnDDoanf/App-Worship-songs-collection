import { buildShareUrl, parseShareLocation } from './shareLinks';
import { createDefaultState, mergeSharedListIntoState, normalizeStoredState } from '../store/slideshowStore';
import { applyChordPreference, readChordPreferences, saveChordPreference } from '../store/chordPreferences';

beforeEach(() => localStorage.clear());

test('preferences persist and survive share, import, reload and reshare', () => {
  const preference = { sourceKey: 'Em', targetKey: 'Dm' };
  saveChordPreference('H18', preference);
  expect(readChordPreferences().H18).toEqual(preference);
  const link = buildShareUrl({ name: 'Chủ nhật', ids: ['H18'], chordPreferences: readChordPreferences() });
  const shared = parseShareLocation(new URL(link));
  localStorage.clear();
  saveChordPreference('H18', { sourceKey: 'Em', targetKey: 'Am' });
  const state = normalizeStoredState(JSON.parse(JSON.stringify(mergeSharedListIntoState(createDefaultState(), shared))));
  const list = state.lists['Chủ nhật'];
  expect(applyChordPreference({ id: 'H18', lyric: '[Em]Chúa [B7]con' }, list.chordPreferences.H18).lyric)
    .toBe('[Dm]Chúa [A7]con');
  expect(parseShareLocation(new URL(buildShareUrl({ name: 'Again', ...list }))).chordPreferences.H18).toEqual(preference);
  const changed = mergeSharedListIntoState(state, { ...shared, chordPreferences: { H18: { sourceKey: 'Em', targetKey: 'Gm' } } });
  expect(changed.activeListName).toBe('Chủ nhật (2)');
});

test('old links and malformed preference payloads remain usable', () => {
  const url = new URL(buildShareUrl({ name: 'Old', ids: ['H18'] }));
  url.searchParams.set('chords', 'invalid');
  expect(parseShareLocation(url)).toMatchObject({ ids: ['H18'], chordPreferences: {} });
  expect(normalizeStoredState({ lists: { old: { ids: 'bad' } } }).lists.old.ids).toEqual([]);
});
