import { normalizeStoredState } from '../store/slideshowStore';
import { mergeSetlistBackup, parseSetlistBackup, serializeSetlists } from './setlistBackup';

const state = { activeListName: 'Chúa nhật', lists: { 'Chúa nhật': {
  ids: ['H18', 'T1'], draft: 'H18, T1', serviceDate: '2026-11-01', service: 'Ban hát sáng', status: 'ready',
  songNotes: { H18: 'Câu 1, điệp khúc hai lần' },
  chordPreferences: { H18: { sourceKey: 'Em', targetKey: 'Dm', lyric: '[Em]Bản phối riêng' } },
} } };
test('backs up order, service details, notes and private arrangements without changing source data', () => {
  expect(parseSetlistBackup(serializeSetlists(state))).toEqual(normalizeStoredState(state));
  expect(state.lists['Chúa nhật'].chordPreferences.H18.targetKey).toBe('Dm');
});
test('imports a duplicate name as a new set while keeping existing preparation', () => {
  const imported = parseSetlistBackup(serializeSetlists(state));
  const merged = mergeSetlistBackup(state, imported);
  expect(merged.lists['Chúa nhật']).toBe(state.lists['Chúa nhật']);
  expect(merged.lists['Chúa nhật (2)'].songNotes.H18).toBe('Câu 1, điệp khúc hai lần');
  expect(merged.activeListName).toBe('Chúa nhật (2)');
});
test('rejects corrupt or unsupported backups and preserves legacy lists', () => {
  expect(() => parseSetlistBackup('{bad')).toThrow();
  expect(() => parseSetlistBackup('{"format":"worship-setlists","version":9}')).toThrow();
  expect(() => parseSetlistBackup('{"format":"worship-setlists","version":1,"state":{"lists":{"__proto__":{"ids":[]}}}}')).toThrow();
  const legacy = normalizeStoredState({ lists: { Old: { ids: ['h18', 'H18'], draft: 'H18' } } });
  expect(legacy.lists.Old.ids).toEqual(['H18']);
  expect(legacy.lists.Old.status).toBe('draft');
});
