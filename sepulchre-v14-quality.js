/* Sepulchre v14: navigation synchronization and accessibility only.
   No networking, statistics, command catalog, pricing, or embed data changes. */
(() => {
  'use strict';
  const nav = document.querySelector('.pill-nav');
  const toggle = nav?.querySelector('.menu-toggle');
  const menu = nav?.querySelector('.nav-items');
  if (!nav || !toggle || !menu || document.documentElement.dataset.s14NavReady) return;
  document.documentElement.dataset.s14NavReady = 'true';
  const isOpen = () => menu.classList.contains('open') || nav.classList.contains('menu-open');
  const setOpen = (value, focusButton = false) => {
    menu.classList.toggle('open', value);
    nav.classList.toggle('menu-open', value);
    toggle.setAttribute('aria-expanded', String(value));
    if (focusButton && menu.contains(document.activeElement)) toggle.focus();
  };
  // Legacy site scripts both handle menu toggles. Synchronize after their handlers.
  toggle.addEventListener('click', () => {
    setTimeout(() => {
      const aria = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(aria);
    }, 0);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) setOpen(false, true);
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && isOpen()) setOpen(false);
  });
  document.addEventListener('focusin', e => {
    // No focus trapping: menu remains keyboard navigable and closes on Escape.
    if (e.target === toggle && toggle.getAttribute('aria-expanded') === null) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760 && isOpen()) setOpen(false);
  }, {passive:true});
  if (!toggle.getAttribute('aria-label')) toggle.setAttribute('aria-label', 'Toggle site navigation');
  setOpen(false);
})();
