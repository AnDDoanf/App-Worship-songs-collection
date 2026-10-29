import { parseSheetImageSources } from './sheetImages';

jest.mock('./gallery', () => ({
  __esModule: true,
  default: { knownPage: '/assets/knownPage.webp' },
}));

test('returns no pages for empty or unknown placeholders', () => {
  expect(parseSheetImageSources('')).toEqual([]);
  expect(parseSheetImageSources('KhÃ´ng rÃµ')).toEqual([]);
  expect(parseSheetImageSources(' ,  ')).toEqual([]);
});

test('resolves local keys from bare names, paths, and image filenames', () => {
  const pages = parseSheetImageSources('knownPage, scans/knownPage.png, knownPage.webp?version=2');
  expect(pages).toHaveLength(3);
  expect(pages.map((page) => page.kind)).toEqual(['local', 'local', 'local']);
  expect(pages[0]).toMatchObject({ id: 'local-knownPage-0', src: '/assets/knownPage.webp', label: 'knownPage' });
});

test('resolves supported Google Drive URL formats and ordinary remote URLs', () => {
  const pages = parseSheetImageSources([
    'https://drive.google.com/open?id=file-one',
    'https://drive.google.com/file/d/file-two/view',
    'https://drive.google.com/uc?id=file-three',
    'https://images.example.com/page.jpg',
  ].join(','));
  expect(pages.map((page) => page.src)).toEqual([
    'https://drive.google.com/thumbnail?id=file-one&sz=w2000',
    'https://drive.google.com/thumbnail?id=file-two&sz=w2000',
    'https://drive.google.com/thumbnail?id=file-three&sz=w2000',
    'https://images.example.com/page.jpg',
  ]);
});

test('drops malformed, unsupported, and empty list entries', () => {
  expect(parseSheetImageSources('not-a-url,ftp://example.com/sheet.png,,')).toEqual([]);
  expect(parseSheetImageSources('https://example.com/page.svg')).toHaveLength(1);
});

test('keeps ordinary HTTP URLs and safely ignores malformed or unsupported sources', () => {
  expect(parseSheetImageSources('https://drive.google.co.uk/open?id=outside,https://images.example.com/page.svg'))
    .toMatchObject([{ kind: 'remote', label: 'https://drive.google.co.uk/open?id=outside' }, { kind: 'remote', label: 'https://images.example.com/page.svg' }]);
  expect(parseSheetImageSources('ftp://drive.google.com/unknown/path')).toEqual([]);
});
