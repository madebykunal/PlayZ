// Service Worker Configuration
const CACHE_NAME = 'playz-v2';
const BASE_URL = 'https://playz.pages.dev';

// List of resources that would be cached in production
// Currently not being used during development
const urlsToCache = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/about.html`,
  `${BASE_URL}/styles.css`,
  `${BASE_URL}/script.js`,
  `${BASE_URL}/Images/Favicon.png`,
  '/Images/Bloom.webp',
  '/Images/broken-platform.webp',
  '/Images/chess.webp',
  '/Images/classical-snake.webp',
  '/Images/color-chaser.webp',
  '/Images/Dodger.webp',
  '/Images/Pixel-Runner.webp',
  '/Images/Tetris.webp',
  '/Images/tic-tac-toe.webp',
  '/Images/truck-tunk.webp',
  '/Images/Whack-a-Hole.webp'
];

// Skip caching during installation
self.addEventListener('install', event => {
  // Skip the waiting phase
  self.skipWaiting();
  console.log('Service Worker installed - caching disabled for development');
});

// Network-first strategy for all fetch requests during development
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        console.log('Fetch failed, trying cache for:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// When activated, clear all existing caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('Clearing all caches during development');
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('All caches cleared successfully');
      return self.clients.claim();
    })
  );
});
