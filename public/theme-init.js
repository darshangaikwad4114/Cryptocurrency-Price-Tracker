(function () {
  try {
    var raw = localStorage.getItem('cryptotracker.theme');
    var stored = null;
    try {
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = raw;
    }
    var theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a192f');
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
