# دانش‌نامه‌ی پروژه نیلا گل (AGENT-KNOWLEDGE-BASE.md)

> **هدف:** مرجع دائمی و دقیق برای هر سشن ایجنت روی این ریپو. بر اساس خوانش عمیق کل کدبیس (۹ گذار تخصصی موازی) نوشته شده است.
> **قانون مهم:** هرجا این فایل با `AGENTS.md`/`CLAUDE.md` تعارض داشت، **این فایل معتبر است** (مستندات قدیمی با کد فعلی فاصله گرفته‌اند — لیست مغایرت‌ها در §19).

---

## 1) هویت پروژه

- **برند:** «نیلا گل» — گل‌های روسی انعطاف‌پذیر؛ فروشگاه تک‌برندی، فارسی، تماماً RTL، شهر گرگان.
- **دامنه رسمی:** `https://nilagol.ir` · Supabase project ref: `msiowolgbuffddhcdmqw`
- **استک:** React 18 + Vite 5 + `vite-react-ssg ^0.9.1-beta.1` (SSG بتا!) + react-router-dom 6 (data router از آرایه `routes`) + Framer Motion + @supabase/supabase-js + react-markdown/remark-gfm + vite-plugin-pwa. دیپلوی Vercel.
- **مدل کسب‌وکار:** پرداخت آنلاین زرین‌پال + COD درب منزل گرگان / ارسال پستی سراسری. سئو با پیش‌رندر HTML واقعی.
- `package.json` name = `russian-flowers-website` v1.0.0. Node 20 (`.nvmrc`، CRLF دارد) ولی CI روی Node 22.

## 2) دستورات

| دستور | رفتار |
|---|---|
| `npm run dev` | dev سرور vite-react-ssg روی پورت **3000** (`--port` نادیده گرفته می‌شود) |
| `npm run build` | اول lifecycle `prebuild` → `scripts/gen-sitemap.mjs`، بعد `vite-react-ssg build` → `dist/` تو در تو |
| `npm run preview` | `vite preview` روی پورت **4173** (تارگت اسکریپت‌های QA) |
| `npm run lint` | `eslint .` با `.eslintrc.cjs` |
| تست فریمورک ندارد | فقط pgTAP SQL: `supabase/tests/database/order_integrity.test.sql` |

## 3) نقشه معماری (نقش فایل‌ها)

```
src/main.jsx            ← createRoot = ViteReactSSG({ routes })؛ هیدراتیشن/پیش‌رندر مال این فریمورک است؛ هیچ <BrowserRouter> وجود ندارد
src/App.jsx             ← آرایه routes + تعریف همه loaderها (homeLoader/productsLoader/productLoader/blogLoader/blogPostLoader همین‌جاست، ~L85–143)
src/layouts/            ← PublicLayout.jsx (کروم عمومی)، authLayout/AuthOutlet.jsx (AuthProvider per-route)
src/context/            ← AuthProvider.jsx ، CartProvider.jsx
src/services/           ← catalog, inquiries, posts, reviews, orders, payments, chat, aichat, admin, adminOverview
src/lib/                ← supabase, order, format, slug, markdown, seo, pageSeo, motion, cart
src/data/               ← products.js (فالبک استاتیک products/features/aboutContent)، config.js (کانال‌ها + Enamad)
src/components/         ← کامپوننت‌ها (§8)
src/pages/              ← صفحات عمومی/فروشگاهی؛ src/pages/admin/* پنل مدیریت
src/styles/global.css   ← توکن‌ها و یوتیلیتی‌ها (§10)
supabase/migrations/    ← 0001…0021 (§11)
supabase/functions/     ← ai-chat , payment (§13)
supabase/config.toml    ← verify_jwt: payment=false ، ai-chat=true
scripts/, .github/workflows/, docs/, design-briefs/, lighthouse/
```

## 4) روتینگ، لودرها و قوانین حیاتی SSG

- **RootProviders** (pathless در App.jsx) فقط `CartProvider` (+VercelSpeedInsights) را می‌پیچد — **AuthProvider عمداً بیرون است** تا روت‌های بازاریابی کار session انجام ندهند.
- **AuthProvider per-route:** لِیزی `authLayout` دور `[checkout, account]` و جداگانه دور `/admin/login` + `/admin` (ProtectedAdminPage). چت‌ویجت هم نمونه‌ی دوم AuthProvider خودش را داخل `SupportChatBoundary` دارد (عمدی؛ جلوگیری از دبل‌مانت).
- **PublicLayout:** Header → ScrollToHash → ScrollReveal → ScrollProgress(rAF) → Footer → ScrollToTop → CartFeedback + Suspense («در حال بارگذاری…») + لِیزی `SupportChatBoundary` که روی `/checkout`, `/account`, `/payment/*` ساپرس می‌شود.
- **لودرها هرگز throw نمی‌کنند** (سرویس‌ها خودشان degrade می‌کنند). همه صفحات داده‌محور `shouldRevalidate = revalidateOnPathChange` دارند (فقط مقایسه pathname).
- **چرا shouldRevalidate حیاتی است:** مانيفست داده سریالایزشده‌ی SSG با pathname دقیق کلید می‌خورد (canonical با trailing slash مثل `/products/`)؛ revalidate روی query/hash باعث miss و برگرداندن `null` از `useLoaderData` می‌شود ⇒ به همین دلیل همه‌جا الگوی `useLoaderData() ?? {}` الزامی است.
- **includedRoutes** (vite.config): مسیرهای بازاریابی ۴گانه + اجتماع slug محصولات فالبک ∪ محصولات فعالِ زنده (REST مستقیم با timeout 8s، خطا⇒[]) + پست‌های منتشرشده؛ همه `encodeURIComponent`. cart/checkout/account/admin عمداً حذف‌اند (client-only).
- **صفحات:** فقط HomePage eager است؛ بقیه public route-lazy. admin: فقط `ProtectedAdminPage` route-lazy است — مدیران داخل AdminDashboard **استاتیک import شده‌اند**.
- `ClientOnly` از vite-react-ssg **هیچ‌جا استفاده نشده**؛ SSR-safety با defer به effect هاست (CartProvider با فلگ `loaded`، ThemeToggle با رندر اول ثابت، …).

