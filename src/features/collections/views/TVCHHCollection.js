import CollectionBrowser from '../components/CollectionBrowser';

function TVCHHCollection({ songs, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} onAddToSlideshow={onAddToSlideshow} />;
}

export default TVCHHCollection;
