/* Sepulchre v13: additive guidance enhancements. No network requests or backend changes. */
(() => {
'use strict';
const doc=document;
const $=(s,root=doc)=>root.querySelector(s);
const $$=(s,root=doc)=>Array.from(root.querySelectorAll(s));
const el=(tag,cls,content)=>{const x=doc.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;};
const safeQuery=(name)=>{try{return new URL(location.href).searchParams.get(name)||''}catch(_){return ''}};
const setSearch=(pairs)=>{try{const u=new URL(location.href);Object.entries(pairs).forEach(([k,v])=>{if(v)u.searchParams.set(k,v);else u.searchParams.delete(k)});history.replaceState(history.state,'',u.pathname+u.search+u.hash)}catch(_){}};
// Existing documentation cards only. No new pages or capabilities advertised.
const query=$('#v10-guide-query');
if(query && !$('#s13-doc-meta')){
 const cards=$$('.v10-guide-card'),searchWrap=query.closest('.v10-guide-search')||query;
 const meta=el('div','s13-doc-meta');meta.id='s13-doc-meta';
 const count=el('span','s13-doc-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');
 const clear=el('button','s13-doc-clear','Clear search');clear.type='button';
 meta.append(count,clear);searchWrap.insertAdjacentElement('afterend',meta);
 const empty=el('div','s13-doc-empty','No guides match this search. Try a different keyword.');empty.hidden=true;
 const list=$('#v10-guides');if(list)list.insertAdjacentElement('afterend',empty);
 const refresh=()=>{
  const q=query.value.trim().toLocaleLowerCase();let n=0;
  cards.forEach(card=>{const match=(card.dataset.search||card.textContent).toLocaleLowerCase().includes(q);card.hidden=!match;if(match)n++;});
  count.textContent=`${n} of ${cards.length} guides`;empty.hidden=n!==0;
  clear.hidden=!q;setSearch({q:query.value.trim()});
 };
 query.addEventListener('input',refresh);
 clear.addEventListener('click',()=>{query.value='';query.dispatchEvent(new Event('input',{bubbles:true}));query.focus()});
 const initial=safeQuery('q').slice(0,120);if(initial)query.value=initial;
 query.dispatchEvent(new Event('input',{bubbles:true}));
}
// Auto-generate a guide jump menu from existing, published article headings.
const article=$('.v10-guide-article');
if(article && !$('.s13-guide-toc')){
 const hs=$$('.v10-guide-step h2',article).filter(h=>h.textContent.trim());
 if(hs.length>=2){
  const nav=el('nav','s13-guide-toc');nav.setAttribute('aria-label','Sections on this guide');
  const heading=el('div','s13-toc-heading','ON THIS PAGE');const links=el('div','s13-toc-links');
  const used=new Set($$('[id]').map(x=>x.id));
  hs.forEach((h,i)=>{
   let id=h.id||('guide-'+h.textContent.trim().toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,56));
   if(!id || (used.has(id)&&h.id!==id))id='guide-section-'+(i+1);
   if(!h.id){let candidate=id,j=2;while(used.has(candidate)){candidate=id+'-'+j++;}id=candidate;h.id=id;used.add(id)}
   const link=el('a','',h.textContent.trim());link.href='#'+id;links.appendChild(link);
   const anchor=el('a','s13-guide-anchor','#');anchor.href='#'+id;anchor.setAttribute('aria-label','Link to '+h.textContent.trim());h.appendChild(anchor);
  });
  nav.append(heading,links);article.insertBefore(nav,article.firstChild);
 }
}
// Real published FAQ questions grouped only by their existing topic and copy.
const faq=$('.faq-list');
if(faq && !$('.s13-faq-tabs')){
 const items=$$('details.faq-item',faq);const tools=$('.s11-faq-tools');const input=tools?.querySelector('input[type="search"]');
 if(items.length && input){
  const classify=(q)=>{
   if(/payment method|where can i purchase/i.test(q))return 'Purchasing';
   if(/how do i contact support/i.test(q))return 'Support';
   if(/bot commands/i.test(q))return 'Commands';
   if(/license|subscription/i.test(q))return 'Licensing';
   return 'General';
  };
  items.forEach(item=>item.dataset.s13Category=classify($('summary',item)?.textContent||''));
  const names=['All',...['Licensing','Purchasing','Support','Commands','General'].filter(c=>items.some(x=>x.dataset.s13Category===c))];
  const group=el('div','s13-faq-tabs');group.setAttribute('role','group');group.setAttribute('aria-label','Filter FAQ by topic');
  let active='All';const buttons=new Map();
  const count=$('.s11-faq-count',tools),empty=$('.s11-faq-empty');
  const apply=()=>{
   const q=input.value.trim().toLocaleLowerCase();let visible=0;
   items.forEach(item=>{const matches=(active==='All'||item.dataset.s13Category===active)&&item.textContent.toLocaleLowerCase().includes(q);item.hidden=!matches;item.style.display=matches?'':'none';if(matches)visible++;});
   buttons.forEach((button,name)=>button.setAttribute('aria-pressed',String(active===name)));
   if(count)count.textContent=`${visible} of ${items.length} questions`;
   if(empty)empty.hidden=visible!==0;
   setSearch({category:active==='All'?'':active,q:input.value.trim()});
  };
  names.forEach(name=>{
   const n=items.filter(i=>name==='All'||i.dataset.s13Category===name).length;
   const b=el('button','s13-faq-chip',`${name} (${n})`);b.type='button';
   b.addEventListener('click',()=>{active=name;apply()});buttons.set(name,b);group.appendChild(b);
  });
  tools.insertAdjacentElement('afterend',group);
  input.addEventListener('input',apply); // Runs after v11 filter and combines both conditions.
  const initialCategory=safeQuery('category');if(names.includes(initialCategory))active=initialCategory;
  const initialSearch=safeQuery('q').slice(0,120);if(initialSearch)input.value=initialSearch;
  input.dispatchEvent(new Event('input',{bubbles:true}));
 }
}
// Purchase instructions strictly repeat the existing website model. No checkout backend.
const clarity=$('.purchase-clarity');
if(clarity && $('.pricing-box') && !$('.s13-purchase-steps')){
 const section=el('section','wrap s13-purchase-steps');
 section.setAttribute('aria-label','How purchasing works');
 const eyebrow=el('p','s13-purchase-head','SIMPLE, TRANSPARENT PROCESS');
 const heading=el('h2','s13-purchase-title','How purchasing works');
 const list=el('ol','s13-purchase-grid');
 const steps=[
  ['Review the license','The listed price is $5.99 USD, one time, for one designated Discord server. Read the published terms and refund policy.','/terms/','Read terms'],
  ['Open official support','Use the Purchase button above to open the official Sepulchre support Discord. No checkout happens on this website.','/docs/licenses/','License guide'],
  ['Confirm details with staff','Check available payment methods and activation steps with authorized staff before sending funds. Never pay an unsolicited account.','/faq/','Purchase FAQ']
 ];
 steps.forEach(([name,desc,url,label],i)=>{
  const item=el('li');const num=el('span','s13-step-index',String(i+1).padStart(2,'0'));
  const h=el('h3','',name),p=el('p','',desc),a=el('a','',label);a.href=url;
  const footer=el('p');footer.appendChild(a);item.append(num,h,p,footer);list.appendChild(item);
 });
 const note=el('p','s13-purchase-note','Sepulchre does not process payments or collect payment details through this website.');
 section.append(eyebrow,heading,list,note);clarity.insertAdjacentElement('afterend',section);
}
})();
