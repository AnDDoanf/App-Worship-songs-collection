import CollectionBrowser from '../components/CollectionBrowser';

function BaihattudoCollection({ songs, isLoading, onAddToSlideshow, ...browserProps }) {
  return <CollectionBrowser {...browserProps} songs={songs} isLoading={isLoading} onAddToSlideshow={onAddToSlideshow} />;
}

export default BaihattudoCollection;
