import Header from './Header';
import Footer from './Footer';
import ScrollToTop from '../components/common/ScrollToTop';

function RootLayout({ children, mode, handleMode, palette, onPaletteChange, footerProps }) {
  return (
    <div className={`app-shell ${mode ? 'dark-mode' : ''}`}>
      <div className="container">
        <Header
          mode={mode}
          handleMode={handleMode}
          palette={palette}
          onPaletteChange={onPaletteChange}
        />
        {children}
        <ScrollToTop />
      </div>
      <Footer {...footerProps} />
    </div>
  );
}

export default RootLayout;
