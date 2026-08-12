// ZarinPal online-payment proxy for Nila Gol.
//
// Actions:
//   • create    { order_id: public UUID, payment_token, origin } -> { url }
//   • verify    { order_id, authority, status }                  -> { ok, ref_id, code, reason }
//   • reconcile { order_id: internal bigint }                    -> { ok, status, ref_id, reason } (ADMIN ONLY)
//
// Security model (see docs/zarinpal-developer-guide.md §11):
//   - verify_jwt is OFF so guests can pay, therefore public actions authorize
//     inside this handler instead of treating a predictable database id as proof.
//   - `create` requires an unguessable public_id plus a separate high-entropy
//     payment capability. Only SHA-256(payment_token) is stored in the order row.
//   - `create` atomically claims the order with a DB lock marker before contacting
//     ZarinPal, so concurrent/replayed requests cannot overwrite each other's
//     authority. Locks expire and gateway requests are time-bounded for recovery.
//   - `verify` requires the callback authority to exactly equal the authority
//     stored by `create` BEFORE any payment-state mutation; legacy numeric
//     references are accepted only for verify so pre-migration callbacks can finish.
//   - `reconcile` validates the caller JWT and the admins allowlist.
//   - money is always read from the DB; payment_amount_rial is frozen at create.
//   - unique indexes on authority/ref_id (0013) make one payment settle one order.
//
// Secrets: ZARINPAL_MERCHANT_ID, ZARINPAL_MODE (sandbox|production), SITE_URL
// (production canonical origin — MUST equal the ZarinPal-registered domain).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODE = Deno.env.get("ZARINPAL_MODE") ?? "sandbox";
const MERCHANT = Deno.env.get("ZARINPAL_MERCHANT_ID") ?? "00000000-0000-0000-0000-000000000000";
const BASE = MODE === "production" ? "https://payment.zarinpal.com" : "https://sandbox.zarinpal.com";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://nilagol.ir").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_LOCK_PREFIX = "__NILA_PAYMENT_LOCK__:";
const PAYMENT_LOCK_TTL_MS = 2 * 60 * 1000;
const PAYMENT_FETCH_TIMEOUT_MS = 15 * 1000;

const ERROR_FA: Record<string, string> = {
  "-9": "خطای اعتبارسنجی (مقادیر ارسالی نادرست است).",
  "-10": "کد پذیرنده یا IP معتبر نیست.",
  "-11": "درگاه فعال نیست؛ با پشتیبانی زرین‌پال تماس بگیرید.",
  "-12": "تلاش بیش از حد مجاز؛ کمی بعد دوباره امتحان کنید.",
  "-13": "محدودیت تراکنش؛ لازم است مدارک درگاه تکمیل شود.",
  "-14": "دامنهٔ آدرس بازگشت با دامنهٔ ثبت‌شدهٔ درگاه یکی نیست.",
  "-15": "درگاه معلق شده است؛ با پشتیبانی تماس بگیرید.",
  "-16": "سطح تأیید پذیرنده کافی نیست.",
  "-17": "محدودیت سطح پذیرنده.",
  "-18": "آدرس معرف با دامنهٔ ثبت‌شده مطابقت ندارد.",
  "-19": "امکان ایجاد تراکنش برای این درگاه نیست.",
  "-30": "خطای تسویهٔ اشتراکی.",
  "-31": "برای تسویهٔ اشتراکی باید حساب بانکی معتبر به پنل اضافه شود.",
  "-32": "مبلغ تسهیم از کل تراکنش بیشتر است.",
  "-33": "درصدهای تسهیم نادرست است.",
  "-34": "مبلغ تسهیم از کل تراکنش بیشتر است.",
  "-35": "تعداد دریافت‌کنندگان تسهیم بیش از حد مجاز است.",
  "-36": "حداقل مبلغ تسهیم ۱۰٬۰۰۰ ریال است.",
  "-37": "یک یا چند شبای تسهیم غیرفعال است.",
  "-38": "خطای تعریف شبا؛ کمی بعد دوباره تلاش کنید.",
  "-39": "خطای تسهیم؛ با پشتیبانی تماس بگیرید.",
  "-40": "پارامتر expire_in نامعتبر است.",
  "-41": "حداکثر مبلغ پرداختی ۱۰۰ میلیون تومان است.",
  "-50": "مبلغ تأیید با مبلغ اولیهٔ تراکنش یکسان نیست.",
  "-51": "پرداخت ناموفق بود.",
  "-52": "خطای غیرمنتظره؛ با پشتیبانی زرین‌پال تماس بگیرید.",
  "-53": "این تراکنش متعلق به این درگاه نیست (احتمال ناهماهنگی sandbox/production).",
  "-54": "شناسهٔ تراکنش (authority) نامعتبر یا منقضی است.",
  "-55": "تراکنش موردنظر یافت نشد.",
  "-60": "امکان ریورس این تراکنش با بانک وجود ندارد.",
  "-61": "تراکنش در وضعیت موفق نیست یا قبلاً ریورس شده است.",
  "-62": "IP درگاه ثبت نشده است.",
  "-63": "مهلت ۳۰ دقیقه‌ای ریورس این تراکنش گذشته است.",
  "100": "عملیات موفق.",
  "101": "تراکنش قبلاً تأیید (وریفای) شده است.",
};

