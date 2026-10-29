function SongListSkeleton() {
  return (
    <>
      <p className="song-loading-status" role="status">Đang tải bài hát…</p>
      <div className="song-list" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="song song-skeleton" key={index}>
            <div className="song-header">
              <span className="song-skeleton-bar song-skeleton-title" />
              <span className="song-skeleton-bar song-skeleton-category" />
            </div>
            <div className="song-footer">
              <div className="song-footer-col1">
                <span className="song-skeleton-bar song-skeleton-detail" />
                <span className="song-skeleton-bar song-skeleton-detail" />
              </div>
              <div className="song-footer-col2">
                <span className="song-skeleton-bar song-skeleton-button" />
                <span className="song-skeleton-bar song-skeleton-button" />
                <span className="song-skeleton-bar song-skeleton-button" />
              </div>
              <div className="song-footer-col3">
                <span className="song-skeleton-bar song-skeleton-button" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default SongListSkeleton;
