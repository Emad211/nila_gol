import './Contact.css';
import { useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTelegramPlane,
} from 'react-icons/fa';
import { config } from '../../data/config';
import contactImage from '../../assets/contact.webp';

const initialForm = { name: '', phone: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const phoneRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status === 'success' || status === 'invalid' || status === 'error') setStatus('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    // A valid Iranian mobile: 10–11 digits, optional leading 0 (matches Checkout).
    const phone = form.phone.trim();
    if (!/^0?\d{10,11}$/.test(phone.replace(/[\s-]/g, ''))) {
      setStatus('invalid');
      phoneRef.current?.focus();
      return;
    }

    setStatus('submitting');
    try {
      const { submitInquiry } = await import('../../services/inquiries');
      await submitInquiry(form);
      setForm(initialForm);
      setStatus('success');
    } catch (err) {
      console.error('[contact] submit failed', err);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="contact contact--concierge" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact-concierge-shell">
          <div className="contact-concierge-media">
            <img src={contactImage} alt="گل روسی نیلا گل برای مشاوره و سفارش" loading="lazy" decoding="async" />
            <div className="contact-media-copy">
              <span>نیاز به انتخاب دقیق‌تر دارید؟</span>
              <strong>قبل از خرید، با ما درباره فضا و سلیقه‌تان صحبت کنید.</strong>
            </div>
          </div>

          <div className="contact-concierge-body">
            <header className="contact-concierge-head">
              <span className="contact-kicker">
                <FaPhoneAlt aria-hidden="true" />
                مشاوره و سفارش
              </span>
              <h2 id="contact-title">برای انتخاب خوب، لازم نیست عجله کنید.</h2>
              <p>
                شماره‌تان را بگذارید و اگر خواستید درباره رنگ، مدل یا فضای موردنظر چند کلمه بنویسید؛ برای راهنمایی با شما تماس می‌گیریم.
              </p>
            </header>

            <form className="contact-form contact-form--editorial" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <div className="contact-field">
                  <label htmlFor="contact-name">نام</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="نام شما"
                    autoComplete="name"
                    maxLength={120}
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-phone">شماره تماس <span>*</span></label>
                  <input
                    ref={phoneRef}
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    autoComplete="tel"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="contact-field contact-field--full">
                <label htmlFor="contact-message">در چه موردی راهنمایی می‌خواهید؟</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="مثلاً برای میز پذیرایی، رنگ کرم و صورتی..."
                  maxLength={2000}
                />
              </div>

              <div className="contact-form-bottom">
                <button type="submit" className="contact-submit" disabled={status === 'submitting'}>
                  <span>{status === 'submitting' ? 'در حال ارسال…' : 'درخواست مشاوره'}</span>
                  <FaArrowLeft aria-hidden="true" />
                </button>
                <span className="contact-privacy-note">اطلاعات شما فقط برای پاسخ به همین درخواست استفاده می‌شود.</span>
              </div>

              <p
                className={`contact-form-status${status === 'success' ? ' is-success' : ''}${status === 'error' || status === 'invalid' ? ' is-error' : ''}`}
                role="status"
                aria-live="polite"
              >
                {status === 'success' && (
                  <>
                    <FaCheckCircle aria-hidden="true" /> درخواست ثبت شد؛ به‌زودی با شما تماس می‌گیریم.
                  </>
                )}
                {status === 'invalid' && (
                  <>
                    <FaExclamationTriangle aria-hidden="true" /> شماره موبایل معتبر نیست؛ یک شماره ۱۱ رقمی وارد کنید.
                  </>
                )}
                {status === 'error' && (
                  <>
                    <FaExclamationTriangle aria-hidden="true" /> ارسال درخواست ناموفق بود؛ لطفاً دوباره تلاش کنید.
                  </>
                )}
              </p>
            </form>

            <div className="contact-direct-grid" aria-label="راه‌های تماس مستقیم">
              <a href={`tel:${config.contact.phone}`}>
                <FaPhoneAlt aria-hidden="true" />
                <span><small>تماس مستقیم</small><strong dir="ltr">{config.contact.phone}</strong></span>
              </a>

              {config.contact.telegram && (
                <a href={config.contact.telegram} target="_blank" rel="noopener noreferrer">
                  <FaTelegramPlane aria-hidden="true" />
                  <span><small>تلگرام</small><strong>پیام مستقیم</strong></span>
                </a>
              )}

              <div>
                <FaClock aria-hidden="true" />
                <span><small>پاسخگویی</small><strong>هر روز ۹ تا ۲۱</strong></span>
              </div>

              <div>
                <FaMapMarkerAlt aria-hidden="true" />
                <span><small>ارسال</small><strong>گرگان و سراسر کشور</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
