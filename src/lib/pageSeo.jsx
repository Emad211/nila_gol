import { Head } from 'vite-react-ssg';

// Canonical production origin — used to build absolute canonical/OG URLs at BUILD
// time (no `window`), so per-page <head> metadata is baked into the static HTML.
export const SITE_URL = 'https://www.nilagol.ir';

// Renders per-page <title>/description/canonical/OG + optional JSON-LD into the
// document head. Because it uses vite-react-ssg's <Head>, the tags land in the
// pre-rendered HTML (SSG) and also update on client-side navigation.
// NOTE: filename is pageSeo.jsx (not Seo.jsx) to avoid a case-insensitive clash
// with the client-only helper src/lib/seo.js on Windows/macOS.
export default function PageSeo({ title, description, path = '', image, jsonLd }) {
  const url = SITE_URL + (path || '');
  const img = image
    ? image.startsWith('http')
      ? image
      : SITE_URL + image
    : `${SITE_URL}/pwa-512.png`;

  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Head>
  );
}
