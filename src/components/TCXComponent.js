import CollectionBrowser from './CollectionBrowser';

function TCXComponent({ songs, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} onAddToSlideshow={onAddToSlideshow} />;
}

export default TCXComponent;
