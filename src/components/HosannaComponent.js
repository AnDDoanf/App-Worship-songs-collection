import CollectionBrowser from './CollectionBrowser';
import data from '../data/song2-data.json';

function HosannaComponent({ onAddToSlideshow }) {
  return <CollectionBrowser songs={data} onAddToSlideshow={onAddToSlideshow} />;
}

export default HosannaComponent;
