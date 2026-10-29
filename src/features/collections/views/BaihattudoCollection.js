import CollectionBrowser from '../components/CollectionBrowser';

function BaihattudoCollection({ songs, isLoading, onAddToSlideshow }) {
  return <CollectionBrowser songs={songs} isLoading={isLoading} onAddToSlideshow={onAddToSlideshow} />;
}

export default BaihattudoCollection;