function describeError(dataCode: unknown, errorsObj: unknown): { code: number | null; reason: string } {
  let code = Number(dataCode);
  if (!Number.isFinite(code) || code >= 0) {
    if (errorsObj && !Array.isArray(errorsObj) && typeof (errorsObj as any).code !== "undefined") {
      code = Number((errorsObj as any).code);
    }
  }
  const key = String(code);
  const reason =
    ERROR_FA[key] ||
    (errorsObj && !Array.isArray(errorsObj) ? (errorsObj as any).message : null) ||
    `خطای درگاه (کد ${Number.isFinite(code) ? code : "نامشخص"})`;
  return { code: Number.isFinite(code) ? code : null, reason };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isPaymentLock(value: unknown) {
  return typeof value === "string" && value.startsWith(PAYMENT_LOCK_PREFIX);
}

function paymentLockTimestamp(value: unknown) {
  if (!isPaymentLock(value)) return null;
  const token = String(value).slice(PAYMENT_LOCK_PREFIX.length);
  const timestamp = Number(token.split(":", 1)[0]);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isFreshPaymentLock(value: unknown) {
  const timestamp = paymentLockTimestamp(value);
  return timestamp !== null && Date.now() - timestamp < PAYMENT_LOCK_TTL_MS;
}

async function zpPost(path: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAYMENT_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/pg/v4/payment/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await res.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

async function markPaid(db: ReturnType<typeof admin>, order: any, refId: string) {
  const patch: Record<string, unknown> = {
    payment_status: "paid",
    payment_ref_id: refId,
    paid_at: new Date().toISOString(),
    payment_gateway: "zarinpal",
    payment_token_hash: null,
  };
  if (order.status === "pending") patch.status = "confirmed";
  const { data } = await db
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

async function markFailed(db: ReturnType<typeof admin>, internalOrderId: unknown) {
  await db
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", internalOrderId)
    .neq("payment_status", "paid");
}

async function releasePaymentLock(db: ReturnType<typeof admin>, internalOrderId: unknown, lockValue: string) {
  await db
    .from("orders")
    .update({ payment_authority: null, payment_status: "failed" })
    .eq("id", internalOrderId)
    .eq("payment_authority", lockValue)
    .neq("payment_status", "paid");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const db = admin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "create") {
      const orderRef = String(body.order_id || "");
      const paymentToken = String(body.payment_token || "");
      if (!UUID_RE.test(orderRef) || paymentToken.length < 64) {
        return json({ error: "مجوز پرداخت سفارش نامعتبر است." }, 400);
      }

      const { data: order, error } = await db
        .from("orders")
        .select("id, public_id, subtotal, phone, user_id, payment_status, payment_gateway, payment_authority, payment_token_hash")
        .eq("public_id", orderRef)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد یا مجوز پرداخت نامعتبر است." }, 404);

      const suppliedHash = await sha256Hex(paymentToken);
      if (!order.payment_token_hash || !safeEqual(suppliedHash, String(order.payment_token_hash))) {
        return json({ error: "سفارش یافت نشد یا مجوز پرداخت نامعتبر است." }, 403);
      }
      if (order.payment_status === "paid") return json({ error: "این سفارش قبلاً پرداخت شده است." }, 400);

      if (isPaymentLock(order.payment_authority) && isFreshPaymentLock(order.payment_authority)) {
        return json({ error: "درگاه پرداخت برای این سفارش در حال آماده‌سازی است. چند لحظه بعد دوباره تلاش کنید." }, 409);
      }

      if (!isPaymentLock(order.payment_authority) && order.payment_status === "unpaid" && order.payment_authority) {
        return json({ url: `${BASE}/pg/StartPay/${order.payment_authority}`, authority: order.payment_authority, reused: true });
      }

      const lockValue = `${PAYMENT_LOCK_PREFIX}${Date.now()}:${crypto.randomUUID()}`;
      let lockQuery = db
        .from("orders")
        .update({ payment_authority: lockValue })
        .eq("id", order.id)
        .eq("payment_status", order.payment_status)
        .neq("payment_status", "paid");
      lockQuery = order.payment_authority == null
        ? lockQuery.is("payment_authority", null)
        : lockQuery.eq("payment_authority", order.payment_authority);
      const { data: lockedRows, error: lockError } = await lockQuery.select("id");
      if (lockError) return json({ error: "آماده‌سازی امن درگاه پرداخت ناموفق بود." }, 500);
      if (!Array.isArray(lockedRows) || lockedRows.length !== 1) {
        return json({ error: "درگاه پرداخت برای این سفارش در درخواست دیگری در حال آماده‌سازی است. چند لحظه بعد دوباره تلاش کنید." }, 409);
      }

      const amount = Math.round(Number(order.subtotal) * 10);
      if (!amount || amount < 1000) {
        await releasePaymentLock(db, order.id, lockValue);
        return json({ error: "مبلغ سفارش نامعتبر است." }, 400);
      }

      const origin = MODE === "production" ? SITE_URL : String(body.origin || SITE_URL).replace(/\/$/, "");
      const publicCode = String(order.public_id).slice(0, 8).toUpperCase();
      const metadata: Record<string, string> = { order_id: String(order.public_id) };
      if (/^09\d{9}$/.test(String(order.phone || ""))) metadata.mobile = order.phone;
      if (order.user_id) {
        try {
          const { data: u } = await db.auth.admin.getUserById(order.user_id);
          if (u?.user?.email) metadata.email = u.user.email;
        } catch { /* optional metadata */ }
      }

      let out: any;
      try {
        out = await zpPost("request.json", {
          merchant_id: MERCHANT,
          amount,
          currency: "IRR",
          description: `سفارش ${publicCode} — نیلا گل`,
          callback_url: `${origin}/payment/callback?order_id=${encodeURIComponent(String(order.public_id))}`,
          metadata,
        });
      } catch (error) {
        await releasePaymentLock(db, order.id, lockValue);
        const reason = error instanceof DOMException && error.name === "AbortError"
          ? "درگاه پرداخت در زمان مقرر پاسخ نداد."
          : "ارتباط با درگاه پرداخت برقرار نشد.";
        return json({ error: reason }, 502);
      }

      const code = out?.data?.code;
      const authority = out?.data?.authority;
      if (code !== 100 || !authority) {
        await releasePaymentLock(db, order.id, lockValue);
        const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
        return json({ error: `ایجاد تراکنش ناموفق بود: ${reason}`, code: zc }, 502);
      }

      const { data: savedRows, error: saveError } = await db
        .from("orders")
        .update({
          payment_method: "online",
          payment_status: "unpaid",
          payment_gateway: "zarinpal",
          payment_authority: authority,
          payment_amount_rial: amount,
          payment_ref_id: null,
          paid_at: null,
        })
        .eq("id", order.id)
        .eq("payment_authority", lockValue)
        .neq("payment_status", "paid")
        .select("id");

      if (saveError || !Array.isArray(savedRows) || savedRows.length !== 1) {
        return json({ error: "تراکنش ایجاد شد اما ثبت امن شناسه درگاه ناموفق بود. لطفاً با پشتیبانی تماس بگیرید و پرداخت را ادامه ندهید." }, 500);
      }

      return json({ url: `${BASE}/pg/StartPay/${authority}`, authority });
    }

    if (action === "verify") {
      const orderRef = String(body.order_id || "");
      const authority = String(body.authority || "");
      const status = body.status;
      const isPublicRef = UUID_RE.test(orderRef);
      const isLegacyRef = /^\d+$/.test(orderRef);
      if ((!isPublicRef && !isLegacyRef) || !authority) return json({ error: "پارامتر ناقص است." }, 400);

      let query = db
        .from("orders")
        .select("id, public_id, subtotal, status, payment_status, payment_ref_id, payment_authority, payment_amount_rial");
      query = isPublicRef ? query.eq("public_id", orderRef) : query.eq("id", orderRef);
      const { data: order, error } = await query.maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);

      if (!order.payment_authority || isPaymentLock(order.payment_authority) || order.payment_authority !== authority) {
        return json({ ok: false, reason_code: "authority_mismatch", reason: "شناسهٔ تراکنش نامعتبر است." }, 400);
      }
      if (order.payment_status === "paid") return json({ ok: true, ref_id: order.payment_ref_id, already: true });
      if (status && status !== "OK") {
        await markFailed(db, order.id);
        return json({ ok: false, reason_code: "canceled", reason: "پرداخت توسط شما لغو شد." });
      }

      const amount = order.payment_amount_rial ?? Math.round(Number(order.subtotal) * 10);
      const out = await zpPost("verify.json", { merchant_id: MERCHANT, amount, authority });
      const code = out?.data?.code;
      if (code === 100 || code === 101) {
        const ref = String(out.data.ref_id ?? "");
        const won = await markPaid(db, order, ref);
        return json({ ok: true, ref_id: ref, code, card_pan: out.data.card_pan ?? null, already: code === 101 || !won });
      }
      await markFailed(db, order.id);
      const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
      return json({ ok: false, code: zc, reason });
    }

    if (action === "reconcile") {
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "دسترسی غیرمجاز." }, 403);
      const { data: uData, error: uErr } = await db.auth.getUser(token);
      if (uErr || !uData?.user) return json({ error: "دسترسی غیرمجاز." }, 403);
      const { data: adminRow } = await db
        .from("admins")
        .select("user_id")
        .eq("user_id", uData.user.id)
        .maybeSingle();
      if (!adminRow) return json({ error: "این عملیات فقط برای مدیر مجاز است." }, 403);

      const orderId = body.order_id;
      if (!orderId) return json({ error: "order_id لازم است." }, 400);
      const { data: order, error } = await db
        .from("orders")
        .select("id, subtotal, status, payment_method, payment_status, payment_ref_id, payment_authority, payment_amount_rial")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);

      if (order.payment_status === "paid")
        return json({ ok: true, already: true, ref_id: order.payment_ref_id, status: "VERIFIED" });
      if (order.payment_method !== "online") return json({ error: "این سفارش آنلاین نیست." }, 400);
      if (!order.payment_authority || isPaymentLock(order.payment_authority))
        return json({ error: "برای این سفارش شناسهٔ تراکنش معتبر ذخیره نشده؛ امکان آشتی نیست." }, 400);

      const amount = order.payment_amount_rial ?? Math.round(Number(order.subtotal) * 10);
      const inq = await zpPost("inquiry.json", { merchant_id: MERCHANT, authority: order.payment_authority });
      const st = inq?.data?.status;
      if (!st) {
        const { code: zc, reason } = describeError(inq?.data?.code, inq?.errors);
        return json({ ok: false, status: null, code: zc, reason: reason || "استعلام وضعیت ناموفق بود." }, 502);
      }

      if (st === "VERIFIED" || st === "PAID") {
        const out = await zpPost("verify.json", { merchant_id: MERCHANT, amount, authority: order.payment_authority });
        const code = out?.data?.code;
        if (code === 100 || code === 101) {
          const ref = String(out.data.ref_id ?? order.payment_ref_id ?? "");
          await markPaid(db, order, ref);
          return json({ ok: true, status: "VERIFIED", code, ref_id: ref, already: code === 101 });
        }
        const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
        return json({ ok: false, status: st, code: zc, reason });
      }
      if (st === "IN_BANK")
        return json({ ok: false, status: "IN_BANK", reason: "پرداخت هنوز در بانک در حال انجام است؛ کمی بعد دوباره بررسی کنید." });
      if (st === "FAILED") {
        await markFailed(db, order.id);
        return json({ ok: false, status: "FAILED", code: -51, reason: "تراکنش ناموفق بوده است." });
      }
      if (st === "REVERSED") {
        await db.from("orders").update({ payment_status: "refunded", payment_token_hash: null }).eq("id", order.id).neq("payment_status", "paid");
        return json({ ok: false, status: "REVERSED", reason: "تراکنش ریورس (بازگشت وجه) شده است." });
      }
      return json({ ok: false, status: st, reason: `وضعیت نامشخص: ${st}` });
    }

    return json({ error: "action نامعتبر است." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
