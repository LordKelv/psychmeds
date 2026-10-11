import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ViewModeProvider, useViewMode } from './viewMode';
import HomePage from './pages/HomePage';
import DisorderPage from './pages/DisorderPage';
import AboutPage from './pages/AboutPage';

function Header() {
  const { mode, setMode } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const query = location.pathname === '/' ? (params.get('q') ?? '') : '';

  const onSearch = (value: string) =>
    navigate(value ? `/?q=${encodeURIComponent(value)}` : '/', { replace: location.pathname === '/' });

  return (
    <header className="site-header">
      <div className="header-row">
        <Link to="/" className="brand" aria-label="PsychMeds home">
          <img src="./icon.svg" alt="" width={28} height={28} />
          <span>PsychMeds</span>
        </Link>
        <div className="mode-toggle" role="group" aria-label="Detail level">
          <button aria-pressed={mode === 'clinician'} onClick={() => setMode('clinician')}>
            Clinician
          </button>
          <button aria-pressed={mode === 'plain'} onClick={() => setMode('plain')}>
            Plain language
          </button>
        </div>
      </div>
      <input
        className="search-input"
        type="search"
        placeholder="Search disorders, drugs, or brands…"
        aria-label="Search disorders, drugs, or brands"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </header>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ViewModeProvider>
      <ScrollToTop />
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/d/:id" element={<DisorderPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="site-footer container">
        <p>
          <strong>For education only.</strong> Not a substitute for clinical judgment or the full prescribing
          information. Always check the current FDA label before prescribing.
        </p>
        <p>
          <Link to="/about">About &amp; methodology</Link>
        </p>
      </footer>
    </ViewModeProvider>
  );
}
