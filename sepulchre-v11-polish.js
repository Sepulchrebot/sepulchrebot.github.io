/* Sepulchre v11 additive UX. Does not fetch, write or modify live bot-stat data. */
(() => {
  'use strict';
  const doc = document;
  const body = doc.body;
  if (!body || body.classList.contains('s11-ready')) return;
  body.classList.add('s11-ready');
  const $ = (s, root=doc) => root.querySelector(s);
  const $$ = (s, root=doc) => [...root.querySelectorAll(s)];
  const path = location.pathname.replace(/\/$/, '') || '/';
  $$('.nav-link').forEach(link => {
    try {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      const hrefPath = url.pathname.replace(/\/$/, '') || '/';
      if (hrefPath === path) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    } catch (_) { /* retain existing navigation */ }
  });
  const setScroll = () => body.classList.toggle('s11-scrolled', window.scrollY > 70);
  setScroll();
  window.addEventListener('scroll', setScroll, {passive:true});

  // Explicit visitor-controlled motion, disabled automatically when OS asks for it.
  const prefersLessMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let storedMotion = '';
  try { storedMotion = localStorage.getItem('sepulchre-motion') || ''; } catch (_) {}
  const motionOff = prefersLessMotion || storedMotion === 'off';
  if (motionOff) {
    body.classList.add('s11-motion-off');
    // V10 reveal effects hide offscreen sections; ensure every section is visible.
    $$('#main [data-v10-reveal]').forEach(e=>{e.style.opacity='1';e.style.transform='none';});
  }
  const footer = $('.site-footer');
  if (footer && !$('.s11-motion-toggle')) {
    const btn = doc.createElement('button');
    btn.type='button';btn.className='s11-motion-toggle';
    const update = () => {const off=body.classList.contains('s11-motion-off');btn.textContent=`Motion: ${off?'Off':'On'}`;btn.setAttribute('aria-pressed',String(!off));};
    update();
    btn.addEventListener('click',()=>{
      const off=body.classList.toggle('s11-motion-off');
      try {localStorage.setItem('sepulchre-motion',off?'off':'on');} catch (_) {}
      if (off) $$('#main [data-v10-reveal]').forEach(e=>{e.style.opacity='1';e.style.transform='none';});
      update();
    });
    footer.appendChild(btn);
  }

  // FAQ search: filters only actual published questions, never invents answers.
  const faq=$('.faq-list');
  if(faq && !$('.s11-faq-tools')) {
    const items=$$('details.faq-item',faq);
    if (items.length) {
      const tools=doc.createElement('div');tools.className='s11-faq-tools';
      const label=doc.createElement('label');
      const input=doc.createElement('input');input.type='search';input.placeholder='Search questions and answers…';input.setAttribute('aria-label','Search frequently asked questions');input.autocomplete='off';
      label.appendChild(input);const count=doc.createElement('span');count.className='s11-faq-count';count.setAttribute('aria-live','polite');tools.append(label,count);faq.parentNode.insertBefore(tools,faq);
      const empty=doc.createElement('div');empty.className='s11-faq-empty';empty.textContent='No matching questions. Try another keyword.';empty.hidden=true;faq.insertAdjacentElement('afterend',empty);
      const filter=()=>{const q=input.value.trim().toLocaleLowerCase();let matches=0;items.forEach(el=>{const shown=el.textContent.toLocaleLowerCase().includes(q);el.hidden=!shown;if(shown)matches++;});count.textContent=`${matches} of ${items.length} questions`;empty.hidden=matches!==0;};
      input.addEventListener('input',filter);filter();
    }
  }

  // Discoverability: commands already supports '/' and Escape, don't override them.
  const cmd=$('#cmd-search');
  const guide=$('#v10-guide-query');
  const shortcut=cmd || guide;
  if(shortcut && !$('.s11-shortcut-tip')){
    const note=doc.createElement('p');note.className='s11-shortcut-tip';note.innerHTML='Tip: Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search.';
    shortcut.closest('label')?.insertAdjacentElement('afterend',note) || shortcut.insertAdjacentElement('afterend',note);
    doc.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault();shortcut.focus();shortcut.select?.();}
    });
  }
  // Mark the Embed Studio's preview controls as a complementary region for assistive technologies.
  const preview=$('#pv-embed');
  if(preview){const container=preview.closest('.v8-discord-message')||preview.parentElement;if(container){container.setAttribute('aria-label','Discord-style design preview');}}
})();