## 5) لایه داده (services)

- `lib/supabase.js`: وقتی تنظیم نباشد client = **null** و `isSupabaseConfigured=false`؛ همه سرویس‌ها gate دارند.
- **catalog**: `getProducts/getProduct/getFeatures/getGallery` خطا را ساکت degrade می‌کنند به فالبک استاتیک (`src/data/products.js`). ⚠️ گالری الان هم **فالبک استاتیک ۴ آیتمی دارد** (برخلاف ادعای AGENTS.md). `getOrderValidationProducts` برخلاف بقیه وقتی configured-but-failing باشد **throw می‌کند** (دروازه صحت checkout).
- **inquiries**: فقط INSERT عمومی؛ SELECT عمومی وجود ندارد (leads نوشتنی‌اند).
- **posts**: `getPosts/getPost/getRecentPosts` در هر مشکلی `[]`.
- **reviews**: ثبت عمومی `is_approved:false` اجباری؛ ساخت ادمین `true` — **هرگز جابه‌جا نکن**.
- **orders.createOrder**: کلاینت `public_id` (uuid) + `payment_token` (دو uuid چسبیده ≈512bit) می‌سازد؛ فقط SHA-256 هش در `payment_token_hash` ذخیره می‌شود؛ insert **بدون `.select()`** (RLS مهمان فقط INSERT دارد)؛ `user_id: user?.id ?? null`. توکن یک‌بار برمی‌گردد و برای startPayment لازم است.
- **payments**: `startPayment(orderId, token)` → Edge fn `create`؛ URL برگشتی با allowlist (`https:` + `payment.zarinpal.com|sandbox.zarinpal.com` + `/pg/StartPay/`) اعتبارسنجی و redirect می‌شود. `verifyPayment` → action `verify`.
- **aichat.askAI**: پاسخ 429 شامل `{reply}` را به‌عنوان حباب چت نمایش می‌دهد — **عمدی است، تبدیلش به error نکن**.
- **admin.js**: CRUD کامل محصولات/گالری/پست‌ها/نظرات/سفارش‌ها/چت/استعلام‌ها + `uploadImage(file, folder)` (اجازه jpeg/png/webp/avif و ≤8MB در کلاینت) + `removeImageByUrl` + `reconcilePayment`. slugify با retry **یک‌بار** روی خطای یکتایی 23505 با پسوند `-<4 کاراکتر base36>` (برخورد دوم ⇒ خطا).
- **فالبک استاتیک (6 محصول)**: rose-red/rose-pink/rose-white (450k، رز)، sunflower (380k)، tulip (420k، ویژه)، mixed-bouquet (550k، ویژه). quirk نامگذاری: `mixed-bouquet` → `/img/mixed.webp`. features فالبک آیکون emoji دارند (legacy). قیمت‌ها int تومان.

## 6) Context ها

- **CartProvider** (سراسری، یک‌بار): کلید localStorage = `'nila_cart'`؛ فلگ `loaded` مانع پاک‌شدن storage توسط state خالی اولیه؛ ورودی localStorage ورود متخاصم فرض و normalize می‌شود؛ `add()` برای sold_out toast هشدار با `token: Date.now()`؛ `syncCatalog` اقلام را با کاتالوگ زنده همگام و ناموجودها را mark می‌کند (قیمت نهایی همچنان trigger دیتابیس است)؛ `count/subtotal` مشتق.
- **AuthProvider** (per-route): `session/isAdmin/loading/checkingAdmin/passwordRecovery` + `signIn/signUp/signOut/requestPasswordReset/updatePassword(password,current)/finishPasswordRecovery`. isAdmin با `rpc('is_admin')` و در **هر رویداد auth** دوباره چک می‌شود. بازیابی رمز با رویداد `PASSWORD_RECOVERY` است (نه query)؛ `?recovery=1` فقط برای پیام لینک منقضی. متدها وقتی unconfigured هستند resolve با `{error}` می‌کنند نه throw.

## 7) کامپوننت‌ها (خلاصه عملیاتی)

