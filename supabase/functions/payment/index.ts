// ZarinPal online-payment proxy for Nila Gol.
//
// Keeps the ZarinPal Merchant ID server-side and reads the order amount from the
// database (never trusting the client), so the paid amount can't be tampered
// with. Two actions:
//   • create  { order_id, origin }  -> { url }   (redirect the user to `url`)
//   • verify  { order_id, authority, status } -> { ok, ref_id }
//
// Edge secrets (Supabase → Edge Functions → Secrets):
//   ZARINPAL_MERCHANT_ID   the 36-char merchant id from your ZarinPal panel
//   ZARINPAL_MODE          'sandbox' (default) | 'production'
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
//
// verify_jwt is OFF on purpose: guest checkout must be able to pay. The function
// validates the order itself and confirms every payment with ZarinPal, so an
// unauthenticated caller cannot mark an order paid.
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
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // ── Create a payment & return the gateway redirect URL ──────────────────
    if (action === "create") {
      const orderId = body.order_id;
      const origin = String(body.origin || "https://www.nilagol.ir").replace(/\/$/, "");
      if (!orderId) return json({ error: "order_id لازم است." }, 400);

      const { data: order, error } = await admin
        .from("orders")
        .select("id, subtotal, phone, payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);
      if (order.payment_status === "paid") return json({ error: "این سفارش قبلاً پرداخت شده است." }, 400);

      const amount = Math.round(Number(order.subtotal) * 10); // Toman → Rial
      if (!amount || amount < 1000) return json({ error: "مبلغ سفارش نامعتبر است." }, 400);

      const mobile = /^09\d{9}$/.test(String(order.phone || "")) ? order.phone : undefined;
      const res = await fetch(`${BASE}/pg/v4/payment/request.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          merchant_id: MERCHANT,
          amount,
          currency: "IRR",
          description: `سفارش #${orderId} — نیلا گل`,
          callback_url: `${origin}/payment/callback?order_id=${orderId}`,
          metadata: mobile ? { mobile } : undefined,
        }),
      });
      const out = await res.json().catch(() => ({}));
      const authority = out?.data?.authority;
      const code = out?.data?.code;
      if (!authority || (code !== 100 && code !== 101)) {
        const errs = out?.errors;
        const msg = Array.isArray(errs) ? JSON.stringify(errs) : (errs?.message || "خطای درگاه پرداخت");
        return json({ error: `ایجاد تراکنش ناموفق بود: ${msg}` }, 502);
      }

      await admin
        .from("orders")
        .update({ payment_method: "online", payment_gateway: "zarinpal", payment_authority: authority })
        .eq("id", orderId);

      return json({ url: `${BASE}/pg/StartPay/${authority}`, authority });
    }

    // ── Verify a payment on return from the gateway ─────────────────────────
    if (action === "verify") {
      const orderId = body.order_id;
      const authority = body.authority;
      const status = body.status; // 'OK' | 'NOK'
      if (!orderId || !authority) return json({ error: "پارامتر ناقص است." }, 400);

      const { data: order, error } = await admin
        .from("orders")
        .select("id, subtotal, payment_status, payment_ref_id, payment_authority")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return json({ error: "سفارش یافت نشد." }, 404);

      // Idempotent: a re-opened callback for an already-paid order just succeeds.
      if (order.payment_status === "paid") {
        return json({ ok: true, ref_id: order.payment_ref_id, already: true });
      }
      if (status && status !== "OK") {
        await admin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
        return json({ ok: false, reason: "canceled" });
      }
      if (order.payment_authority && order.payment_authority !== authority) {
        return json({ ok: false, reason: "authority_mismatch" }, 400);
      }

      const amount = Math.round(Number(order.subtotal) * 10);
      const res = await fetch(`${BASE}/pg/v4/payment/verify.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ merchant_id: MERCHANT, amount, authority }),
      });
      const out = await res.json().catch(() => ({}));
      const code = out?.data?.code;
      if (code === 100 || code === 101) {
        const refId = String(out.data.ref_id ?? "");
        await admin
          .from("orders")
          .update({
            payment_status: "paid",
            payment_ref_id: refId,
            paid_at: new Date().toISOString(),
            status: "confirmed",
          })
          .eq("id", orderId);
        return json({ ok: true, ref_id: refId, card_pan: out.data.card_pan ?? null });
      }

      await admin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
      const errs = out?.errors;
      const msg = Array.isArray(errs) ? JSON.stringify(errs) : (errs?.message || `code ${code}`);
      return json({ ok: false, reason: msg });
    }

    return json({ error: "action نامعتبر است." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
