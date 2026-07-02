import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

// Dark/light toggle. The initial theme is applied pre-paint by an inline script
// in index.html. SSR-safe: renders a stable icon on the server and the first
// client render, then syncs to the real theme after mount (no hydration mismatch).
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage blocked — ignore */
    }
    setDark(!dark);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'حالت روشن' : 'حالت تیره'}
      title={dark ? 'حالت روشن' : 'حالت تیره'}
    >
      {dark ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
    </button>
  );
}
