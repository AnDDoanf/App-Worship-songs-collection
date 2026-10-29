import songData from './song-data.json';
import song2Data from './song2-data.json';
import song3Data from './song3-data.json';
import song4Data from './song4-data';
import { COLLECTION_DEFINITIONS } from './collectionDefinitions';

const songsByCollection = { tvchh: songData, hosanna: song2Data, free: song3Data, tcx: song4Data };

export const LOCAL_SONG_SOURCES = COLLECTION_DEFINITIONS.map((definition) => ({
  ...definition,
  songs: songsByCollection[definition.key],
}));
