# راهنمای توسعه‌دهندگی درگاه پرداخت زرین‌پال (نیلا گل)

> مرجع کامل و فنی برای پیاده‌سازی، تکمیل و ممیزی اتصال به زرین‌پال.
> برگرفته از مستندات رسمی: `zarinpal.com/docs` (درگاه پرداخت، API، راهنمای استفاده، SDK) — استخراج‌شده در تیر ۱۴۰۵.
> نگاشت به پیاده‌سازی فعلی ما در انتهای سند آمده است (Edge Function `payment` → `supabase/functions/payment/index.ts`).

---

## فهرست
1. [معماری کلی: دو API مجزا](#۱-معماری-کلی)
2. [واژگان و پارامترهای فنی](#۲-واژگان-و-پارامترهای-فنی)
3. [محیط تولید و تست (Sandbox)](#۳-محیط-تولید-و-تست)
4. [درگاه پرداخت REST — چرخهٔ کامل پرداخت](#۴-درگاه-پرداخت-rest)
5. [واحد پولی (IRR / IRT)](#۵-واحد-پولی)
6. [لیست کامل خطاها](#۶-لیست-کامل-خطاها)
7. [امکانات بیشتر](#۷-امکانات-بیشتر) (auto_verify، cart_data، تسهیم، card_pan، referrer، ریورس)
8. [متدهای دیگر: unVerified / inquiry / feeCalculation](#۸-متدهای-دیگر)
9. [API گراف‌کیوال (GraphQL) و احراز هویت oAuth2](#۹-api-graphql)
10. [استرداد وجه (Refund)](#۱۰-استرداد-وجه)
11. [نگاشت به پیاده‌سازی ما + ممیزی + چک‌لیست Go-Live](#۱۱-نگاشت-به-پیادهسازی-ما)
12. [منابع](#۱۲-منابع)

---

## ۱) معماری کلی

زرین‌پال دو رابط برنامه‌نویسی **مجزا** دارد؛ این دو را با هم اشتباه نگیرید:

| API | پروتکل | Endpoint پایه | کاربرد | احراز هویت |
|---|---|---|---|---|
| **درگاه پرداخت (Payment Gateway)** | REST / JSON | `https://payment.zarinpal.com/pg/v4/payment/*` | ساخت تراکنش، هدایت به درگاه، وریفای، ریورس، استعلام | فقط `merchant_id` (کد ۳۶ کاراکتری درگاه) |
| **API حساب کاربری** | GraphQL | `https://next.zarinpal.com/api/v4/graphql` | مدیریت حساب: ساخت درگاه، استرداد، تسویه، تیکت، حساب بانکی | oAuth 2.0 (`Access Token` به‌صورت `Bearer`) |

**برای فروشگاه ما (نیلا گل) فقط API نوعِ اول (درگاه پرداخت REST) لازم است.** GraphQL برای اتوماسیونِ پیشرفته (مثل استرداد خودکار یا ساخت درگاه از طریق کد) است و در بخش‌های ۹ و ۱۰ پوشش داده شده.

---

## ۲) واژگان و پارامترهای فنی

- **پذیرنده:** صاحب فروشگاه (ما).
- **خریدار:** دارندهٔ کارت شتاب که خرید می‌کند.
- **`merchant_id`:** کد یکتای **۳۶ کاراکتری** درگاه که زرین‌پال به هر درگاه می‌دهد.
- **`authority`:** شناسهٔ مرجع یکتای هر تراکنش (UUID، ۳۶ کاراکتر). در محیط تولید با حرف **`A`** و در سندباکس با حرف **`S`** شروع می‌شود.
- **`code`:** عدد وضعیت تراکنش (مثلاً `100` = موفق، `101` = قبلاً وریفای‌شده، اعداد منفی = خطا).
- **`ref_id`:** شمارهٔ پیگیری مالی که پس از پرداخت **موفق** برگردانده می‌شود.
- **`callback_url`:** آدرس بازگشت خریدار پس از پرداخت.
- **`IP` سرور:** برای بعضی متدها (مثل ریورس) باید IP سرور در پنل درگاه ثبت شود.
- **`fee` / `fee_type`:** مبلغ کارمزد و اینکه پرداخت‌کنندهٔ کارمزد `Merchant` (پذیرنده) است یا `Payer` (خریدار) — در پنل قابل تنظیم است.
- **امنیت:** هیچ اطلاعات بانکی خریدار (شماره کارت، رمز، CVV2) هرگز به پذیرنده یا زرین‌پال داده نمی‌شود؛ همه در صفحهٔ امن بانک وارد می‌شود. ارتباط روی HTTPS/SSL است.

---

## ۳) محیط تولید و تست

| محیط | دامنهٔ Endpoint | نکته |
|---|---|---|
| **Production** | `https://payment.zarinpal.com/...` | نیازمند `merchant_id` واقعی از پنل (پس از دریافت نماد اعتماد). authority با `A`. |
| **Sandbox (تست)** | `https://sandbox.zarinpal.com/...` | بدون پرداخت واقعی. برای `merchant_id` هر **UUID دلخواه** بگذارید. authority با `S`. |

برای سوییچ بین دو محیط فقط کافی است دامنه را از `payment.zarinpal.com` به `sandbox.zarinpal.com` تغییر دهید؛ بقیهٔ مسیر و پارامترها یکسان است.

---

## ۴) درگاه پرداخت REST

چرخهٔ پرداخت **۴ مرحله** دارد. همهٔ درخواست‌ها `POST` با `Content-Type: application/json` هستند و همهٔ پاسخ‌ها JSON.

### مرحلهٔ ۱ — ساخت تراکنش (Request)
`POST https://payment.zarinpal.com/pg/v4/payment/request.json`

| پارامتر | نوع | الزام | توضیح |
|---|---|---|---|
| `merchant_id` | String | بله | کد ۳۶ کاراکتری درگاه |
| `amount` | Integer | بله | مبلغ تراکنش (پیش‌فرض به **ریال**؛ با `currency` قابل تغییر) |
| `currency` | String | خیر | `IRR` (ریال) یا `IRT` (تومان) |
| `description` | String | بله | توضیح تراکنش (حداکثر ۵۰۰ کاراکتر) |
| `callback_url` | String | بله | آدرس بازگشت خریدار |
| `referrer_id` | String | خیر | کد معرف (همکاری در فروش) |
| `metadata` | Object | خیر | شامل `mobile`، `email`، `order_id` و `auto_verify` |
| `wages` | Array | خیر | تسویهٔ اشتراکی (بخش ۷) |
| `cart_data` | Object | خیر | جزئیات سبد خرید (بخش ۷) |

**نمونهٔ درخواست:**
```bash
curl -X POST https://payment.zarinpal.com/pg/v4/payment/request.json \
  -H 'accept: application/json' -H 'content-type: application/json' \
  -d '{
    "merchant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "amount": 10000,
    "currency": "IRT",
    "callback_url": "https://nilagol.ir/payment/callback",
    "description": "سفارش #123 — نیلا گل",
    "metadata": { "mobile": "09121234567", "email": "user@example.com", "order_id": "123" }
  }'
```

**پاسخ موفق:**
```json
{ "data": { "code": 100, "message": "Success",
  "authority": "A0000000000000000000000000000wwOGYpd",
  "fee_type": "Merchant", "fee": 100 }, "errors": [] }
```
اگر `code = 100` و `authority` دریافت شد، به مرحلهٔ ۲ بروید. در غیر این صورت به [لیست خطاها](#۶-لیست-کامل-خطاها) مراجعه کنید (خطاها در آرایهٔ `errors` می‌آیند).

### مرحلهٔ ۲ — هدایت خریدار به درگاه
خریدار را به این آدرس ریدایرکت کنید:
```
https://payment.zarinpal.com/pg/StartPay/{authority}
```

### مرحلهٔ ۳ — بازگشت به سایت (Callback)
پس از پرداخت، زرین‌پال خریدار را به `callback_url` برمی‌گرداند و دو پارامتر را در QueryString اضافه می‌کند:
```
https://nilagol.ir/payment/callback?Authority=A000...&Status=OK
```
- `Status = OK` → پرداخت انجام شده؛ باید **وریفای** شود.
- `Status = NOK` → تراکنش ناموفق یا لغو‌شده؛ وریفای نکنید.
> ⚠️ متد verify را **فقط** وقتی صدا بزنید که `Status == OK` باشد.

### مرحلهٔ ۴ — وریفای (Verify)
`POST https://payment.zarinpal.com/pg/v4/payment/verify.json`

ورودی:
| پارامتر | نوع | توضیح |
|---|---|---|
| `merchant_id` | String | کد درگاه |
| `amount` | Integer | مبلغ تراکنش (**همان مبلغ مرحلهٔ ۱، به ریال**) |
| `authority` | String | شناسهٔ مرجع دریافتی |

خروجی:
| پارامتر | نوع | توضیح |
|---|---|---|
| `code` | Integer | `100` = موفق، `101` = قبلاً وریفای‌شده |
| `ref_id` | Integer | شمارهٔ پیگیری (فقط در موفقیت) |
| `card_pan` | String | شماره کارت به‌صورت Mask (`502229******5995`) |
| `card_hash` | String | هش SHA256 کارت |
| `fee_type` / `fee` | String / Integer | کارمزد |

**پاسخ موفق:**
```json
{ "data": { "code": 100, "message": "Verified",
  "ref_id": 201, "card_pan": "502229******5995",
  "card_hash": "1EBE...B69", "fee_type": "Merchant", "fee": 0 }, "errors": [] }
```

> 🔑 **نکتهٔ کلیدی (idempotency):** اولین verify موفق `code = 100` می‌دهد؛ در فراخوانی‌های بعدیِ همان تراکنش `code = 101` («قبلاً وریفای شده») برمی‌گردد. **هر دو به‌معنای پرداخت موفق‌اند.** پس منطق شما باید `100 || 101` را «پرداخت‌شده» تلقی کند.

---

## ۵) واحد پولی

- پیش‌فرض `amount` بر حسب **ریال (IRR)** است.
- با فرستادن `currency: "IRT"` مبلغ بر حسب **تومان** تفسیر می‌شود.
- دو راه معادل برای ثبت «۱۰٬۰۰۰ تومان»:
  - `{"amount": 100000, "currency": "IRR"}` (تومان × ۱۰)
  - `{"amount": 10000, "currency": "IRT"}`
- در verify، `amount` باید با مبلغ ثبت‌شده در request یکی باشد وگرنه خطای `-50` می‌گیرید.

---

## ۶) لیست کامل خطاها

| گروه | code | معنی (EN) | شرح فارسی |
|---|---|---|---|
| public | **-9** | Validation error | خطای اعتبارسنجی: نبود merchant_id / callback_url / description، یا description > ۵۰۰ کاراکتر، یا مبلغ خارج از حد مجاز، یا referrer_id نامعتبر |
| public | -10 | Terminal is not valid | IP یا merchant_id صحیح نیست |
| public | -11 | Terminal is not active | درگاه فعال نیست (تماس با پشتیبانی) |
| public | -12 | Too many attempts | تلاش بیش از حد در بازهٔ کوتاه |
| public | -13 | terminal limit reached | محدودیت تراکنش؛ تکمیل مدارک لازم است |
| public | -14 | Callback URL domain does not match | **دامنهٔ callback با دامنهٔ ثبت‌شدهٔ درگاه یکی نیست** |
| public | -15 | Terminal suspended | درگاه معلق شده |
| public | -16 / -17 | Terminal user level not valid | سطح پذیرنده پایین‌تر از حد (نقره‌ای/آبی) |
| public | -18 | Referrer address mismatch | استفاده از کد درگاه در دامنهٔ دیگر مجاز نیست |
| public | -19 | Transactions banned | ایجاد تراکنش برای این ترمینال ممکن نیست |
| public | **100** | Success | عملیات موفق |
| PaymentRequest | -30 … -39 | Wages errors | خطاهای تسویهٔ اشتراکی (دسترسی/حساب بانکی/درصد/شبا/…) |
| PaymentRequest | -40 | Invalid `expire_in` | پارامتر انقضا نامعتبر |
| PaymentRequest | **-41** | Max amount 100,000,000 tomans | حداکثر مبلغ ۱۰۰ میلیون تومان |
| PaymentVerify | **-50** | Amounts not the same | مبلغ verify با مبلغ request فرق دارد |
| PaymentVerify | -51 | Not a paid try | پرداخت ناموفق |
| PaymentVerify | -52 | Unexpected error | خطای غیرمنتظره (پشتیبانی) |
| PaymentVerify | -53 | Not this merchant's session | تراکنش متعلق به این merchant_id نیست |
| PaymentVerify | **-54** | Invalid authority | authority نامعتبر |
| PaymentVerify | -55 | manual payment not found | تراکنش یافت نشد |
| PaymentVerify | **101** | Verified | تراکنش قبلاً وریفای شده (موفق) |
| PaymentReverse | -60 | Cannot reverse with bank | امکان ریورس با بانک نیست |
| PaymentReverse | -61 | Not in success status | تراکنش موفق نیست یا قبلاً ریورس شده |
| PaymentReverse | -62 | Terminal IP limit must be active | IP درگاه ست نشده |
| PaymentReverse | -63 | Reverse time expired | زمان ریورس (۳۰ دقیقه) گذشته |

فرمت خطا در پاسخ:
```json
{ "data": [], "errors": { "message": "Invalid authority.", "code": -54, "validations": [] } }
```

---

## ۷) امکانات بیشتر

### ۷.۱ اعتبارسنجی خودکار/غیرخودکار (`metadata.auto_verify`)
پس از پرداخت، زرین‌پال باید از بانک تأییدیهٔ نهایی بگیرد (verify). اگر verify در بازهٔ مجاز انجام نشود، **پول به خریدار برمی‌گردد**. رفتار پیش‌فرض از پنل تنظیم می‌شود، ولی با `metadata.auto_verify` قابل override در همان تراکنش است:
- `auto_verify: true` → زرین‌پال خودش خودکار وریفای می‌کند (نیازی به فراخوانی verify نیست).
- `auto_verify: false` → وریفای فقط با فراخوانی متد verify توسط شما انجام می‌شود (کنترل کامل؛ برای جلوگیری از مغایرت وقتی callback از دست می‌رود مناسب است).
- ارسال‌نکردن → تابع تنظیم پنل.
> مقدار `metadata.auto_verify` همیشه بر تنظیم پنل اولویت دارد.

### ۷.۲ میان‌پی / اطلاعات سبد خرید (`cart_data`)
شیٔ اختیاری برای شفاف‌سازی فاکتور؛ شامل:
- `items[]`: `item_name`, `item_amount` (ریال), `item_count`, `item_amount_sum`
- `added_costs`: `tax`, `payment`, `transport`
- `deductions`: `discount`

### ۷.۳ تسویهٔ اشتراکی شناور (`wages`)
تقسیم خودکار مبلغ بین چند حساب در لحظهٔ پرداخت. آرایه‌ای از `{ iban (۲۶ کاراکتری IR...), amount (ریال), description }`. حداکثر **۵ سهم** و تا **۹۹٪** مبلغ. (خطاهای -30..-39.)

### ۷.۴ پرداخت با کارت مشخص (`metadata.card_pan`)
با گذاشتن `card_pan` در `metadata`، تراکنش فقط با آن کارت انجام می‌شود؛ در غیر این صورت ناموفق. همچنین با ارسال `mobile`، سابقهٔ کارت‌های خریدار برای پرداخت‌های بعدی ذخیره و سریع‌تر می‌شود.

### ۷.۵ همکاری در فروش (`referrer_id`)
با کد معرف از تراکنش‌های زیرمجموعه سهم می‌گیرید. اگر کد نامعتبر باشد معمولاً نادیده گرفته می‌شود (نه خطای مستقیم؛ جز `429` = قالب نامعتبر).

### ۷.۶ ریورس تراکنش (Reverse)
`POST /pg/v4/payment/reverse.json` — تراکنش‌های موفقِ حداکثر **۳۰ دقیقه** گذشته را بدون کارمزد به خریدار برمی‌گرداند. نیازمند **ست‌کردن IP سرور** در پنل (وگرنه خطای -62). ورودی: `merchant_id`, `authority`. پاسخ موفق: `{ "code":100, "message":"Reversed" }`.

---

## ۸) متدهای دیگر

### ۸.۱ unVerified — لیست پرداخت‌های موفقِ وریفای‌نشده
`POST /pg/v4/payment/unVerified.json` — ورودی `merchant_id`. خروجی آرایهٔ `authorities` (هرکدام `authority`, `amount`, `callback_url`, `date`). حداکثر **۱۰۰ تراکنش آخر**. برای **آشتی/بازیابی** تراکنش‌هایی که callbackشان از دست رفته عالی است.

### ۸.۲ استعلام وضعیت (Inquiry)
`POST /pg/v4/payment/inquiry.json` — ورودی `merchant_id`, `authority`. خروجی `status`:
`VERIFIED` (وریفای‌شده) · `PAID` (پرداخت‌شده ولی وریفای‌نشده) · `IN_BANK` (در حال پرداخت) · `FAILED` (ناموفق) · `REVERSED` (ریورس‌شده).
> ⚠️ این متد **فقط وضعیت** را می‌گوید و **جایگزین verify نیست**.

### ۸.۳ محاسبهٔ کارمزد (FeeCalculation)
`POST /pg/v4/payment/feeCalculation.json` — ورودی `merchant_id`, `amount`, `currency`. خروجی `fee`, `fee_type`, `suggested_amount`. تراکنشی ایجاد نمی‌کند؛ فقط محاسبه.

---

## ۹) API GraphQL

- **Endpoint یکتا:** `https://next.zarinpal.com/api/v4/graphql` (همه‌چیز `POST` + `application/json`).
- **احراز هویت oAuth 2.0** (برای گرفتن `Access Token`):
  1. `POST https://next.zarinpal.com/api/oauth/register` — `{first_name,last_name,cell_number}` → `user_id`.
  2. `POST /api/oauth/initialize` — `{username, channel: 'ussd'|'sms'}` → کد یک‌بارمصرف (USSD/SMS).
  3. `POST /api/oauth/token` — `grant_type:'password'`, `client_id`, `client_secret` (از پشتیبانی زرین‌پال)، `username`, `password` (OTP), `scope:'*'` → `access_token` (JWT) + `refresh_token` + `expires_in`.
  4. تمدید: `POST /api/oauth/token` با `grant_type:'refresh_token'`.
- سپس هر درخواست با هدر `Authorization: Bearer {ACCESS_TOKEN}`.
- **نوشتن کوئری:** ریشه `query` (خواندن) یا `mutation` (تغییر). انواع: `Object`, `Scalar` (`String/Int/DateTime/ID/Boolean`), `Enum`, `List`. علامت `!` = non-null.
- **محیط تست:** GraphiQL روی `https://api.zarinpal.com/api/v4/docs/graphiql`.

**کوئری/میوتیشن‌های مهم (query/*):**
| صفحه | کاربرد |
|---|---|
| `session` (تراکنش‌ها) | لیست/جزئیات تراکنش‌ها (`Session`) |
| `refund` (استرداد وجه) | ثبت و استعلام استرداد — بخش ۱۰ |
| `terminal` (درگاه) | ساخت/مدیریت درگاه از طریق API |
| `reconciles` (تسویه حساب) | گزارش تسویه‌ها |
| `payout` (تسهیم درآمد) | تسهیم درآمد |
| `instantPayout` (تسویهٔ پیش از موعد) | برداشت زودتر از سیکل |
| `invoice` (پرداخت شناسه‌دار) | پرداخت با شناسه |
| `bankaccount` (حساب بانکی) | مدیریت حساب‌های تسویه |
| `card-mobile-verified` (سرویس عیان) | استعلام تعلق کارت/موبایل به یک شخص |

---

## ۱۰) استرداد وجه (Refund)

از طریق **GraphQL** (نیازمند Access Token). حداقل مبلغ استرداد **۲۰٬۰۰۰ ریال**.

**Mutation ثبت استرداد:**
```graphql
mutation AddRefund($session_id: ID!, $amount: BigInteger!, $description: String,
                   $method: InstantPayoutActionTypeEnum, $reason: RefundReasonEnum) {
  resource: AddRefund(session_id: $session_id, amount: $amount,
                      description: $description, method: $method, reason: $reason) {
    terminal_id id amount
    timeline { refund_amount refund_time refund_status }
  }
}
```
متغیرها:
- `session_id`: شمارهٔ تراکنش (Session ID، از بخش تراکنش‌ها).
- `amount`: ریال (حداقل ۲۰٬۰۰۰).
- `method`: `PAYA` (عادی، سیکل بعدی) یا `CARD` (آنی).
- `reason`: `CUSTOMER_REQUEST` / `DUPLICATE_TRANSACTION` / `SUSPICIOUS_TRANSACTION` / `OTHER`.

**استعلام وضعیت استرداد** با `SessionById` → فیلد `timeline.refund_status` (`SUCCESS` / `PENDING` / `FAILED`).

---

## ۱۱) نگاشت به پیاده‌سازی ما

پیاده‌سازی فعلی: `supabase/functions/payment/index.ts` (Edge Function `payment`, `verify_jwt=false`), سرویس `src/services/payments.js`, صفحهٔ بازگشت `src/pages/PaymentCallback.jsx`. اسرار: `ZARINPAL_MERCHANT_ID`, `ZARINPAL_MODE`, `SITE_URL`.

### ✅ چیزهایی که درست پیاده شده
- Endpointها: `request.json`, `verify.json`, `StartPay/{authority}` ✔️
- سوییچ Sandbox↔Production با تعویض دامنه بر اساس `ZARINPAL_MODE` ✔️
- مبلغ: `subtotal (تومان) × 10` با `currency:"IRR"` → معادل درست ریال ✔️
- مدیریت `code` **100 یا 101** به‌عنوان موفق (idempotent) ✔️ مطابق نکتهٔ بخش ۴
- فقط وقتی `Status == OK` وریفای می‌شود ✔️
- خواندن مبلغ از **دیتابیس** (نه از کلاینت) → ضد دستکاری ✔️
- گارد حداقل مبلغ (۱۰۰۰ ریال) ✔️
- `merchant_id`/کلید فقط سمت سرور (Edge Secret) ✔️

### 🔧 وضعیت تکمیلی و پیشنهادهای باقی‌مانده
1. **آشتی/Reconciliation پیاده شده:** اکشن ادمین `reconcile` با `inquiry.json` وضعیت را می‌گیرد و در صورت `PAID`
   متد verify را صدا می‌زند. در پنل ادمین با «تأیید مجدد پرداخت» در دسترس است.
2. **نمایش خطای دقیق پیاده شده:** Edge Function کدهای زرین‌پال را به پیام فارسی map می‌کند و callback/ادمین همان دلیل را نشان می‌دهند.
3. **دامنهٔ callback harden شده:** در production، `callback_url` از secret/متغیر `SITE_URL` ساخته می‌شود تا با دامنهٔ ثبت‌شدهٔ زرین‌پال یکی باشد؛ `origin` کلاینت فقط در sandbox/dev استفاده می‌شود.
4. **`metadata` پیاده شده:** `order_id`، موبایل معتبر و در صورت وجود ایمیل کاربر به metadata زرین‌پال فرستاده می‌شود.
5. **قابلیت‌های آینده (اختیاری):** «لغو/بازگشت وجه» با **ریورس** (≤۳۰ دقیقه، نیاز به ست‌کردن IP سرور) یا **استرداد** GraphQL (`AddRefund`, نیازمند oAuth2 client از پشتیبانی).
6. سقف مبلغ: در صورت نیاز گاردِ حداکثر ۱۰۰ میلیون تومان (خطای -41).

### 🚀 چک‌لیست Go-Live
- [ ] دریافت **نماد اعتماد** → ساخت درگاه در پنل زرین‌پال → دریافت `merchant_id` واقعی.
- [ ] ثبت **دامنهٔ `nilagol.ir`** به‌عنوان دامنهٔ درگاه (برای رفع خطای -14).
- [ ] ست‌کردن اسرار Edge: `ZARINPAL_MERCHANT_ID` + `ZARINPAL_MODE=production` + `SITE_URL=https://www.nilagol.ir`.
- [ ] (برای ریورس) ثبت **IP سرور** در تنظیمات درگاه.
- [ ] تست کامل در Sandbox، سپس یک تراکنش واقعی کم‌مبلغ در Production و بررسی verify + `ref_id`.

---

## ۱۲) منابع
- درگاه پرداخت: https://www.zarinpal.com/docs/paymentGateway/
- راهنمای اتصال: https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html
- Sandbox: https://www.zarinpal.com/docs/paymentGateway/sandBox.html
- لیست خطاها: https://www.zarinpal.com/docs/paymentGateway/errorList.html
- امکانات بیشتر: `.../moreFeatures/` (session-validation, checkout, currency, setshare, card-pan, reverse, referrer-id)
- متدهای دیگر: `.../otherMethods/` (unVerified, Inquiry, feeCalculation)
- مستندات API (GraphQL): https://www.zarinpal.com/docs/apiDocs/ · احراز هویت: `.../apiDocs/auth.html` · استرداد: `.../apiDocs/query/refund.html`
- راهنمای استفاده: https://www.zarinpal.com/docs/howToUse/ · SDK: https://www.zarinpal.com/docs/sdkDocs/
- GraphiQL: https://api.zarinpal.com/api/v4/docs/graphiql
