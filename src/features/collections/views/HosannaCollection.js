import CollectionBrowser from '../components/CollectionBrowser';

function HosannaCollection({ songs, isLoading, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} isLoading={isLoading} onAddToSlideshow={onAddToSlideshow} />;
}

export default HosannaCollection;