- **Header:** nav آرایه LINKS (account فقط mobile)، focus-trap کامل، بَج سبد از useCart، ThemeToggle داخل آن.
- **Footer:** استاتیک/config-driven؛ Enamad شرطی با `referrerPolicy="origin"`؛ strip اعتماد ۴ آیتمی.
- **Hero:** **استاتیک** با `hero.webp` (eager + fetchpriority high). ⚠️ `HeroOrchid3D` یتیم است (هیچ importer ندارد) و `three@0.170` وابسته مرده است.
- **About:** بخش About+Features ادغام‌شده (کامپوننت Features وجود ندارد)؛ anchor `#about`؛ proof-list هاردکد + uses تا ۵.
- **Gallery/Lightbox:** `initialItems` از homeLoader، فالبک dynamic import؛ وقتی خالی `null` (سکشن مخفی)؛ max ۶ سلول؛ Lightbox مشترک با PDP (focus trap، scroll lock).
- **Products/ProductCard/FeaturedProducts:** فیلترها **URL-synced** (`?category&q&sort&stock&sale&featured`, replace:true)؛ sort پیش‌فرض recommended = featured-first؛ ProductCard داخل `MotionCard` (lift مال Framer — CSS hover فقط shadow/border)؛ add وقتی sold_out غیرفعال؛ دکمه واتساپ «سفارش»/«استعلام». FeaturedProducts top-3 با کارت lead، فقط HomePage، `#featured-products`.
- **Collections:** ⚠️ **یتیم** (هیچ‌جا mount نمی‌شود)؛ تنها مصرف‌کننده MotionLinkCard.
- **Contact:** regex موبایل ایران `/^0?\d{10,11}$/`، maxLength 120/30/2000، dynamic import inquiries، `#contact`.
- **Reviews family:** ProductReviews (فرم moderated، `.product-reviews` هدف legacy ScrollReveal)؛ Stars مشترک (`aria-label="{value} از ۵"`)؛ Testimonials (featured hero + side list، مخفی وقتی خالی؛ TestimonialsPremium.css فقط CSS است و توسط Testimonials.jsx ایمپورت می‌شود).
- **Utility:** ScrollToHash (smooth به hash/top)، ScrollToTop (>300px، inset-inline-end، z899)، ScrollReveal (سلکتورهای ثابت `.product-reviews,.pdp-related,.how-*`)، ScrollProgress (rAF، origin راست RTL، z200)، ThemeToggle (اولین رندر ثابت SSR-safe؛ sync بعد از mount؛ localStorage try/catch)، CartFeedback (auto-dismiss 2600ms، variant هشدار، deep-link /cart).
- **ChatWidget (~628 خط):** دو حالت tablist با pill لغزان layoutId؛ FAB pulse تا اولین باز شدن؛ nudge یک‌باره 5.2s با sessionStorage `nilagol_chat_nudge`. AI: state محلی، askAI با کل تاریخ منهای سلام، chips پیشنهادی، renderRich دستی `**bold**` (react-markdown در ویجت نمی‌آید). Human: gate لاگین + Realtime `subscribeMyMessages` (dedup با row id)؛ مهمان‌ها DIRECT_CHANNELS واتساپ/تلگرام/بله (فقط اگر configure شده). Escape می‌بندد و فوکوس به FAB.
- **Admin:** ProtectedRoute (منتظر loading/checkingAdmin سپس Navigate به /admin/login)؛ AdminOverview (شمارنده‌ها، کارت‌های کلیک‌شو)؛ ProductsManager (CRUD + جستجو + تب‌های فیلتر + validation sale 0<sale<price + آپلود چندتصویری)؛ GalleryManager (آپلود گروهی، sort=max+1، حذف + پاکسازی storage)؛ PostsManager (تولبار Markdown با restore caret، پیش‌نمایش زنده با `.prose`، شمارش کلمه/read-time، انتشار/پیش‌نویس)؛ ReviewsManager (toggle تأیید، ساخت دستی testimonial با product_id:null)؛ InquiriesViewer (جدول + tel:)؛ OrdersManager (**به‌روزرسانی وضعیت optimistic با rollback**، حذف irreversible با confirm، دکمه «تأیید مجدد پرداخت» reconcile)؛ ChatManager (inbox با unread badge، الگوی `openIdRef` که subscription را پایدار نگه می‌دارد — موقع refactor حفظش کن، reply optimistic با rollback). همه deleteها `window.confirm` native هستند.
- **یتیم‌های motion.jsx:** Stagger/RevealItem/CountUp/MagneticButton/Parallax استفاده نشده؛ نسخه framer ScrollProgress هم dead code است (نسخه rAF در components mount شده).

## 8) صفحات

### عمومی (پیش‌رندر)
- **HomePage:** ترتیب سکشن‌ها = Seo → Hero → FeaturedProducts → About → Gallery → Testimonials → Contact. CSS اضافه: landing-research.css + landing-a11y.css. JSON-LD محلی ندارد (site-wide در index.html است).
- **ProductsPage:** هیرو با copy از `config.productsPage`، CTA `<a href="#products">` + لینک متقاطع `/#contact`، VALUE_PROPS چهارگانه، JSON-LD CollectionPage/ItemList از داده لودر.
- **ProductDetail:** گالری image_url+images[] با thumbnails و Lightbox؛ بَج تخفیف٪/ویژه/وضعیت؛ sold_out ⇒ qty/add غیرفعال و واتساپ می‌شود استعلام موجودی؛ made_to_order ⇒ یادداشت سفارشی‌سازی؛ نوار خرید sticky موبایل؛ related = هم‌دسته اول + پرکننده، slice(0,4)؛ SEO: `Product/Offer/BreadcrumbList` — قیمت JSON-LD = `current × 10` و `'IRR'`؛ aggregateRating فقط وقتی reviewCount>0 (هرگز جعل نشود).
- **Blog / BlogPost:** کارت‌های MotionLinkCard؛ بدنه با `Markdown` (remark-gfm، HTML خام عمداً غیرفعال) + تایپوگرافی `.prose` (در `pages/Blog.css` است نه global!). BlogPosting JSON-LD + BreadcrumbList.
- **HowToOrder:** آکاردئون FAQ تک‌بازشو؛ JSON-LD FAQPage از همان const `FAQS` صفحه (single source of truth).
- **NotFound:** catch-all؛ الگوی client-only با `setPageSeo/resetPageSeo`.

