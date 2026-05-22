import CollectionBrowser from '../components/CollectionBrowser';

function TCXCollection({ songs, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} onAddToSlideshow={onAddToSlideshow} />;
}

export default TCXCollection;
