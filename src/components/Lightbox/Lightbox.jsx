import './Lightbox.css';
import { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

// Full-screen image viewer. Pass a src to open; onClose clears it.
export default function Lightbox({ src, alt = '', onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!src) return undefined;

    const previousFocus = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // The close button is the dialog's only interactive element; keep keyboard
      // focus inside the modal rather than allowing Tab into the hidden page.
      if (e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="نمایش بزرگ تصویر"
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox-close"
        aria-label="بستن"
        onClick={onClose}
      >
        <FaTimes aria-hidden="true" />
      </button>
      <img className="lightbox-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
