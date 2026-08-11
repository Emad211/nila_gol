import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const reportPath = path.join(root, 'public', 'e2e-report.json');
const env = process.env;
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://msiowolgbuffddhcdmqw.supabase.co';
const publishableKey =
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  '';
const secretKey = env.SUPABASE_SECRET_KEY || '';

const report = {
  generated_at: new Date().toISOString(),
  project_ref: 'msiowolgbuffddhcdmqw',
  environment: env.VERCEL_ENV || 'local',
  tests: [],
  cleanup: [],
};

function record(name, pass, detail = '') {
  report.tests.push({ name, pass, detail });
  console.log(`[e2e] ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function cleanupRecord(name, pass, detail = '') {
  report.cleanup.push({ name, pass, detail });
  console.log(`[e2e] cleanup ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function writeReport() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

if (!publishableKey || !secretKey) {
  record('environment credentials', false, `publishable=${Boolean(publishableKey)} secret=${Boolean(secretKey)}`);
  writeReport();
  process.exit(0);
}
record('environment credentials', true, 'publishable + secret keys available');

const publicClient = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `nilagol-e2e-${stamp}@example.com`;
const password = `NilaE2E!${stamp}Aa9`;
const reviewAuthor = `E2E-${stamp}`;
const galleryTitle = `E2E-gallery-${stamp}`;
const storagePath = `e2e/${stamp}.svg`;
let userId = null;
let orderId = null;
let reviewId = null;
let chatIds = [];
let galleryId = null;
let storageUploaded = false;
let userClient = null;
let product = null;

async function run() {
  // Public Data API / catalog.
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
    record('catalog public read', true, `product_id=${data.id}`);
  } catch (error) {
    record('catalog public read', false, error.message);
  }

  // Registration through the public Auth endpoint.
  try {
    const { data, error } = await publicClient.auth.signUp({ email, password });
    if (error) throw error;
    if (!data?.user?.id) throw new Error('signup returned no user id');
    userId = data.user.id;
    record('auth public signup', true, `user_id=${userId}`);
  } catch (error) {
    record('auth public signup', false, error.message);
  }

  if (!userId) return;

  // Public signup must never be silently promoted to admin.
  try {
    const { data, error } = await admin.from('admins').select('user_id').eq('user_id', userId);
    if (error) throw error;
    if ((data || []).length !== 0) throw new Error('public signup was promoted to admin');
    record('auth signup is non-admin', true);
  } catch (error) {
    record('auth signup is non-admin', false, error.message);
  }

  // Confirm test account without email delivery, then test password login.
  try {
    const { error: confirmError } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (confirmError) throw confirmError;
    userClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await userClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.session?.access_token) throw new Error('login returned no session');
    record('auth password login', true);
  } catch (error) {
    record('auth password login', false, error.message);
    return;
  }

  try {
    const { data, error } = await userClient.rpc('is_admin');
    if (error) throw error;
    if (data !== false) throw new Error(`expected false, got ${String(data)}`);
    record('is_admin ordinary user', true);
  } catch (error) {
    record('is_admin ordinary user', false, error.message);
  }

  if (product) {
    // Order creation via authenticated public client + server-authoritative total.
    try {
      const { data, error } = await userClient
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: 'Nila E2E',
          phone: '09120000000',
          city: 'گرگان',
          address: 'E2E test address',
          postal_code: '4916600000',
          note: `e2e:${stamp}`,
          items: [{ id: product.id, qty: 1, price: 1 }],
          subtotal: 1,
          payment_method: 'cod',
        })
        .select('*')
        .single();
      if (error) throw error;
      orderId = data.id;
      const expected = Number(product.sale_price ?? product.price ?? 0);
      if (Number(data.subtotal) !== expected) {
        throw new Error(`server total mismatch expected=${expected} actual=${data.subtotal}`);
      }
      if (Number(data.items?.[0]?.price) !== expected) throw new Error('server did not rewrite item price');
      record('orders create + authoritative pricing', true, `order_id=${orderId}`);
    } catch (error) {
      record('orders create + authoritative pricing', false, error.message);
    }

    try {
      const { data, error } = await userClient.from('orders').select('id,user_id').eq('user_id', userId);
      if (error) throw error;
      if (!data?.some((row) => String(row.id) === String(orderId))) throw new Error('own order not readable');
      record('orders own-history RLS', true);
    } catch (error) {
      record('orders own-history RLS', false, error.message);
    }

    // Moderated review submission.
    try {
      const { error } = await userClient.from('reviews').insert({
        product_id: product.id,
        author_name: reviewAuthor,
        city: 'E2E',
        rating: 5,
        body: `temporary e2e review ${stamp}`,
        is_approved: false,
      });
      if (error) throw error;
      const { data: rows, error: adminReadError } = await admin
        .from('reviews')
        .select('id,is_approved')
        .eq('author_name', reviewAuthor);
      if (adminReadError) throw adminReadError;
      reviewId = rows?.[0]?.id ?? null;
      if (!reviewId || rows[0].is_approved !== false) throw new Error('unapproved review not persisted as expected');
      const { data: publicRows, error: publicReadError } = await publicClient
        .from('reviews')
        .select('id')
        .eq('author_name', reviewAuthor);
      if (publicReadError) throw publicReadError;
      if ((publicRows || []).length !== 0) throw new Error('unapproved review leaked through public RLS');
      record('reviews submit + moderation RLS', true, `review_id=${reviewId}`);
    } catch (error) {
      record('reviews submit + moderation RLS', false, error.message);
    }
  }

  // Customer chat insert/read under own RLS.
  try {
    const { data, error } = await userClient
      .from('chat_messages')
      .insert({ user_id: userId, sender: 'customer', body: `e2e customer ${stamp}`, customer_email: email })
      .select('id,user_id,sender,body')
      .single();
    if (error) throw error;
    chatIds.push(data.id);
    const { data: own, error: readError } = await userClient
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId);
    if (readError) throw readError;
    if (!own?.some((row) => row.id === data.id)) throw new Error('own chat message not readable');
    record('chat customer insert + own read', true, `message_id=${data.id}`);
  } catch (error) {
    record('chat customer insert + own read', false, error.message);
  }

  // Explicitly promote the disposable user, then exercise admin RLS.
  try {
    const { error } = await admin.from('admins').insert({ user_id: userId });
    if (error) throw error;
    const { data: isAdmin, error: rpcError } = await userClient.rpc('is_admin');
    if (rpcError) throw rpcError;
    if (isAdmin !== true) throw new Error('admin allowlist not reflected by is_admin');
    const { data: adminRows, error: adminReadError } = await userClient.from('admins').select('user_id').eq('user_id', userId);
    if (adminReadError) throw adminReadError;
    if (!adminRows?.length) throw new Error('admin cannot read admins allowlist');
    record('admin allowlist + RLS', true);
  } catch (error) {
    record('admin allowlist + RLS', false, error.message);
  }

  // Admin chat reply.
  try {
    const { data, error } = await userClient
      .from('chat_messages')
      .insert({ user_id: userId, sender: 'admin', body: `e2e admin ${stamp}`, customer_email: email })
      .select('id')
      .single();
    if (error) throw error;
    chatIds.push(data.id);
    record('chat admin reply policy', true, `message_id=${data.id}`);
  } catch (error) {
    record('chat admin reply policy', false, error.message);
  }

  // Storage admin upload + public read.
  try {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#d62e8c"/></svg>');
    const { error } = await userClient.storage.from('media').upload(storagePath, svg, {
      contentType: 'image/svg+xml',
      cacheControl: '60',
      upsert: false,
    });
    if (error) throw error;
    storageUploaded = true;
    const { data } = userClient.storage.from('media').getPublicUrl(storagePath);
    const res = await fetch(data.publicUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`public media returned HTTP ${res.status}`);
    record('storage admin upload + public read', true);

    const { data: gallery, error: galleryError } = await userClient
      .from('gallery')
      .insert({ title: galleryTitle, image_url: data.publicUrl, sort_order: 999999, is_active: true })
      .select('id')
      .single();
    if (galleryError) throw galleryError;
    galleryId = gallery.id;
    const { data: publicGallery, error: publicGalleryError } = await publicClient
      .from('gallery')
      .select('id')
      .eq('id', galleryId)
      .maybeSingle();
    if (publicGalleryError) throw publicGalleryError;
    if (!publicGallery) throw new Error('active gallery row not public');
    record('gallery admin write + public read', true, `gallery_id=${galleryId}`);
  } catch (error) {
    record('storage/gallery', false, error.message);
  }

  // Edge Function + server-side DB access, without creating a gateway transaction.
  try {
    const res = await fetch(`${url}/functions/v1/payment`, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', order_id: '9223372036854775000' }),
    });
    const text = await res.text();
    if (res.status !== 404 || !text.includes('سفارش')) {
      throw new Error(`unexpected payment probe HTTP ${res.status}: ${text.slice(0, 120)}`);
    }
    record('payment Edge Function + DB lookup', true, 'nonexistent order safely returned 404');
  } catch (error) {
    record('payment Edge Function + DB lookup', false, error.message);
  }
}

