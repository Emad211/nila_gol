export const config = {
  siteName: import.meta.env.VITE_SITE_TITLE || 'گل‌های روسی انعطاف‌پذیر',
  productsPage: {
    eyebrow: 'گل هایی برای هر فضا و سلیقه',
    title: 'مجموعه کامل گل های ترکیبی',
    subtitle: 'انتخاب های متنوع برای دکور خانه، هدیه دادن و زیبایی ماندگار. هر مدل با فرم پایدار و حس لطیف آماده شده است.',
    primaryCta: 'مشاهده محصولات',
    secondaryCta: 'مشاوره و سفارش'
  },
  contact: {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'info@example.com',
    phone: import.meta.env.VITE_CONTACT_PHONE || '09123456789',
    telegram: import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/your_account',
    // International digits for WhatsApp. Falls back to the phone number above.
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || ''
  },
  // Enamad e-trust seal (Iran). The real nilagol.ir seal (id 7358431) is baked in
  // as the default so it renders in production without extra env setup; override
  // per-environment via VITE_ENAMAD_* if the seal ever changes. The `code` value
  // MUST stay on the <img> as a `code` attribute — Enamad's domain-verification
  // script scans the page source for it, so the image alone is not enough.
  enamad: {
    img:
      import.meta.env.VITE_ENAMAD_IMG ||
      'https://trustseal.enamad.ir/logo.aspx?id=7358431&Code=Lf5PbQYcOv6wIgnQxebkKopT4Rbm8n9G',
    link:
      import.meta.env.VITE_ENAMAD_LINK ||
      'https://trustseal.enamad.ir/?id=7358431&Code=Lf5PbQYcOv6wIgnQxebkKopT4Rbm8n9G',
    code: import.meta.env.VITE_ENAMAD_CODE || 'Lf5PbQYcOv6wIgnQxebkKopT4Rbm8n9G'
  }
};
