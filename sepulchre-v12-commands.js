/* Sepulchre v12: optional command browser conveniences; does not alter catalog data. */
(() => {
  'use strict';
  const start = () => {
    const doc = document;
    const search = doc.getElementById('cmd-search');
    const category = doc.getElementById('cmd-category');
    const access = doc.getElementById('cmd-access');
    const legacy = doc.getElementById('cmd-legacy');
    const size = doc.getElementById('v10-page-size');
    const grid = doc.getElementById('cmd-grid');
    const extra = doc.querySelector('.v10-command-extras');
    if (!search || !category || !access || !legacy || !grid || !extra || doc.getElementById('s12-command-tools')) return;

    const key = 'sepulchre-saved-commands-v1';
    const $ = (tag, className, text) => {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    };
    let saved = [];
    try {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(items)) saved = [...new Set(items.filter(v => typeof v === 'string' && /^\/[\w-]+(?:\s+[\w-]+)*$/.test(v) && v.length <= 120))].slice(0, 100);
    } catch (_) { /* storage unavailable or malformed */ }
    const persist = () => {try {localStorage.setItem(key, JSON.stringify(saved));} catch (_) {status.textContent = 'Local storage unavailable; saved list may not persist.';}};
    const tools = $('div','s12-command-tools'); tools.id = 's12-command-tools';
    const note = $('div','s12-commands-note','Share the current search or save command names on this browser. The catalog is not proof of live bot registration.');
    const share = $('button','s12-soft-btn','Copy search link'); share.type='button';
    const favorites = $('details','s12-saved-box');
    const summary = $('summary','','Saved commands (0)');
    const savedList = $('div','s12-saved-list');
    favorites.append(summary,savedList);
    const status = $('span','s12-status',''); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    tools.append(share,favorites,status);
    extra.insertAdjacentElement('afterend',tools);
    tools.insertAdjacentElement('afterend',note);

    const storedParams = new URLSearchParams(location.search);
    const paramsForUI = () => {
      const u = new URL(location.href);
      for (const k of ['q','cat','access','legacy','show']) u.searchParams.delete(k);
      if (search.value.trim()) u.searchParams.set('q',search.value.trim().slice(0,120));
      if (category.value) u.searchParams.set('cat',category.value);
      if (access.value) u.searchParams.set('access',access.value);
      if (legacy.checked) u.searchParams.set('legacy','1');
      if (size && size.value !== '24') u.searchParams.set('show',size.value);
      return u;
    };
    let initialRestore = false;
    const restoreSearch = () => {
      if (initialRestore) return;
      if (category.options.length < 2) return; // catalog is populated asynchronously
      initialRestore = true;
      const q = storedParams.get('q') || '';
      const cat = storedParams.get('cat') || '';
      const acc = storedParams.get('access') || '';
      const show = storedParams.get('show') || '';
      if (q) search.value = q.slice(0,120);
      if ([...category.options].some(o=>o.value===cat)) category.value=cat;
      if ([...access.options].some(o=>o.value===acc)) access.value=acc;
      legacy.checked = storedParams.get('legacy')==='1';
      if (size && [...size.options].some(o=>o.value===show)) size.value=show;
      search.dispatchEvent(new Event('input',{bubbles:true}));
      if (size) size.dispatchEvent(new Event('change',{bubbles:true}));
      if (q||cat||acc||storedParams.has('legacy')||show) status.textContent='Search options restored from the URL.';
    };
    const catWatcher = new MutationObserver(restoreSearch);
    catWatcher.observe(category,{childList:true});
    restoreSearch();

    let urlUpdate = 0;
    const syncUrl = () => {
      if (!initialRestore) return;
      clearTimeout(urlUpdate);
      urlUpdate = window.setTimeout(()=>history.replaceState(history.state,'',paramsForUI().toString()),180);
    };
    for (const el of [search,category,access,legacy,size].filter(Boolean)) {
      el.addEventListener(el===search?'input':'change',syncUrl);
    }
    const copyString = async (text) => {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
    };
    share.addEventListener('click',async()=>{
      try {await copyString(paramsForUI().toString()); status.textContent='Search link copied.';}
      catch {status.textContent='Clipboard unavailable. Copy the URL from your browser address bar.';}
    });
    const rebuildList = () => {
      summary.textContent=`Saved commands (${saved.length})`;
      savedList.replaceChildren();
      if (!saved.length) {savedList.append($('p','s12-saved-empty','Use the ☆ button on any command to save it here.'));return;}
      for (const name of saved) {
        const row=$('div','s12-saved-row');
        const jump=$('button','s12-saved-jump',name);jump.type='button';
        jump.addEventListener('click',()=>{
          search.value=name;
          category.value='';access.value=''; // Keep legacy-commerce visibility under the visitor's control.
          search.dispatchEvent(new Event('input',{bubbles:true}));
          favorites.open=false;
          grid.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
        });
        const del=$('button','s12-saved-remove','×');del.type='button';del.title=`Remove ${name}`;del.setAttribute('aria-label',`Remove ${name}`);
        del.addEventListener('click',()=>{saved=saved.filter(s=>s!==name);persist();rebuildList();decorateCards();});
        row.append(jump,del);savedList.append(row);
      }
    };
    const decorateCards = () => {
      for (const card of grid.querySelectorAll('.v8-command-card')) {
        const command = card.querySelector('h3')?.textContent?.trim();
        const header = card.querySelector('.v8-cmd-head');
        if (!command || !command.startsWith('/') || !header) continue;
        let button = header.querySelector('.s12-save-command');
        if (!button) {
          button = $('button','s12-save-command','☆');button.type='button';
          header.insertBefore(button,header.querySelector('.v8-cmd-copy'));
          button.addEventListener('click',()=>{
            if(saved.includes(command)) saved=saved.filter(s=>s!==command);
            else if(saved.length<100) saved.push(command);
            else {status.textContent='You can save up to 100 commands.';return;}
            persist();rebuildList();decorateCards();
          });
        }
        const active=saved.includes(command);
        button.textContent=active?'★':'☆';
        button.title=active?`Remove saved command ${command}`:`Save ${command}`;
        button.setAttribute('aria-label',button.title);
        button.setAttribute('aria-pressed',String(active));
      }
    };
    const watcher=new MutationObserver(decorateCards);
    watcher.observe(grid,{childList:true,subtree:false});
    rebuildList();decorateCards();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
