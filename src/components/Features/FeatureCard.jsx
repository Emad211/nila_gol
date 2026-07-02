import './FeatureCard.css';
import { FaRegGem, FaPalette, FaTint, FaRegClock, FaShieldAlt, FaHome, FaLeaf } from 'react-icons/fa';
import { MotionCard } from '../../lib/motion';

// Map the emoji stored on each feature to a refined line icon so the public
// site never shows raw emoji. Unknown icons fall back to a neutral leaf.
const ICONS = {
  '✨': FaRegGem,
  '🎨': FaPalette,
  '💧': FaTint,
  '⏰': FaRegClock,
  '🛡️': FaShieldAlt,
  '🛡': FaShieldAlt,
  '🏡': FaHome,
  '🏠': FaHome,
};

const FeatureCard = ({ feature, index = 0 }) => {
  const Icon = ICONS[(feature.icon || '').trim()] || FaLeaf;

  return (
    <MotionCard className="feature-card" index={index}>
      <span className="feature-icon" aria-hidden="true">
        <Icon />
      </span>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-description">{feature.description}</p>
    </MotionCard>
  );
};

export default FeatureCard;
