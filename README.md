# نیلا گل

وب‌سایت فارسی و راست‌به‌چپ نیلا گل برای معرفی، فروش و مدیریت گل‌های روسی/مصنوعی ماندگار، قابل شستشو و فرم‌پذیر.

## وضعیت فعلی پروژه

- React 18 + Vite با `vite-react-ssg`؛ مسیرهای عمومی مثل خانه، محصولات، جزئیات محصول، بلاگ و روش خرید به‌صورت static HTML پیش‌رندر می‌شوند.
- مسیرهای پویا مثل سبد خرید، checkout، حساب کاربری، پرداخت، چت و پنل ادمین client-only هستند.
- طراحی مرجع فعلی `Immersive Boutique` است: پالت pink/violet/wine، glassmorphism، meshهای برند و بدون gold/black/sage خارج از هویت فعلی.
- دیتای عمومی از Supabase می‌آید و برای کاتالوگ fallback استاتیک وجود دارد تا سایت عمومی با خطای دیتابیس خالی نشود.
- پرداخت آنلاین زرین‌پال، پرداخت درب منزل در گرگان، ارسال پستی سراسری، واتساپ/تلگرام/تماس، چت، بلاگ و ادمین پیاده‌سازی شده‌اند.

## دستورهای توسعه

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

`npm run build` ابتدا sitemap را تولید می‌کند و سپس routeهای عمومی را با `vite-react-ssg` در `dist/` پیش‌رندر می‌کند.

## تنظیمات محیطی

فایل `.env.example` را کپی کنید و مقادیر واقعی را در `.env` بگذارید:

```env
VITE_SITE_TITLE=نیلا گل
VITE_CONTACT_EMAIL=info@example.com
VITE_CONTACT_PHONE=09123456789
VITE_TELEGRAM_URL=https://t.me/your_account
VITE_WHATSAPP_NUMBER=989123456789

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

اگر متغیرهای Supabase تنظیم نباشند، بخش عمومی کاتالوگ از داده‌های fallback استفاده می‌کند؛ اما ادمین، سفارش، پرداخت، چت، بلاگ داینامیک و آپلود تصویر به Supabase نیاز دارند.

## ساختار اصلی

```text
src/
  components/      کامپوننت‌های عمومی و ادمین
  context/         AuthProvider و CartProvider
  data/            config و fallback catalog
  lib/             Supabase client، SEO، format، motion، order helpers
  pages/           route pageها و admin dashboard
  services/        data access layer برای catalog/orders/payments/admin/chat
  styles/          global.css و design tokens

supabase/
  migrations/      schema، RLS، storage policies، orders/payments/chat/blog
  functions/       Edge Function پرداخت زرین‌پال
  seed.sql         دیتای اولیه محصولات، ویژگی‌ها و پست‌ها

scripts/
  gen-sitemap.mjs
  optimize-assets.mjs
  fetch-images.mjs
```

## Supabase و ادمین

پنل ادمین در `/admin` است. اولین حساب از `/admin/login` ساخته می‌شود و طبق migrationها به‌صورت خودکار admin می‌شود. ادمین می‌تواند محصولات، تصاویر، گالری، بلاگ، نقدها، سفارش‌ها، پیام‌ها و پرداخت‌های گیرکرده را مدیریت کند.

مدل امنیتی با RLS حفظ شده است: خواندن عمومی فقط برای محتوای فعال/منتشرشده، نوشتن عمومی محدود به lead/order/review، و مدیریت کامل فقط برای admin.

## پرداخت و سفارش

Checkout دو مسیر دارد:

- پرداخت آنلاین امن از طریق Edge Function `payment` و زرین‌پال.
- پرداخت در محل برای گرگان و هماهنگی ارسال پستی برای سایر شهرها.

مبلغ سفارش در دیتابیس از روی محصولات دوباره محاسبه می‌شود و Edge Function مبلغ را از دیتابیس می‌خواند، نه از کلاینت.

## راهنمای طراحی

منبع معتبر طراحی فعلی:

- `CLAUDE.md`
- `design-briefs/redesign-B-immersive-boutique.md`
- `design-briefs/mockup-B.html`

briefهای قدیمی‌تر فقط برای تاریخچه تصمیم‌ها نگه داشته شده‌اند و نباید بر خلاف Direction B، پرداخت آنلاین فعلی یا SSG فعلی استفاده شوند.
