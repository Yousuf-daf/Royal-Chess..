import { useCallback, useEffect, useState } from 'react';
import type { GameSettings, MatchConfig, PageRoute } from './types/chess';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './utils/settings';
import { soundEngine } from './utils/sound';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { AboutPage } from './pages/AboutPage';

const PATH_TO_PAGE: Record<string, PageRoute> = {
  '/': 'home',
  '/play': 'play',
  '/how-to-play': 'how-to-play',
  '/about': 'about',
  '/settings': 'settings',
};

const PAGE_TO_PATH: Record<PageRoute, string> = {
  home: '/',
  play: '/play',
  'how-to-play': '/how-to-play',
  about: '/about',
  settings: '/settings',
};

function getPageFromLocation(): PageRoute {
  if (typeof window === 'undefined') return 'home';
  const normalized = window.location.pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_PAGE[normalized] ?? 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(getPageFromLocation);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const loaded = loadSettings();
    soundEngine.setEnabled(loaded.soundEnabled);
    return loaded;
  });

  const [matchConfig, setMatchConfig] = useState<MatchConfig>(() => ({
    mode: 'ai',
    difficulty: settings.defaultDifficulty,
    playerColor: 'w',
    timeControl: settings.defaultTimeControl,
  }));

  // Sync browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((page: PageRoute) => {
    setCurrentPage(page);
    const targetPath = PAGE_TO_PATH[page];
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      soundEngine.setEnabled(next.soundEnabled);
      return next;
    });
  }, []);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    soundEngine.setEnabled(DEFAULT_SETTINGS.soundEnabled);
  }, []);

  const handleStartMatch = useCallback(
    (partial: Partial<MatchConfig>) => {
      setMatchConfig((prev) => ({
        ...prev,
        ...partial,
      }));
      handleNavigate('play');
    },
    [handleNavigate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0E] text-[#F2EFE9]">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onStartMatch={handleStartMatch} onNavigate={handleNavigate} />
        )}
        {currentPage === 'play' && (
          <PlayPage
            settings={settings}
            initialMatchConfig={matchConfig}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'how-to-play' && <HowToPlayPage onNavigate={handleNavigate} />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
