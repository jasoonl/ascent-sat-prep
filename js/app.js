/* Bootstrap */
(function () {
  Store.get();
  UI.applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', UI.applyTheme);
  if (!location.hash) location.hash = '#/home';
  UI.render();
  if (window.Cloud) Cloud.init();
  window.addEventListener('beforeunload', () => Store.save(true, { silent: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) Store.save(true, { silent: true }); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
