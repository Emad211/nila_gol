import { useState, useEffect } from 'react';
import './Loader.css';

const Loader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-flowers">🌸💐🌹</div>
        <h2 className="loader-title">گل‌های روسی انعطاف‌پذیر</h2>
        <div className="loader-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
