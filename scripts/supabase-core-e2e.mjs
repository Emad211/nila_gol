import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = process.env;
const root = process.cwd();
const reportPath = path.join(root, 'public', 'e2e-core-report.json');
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://msiowolgbuffddhcdmqw.supabase.co';
const publishableKey =
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  '';
const secretKey = env.SUPABASE_SECRET_KEY || '';

const report = { generated_at: new Date().toISOString(), tests: [], cleanup: [] };
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `nilagol-core-e2e-${stamp}@example.com`;
const password = `NilaCore!${stamp}Aa9`;
const reviewAuthor = `CORE-E2E-${stamp}`;
const storagePath = `e2e/${stamp}.png`;
const galleryTitle = `CORE-E2E-gallery-${stamp}`;
let userId = null;
let orderId = null;
let reviewId = null;
let galleryId = null;
let storageUploaded = false;
let product = null;

function test(name, pass, detail = '') {
  report.tests.push({ name, pass, detail });
  console.log(`[core-e2e] ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function cleaned(name, pass, detail = '') {
  report.cleanup.push({ name, pass, detail });
  console.log(`[core-e2e] cleanup ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function save() {
  report.summary = {
    passed: report.tests.filter((t) => t.pass).length,
    failed: report.tests.filter((t) => !t.pass).length,
    cleanup_failed: report.cleanup.filter((t) => !t.pass).length,
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

if (!publishableKey || !secretKey) {
  test('credentials', false, `publishable=${Boolean(publishableKey)} secret=${Boolean(secretKey)}`);
  save();
  process.exit(0);
}
test('credentials', true);

const publicClient = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
let userClient = null;

async function run() {
  try {
    const { data, error } = await publicClient
      .from('products')
      .select('id,name,price,sale_price,is_active')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('no active product exists');
    product = data;
    test('catalog public read', true, `product_id=${data.id}`);
  } catch (error) {
    test('catalog public read', false, error.message);
  }

  // Create a disposable confirmed user through the trusted Admin API. Public
  // signup is tested separately because the project currently requires CAPTCHA.
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    if (!data?.user?.id) throw new Error('Admin API returned no user id');
    userId = data.user.id;
    test('auth admin create disposable user', true, `user_id=${userId}`);
  } catch (error) {
    test('auth admin create disposable user', false, error.message);
    return;
  }

  try {
    userClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await userClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.session?.access_token || data.user.id !== userId) throw new Error('login session mismatch');
    test('auth password login', true);
  } catch (error) {
    test('auth password login', false, error.message);
    return;
  }

  try {
    const { data, error } = await userClient.rpc('is_admin');
    if (error) throw error;
    if (data !== false) throw new Error(`expected false, got ${String(data)}`);
    test('ordinary user is not admin', true);
  } catch (error) {
    test('ordinary user is not admin', false, error.message);
  }

  if (product) {
    try {
      const expected = Number(product.sale_price ?? product.price ?? 0);
      const { data, error } = await userClient
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: 'Nila Core E2E',
          phone: '09120000000',
          city: 'گرگان',
          address: 'Temporary E2E address',
          postal_code: '4916600000',
          note: `core-e2e:${stamp}`,
          items: [{ id: product.id, qty: 1, price: 1 }],
          subtotal: 1,
          payment_method: 'cod',
        })
        .select('*')
        .single();
      if (error) throw error;
      orderId = data.id;
      if (Number(data.subtotal) !== expected) throw new Error(`total expected=${expected} actual=${data.subtotal}`);
      if (Number(data.items?.[0]?.price) !== expected) throw new Error('item price was not server-recomputed');
      test('orders create + authoritative pricing', true, `order_id=${orderId}`);
    } catch (error) {
      test('orders create + authoritative pricing', false, error.message);
    }

    try {
      const { data, error } = await userClient.from('orders').select('id,user_id').eq('user_id', userId);
      if (error) throw error;
      if (!data?.some((row) => String(row.id) === String(orderId))) throw new Error('own order not readable');
      test('orders own-history RLS', true);
    } catch (error) {
      test('orders own-history RLS', false, error.message);
    }

    try {
      const { error } = await userClient.from('reviews').insert({
        product_id: product.id,
        author_name: reviewAuthor,
        city: 'E2E',
        rating: 5,
        body: `temporary review ${stamp}`,
        is_approved: false,
      });
      if (error) throw error;
      const { data: rows, error: adminError } = await admin
        .from('reviews')
        .select('id,is_approved')
        .eq('author_name', reviewAuthor);
      if (adminError) throw adminError;
      reviewId = rows?.[0]?.id ?? null;
      if (!reviewId || rows[0].is_approved !== false) throw new Error('moderated review missing');
      const { data: leaked, error: publicError } = await publicClient
        .from('reviews')
        .select('id')
        .eq('author_name', reviewAuthor);
      if (publicError) throw publicError;
      if ((leaked || []).length) throw new Error('unapproved review visible publicly');
      test('reviews submit + moderation RLS', true, `review_id=${reviewId}`);
    } catch (error) {
      test('reviews submit + moderation RLS', false, error.message);
    }
  }

  try {
    const { data, error } = await userClient
      .from('chat_messages')
      .insert({ user_id: userId, sender: 'customer', body: `core e2e customer ${stamp}`, customer_email: email })
      .select('id')
      .single();
    if (error) throw error;
    const { data: own, error: readError } = await userClient
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId);
    if (readError) throw readError;
    if (!own?.some((row) => row.id === data.id)) throw new Error('customer cannot read own message');
    test('chat customer insert + own read', true, `message_id=${data.id}`);
  } catch (error) {
    test('chat customer insert + own read', false, error.message);
  }

  try {
    const { error } = await admin.from('admins').insert({ user_id: userId });
    if (error) throw error;
    const { data, error: rpcError } = await userClient.rpc('is_admin');
    if (rpcError) throw rpcError;
    if (data !== true) throw new Error('is_admin did not reflect allowlist');
    const { data: rows, error: readError } = await userClient.from('admins').select('user_id').eq('user_id', userId);
    if (readError) throw readError;
    if (!rows?.length) throw new Error('admin cannot read admins allowlist');
    test('admin allowlist + RLS', true);
  } catch (error) {
    test('admin allowlist + RLS', false, error.message);
  }

  try {
    const { error } = await userClient
      .from('chat_messages')
      .insert({ user_id: userId, sender: 'admin', body: `core e2e admin ${stamp}`, customer_email: email });
    if (error) throw error;
    test('chat admin reply policy', true);
  } catch (error) {
    test('chat admin reply policy', false, error.message);
  }

  try {
    // 1x1 transparent PNG.
    const png = Uint8Array.from([
      137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,
      0,0,0,13,73,68,65,84,8,215,99,248,207,192,240,31,0,5,0,1,255,137,153,61,29,0,0,0,0,73,69,78,68,174,66,96,130,
    ]);
    const { error } = await userClient.storage.from('media').upload(storagePath, png, {
      contentType: 'image/png', cacheControl: '60', upsert: false,
    });
    if (error) throw error;
    storageUploaded = true;
    const { data } = userClient.storage.from('media').getPublicUrl(storagePath);
    const res = await fetch(data.publicUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`public object HTTP ${res.status}`);
    test('storage admin upload + public read', true);

    const { data: gallery, error: galleryError } = await userClient
      .from('gallery')
      .insert({ title: galleryTitle, image_url: data.publicUrl, sort_order: 999999, is_active: true })
      .select('id')
      .single();
    if (galleryError) throw galleryError;
    galleryId = gallery.id;
    const { data: visible, error: visibleError } = await publicClient
      .from('gallery')
      .select('id')
      .eq('id', galleryId)
      .maybeSingle();
    if (visibleError) throw visibleError;
    if (!visible) throw new Error('active gallery row not publicly readable');
    test('gallery admin write + public read', true, `gallery_id=${galleryId}`);
  } catch (error) {
    test('storage/gallery', false, error.message);
  }

  try {
    const res = await fetch(`${url}/functions/v1/payment`, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', order_id: '9223372036854775000' }),
    });
    const text = await res.text();
    if (res.status !== 404 || !text.includes('سفارش')) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }
    test('payment Edge Function + DB lookup', true);
  } catch (error) {
    test('payment Edge Function + DB lookup', false, error.message);
  }
}

async function cleanup() {
  const jobs = [
    ['gallery', async () => galleryId ? admin.from('gallery').delete().eq('id', galleryId) : null],
    ['storage', async () => storageUploaded ? admin.storage.from('media').remove([storagePath]) : null],
    ['chat', async () => userId ? admin.from('chat_messages').delete().eq('user_id', userId) : null],
    ['review', async () => admin.from('reviews').delete().eq('author_name', reviewAuthor)],
    ['order', async () => userId ? admin.from('orders').delete().eq('user_id', userId) : null],
    ['admin allowlist', async () => userId ? admin.from('admins').delete().eq('user_id', userId) : null],
    ['auth user', async () => userId ? admin.auth.admin.deleteUser(userId) : null],
  ];
  for (const [name, action] of jobs) {
    try {
      const result = await action();
      if (result?.error) throw result.error;
      cleaned(name, true);
    } catch (error) {
      cleaned(name, false, error.message);
    }
  }
}

try {
  await run();
} catch (error) {
  test('unexpected harness error', false, error.message);
} finally {
  await cleanup();
  save();
}
