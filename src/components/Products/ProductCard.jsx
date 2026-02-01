import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-cover" aria-hidden="true">
        <div className="product-orb" />
      </div>
      <div className="product-category">{product.category}</div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-description">{product.description}</p>
      
      <div className="product-features">
        {product.features.map((feature, index) => (
          <span key={index} className="product-feature-tag">
            {feature}
          </span>
        ))}
      </div>
      
      <div className="product-footer">
        <span className="product-price">{product.price} تومان</span>
      </div>
    </div>
  );
};

export default ProductCard;
