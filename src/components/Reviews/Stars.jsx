import { FaRegStar, FaStar } from 'react-icons/fa';

const Stars = ({ value = 0, size = 'md' }) => {
  const full = Math.round(value);
  return (
    <span className={`stars stars--${size}`} aria-label={`${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const Icon = n <= full ? FaStar : FaRegStar;
        return (
          <span key={n} className={n <= full ? 'star star--on' : 'star'} aria-hidden="true">
            <Icon />
          </span>
        );
      })}
    </span>
  );
};

export default Stars;
