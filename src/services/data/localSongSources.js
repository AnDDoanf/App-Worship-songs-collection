import songData from './song-data.json';
import song2Data from './song2-data.json';
import song3Data from './song3-data.json';
import song4Data from './song4-data';

export const LOCAL_SONG_SOURCES = [
  {
    key: 'tvchh',
    label: 'Tôn Vinh Chúa Hằng Hữu',
    sheetName: 'TVCHH',
    songs: songData,
  },
  {
    key: 'hosanna',
    label: 'Hosanna Việt Nam',
    sheetName: 'HOSANNA',
    songs: song2Data,
  },
  {
    key: 'free',
    label: 'Bài hát tự do',
    sheetName: 'BAI_HAT_TU_DO',
    songs: song3Data,
  },
  {
    key: 'tcx',
    label: 'Thánh Ca Xanh',
    sheetName: 'THANH_CA_XANH',
    songs: song4Data,
  },
];
