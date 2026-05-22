function Footer({ songLibraryState }) {
  const currentYear = new Date().getFullYear();
  const isRemote = songLibraryState.source === 'remote';
  const isFallback = songLibraryState.source === 'fallback';
  const hasRemoteLink = Boolean(songLibraryState.workbookUrl);

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-top">
          <strong>Thánh Ca Hội Thánh</strong>
          <span>Version 2.03</span>
          <span>{currentYear}</span>
        </div>

        <div className="app-footer-bottom">
          <span>Liên hệ:</span>
          <a href="mailto:anddoanf.work@gmail.com">anddoanf.work@gmail.com</a>

          {songLibraryState.isLoading ? <span>Đang tải dữ liệu bài hát...</span> : null}

          {isRemote ? (
            <span className="app-footer-source-inline">
              Dữ liệu đọc từ{' '}
              {hasRemoteLink ? (
                <a
                  href={songLibraryState.workbookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  file collections
                </a>
              ) : (
                'file collections'
              )}
            </span>
          ) : null}

          {isFallback ? (
            <span className="app-footer-source-warning">
              Đang dùng dữ liệu local: {songLibraryState.error}
            </span>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
