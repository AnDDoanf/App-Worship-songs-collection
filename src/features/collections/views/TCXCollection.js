import CollectionBrowser from '../components/CollectionBrowser';

function TCXCollection({ songs, isLoading, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} isLoading={isLoading} onAddToSlideshow={onAddToSlideshow} />;
}

export default TCXCollection;
