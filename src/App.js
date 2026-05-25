import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { loadSongLibrary } from './services/songLibrary';
import churchLogo from './assets/logos/church-logo.svg';
import churchLogoDark from './assets/logos/church-logo-dark.svg';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';

const THEME_STORAGE_KEY = 'song-collections-theme';
const APP_TITLE = 'Thánh Ca Hội Thánh';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function setHeadLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

function App() {
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return getSystemPrefersDark();
  });
  const [songLibraryState, setSongLibraryState] = useState({
    songs: [],
    source: 'local',
    workbookUrl: '',
    resolvedWorkbookUrl: '',
    error: '',
    isLoading: true,
  });

  const mode = themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';

  useEffect(() => {
    let isMounted = true;

    loadSongLibrary().then((result) => {
      if (!isMounted) {
        return;
      }

      setSongLibraryState({
        ...result,
        isLoading: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (themePreference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', mode);
    document.title = APP_TITLE;

    const activeLogo = mode ? churchLogoDark : churchLogo;
    setHeadLink('icon', activeLogo);
    setHeadLink('apple-touch-icon', activeLogo);
  }, [mode]);

  const handleMode = (updater) => {
    setThemePreference((currentPreference) => {
      const currentMode =
        currentPreference === 'system' ? systemPrefersDark : currentPreference === 'dark';
      const nextMode = typeof updater === 'function' ? updater(currentMode) : updater;

      return nextMode ? 'dark' : 'light';
    });
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        theme={mode ? 'dark' : 'light'}
        toastOptions={{
          duration: 2200,
        }}
      />
      <RootLayout mode={mode} handleMode={handleMode} footerProps={{ songLibraryState }}>
        <HomePage
          songLibraryState={songLibraryState}
          setSongLibraryState={setSongLibraryState}
        />
      </RootLayout>
    </>
  );
}

export default App;
