import './Contact.css';
import { useState } from 'react';
import { FaPhoneAlt, FaTelegramPlane, FaCheckCircle, FaExclamationTriangle, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { config } from '../../data/config';
import { submitInquiry } from '../../services/inquiries';
import contactBg from '../../assets/contact.webp';
import { Reveal } from '../../lib/motion';

const initialForm = { name: '', phone: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!form.phone.trim()) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      await submitInquiry(form);
      setForm(initialForm);
      setStatus('success');
    } catch (err) {
      console.error('[contact] submit failed', err);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="contact-bg" style={{ backgroundImage: `url(${contactBg})` }} aria-hidden="true" />
      <div className="contact-overlay" aria-hidden="true" />
      <div className="container">
        <Reveal className="contact-header">
          <span className="eyebrow contact-eyebrow">
            <FaPhoneAlt aria-hidden="true" />
            تماس با ما
          </span>
          <h2 className="section-title contact-title">
            سفارش شما تنها يك <span className="text-gradient">پيام</span> فاصله دارد
          </h2>
        </Reveal>

        <div className="contact-content">
          <Reveal dir="end" className="contact-info">
            <div className="contact-item glass">
              <span className="contact-icon"><FaPhoneAlt aria-hidden="true" /></span>
              <div>
                <h3>تلفن تماس</h3>
                <a href={`tel:${config.contact.phone}`} className="contact-link">
                  {config.contact.phone}
                </a>
              </div>
            </div>

            {config.contact.telegram && (
              <div className="contact-item glass">
                <span className="contact-icon"><FaTelegramPlane aria-hidden="true" /></span>
                <div>
                  <h3>تلگرام</h3>
                  <a
                    href={config.contact.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link"
                  >
                    @{config.contact.telegram.replace(/\/$/, '').split('/').pop()}
                  </a>
                </div>
              </div>
            )}

            <div className="contact-meta">
              <span className="contact-meta-item">
                <FaClock aria-hidden="true" />
                پاسخگويي هر روز ۹ تا ۲۱
              </span>
              <span className="contact-meta-item">
                <FaMapMarkerAlt aria-hidden="true" />
                ارسال درون‌شهري گرگان درب منزل، سراسر کشور با پست
              </span>
            </div>
          </Reveal>

          <Reveal as="form" dir="start" className="contact-form glass" onSubmit={handleSubmit} noValidate>
            <h3 className="contact-form-title">فرم سفارش و مشاوره</h3>
            <p className="contact-form-lead">
              برای سفارش، مشاوره و اطلاعات بیشتر فرم زیر را پر کنید؛ به‌زودی با شما تماس می‌گیریم.
            </p>

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
                <label htmlFor="contact-phone">شماره تماس *</label>
                <input
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
              <label htmlFor="contact-message">پیام</label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="چه گلی مدنظرتان است؟ توضیح کوتاهی بنویسید…"
                maxLength={2000}
              />
            </div>

            <button type="submit" className="btn btn-primary contact-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'در حال ارسال…' : 'ارسال درخواست'}
            </button>

            <p
              className={`contact-form-status${status === 'success' ? ' is-success' : ''}${status === 'error' ? ' is-error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {status === 'success' && (
                <>
                  <FaCheckCircle aria-hidden="true" /> پیام شما ثبت شد. به‌زودی با شما تماس می‌گیریم.
                </>
              )}
              {status === 'error' && (
                <>
                  <FaExclamationTriangle aria-hidden="true" /> ارسال نشد. لطفاً شماره تماس را وارد کرده و دوباره تلاش کنید.
                </>
              )}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Contact;
