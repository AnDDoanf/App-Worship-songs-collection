import CollectionBrowser from '../components/CollectionBrowser';

function HosannaCollection({ songs, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} onAddToSlideshow={onAddToSlideshow} />;
}

export default HosannaCollection;
