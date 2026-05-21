import CollectionBrowser from './CollectionBrowser';
import data from '../data/song-data.json';

const TVCHHComponent = ({ onAddToSlideshow }) => {
  return <CollectionBrowser songs={data} onAddToSlideshow={onAddToSlideshow} />;
};

export default TVCHHComponent;