### فروشگاهی (client-only)
- **Cart:** بعد از `loaded` → `getOrderValidationProducts()` + `syncCatalog`؛ `checkoutReady = catalogChecked && !catalogError && !hasUnavailable`؛ ریل cross-sell (top3 خارج از سبد و غیر sold_out)؛ تا `!loaded` اسکلت «در حال بازیابی…».
- **Checkout:** فیلدها name/phone(tel,LTR)/city/postal_code(numeric,LTR)/address/note؛ نرمال‌سازی ارقام فارسی با toLatinDigits؛ phone `/^0?\d{10,11}$/`، postal دقیقاً `/^\d{10}$/`؛ انتخاب پرداخت radio (online پیش‌فرض / cod گرگان درب منزل)؛ prefill از آخرین سفارش کاربر فقط فیلدهای خالی؛ جریان createOrder→startPayment (سبد هنوز پاک نمی‌شود)؛ مسیر COD: clear سبد + صفحه موفقیت با کد رهگیری `#<segment اول public_id>`؛ Enamad فقط اگر `config.enamad.img && link` (attr `code=` روی img عمداً برای اسکنر Enamad است — React warn بی‌ضرر می‌دهد).
- **Account:** سه حالت (AuthForm/Dashboard/PasswordRecoveryForm با event)؛ حداقل رمز ۸ (فقط signup)؛ forgot با notice غیر قابل enumeration؛ داشبورد: تغییر رمز (با verify رمز فعلی) + تاریخچه سفارش‌ها. ⚠️ کارت سفارش `#id` داخلی DB را نشان می‌دهد نه public_id، و pill وضعیت پرداخت رندر نمی‌شود (با اینکه service آن را select می‌کند).
- **PaymentCallback:** guard `ran.current`؛ پارامترهای order_id/Authority/Status؛ verify سمت سرور authority را exact-match می‌کند؛ موفق ⇒ ref_id + clear سبد؛ canceled/خطاها با نگاشت کد زرین‌پال؛ دکمه‌های retry→/checkout و /products.
- **AdminLogin:** فقط login است — بوت‌استرپ first-admin **حذف شده** (migration 0014؛ هیچ اشاره‌ای به admin_exists/signup در src نیست). non-admin ⇒ خطا + signOut خودکار.
- **AdminDashboard:** ۸ تب (overview/orders/products/gallery/posts/reviews/chat/inquiries)؛ hardening: timeout بیکاری ۳۰ دقیقه‌ای با localStorage `nila-admin-last-activity` + re-verify `rpc('is_admin')` روی focus/visibilitychange؛ Head با noindex.

## 9) سیستم دیزاین («Immersive Boutique»)

- مرجع canonical: `design-briefs/redesign-B-immersive-boutique.md` + ماکاپ `mockup-B.html`. جهت A آرشیو است (اجرا نشود). **پالت سیاه+طلایی رد شده و ممنوع است؛ لوگو دست‌نخورده.**
- توکن‌ها در `global.css :root` (brand/wine/surfaces/hairlines/glass/mesh/elevation/radius/motion/rhythm/fonts)؛ دارک `[data-theme='dark']` فقط ~۱۹ توکن خنثی/glass/shadow را swap می‌کند — brand/wine/گرادیان‌ها/motion/radius بین دو تم ثابت‌اند.
- یوتیلیتی‌ها: `.container`(1180px) `.glass`(+fallback @supports) `.eyebrow` `.section-title`(clamp) `.btn/-primary/-secondary`(+variant `.on-dark`) `.text-gradient`(+fallback) `.num`(Playfair tabular برای ارقام قیمت — formatPrice عمداً رقم لاتین می‌دهد) `.catalog-state` `.reveal/.is-revealed`(legacy) `.fade-in` `.stagger-animation` `.theme-toggle`.
- **RTL:** logical properties (inset-inline/margin-inline/border-block…)؛ drawer با `translateX(-105%)`؛ progress bar `transform-origin: right`؛ آینه‌سازی آیکون ارسال با `scaleX(-1)`؛ جزایر LTR صریح (input عددی گالری، `.field-input--ltr`). لینک‌های hash همیشه `<Link to="/#about">` باشند نه anchor خام.
- **Framer owns hover-lift:** المان‌های داخل MotionCard نباید `transform` در `:hover` داشته باشند.
- **z-index ladder (دست نخورد):** drawer 1002 > header/lightbox 1000 > cart-feedback 980 > ChatWidget 900 > ScrollToTop 899 > scroll-progress 200 > admin 10–30.
- reduced-motion: بلنکت سراسری 1ms + بلاک اختصاصی در هر فایل CSS + degrade داخلی Framer.
- رنگ‌های معنایی مجاز فقط در context خطا/وضعیت: قرمزها `#e0356b` (storefront) و `#b3261e` (admin)، سبزهای status.
- بدهی شناخته‌شده: کامپوننت‌های editorial (Hero، FeaturedProducts، بخشی از TestimonialsPremium) hex روشن هاردکد دارند و خودشان با `html[data-theme='dark']` patch می‌شوند — کد جدید باید توکن بخورد. پسماند tan `rgba(201,143,123,…)` در admin.css legacy است، کپی نشود. admin-premium.css مجموعه توکن موازی scope شده `--admin-*` دارد (عمدی و مجزا از storefront).
- تایپوگرافی: Vazirmatn 400–800 (line-height 1.75؛ prose=2.0) async-load با الگوی media=print؛ Playfair Display فقط برای `.num`. `.prose` در `pages/Blog.css`.

## 10) دیتابیس (نهایی بعد از migration 0021)

