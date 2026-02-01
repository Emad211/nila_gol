import './FeatureCard.css';

const FeatureCard = ({ feature }) => {
  return (
    <div className="feature-card">
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-description">{feature.description}</p>
    </div>
  );
};

export default FeatureCard;
