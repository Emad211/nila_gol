/*
 * Service-worker kill switch.
 *
 * The site previously shipped a vite-plugin-pwa precache service worker.
 * Browsers that already installed it keep serving stale bundles, which made
 * the old design appear on top of freshly deployed HTML. This file replaces
 * /sw.js at the same URL: on the next navigation the browser sees new bytes,
 * installs this version, which purges every cache and unregisters itself so
 * the page falls back to plain network loading forever after.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async () => {
  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  } catch (error) {
    // Cache Storage may be unavailable (private mode); unregistering still matters.
  }

  try {
    await self.registration.unregister();
  } catch (error) {
    // Nothing else to do; the next visit will retry the update check anyway.
  }

  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(
      clientList.map(async (client) => {
        try {
          // Reload open tabs through the network now that no SW controls them.
          await client.navigate(client.url);
        } catch (error) {
          client.postMessage('sw-self-destructed');
        }
      }),
    );
  } catch (error) {
    // Tabs will pick up the clean state on their next navigation.
  }
});