### جداول
- **products:** id bigint identity **ALWAYS**، slug UNIQUE، name NOT NULL، description، price int (تومان)، category، features text[]، sort_order، is_active(true)، created_at، image_url، is_featured(false)، sale_price nullable، availability CHECK('in_stock','made_to_order','sold_out') default in_stock، images text[] default '{}'.
- **features/gallery:** id ALWAYS، title، description/icon(emoji)/image_url، sort_order، is_active.
- **reviews:** product_id FK CASCADE به products (NULL = testimonial سایت)، author_name NOT NULL، city، rating CHECK 1..5، body، photo_url، **is_approved default false**.
- **posts:** id BY DEFAULT، title، slug UNIQUE، excerpt، content (Markdown) NOT NULL default ''، cover_image_url، author default 'نیلا گل'، tags text[]، **is_published default false**، published_at nullable، updated_at با trigger `set_updated_at`.
- **inquiries:** name nullable، phone NOT NULL، message، created_at. هیچ ALTER بعدی نداشته.
- **orders:** id BY DEFAULT (کلید داخلی)، user_id FK SET NULL (null=مهمان)، customer_name/phone NOT NULL، city/address/note، **postal_code** (≤20 در policy؛ قانون ۱۰رقمی client-side)، items jsonb (canonical server: [{id,name,price,qty}])، subtotal bigint server-computed، status CHECK(pending|confirmed|shipped|delivered|canceled)، payment_method(cod|online)، payment_status(unpaid|paid|failed|refunded) default unpaid، payment_gateway/authority/ref_id، paid_at، **payment_amount_rial** (مبلغ دقیق frozen در create)، **public_id uuid NOT NULL UNIQUE**، **payment_token_hash** CHECK `^[0-9a-f]{64}$`. Triggerها: set_updated_at + **orders_recompute_total (BEFORE INSERT)**. Indexهای unique جزئی روی payment_authority/payment_ref_id (ضد replay) + orders_public_id_uidx.
- **chat_messages:** user_id FK CASCADE (مالک thread)، customer_email denormalized، sender(customer|admin)، body، read_at؛ عضو publication `supabase_realtime`. anon هیچ policy‌ای ندارد.
- **admins:** user_id PK FK CASCADE. grants سخت‌گیرانه (authenticated فقط SELECT تحت RLS؛ هیچ مسیر نوشتن از کلاینت).
- **ai_chat_usage:** (bucket,window_start,hits) — RLS فعال با **صفر policy** و grants revoked؛ فقط service_role.

### ماتریس RLS (anon | authenticated | admin=is_admin())
| جدول | anon | user عادی | admin |
|---|---|---|---|
| products/features/gallery | R(is_active) | R(is_active) | CRUD کامل (ALL با OR) |
| posts | R(is_published) | R(is_published) | CRUD + draftها |
| reviews | R(is_approved)+I اجباری approved=false | مثل anon | CRUD |
| inquiries | فقط I (طول‌ها guarded) | فقط I | R+D |
| orders | فقط I (guarded پایین) | I + R ردیف خودش | R همه + U + D |
| chat_messages | هیچ | R/I فقط thread خودش (sender=customer، body 1–2000) | CRUD |
| admins | هیچ | عملاً هیچ | R |

WITH CHECK کامل policy `"orders insert"` (فرم 0020): user_id null یا خود کاربر ∧ name 1–120 ∧ phone 4–30 ∧ note≤1000 ∧ postal≤20 ∧ items array 1..50 ∧ **subtotal>0** ∧ method∈(cod,online) ∧ **status='unpaid'** ∧ ref_id null ∧ paid_at null ∧ **token_hash هگز64**.

### توابع/triggers کلیدی
- `is_admin()` SECURITY DEFINER stable — exists در admins؛ EXECUTE فقط authenticated+service_role.
- `handle_first_admin()` و `admin_exists()`: **DROP شده در 0014/0015 و باید drop بمانند.** ادمین فقط از Dashboard/SQL/service-role ساخته می‌شود.
- `recompute_order_total()` SECURITY DEFINER، fail-closed نسخه 0017: items آرایه 1..50، id `^\d+$`، qty int 1..99، محصول active با availability∈(in_stock,made_to_order)، unit=`coalesce(sale_price,price)>0`، subtotal>0؛ در غیراین صورت `23514` با پیام فارسی («سبد خرید نامعتبر است.»، «تعداد هر محصول باید بین ۱ تا ۹۹ باشد.»، …) و rewrite کامل items/subtotal. EXECUTE آن از همه نقش‌ها revoked (هرگز RPC نشود).
- `commerce_schema_version()` immutable ⇒ **19** (granted به anon/auth/service). ⚠️ نسبت به 0020/0021 کهنه است؛ bump فقط همراه آپدیت تست pgTAP.
- `ai_chat_rate_check(p_ip_hash)`: SECURITY DEFINER فقط service-role؛ پنجره‌های fixed: 10/min، 40/hr، 120/day per IP-hash + سقف جهانی 4000/day؛ sweep تصادفی ~1%.

### Storage
باکت `media`: **public** (URLها بدون auth) اما **policy SELECT وجود ندارد** (listing مسدود)؛ نوشتن فقط با `bucket_id='media' AND is_admin()`؛ محدودیت 10MiB + MIME های jpeg/png/webp/avif (0016).

### seed و تست
- seed.sql: truncate reviews/products/features/posts؛ ۶ محصول (450k×3 رز، 380k، 420k، 550k)؛ ۶ feature کارت emoji؛ ۳ مقاله published (slugهای `گل-روسی-چیست`، `نگهداری-گل-مصنوعی`، `تزیین-خانه-با-گل-مصنوعی` با published −20d/−10d/−2d).
- pgTAP `order_integrity.test.sql` plan(11): seed با OVERRIDING SYSTEM VALUE (900001 عادی 65000 حراج، 900002 sold_out، 900003 inactive)؛ insert دستکاری‌شده ⇒ subtotal=130000 assert؛ ۴ مورد throws_ok '23514' با رشته‌های دقیق فارسی؛ begin/rollback.

