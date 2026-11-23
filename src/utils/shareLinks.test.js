import { buildShareUrl, consumePendingShareLocation, getAppHomePath, parseShareLocation } from './shareLinks';
import { createDefaultState, mergeSharedListIntoState, normalizeStoredState } from '../store/slideshowStore';
import { applyChordPreference, readChordPreferences, saveChordPreference } from '../store/chordPreferences';

beforeEach(() => localStorage.clear());

test('preferences persist and survive share, import, reload and reshare', () => {
  const preference = { sourceKey: 'Em', targetKey: 'Dm' };
  saveChordPreference('H18', preference);
  expect(readChordPreferences().H18).toEqual(preference);
  const link = buildShareUrl({ name: 'Chủ nhật', ids: ['H18'], chordPreferences: readChordPreferences() });
  const shared = parseShareLocation(new URL(link));
  expect(shared.targetKeys.H18).toBe('Dm');
  const resolvedShared = { ...shared, chordPreferences: { H18: preference } };
  localStorage.clear();
  saveChordPreference('H18', { sourceKey: 'Em', targetKey: 'Am' });
  const state = normalizeStoredState(JSON.parse(JSON.stringify(mergeSharedListIntoState(createDefaultState(), resolvedShared))));
  const list = state.lists['Chủ nhật'];
  expect(applyChordPreference({ id: 'H18', lyric: '[Em]Chúa [B7]con' }, list.chordPreferences.H18).lyric)
    .toBe('[Dm]Chúa [A7]con');
  expect(parseShareLocation(new URL(buildShareUrl({ name: 'Again', ...list }))).targetKeys.H18).toBe('Dm');
  const changed = mergeSharedListIntoState(state, { ...shared, chordPreferences: { H18: { sourceKey: 'Em', targetKey: 'Gm' } } });
  expect(changed.activeListName).toBe('Chủ nhật (2)');
});

test('old links and malformed preference payloads remain usable', () => {
  const url = new URL(buildShareUrl({ name: 'Old', ids: ['H18'] }));
  url.searchParams.set('chords', 'invalid');
  expect(parseShareLocation(url)).toMatchObject({ ids: ['H18'], chordPreferences: {} });
  expect(normalizeStoredState({ lists: { old: { ids: 'bad' } } }).lists.old.ids).toEqual([]);
});

test('builds compact links containing only collection name, songs, and target keys', () => {
  const ids = ['H10', 'H87', 'H129A', 'H180', 'H17', 'H200', 'TD17'];
  const tones = ['Dm', 'Dm', 'Dm', 'D', 'Em', 'G', 'G'];
  const chordPreferences = Object.fromEntries(ids.map((id, index) => [id, {
    sourceKey: tones[index],
    targetKey: index === 1 ? 'Em' : tones[index],
  }]));
  const link = buildShareUrl({ name: 'Dã ngoại', ids, origin: 'https://example.com', chordPreferences });

  expect(link.length).toBeLessThan(180);
  expect(link).not.toContain('chords=');
  expect(link).not.toContain('%22');
  expect(link).toContain('?name=D%C3%A3%20ngo%E1%BA%A1i&songs=H10|Dm,H87|Em,H129A|Dm,H180|D,H17|Em,H200|G,TD17|G');
  expect(parseShareLocation(new URL(link))).toMatchObject({
    name: 'Dã ngoại',
    ids,
    targetKeys: {
      H10: 'Dm', H87: 'Em', H129A: 'Dm', H180: 'D', H17: 'Em', H200: 'G', TD17: 'G',
    },
  });
});

test('keeps the named JSON format for custom lyrics and song-code-like list names', () => {
  const custom = buildShareUrl({ name: 'Set', ids: ['H18'], origin: 'https://example.com',
    chordPreferences: { H18: { sourceKey: 'Em', targetKey: 'Dm', lyric: '[Em]Edited' } } });
  expect(custom).toContain('chords=');
  expect(parseShareLocation(new URL(custom)).chordPreferences.H18.lyric).toBe('[Em]Edited');

  const codeName = buildShareUrl({ name: 'H18', ids: ['H19'], origin: 'https://example.com' });
  expect(codeName).toContain('?name=H18&songs=H19');
  expect(parseShareLocation(new URL(codeName)).name).toBe('H18');
});

test('parses compact IDs and ignores paths outside the app share route', () => {
  expect(parseShareLocation({ pathname: '/share', search: '?H18|td37|H18' })).toMatchObject({
    ids: ['H18', 'TD37'],
    workbookUrl: '',
  });
  expect(parseShareLocation({ pathname: '/other', search: '?H18' })).toBeNull();
  expect(parseShareLocation({ pathname: '/share', search: '' })).toBeNull();
});

test('uses the public URL base path for app and share routes', () => {
  const original = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = 'https://example.com/worship/';
  expect(getAppHomePath()).toBe('/worship/');
  const url = buildShareUrl({ name: 'Set', ids: ['H18'], origin: 'https://example.com' });
  expect(url).toContain('https://example.com/worship/share?');
  if (original === undefined) delete process.env.PUBLIC_URL;
  else process.env.PUBLIC_URL = original;
});

test('consumes direct and pending share locations and ignores malformed pending data', () => {
  const original = window.location.href;
  window.history.replaceState({}, '', '/share?H18|TD37');
  expect(consumePendingShareLocation().ids).toEqual(['H18', 'TD37']);
  window.history.replaceState({}, '', '/');
  sessionStorage.setItem('song-collections-pending-share', JSON.stringify({ pathname: '/share', search: '?H19' }));
  expect(consumePendingShareLocation().ids).toEqual(['H19']);
  sessionStorage.setItem('song-collections-pending-share', '{bad json');
  expect(consumePendingShareLocation()).toBeNull();
  window.history.replaceState({}, '', new URL(original).pathname);
});
