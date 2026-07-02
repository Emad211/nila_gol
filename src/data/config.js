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
  // Enamad e-trust seal (Iran). Paste the image URL + link from your Enamad panel;
  // the badge renders in the footer only when both are set.
  enamad: {
    img: import.meta.env.VITE_ENAMAD_IMG || '',
    link: import.meta.env.VITE_ENAMAD_LINK || ''
  }
};
