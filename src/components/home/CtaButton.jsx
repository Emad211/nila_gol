import { Link } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa6';
import './CtaButton.css';

// The landing's signature CTA (PLAN.md §1): pink pill with the asymmetric
// corner treatment r[30,2,30,2] copied VERBATIM (physical values — the Figma
// file is RTL-authored), Vazirmatn SemiBold 24px white + left chevron.
// Chevron points left because RTL "forward" is leftward.
function CtaButton({ to, children, className = '', ...rest }) {
  return (
    <Link to={to} className={`nl-cta ${className}`.trim()} {...rest}>
      <span className="nl-cta__label">{children}</span>
      <FaChevronLeft aria-hidden="true" className="nl-cta__chev" />
    </Link>
  );
}

export default CtaButton;
