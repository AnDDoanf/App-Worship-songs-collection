import CollectionBrowser from './CollectionBrowser';
import data from '../data/song4-data';

function TCXComponent({ onAddToSlideshow }) {
  return <CollectionBrowser songs={data} onAddToSlideshow={onAddToSlideshow} />;
}

export default TCXComponent;
