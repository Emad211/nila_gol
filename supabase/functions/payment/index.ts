// ZarinPal online-payment proxy for Nila Gol.
//
// Actions:
//   • create    { order_id, origin }              -> { url }   (redirect user)
//   • verify    { order_id, authority, status }   -> { ok, ref_id, code, reason } (guest callback)
//   • reconcile { order_id }                      -> { ok, status, ref_id, reason } (ADMIN ONLY)
//
// Security model (see docs/zarinpal-developer-guide.md §11):
//   - verify_jwt is OFF so guests can pay; `create`/`verify` never trust the client
//     for money — the amount is read from the DB and every settle goes through
//     ZarinPal verify.json. The paid state is written only by this function
//     (service role); RLS forbids the browser from inserting anything but 'unpaid'.
//   - `reconcile` is admin-only: it validates the caller's JWT and checks the
//     `admins` allowlist inside the function (since verify_jwt is off).
//   - amounts come from `payment_amount_rial` (frozen at create) → no -50 drift.
//   - verify requires the stored authority to match (kills cross-order replay);
//     unique indexes on authority/ref_id (0013) make one payment settle one order.
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
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://www.nilagol.ir").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ZarinPal status codes → Persian (docs §6).
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

// Resolve a ZarinPal error to { code, reason }. Handles both response shapes:
// success uses errors:[] with a negative data.code; failures use errors:{message,code,...}.
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