## 11) اینواریانت‌های امنیتی (هرگز نشکند)

1. کلاینت هرگز نمی‌تواند سفارش paid بسازد — policy insert unpaid را force می‌کند؛ تنها نویسنده‌ی paid/ref_id/paid_at تابع `payment` با service role است (update اتمیک `neq paid`).
2. یک تراکنش درگاه حداکثر یک سفارش را settle می‌کند (unique جزئی authority/ref_id).
3. مبالغ server-authoritative اند (trigger + `payment_amount_rial` frozen؛ verify همان را می‌خواهد — بدون drift -50).
4. توکن خام هرگز ذخیره نمی‌شود؛ فقط SHA-256؛ مقایسه داخل Edge Function (constant-time).
5. سطوح مهمان از `public_id` استفاده کنند نه id ترتیبی (ضد enumeration؛ 403 create با متن 404 یکسان).
6. inquiries فقط نوشتنی از مرورگر — هرگز SELECT عمومی اضافه نکن.
7. moderation: insert عمومی is_approved=false اجباری؛ ادمین true.
8. admins زیرساخت است؛ bootstrap خودکار ممنوع (fns drop بمانند).
9. `is_admin()` فقط authenticated+service_role؛ DEFINER برای عدم recursion در policyها.
10. media: بدون policy listing؛ نوشتن فقط ادمین؛ سقف 10MiB/MIME بماند.
11. rate-limiter AI از کلاینت غیرقابل دسترس است؛ روی خطای زیرساخت **fail-open عمدی** است.
12. predicateهای visibility (is_active/is_published/is_approved) در همه readهای عمومی بمانند؛ هم‌پوشانی permissive عمومی+ادمین عمدی است (documented در 0020).
13. چت محدود به thread خود کاربر؛ sender coerced؛ anon کلاً بلاک.
14. توابع trigger هرگز RPC-callable نباشند (REVOKE EXECUTE الگوی آینده).
15. بهینه‌سازی initplan 0020 (wrap `(select auth.uid())`) فقط روی orders/chat انجام شد — الگوی درست برای policyهای جدید.

## 12) Edge Functions

- **ai-chat** (verify_jwt=ON؛ apikey anon یک JWT معتبر است): پروکسی OpenAI-compatible به `https://api.avalai.ir/v1/chat/completions` با `AVALAI_API_KEY` (مدل default/live: `gpt-4.1-mini`)؛ آخرین ۱۲ پیام، content≤2000؛ rate-check با RPC service-role (IP به‌صورت SHA-256 salted با `RATE_LIMIT_SALT`)؛ 429 با پیام فارسی scope-keyed؛ **grounding کاتالوگ زنده**: کش TTL ۵ دقیقه‌ای REST با anon key → bulletهای فارسی (toman با ٬ و ارقام فارسی، desc≤140، AVAIL_FA) با هدر «فهرست زندهٔ محصولات…». پرسونای «گلی»: هیچ محصول/قیمت/شماره‌ای خارج از لیست اختراع نشود، funnel به cart/checkout، ارجاع به واتساپ، دفع off-topic، افشای instructions ممنوع. temp 0.35، max_tokens 700. خطاها: bad_json/bad_request/upstream/fetch_failed؛ secret غائب ⇒ reply «هنوز فعال نشده» با configured:false. هیچ write دیتابیسی ندارد.
- **payment** (verify_jwt=OFF — self-validates): اکشن‌های create/verify/reconcile. Secrets: `ZARINPAL_MERCHANT_ID`, `ZARINPAL_MODE(sandbox default|production)`, `SITE_URL(default https://nilagol.ir)`. Lock اتمیک CAS با پیشوند `__NILA_PAYMENT_LOCK__:` و TTL ۲ دقیقه. **create:** UUID + توکن≥64 کاراکتر؛ lookup با public_id؛ مقایسه constant-time sha256(token)=token_hash (403 با متن 404)؛ paid⇒400، lock تازه⇒409، resume⇒authority قبلی reused:true؛ amount=`Math.round(subtotal×10)` ریال (reject <1000)؛ production origin=SITE_URL force می‌شود؛ callback `${origin}/payment/callback?order_id=...`؛ persist با guard lock (دقیقاً 1 row وگرنه 500). **verify:** authority دقیقاً مطابق stored قبل از هر mutation (authority_mismatch)؛ idempotent اگر paid؛ NOK⇒markFailed «پرداخت توسط شما لغو شد.»؛ مبلغ از `payment_amount_rial ?? subtotal×10`؛ کدهای 100 و 101 = موفق (markPaid: paid+ref_id+paid_at+gateway، promotion pending→confirmed، پاک‌کردن token hash). **reconcile (ادمین-only):** چون JWT verify خاموش است، داخل تابع `getUser(bearer)` + membership جدول admins (403 «این عملیات فقط برای مدیر مجاز است.»)؛ inquiry → VERIFIED|PAID⇒verify/markPaid، IN_BANK⇒بعداً، FAILED⇒markFailed(-51)، REVERSED⇒refunded. جدول کامل `ERROR_FA` برای کدهای −9…−63 و 100/101.

## 13) Build / Deploy / PWA / CSP / Env

