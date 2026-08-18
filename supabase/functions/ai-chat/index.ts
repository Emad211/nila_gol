import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const SYSTEM_PROMPT = `تو «گلی» هستی، دستیارِ فروشگاهِ آنلاینِ «نیلا گل».
نیلا گل گل‌های روسیِ انعطاف‌پذیر و گل مصنوعیِ لوکس، ماندگار و قابل‌شستشو می‌فروشد. مستقر در گرگان؛ ارسال به سراسر کشور با پست و در گرگان تحویلِ درب‌منزل با پرداخت در محل.
قواعد:
- همیشه فارسی، گرم، کوتاه و مفید پاسخ بده.
- درباره‌ی محصولات، نگهداری و شست‌وشو، نحوه‌ی سفارش و ارسال راهنمایی کن.
- قیمتِ دقیق را از خودت نساز؛ کاربر را به صفحه‌ی «محصولات» سایت یا واتساپ راهنمایی کن.
- برای ثبت سفارش: «افزودن به سبد» و «تکمیل خرید» در سایت، یا تماس از طریق واتساپ/تلگرام.
- اگر سؤال نامرتبط بود، مودبانه به موضوعِ گل و خرید برگرد.`;
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json"
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: CORS
  });
  if (req.method !== "POST") return json({
    error: "method_not_allowed"
  }, 405);
  const key = Deno.env.get("AVALAI_API_KEY");
  if (!key) {
    return json({
      reply: "دستیارِ هوشمند هنوز فعال نشده است؛ به‌زودی در دسترس خواهد بود. فعلاً از طریق واتساپ با ما در تماس باشید.",
      configured: false
    });
  }
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      error: "bad_json"
    }, 400);
  }
  const messages = body?.messages;
  if (!Array.isArray(messages)) return json({
    error: "bad_request"
  }, 400);
  const model = Deno.env.get("AVALAI_MODEL") || "gpt-4o-mini";
  const trimmed = messages.slice(-12).map((m)=>({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content ?? "").slice(0, 2000)
    })).filter((m)=>m.content);
  try {
    const resp = await fetch("https://api.avalai.ir/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          ...trimmed
        ],
        temperature: 0.5,
        max_tokens: 600
      })
    });
    if (!resp.ok) {
      const detail = (await resp.text()).slice(0, 300);
      return json({
        error: "upstream",
        status: resp.status,
        detail
      }, 502);
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "پاسخی دریافت نشد.";
    return json({
      reply
    });
  } catch (e) {
    return json({
      error: "fetch_failed",
      detail: String(e).slice(0, 200)
    }, 502);
  }
});
