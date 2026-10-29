import CollectionBrowser from '../components/CollectionBrowser';

function TVCHHCollection({ songs, isLoading, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} isLoading={isLoading} onAddToSlideshow={onAddToSlideshow} />;
}

export default TVCHHCollection;