- **vite.config.js (async):** resolve زنجیره‌ای env (VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY/SUPABASE_*/NEXT_PUBLIC_* × publishable/anon) با fallback هاردکد `msiowolgbuffddhcdmqw.supabase.co`؛ سپس **define bridge** مقدار نهایی را روی `import.meta.env.VITE_SUPABASE_URL/_PUBLISHABLE_KEY` می‌نشاند (override عمدی). **Preflight production fail-closed:** روی Vercel Production بدون key یا بدون دسترسی REST یا `commerce_schema_version()<19` بیلد throw می‌کند.
- **PWA (vite-plugin-pwa):** autoUpdate با injectRegister script-defer (هیچ کد register دستی نیست)؛ manifest fa/rtl standalone bg #f7f3ee theme #c98f7b icons pwa-192/512/maskable-512؛ workbox precache glob (js/css/html/svg/woff2/webp/png/ico)، navigateFallback `/` با denylist `/^\/admin/, /^\/api/`؛ runtime caching: REST عمومی supabase NetworkFirst (timeout 5s، 80 entry، ۷ روز)، storage SWR (120/30 روز)، فونت‌ها SWR (365 روز). آیکون‌ها خروجی `optimize-assets.mjs` روی پس‌زمینه کرم #f7f3ee.
- **vercel.json:** هدرهای امنیتی سراسری شامل CSP سخت (script/style unsafe-inline لازمِ payload هیدراتیشن و theme-init؛ img-src شامل `*.enamad.ir`؛ connect wss برای realtime؛ worker-src blob:)؛ `/admin` و `/admin/(.*)`: no-store/noindex/noarchive/COOP. rewrite واحد catch-all = filesystem-fallback ⇒ URLهای unmatched (از جمله محصول/مقاله حذف‌شده) با HTTP 200 به index.html می‌رسند (soft-404).
- **index.html:** lang=fa dir=rtl؛ theme-init inline قبل از paint (localStorage `theme`، default light)؛ فونت‌ها async؛ JSON-LD site-wide (@graph Organization/WebSite/FloristStore با آدرس گرگان) — این بلوک فقط همینجاست و PageSeo دوباره تولیدش نمی‌کند. meta theme-color `#d62e8c` با manifest `#c98f7b` **ناهماهنگ است**.
- **gen-sitemap.mjs (prebuild):** parser دستی `.env` (env واقعی برنده)؛ دامنه `VITE_SITE_URL||https://nilagol.ir`؛ مسیرهای ثابت + slugهای زنده؛ هرگز fail نمی‌کند؛ خروجی urlset ساده (بدون lastmod) در `public/sitemap.xml`. robots.txt: Allow all، Disallow /admin، Sitemap.
- **Env:** `.env.example` الگوست (کانال‌های Telegram/WhatsApp/Bale — بدون تلفن؛ Enamad override با VITE_ENAMAD_IMG/_LINK/_CODE؛ کلید publishable جدید `sb_publishable_…` ترجیح دارد). `.gitignore` بلنکت `.env*` دارد ولی `.env.example` tracked است. ref هاردکد پروژه در ۳ نقطه: vite.config، gen-sitemap، mgmt-sql.
- **ESLint** `ignorePatterns: ['*.config.js']` ⇒ **vite.config.js اصلاً lint نمی‌شود**.

## 14) سئو (دو مکانیزم)

- **Build-time (صفحات پیش‌رندر):** `lib/pageSeo.jsx` → `<Head>` با canonical (`SITE_URL='https://nilagol.ir'` + path)، title/description/OG/JSON-LD. نام فایل عمداً `pageSeo.jsx` است (clash case-insensitive با `seo.js`). مصرف: home/products/product/blog/post/how-to-order.
- **Client-only (cart/checkout/account/callback/404):** `lib/seo.js` با `setPageSeo/resetPageSeo` (بدون canonical).
- JSON-LD per-page: products=CollectionPage/ItemList؛ product=Product/Offer(×10 IRR)/BreadcrumbList(+aggregateRating مشروط)؛ blog=Blog؛ post=BlogPosting؛ how-to-order=FAQPage. Site-wide @graph در index.html.
- `SITE_URL` build-time است — هرگز window نخواند.

## 15) اسکریپت‌ها و CI

- scripts/: `gen-sitemap.mjs`، `optimize-assets.mjs` (sharp→WebP q78@1600px + آیکون‌های PWA)، `fetch-images.mjs` (دانلود Wikimedia Commons با فیلتر colourfulness Hasler–Süsstrunk → `public/img/*.webp` q80@1100px)، `mgmt-sql.mjs` (اجرای SQL از Management API — نیاز به `SUPABASE_ACCESS_TOKEN`، `SUPA_REF` قابل override)، `lighthouse-summary.mjs`، `landing-qa.mjs` و `storefront-smoke.mjs` (⚠️ هر دو `playwright` را import می‌کنند که **در package.json اعلان نشده** — نصب ad-hoc لازم)، `db-catchup-0014-0019.sql` (batch idempotent؛ یادداشت reconcile با `migration repair`).
- Workflows (.github/workflows): `ci.yml` (Node22: npm ci، audit --omit=dev --audit-level=high، lint، build)، `supabase-edge-check.yml` (deno check payment)، `supabase-db-check.yml` (replay مهاجرت‌ها روی DB نو + db lint + pgTAP)، `landing-lighthouse.yml` (LHCI mobile+desktop؛ گیت‌ها Performance≥90، a11y/BP/SEO=100، CLS≤0.1)، `landing-visual-qa.yml`، `storefront-smoke.yml`. dependabot هفتگی (npm limit 5 گروه safe-minor-patch + actions).
- baseline کیفیت مستند: `docs/landing-quality-baseline.md` (موبایل P92/A100/SEO100، دسکتاپ P100؛ CLS=0).

