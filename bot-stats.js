/* Sepulchre: public aggregate counters; no tokens, no Discord API calls in the browser. */
(() => {
  const root = document.querySelector('[data-sepulchre-stats]');
  if (!root) return;
  const servers = root.querySelector('[data-stat-servers]');
  const members = root.querySelector('[data-stat-members]');
  const note = root.querySelector('[data-stat-status]');
  const formatter = new Intl.NumberFormat('nl-NL');
  async function refresh() {
    try {
      const response = await fetch('/bot-stats.json?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      const stats = await response.json();
      const timestamp = Date.parse(stats.updated_at);
      if (stats.application_id !== '1562563131580878969' ||
          !Number.isInteger(stats.servers) || stats.servers < 0 ||
          !Number.isFinite(timestamp) || Date.now() - timestamp > 2 * 60 * 60 * 1000 ||
          timestamp - Date.now() > 5 * 60 * 1000) throw new Error('Stale or invalid');
      servers.textContent = formatter.format(stats.servers);
      members.textContent = Number.isSafeInteger(stats.members_total) && stats.members_total >= 0
        ? formatter.format(stats.members_total) : '—';
      note.textContent = stats.members_total == null ? 'Server counts refreshed · Member totals unavailable' : 'Updated from Discord · Totals may include members in multiple servers';
    } catch (_) {
      servers.textContent = '—';
      members.textContent = '—';
      note.textContent = 'Statistics temporarily unavailable';
    }
  }
  refresh();
  setInterval(refresh, 60_000);
})();
