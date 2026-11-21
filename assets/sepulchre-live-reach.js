/* Sepulchre reach v4: text-only, standalone, SPA-safe; verified external JSON. */
(() => {
  'use strict';
  const BOT_ID = '1562563131580878969';
  const RAW_URL = 'https://raw.githubusercontent.com/Sepulchrebot/sepulchrebot.github.io/bot-reach-data/bot-stats.json';
  const STALE_MS = 75 * 60 * 1000;
  const REFRESH_MS = 60 * 1000;
  const number = new Intl.NumberFormat('en-US');
  const validCount = value => Number.isSafeInteger(value) && value >= 0;
  let mounted = null;
  let request = 0;

  function makeCounter() {
    const el = document.createElement('div');
    el.id = 'sepulchre-hero-counter';
    el.className = 'sepulchre-live-reach';
    el.setAttribute('data-sepulchre-stats', '');
    el.dataset.reachState = 'loading';
    el.innerHTML = '<span class="sepulchre-reach-line" role="status" aria-live="polite">' +
      'Powering <strong data-stat-members>—</strong> members across ' +
      '<strong data-stat-servers>—</strong> communities</span>';
    return el;
  }

  function findHeroActions() {
    // Stable opt-in mount, then selectors for the current Sepulchre SPA and V15.
    const selectors = [
      '[data-sepulchre-reach-anchor]',
      '.w.hero > .row',
      '.hero .row',
      '.v9-hero-actions',
      '.hero-actions',
      '.hero-copy .cta-buttons',
      '.hero__actions'
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const el of nodes) {
        if (!el.closest('nav,footer') && el.querySelector('a,button')) return el;
      }
    }
    return null;
  }

  function renderUnavailable(el) {
    el.querySelector('[data-stat-members]').textContent = '—';
    el.querySelector('[data-stat-servers]').textContent = '—';
    el.dataset.reachState = 'unavailable';
  }

  async function refresh() {
    const el = mounted;
    if (!el || !el.isConnected) return;
    const id = ++request;
    try {
      const url = new URL(RAW_URL);
      url.searchParams.set('_', String(Date.now()));
      const response = await fetch(url, {cache:'no-store', credentials:'omit', mode:'cors'});
      if (!response.ok) throw new Error('snapshot unavailable');
      const data = await response.json();
      const updated = Date.parse(data.updated_at);
      const age = Date.now() - updated;
      if (data.schema !== 1 || String(data.application_id) !== BOT_ID ||
          !validCount(data.servers) || data.servers < 1 ||
          !(data.members_total === null || validCount(data.members_total)) ||
          !Number.isFinite(updated) || age < -300000 || age > STALE_MS) {
        throw new Error('unverified snapshot');
      }
      if (el !== mounted || id !== request || !el.isConnected) return;
      el.querySelector('[data-stat-servers]').textContent = number.format(data.servers);
      el.querySelector('[data-stat-members]').textContent = data.members_total === null ? '—' : number.format(data.members_total);
      el.dataset.reachState = 'live';
    } catch (_error) {
      if (el === mounted && id === request && el.isConnected) renderUnavailable(el);
    }
  }

  function mount() {
    const actions = findHeroActions();
    if (!actions) {
      if (mounted && mounted.isConnected) mounted.remove();
      if (mounted) {mounted = null; request++;}
      return;
    }
    if (mounted && mounted.isConnected && mounted.nextElementSibling === actions) return;
    if (!mounted || !mounted.isConnected) mounted = makeCounter();
    actions.parentNode.insertBefore(mounted, actions);
    refresh();
  }

  function start() {
    const app = document.getElementById('app');
    const observationRoot = app || document.body;
    // Detect SPA page replacement without depending on private route functions.
    const observer = new MutationObserver(mount);
    observer.observe(observationRoot, {childList:true, subtree:true});
    mount();
    window.addEventListener('hashchange', mount);
    window.setInterval(() => { mount(); if (mounted) refresh(); }, REFRESH_MS);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
