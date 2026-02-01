import './Products.css';
import { products } from '../../data/products';
import ProductCard from './ProductCard';

const Products = () => {
  return (
    <section id="products" className="products">
      <div className="container">
        <h2 className="section-title">محصولات ما</h2>
        <div className="products-grid stagger-animation">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