async function cleanup() {
  const jobs = [
    ['gallery row', async () => galleryId && admin.from('gallery').delete().eq('id', galleryId)],
    ['storage object', async () => storageUploaded && admin.storage.from('media').remove([storagePath])],
    ['chat rows', async () => userId && admin.from('chat_messages').delete().eq('user_id', userId)],
    ['review row', async () => admin.from('reviews').delete().eq('author_name', reviewAuthor)],
    ['order row', async () => userId && admin.from('orders').delete().eq('user_id', userId)],
    ['admin allowlist', async () => userId && admin.from('admins').delete().eq('user_id', userId)],
    ['auth user', async () => userId && admin.auth.admin.deleteUser(userId)],
  ];
  for (const [name, fn] of jobs) {
    try {
      const result = await fn();
      if (result?.error) throw result.error;
      cleanupRecord(name, true);
    } catch (error) {
      cleanupRecord(name, false, error.message);
    }
  }
}

try {
  await run();
} catch (error) {
  record('unexpected harness error', false, error.message);
} finally {
  await cleanup();
  report.summary = {
    passed: report.tests.filter((t) => t.pass).length,
    failed: report.tests.filter((t) => !t.pass).length,
    cleanup_failed: report.cleanup.filter((t) => !t.pass).length,
  };
  writeReport();
}