## 16) مستندات، بریف‌ها و assetهای عمومی

- docs/: `zarinpal-developer-guide.md` (مرجع فنی کامل درگاه + audit پیاده‌سازی + checklist go-live)، `راهنمای-مجوز-و-درگاه-پرداخت.md` (Enamad بدون ستاره → پرونده مالیاتی → ZarinPal شخص حقیقی؛ ≈۱–۳ هفته/۲۰۰–۳۰۰k تومان)، `auth-production-guide.md` (runbook ادمین/redirectها/SMTP)، `landing-quality-baseline.md`.
- design-briefs/: canonical B + mockup-B.html؛ A آرشیو؛ `00-seo-marketing-strategy.md` (استراتژی بازار ایران — بخش‌هایی با پیاده‌سازی فعلی فاصله دارد).
- public/: `models/pink_rose.glb` ≈17MB (⚠️ مدل 3D یتیم است؛ کاندید حذف)، `img/` ۱۴ فایل WebP جمعاً ~0.84MB، robots.txt، sitemap.xml (۱۳ URL با slugهای فارسی encode شده)، آیکون‌های PWA.

## 17) Runbook های عملیاتی

- **فلپ زرین‌پال به production:** ① دریافت Enamad (پیش‌نیاز هر درگاه) ② ساخت درگاه و Merchant ID ۳۶کاراکتری + ثبت دامنه nilagol.ir (جلوگیری از خطای −14) ③ `supabase secrets set ZARINPAL_MERCHANT_ID=…` و `ZARINPAL_MODE=production` و `SITE_URL=https://www.nilagol.ir` (باید دقیقاً دامنه ثبت‌شده باشد) ④ تست کامل sandbox سپس یک تراکنش کوچک واقعی. خطای −53 یعنی قاطی شدن sandbox/production. برای reverse/refund ثبت IP سرور لازم است (−62).
- **Secrets موجود:** `AVALAI_API_KEY` (+اختیاری `AVALAI_MODEL=gpt-4.1-mini`)، `RATE_LIMIT_SALT`، سه secret زرین‌پال بالا. SUPABASE_URL/ANON/SERVICE_ROLE اتوماتیک inject می‌شوند.
- **ادمین جدید (پروڈاکشن):** ساخت کاربر از Dashboard سپس insert دستی UUID در `public.admins` با service role/SQL. مسیر دیگری وجود ندارد و نباید داشته باشد.
- **DDL:** با MCP `apply_migration` (فایل هم‌نام در supabase/migrations)؛ raw SQL با `execute_sql`. بعد از DDL `get_advisors` اجرا شود. سه WARN شناخته‌شده عمدی‌اند (admin_exists حذف شده؛ is_admin authenticated-callable عمدی؛ هم‌پوشانی permissive عمدی).

## 18) Gotchaهای ریز ولی مهم

- `crypto.subtle` در createOrder ⇒ جریان پرداخت فقط روی secure context (HTTPS/localhost) کار می‌کند.
- Host sandbox در allowlist فرانت هست حتی در production — انتخاب mode سمت سرور است.
- subtotal سمت کلاینت صرفاً advisory؛ حقیقت با trigger است. formatPrice عمداً رقم لاتین + `.num`.
- slugها به‌طور پیش‌فرض فارسی‌اند (`\p{L}`)؛ ZWNJ/RLM حذف می‌شوند.
- AuthProvider چند instance عمدی دارد (authLayout + SupportChatBoundary) — یکی‌سازی نکن.
- typo موجود در پیام خطای reconcile ادمین: «آشتی پرداخت ناموفق بود.» (احتمالاً ناخواسته).
- `pageYOffset` در ScrollToTop legacy است ولی بی‌ضرر.
- دو پیاده‌سازی ScrollProgress وجود دارد (نسخه rAF mounted؛ نسخه framer dead).
- لیست مقالات در prerender فالبک استاتیک ندارد — اگر در بیلد (غیر-production) Supabase قطع شود، مقاله‌ها از HTML/sitemap تا بیلد بعدی غایب‌اند.
- `listChatThreads` همه ردیف‌ها را می‌گیرد و در حافظه group می‌کند (در مقیاس فعلی OK).

## 19) مغایرت‌های AGENTS.md با کد فعلی (این فایل معتبر است)

| ادعای AGENTS.md | واقعیت کد |
|---|---|
| RootProviders هر دو provider | فقط CartProvider؛ Auth per-route با authLayout |
| هیرو 3D با useCanRender3D | هیرو استاتیک webp؛ HeroOrchid3D یتیم؛ useCanRender3D وجود ندارد؛ three وابسته مرده |
| کامپوننت Features | وجود ندارد — در About ادغام شده |
| گالری بدون fallback | fallback استاتیک دارد |
| AdminDashboard با React.lazy داخلی | فقط wrapper route-lazy؛ منیجرها static |
| بوت‌استرپ اولین ادمین در login | حذف شده (0014)؛ login-only |
| schema تا 0013 | migrations تا 0021 (RLS perf + rate-limit AI)؛ preflight ≥19 |
| ClientOnly برای pre-render | هیچ استفاده‌ای ندارد |
| ترتیب Home با Features | Hero → FeaturedProducts → About → Gallery → Testimonials → Contact |

---
*آخرین به‌روزرسانی: 2026-08-22 — بر اساس بررسی عمیق کل ریپو (build/config، routing، services، contexts، components، pages، design-system، database/RLS، edge-functions، docs/CI).*
