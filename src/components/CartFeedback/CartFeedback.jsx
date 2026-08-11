import './CartFeedback.css';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaShoppingBag, FaTimes } from 'react-icons/fa';
import { useCart } from '../../context/CartProvider';

export default function CartFeedback() {
  const { lastAdded, dismissLastAdded } = useCart();

  useEffect(() => {
    if (!lastAdded) return undefined;
    const timer = window.setTimeout(dismissLastAdded, 2600);
    return () => window.clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  if (!lastAdded) return null;

  return (
    <div className="cart-feedback" role="status" aria-live="polite">
      <span className="cart-feedback-icon" aria-hidden="true"><FaCheck /></span>
      <div className="cart-feedback-copy">
        <strong>{lastAdded.name}</strong>
        <span>به سبد خرید اضافه شد</span>
      </div>
      <Link to="/cart" className="cart-feedback-link" onClick={dismissLastAdded}>
        <FaShoppingBag aria-hidden="true" />
        سبد خرید
      </Link>
      <button
        type="button"
        className="cart-feedback-close"
        onClick={dismissLastAdded}
        aria-label="بستن پیام"
      >
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}
