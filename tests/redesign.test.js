import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  topProducts,
  priceView,
  postMeta,
  rotateSlides,
} from '../src/lib/redesign.js';

// ── topProducts ─────────────────────────────────────────────────────────────

test('topProducts: featured items come first, then sort_order ascending', () => {
  const products = [
    { id: 'a', sort_order: 1 }, // plain, earliest order
    { id: 'b', is_featured: true, sort_order: 9 },
    { id: 'c', sort_order: 0 },
    { id: 'd', is_featured: true, sort_order: 2 },
  ];
  assert.deepEqual(
    topProducts(products, 4).map((p) => p.id),
    ['d', 'b', 'c', 'a'],
  );
});

test('topProducts: ties keep input order (stable)', () => {
  const products = [
    { id: 'x', sort_order: 3 },
    { id: 'y', sort_order: 3 },
    { id: 'z', sort_order: 3 },
  ];
  assert.deepEqual(
    topProducts(products, 3).map((p) => p.id),
    ['x', 'y', 'z'],
  );
});

test('topProducts: clamps n to the list length and defaults to 3', () => {
  const products = [
    { id: 'a', sort_order: 0 },
    { id: 'b', sort_order: 1 },
    { id: 'c', sort_order: 2 },
    { id: 'd', sort_order: 3 },
  ];
  assert.equal(topProducts(products).length, 3);
  assert.equal(topProducts(products, 2).length, 2);
  assert.equal(topProducts(products, 10).length, 4);
  assert.deepEqual(topProducts(products, 0), []);
});

test('topProducts: null/undefined/empty input returns an empty array', () => {
  assert.deepEqual(topProducts(null), []);
  assert.deepEqual(topProducts(undefined), []);
  assert.deepEqual(topProducts([]), []);
});

// ── priceView ───────────────────────────────────────────────────────────────

test('priceView: sale price wins and the base price becomes oldPrice', () => {
  assert.deepEqual(priceView({ price: 480000, sale_price: 400000 }), {
    price: 400000,
    oldPrice: 480000,
  });
});

test('priceView: without a sale price, price passes through and oldPrice is null', () => {
  assert.deepEqual(priceView({ price: 500000 }), {
    price: 500000,
    oldPrice: null,
  });
  assert.deepEqual(priceView({ price: 500000, sale_price: null }), {
    price: 500000,
    oldPrice: null,
  });
});

test('priceView: null-safe on missing products and missing fields', () => {
  assert.deepEqual(priceView(null), { price: null, oldPrice: null });
  assert.deepEqual(priceView(undefined), { price: null, oldPrice: null });
  assert.deepEqual(priceView({}), { price: null, oldPrice: null });
});

// ── postMeta ────────────────────────────────────────────────────────────────

const WORDS = (n) => Array.from({ length: n }, (_, i) => `کلمه${i}`).join(' ');

test('postMeta: readMinutes is ceil(words / 200) with a floor of 1', () => {
  assert.equal(postMeta({ content: WORDS(200) }).readMinutes, 1);
  assert.equal(postMeta({ content: WORDS(201) }).readMinutes, 2);
  assert.equal(postMeta({ content: WORDS(400) }).readMinutes, 2);
  assert.equal(postMeta({ content: WORDS(401) }).readMinutes, 3);
  assert.equal(postMeta({ content: '' }).readMinutes, 1);
});

test('postMeta: word count prefers content, falls back to excerpt', () => {
  assert.equal(postMeta({ content: WORDS(300), excerpt: WORDS(10) }).readMinutes, 2);
  assert.equal(postMeta({ excerpt: WORDS(300) }).readMinutes, 2);
});

test('postMeta: dateShort is a fa-IR day + long-month string', () => {
  const published_at = '2026-03-21T10:00:00Z';
  const expected = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(published_at));
  const { dateShort } = postMeta({ published_at, content: WORDS(10) });
  assert.equal(dateShort, expected);
  assert.ok(dateShort.length > 0);
});

test('postMeta: missing or invalid date yields an empty dateShort', () => {
  assert.equal(postMeta({ content: WORDS(10) }).dateShort, '');
  assert.equal(postMeta({ published_at: 'not-a-date', content: WORDS(10) }).dateShort, '');
});

test('postMeta: category falls back to «آموزشی»', () => {
  assert.equal(postMeta({ category: 'نگهداری', content: WORDS(10) }).category, 'نگهداری');
  assert.equal(postMeta({ content: WORDS(10) }).category, 'آموزشی');
});

test('postMeta: null-safe on a missing post', () => {
  assert.deepEqual(postMeta(null), {
    readMinutes: 1,
    dateShort: '',
    category: 'آموزشی',
  });
  assert.deepEqual(postMeta(undefined), {
    readMinutes: 1,
    dateShort: '',
    category: 'آموزشی',
  });
});

// ── rotateSlides ────────────────────────────────────────────────────────────

const SLIDES = ['s0', 's1', 's2', 's3'];

test('rotateSlides: front slot is the active slide (queue rotation)', () => {
  assert.deepEqual(rotateSlides(SLIDES, 0), ['s0', 's1', 's2', 's3']);
  assert.deepEqual(rotateSlides(SLIDES, 1), ['s1', 's2', 's3', 's0']);
  assert.equal(rotateSlides(SLIDES, 2)[0], 's2');
});

test('rotateSlides: active index wraps in both directions', () => {
  assert.deepEqual(rotateSlides(SLIDES, 4), ['s0', 's1', 's2', 's3']);
  assert.deepEqual(rotateSlides(SLIDES, 5), ['s1', 's2', 's3', 's0']);
  assert.deepEqual(rotateSlides(SLIDES, -1), ['s3', 's0', 's1', 's2']);
});

test('rotateSlides: empty and missing slide lists return an empty array', () => {
  assert.deepEqual(rotateSlides([], 0), []);
  assert.deepEqual(rotateSlides(null, 2), []);
  assert.deepEqual(rotateSlides(undefined, 0), []);
});

test('rotateSlides: single-slide list always returns itself', () => {
  assert.deepEqual(rotateSlides(['only'], 0), ['only']);
  assert.deepEqual(rotateSlides(['only'], 3), ['only']);
});
