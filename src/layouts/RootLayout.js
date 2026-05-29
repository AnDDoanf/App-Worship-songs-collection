import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from '../components/common/ScrollToTop';
import UsageGuideModal from '../components/common/UsageGuideModal';

function RootLayout({ children, mode, handleMode, palette, onPaletteChange, footerProps }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className={`app-shell ${mode ? 'dark-mode' : ''}`}>
      <div className="container">
        <Header
          mode={mode}
          handleMode={handleMode}
          palette={palette}
          onPaletteChange={onPaletteChange}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
        {children}
        <ScrollToTop />
        <UsageGuideModal trigger={isGuideOpen} setTrigger={setIsGuideOpen} />
      </div>
      <Footer {...footerProps} />
    </div>
  );
}

export default RootLayout;
