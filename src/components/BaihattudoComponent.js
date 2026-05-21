import CollectionBrowser from './CollectionBrowser';
import data from '../data/song3-data.json';

function BaihattudoComponent({ onAddToSlideshow }) {
  return <CollectionBrowser songs={data} onAddToSlideshow={onAddToSlideshow} />;
}

export default BaihattudoComponent;
