/* Sepulchre v12: browser-only embed drafting and validation; no Discord API calls. */
(() => {
  'use strict';
  const start=()=>{
    const d=document;
    const id=x=>d.getElementById(x);
    const output=id('e-json'),bar=d.querySelector('.v8-import'),color=id('e-color');
    if(!output||!bar||!color||id('s12-embed-tools'))return;
    const make=(tag,cls,text)=>{const x=d.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
    const key='sepulchre-embed-manual-draft-v1';
    const toolbar=make('div','s12-embed-tools');toolbar.id='s12-embed-tools';
    const label=make('span','s12-embed-label','Local drafts');
    const save=make('button','s12-soft-btn','Save draft');
    const restore=make('button','s12-soft-btn','Restore draft');
    const erase=make('button','s12-soft-btn','Delete draft');
    const status=make('span','s12-status','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    for(const button of [save,restore,erase])button.type='button';
    toolbar.append(label,save,restore,erase,status);
    bar.insertAdjacentElement('afterend',toolbar);
    const helper=make('p','s12-local-note','Drafts are saved only in this browser. They are not sent to Sepulchre or Discord; export JSON for a separate backup.');
    toolbar.insertAdjacentElement('afterend',helper);

    const validObject=(text)=>{const data=JSON.parse(text);if(!data||typeof data!=='object'||!Array.isArray(data.embeds)||!data.embeds.length||typeof data.embeds[0]!=='object')throw new Error('Embed data is missing');return data;};
    const stored=()=>{try{return localStorage.getItem(key);}catch{return null;}};
    const updateButtons=()=>{const exists=!!stored();restore.disabled=!exists;erase.disabled=!exists;};
    save.addEventListener('click',()=>{
      try {const json=output.textContent;validObject(json);if(json.length>200000)throw new Error('Draft is too large');localStorage.setItem(key,json);status.textContent='Draft saved in this browser.';updateButtons();}
      catch(err){status.textContent='Could not save: '+err.message;}
    });
    restore.addEventListener('click',()=>{
      try {
        const json=stored();if(!json)throw new Error('No saved draft');validObject(json);
        const file=new File([json],'sepulchre-saved-draft.json',{type:'application/json'});
        const transfer=new DataTransfer();transfer.items.add(file);
        const fileInput=id('v8-file');if(!fileInput)throw new Error('Import control unavailable');
        fileInput.files=transfer.files;
        fileInput.dispatchEvent(new Event('change',{bubbles:true}));
        status.textContent='Saved draft loaded into the editor.';
      }catch(err){status.textContent='Restore failed: '+err.message;}
    });
    erase.addEventListener('click',()=>{
      if(!window.confirm('Delete your locally saved Sepulchre embed draft?'))return;
      try{localStorage.removeItem(key);status.textContent='Local draft deleted.';updateButtons();}catch{status.textContent='Could not delete draft.';}
    });
    updateButtons();

    const pal=make('div','s12-color-palette');
    const colors=[['Crimson','#df243d'],['Deep red','#a3162c'],['Silver','#c8cbd1'],['Blue','#5865f2'],['Green','#43b581'],['Gold','#e8ac43']];
    for(const [name,hex] of colors){
      const b=make('button','s12-swatch');b.type='button';b.title=`${name} ${hex}`;
      b.setAttribute('aria-label',`Set embed color to ${name}`);
      b.style.setProperty('--swatch',hex);
      b.addEventListener('click',()=>{color.value=hex;color.dispatchEvent(new Event('input',{bubbles:true}));});
      pal.append(b);
    }
    color.closest('label')?.insertAdjacentElement('afterend',pal);

    const check=make('div','s12-embed-check');check.setAttribute('role','status');check.setAttribute('aria-live','polite');
    const stats=d.querySelector('.v10-embed-stats');if(stats)stats.insertAdjacentElement('afterend',check);
    else toolbar.insertAdjacentElement('afterend',check);
    const httpsCheck=(value,label,problems)=>{
      if(!value)return;
      try{const u=new URL(value);if(u.protocol!=='https:')problems.push(`${label}: use a public HTTPS link`);}
      catch{problems.push(`${label}: invalid URL`);}
    };
    const validate=()=>{
      let data;
      try{data=validObject(output.textContent);}catch{check.textContent='Preview JSON is unavailable.';return;}
      const e=data.embeds[0];const fields=Array.isArray(e.fields)?e.fields:[];
      const t=v=>String(v??'');
      const title=t(e.title),desc=t(e.description),author=t(e.author?.name),foot=t(e.footer?.text);
      let total=title.length+desc.length+author.length+foot.length;
      const errors=[];
      if(title.length>256)errors.push('Title exceeds 256 characters');
      if(desc.length>4096)errors.push('Description exceeds 4096 characters');
      if(author.length>256)errors.push('Author exceeds 256 characters');
      if(foot.length>2048)errors.push('Footer exceeds 2048 characters');
      if(fields.length>25)errors.push('More than 25 fields');
      fields.forEach((f,i)=>{
        const n=t(f.name),v=t(f.value);total+=n.length+v.length;
        if(n.length>256||v.length>1024)errors.push(`Field ${i+1} exceeds name/value limits`);
      });
      if(total>6000)errors.push('Combined embed text exceeds 6000 characters');
      httpsCheck(e.url,'Title link',errors);
      httpsCheck(e.author?.icon_url,'Author icon',errors);
      httpsCheck(e.footer?.icon_url,'Footer icon',errors);
      httpsCheck(e.image?.url,'Image',errors);
      httpsCheck(e.thumbnail?.url,'Thumbnail',errors);
      const buttons=Array.isArray(data.preview_buttons)?data.preview_buttons:[];
      buttons.forEach((b,i)=>{if(b.style==='link')httpsCheck(b.url,`Link button ${i+1}`,errors);});
      check.textContent=`Embed text ${total.toLocaleString()} / 6,000 characters. ${errors.length?errors.join(' · '):'No standard text-limit issues detected.'} Buttons are visual previews only.`;
      check.classList.toggle('s12-has-error',errors.length>0);
    };
    const obs=new MutationObserver(validate);
    obs.observe(output,{childList:true,characterData:true,subtree:true});
    validate();
    const reset=id('v8-reset');if(reset){reset.textContent='Reset example';reset.title='Restore the initial example rather than clearing every field';}
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
