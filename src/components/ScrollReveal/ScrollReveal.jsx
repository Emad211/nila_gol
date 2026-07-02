import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Sections that gently rise into view as the user scrolls. Targets section root
// classes so no per-component markup is needed.
const SELECTOR =
  '.product-reviews, .pdp-related, .how-steps, .how-trust, .how-cta';

export default function ScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(SELECTOR));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    els.forEach((el) => el.classList.add('reveal'));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [location.pathname]);

  return null;
}