async function zpPost(path: string, payload: Record<string, unknown>) {
  const res = await fetch(`${BASE}/pg/v4/payment/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({}));
}

// Atomic paid-write: only flips a not-yet-paid order. Returns true if we won the race.
async function markPaid(db: ReturnType<typeof admin>, order: any, refId: string) {
  const patch: Record<string, unknown> = {
    payment_status: "paid",
    payment_ref_id: refId,
    paid_at: new Date().toISOString(),
    payment_gateway: "zarinpal",
  };
  if (order.status === "pending") patch.status = "confirmed"; // never regress shipped/delivered
  const { data } = await db
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

async function markFailed(db: ReturnType<typeof admin>, orderId: unknown) {
  await db.from("orders").update({ payment_status: "failed" }).eq("id", orderId).neq("payment_status", "paid");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const db = admin();
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // ── create ──────────────────────────────────────────────────────────────
    if (action === "create") {
      const orderId = body.order_id;
      if (!orderId) return json({ error: "order_id لازم است." }, 400);

      const { data: order, error } = await db
        .from("orders")
        .select("id, subtotal, phone, user_id, payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);
      if (order.payment_status === "paid") return json({ error: "این سفارش قبلاً پرداخت شده است." }, 400);

      const amount = Math.round(Number(order.subtotal) * 10); // Toman → Rial (subtotal is server-authoritative)
      if (!amount || amount < 1000) return json({ error: "مبلغ سفارش نامعتبر است." }, 400);

      // Callback: pinned to the registered domain in production; client origin only in sandbox/dev.
      const origin = MODE === "production" ? SITE_URL : String(body.origin || SITE_URL).replace(/\/$/, "");

      const metadata: Record<string, string> = { order_id: String(orderId) };
      if (/^09\d{9}$/.test(String(order.phone || ""))) metadata.mobile = order.phone;
      if (order.user_id) {
        try {
          const { data: u } = await db.auth.admin.getUserById(order.user_id);
          if (u?.user?.email) metadata.email = u.user.email;
        } catch { /* email is optional — never fail payment on lookup error */ }
      }

      const out = await zpPost("request.json", {
        merchant_id: MERCHANT,
        amount,
        currency: "IRR",
        description: `سفارش #${orderId} — نیلا گل`,
        callback_url: `${origin}/payment/callback?order_id=${orderId}`,
        metadata,
      });
      const code = out?.data?.code;
      const authority = out?.data?.authority;
      if (code !== 100 || !authority) {
        const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
        return json({ error: `ایجاد تراکنش ناموفق بود: ${reason}`, code: zc }, 502);
      }

      await db
        .from("orders")
        .update({
          payment_method: "online",
          payment_gateway: "zarinpal",
          payment_authority: authority,
          payment_amount_rial: amount,
        })
        .eq("id", orderId);

      return json({ url: `${BASE}/pg/StartPay/${authority}`, authority });
    }

    // ── verify (guest callback) ──────────────────────────────────────────────
    if (action === "verify") {
      const orderId = body.order_id;
      const authority = body.authority;
      const status = body.status;
      if (!orderId || !authority) return json({ error: "پارامتر ناقص است." }, 400);

      const { data: order, error } = await db
        .from("orders")
        .select("id, subtotal, status, payment_status, payment_ref_id, payment_authority, payment_amount_rial")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);

      if (order.payment_status === "paid") return json({ ok: true, ref_id: order.payment_ref_id, already: true });
      if (status && status !== "OK") {
        await markFailed(db, orderId);
        return json({ ok: false, reason_code: "canceled", reason: "پرداخت توسط شما لغو شد." });
      }
      // Mandatory authority match — the callback authority must equal what we stored at create.
      if (!order.payment_authority || order.payment_authority !== authority) {
        return json({ ok: false, reason_code: "authority_mismatch", reason: "شناسهٔ تراکنش نامعتبر است." }, 400);
      }

      const amount = order.payment_amount_rial ?? Math.round(Number(order.subtotal) * 10);
      const out = await zpPost("verify.json", { merchant_id: MERCHANT, amount, authority });
      const code = out?.data?.code;
      if (code === 100 || code === 101) {
        const ref = String(out.data.ref_id ?? "");
        const won = await markPaid(db, order, ref);
        return json({ ok: true, ref_id: ref, code, card_pan: out.data.card_pan ?? null, already: code === 101 || !won });
      }
      await markFailed(db, orderId);
      const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
      return json({ ok: false, code: zc, reason });
    }

    // ── reconcile (admin only) ───────────────────────────────────────────────
    if (action === "reconcile") {
      // Admin gate — validate the caller JWT + admins allowlist (verify_jwt is off).
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
      if (!order.payment_authority)
        return json({ error: "برای این سفارش شناسهٔ تراکنش ذخیره نشده؛ امکان آشتی نیست." }, 400);

      const amount = order.payment_amount_rial ?? Math.round(Number(order.subtotal) * 10);

      // Step 1: inquiry (advisory status only) — decides whether to verify.
      const inq = await zpPost("inquiry.json", { merchant_id: MERCHANT, authority: order.payment_authority });
      const st = inq?.data?.status;
      if (!st) {
        const { code: zc, reason } = describeError(inq?.data?.code, inq?.errors);
        return json({ ok: false, status: null, code: zc, reason: reason || "استعلام وضعیت ناموفق بود." }, 502);
      }

      // Step 2: act on status. Only verify.json (100/101) may mark paid.
      if (st === "VERIFIED" || st === "PAID") {
        const out = await zpPost("verify.json", { merchant_id: MERCHANT, amount, authority: order.payment_authority });
        const code = out?.data?.code;
        if (code === 100 || code === 101) {
          const ref = String(out.data.ref_id ?? order.payment_ref_id ?? "");
          await markPaid(db, order, ref);
          return json({ ok: true, status: "VERIFIED", code, ref_id: ref, already: code === 101 });
        }
        const { code: zc, reason } = describeError(out?.data?.code, out?.errors);
        return json({ ok: false, status: st, code: zc, reason }); // do NOT flip to failed on ambiguous verify
      }
      if (st === "IN_BANK")
        return json({ ok: false, status: "IN_BANK", reason: "پرداخت هنوز در بانک در حال انجام است؛ کمی بعد دوباره بررسی کنید." });
      if (st === "FAILED") {
        await markFailed(db, orderId);
        return json({ ok: false, status: "FAILED", code: -51, reason: "تراکنش ناموفق بوده است." });
      }
      if (st === "REVERSED") {
        await db.from("orders").update({ payment_status: "refunded" }).eq("id", orderId).neq("payment_status", "paid");
        return json({ ok: false, status: "REVERSED", reason: "تراکنش ریورس (بازگشت وجه) شده است." });
      }
      return json({ ok: false, status: st, reason: `وضعیت نامشخص: ${st}` });
    }

    return json({ error: "action نامعتبر است." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
