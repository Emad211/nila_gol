import './Contact.css';
import { config } from '../../data/config';
import contactBg from '../../pics/contact section.png';

const Contact = () => {
  return (
    <section id="contact" className="contact">
      <div className="contact-bg" style={{ backgroundImage: `url(${contactBg})` }} aria-hidden="true" />
      <div className="contact-overlay" aria-hidden="true" />
      <div className="container">
        <h2 className="section-title">تماس با ما</h2>
        
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <h3>تلفن تماس</h3>
                <a href={`tel:${config.contact.phone}`} className="contact-link">
                  {config.contact.phone}
                </a>
              </div>
            </div>
            
            {config.contact.instagram && (
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div>
                  <h3>اینستاگرام</h3>
                  <a 
                    href={config.contact.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="contact-link"
                  >
                    @{config.contact.instagram.split('/').pop()}
                  </a>
                </div>
              </div>
            )}
            
            {config.contact.telegram && (
              <div className="contact-item">
                <span className="contact-icon">💬</span>
                <div>
                  <h3>تلگرام</h3>
                  <a 
                    href={config.contact.telegram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="contact-link"
                  >
                    @{config.contact.telegram.split('/').pop()}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="contact-message">
            <p>
              برای سفارش، مشاوره و اطلاعات بیشتر با ما در تماس باشید.
              ما آماده پاسخگویی به سوالات شما هستیم.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
