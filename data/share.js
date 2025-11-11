<script>
// js/share.js
(function(){
  const processedAttr = 'data-share-enhanced';

  function productUrl(id){
    return `${location.origin}${location.pathname}#p=${id}`;
  }
  function productText(p){
    const precio = (p && p.precio) ? ` — ${p.precio}` : '';
    return `${p?.nombre||'Tecnolap'}${precio} 👇`;
  }
  function makeShareRow(id){
    const p = (window.P||{})[id] || {};
    const url = productUrl(id);
    const text = productText(p);
    const title = p?.nombre || 'Tecnolap';

    const row = document.createElement('div');
    row.id = '';
    row.className = 'shareRow mini';
    row.style.marginTop = '8px';
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '8px';

    row.innerHTML = `
      <button class="pill shareBtn ws">📤 Compartir</button>
      <a class="pill" target="_blank" rel="noopener"
         href="https://wa.me/?text=${encodeURIComponent(text+' '+url)}">WhatsApp</a>
      <a class="pill" target="_blank" rel="noopener"
         href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a>
      <a class="pill" target="_blank" rel="noopener"
         href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}">X</a>
      <a class="pill" target="_blank" rel="noopener"
         href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}">Telegram</a>
      <button class="pill copyBtn">📎 Copiar link</button>
    `;

    row.querySelector('.copyBtn').onclick = async ()=>{
      try{
        await navigator.clipboard?.writeText(url);
        alert('Link copiado');
      }catch(e){ /* noop */ }
    };
    row.querySelector('.ws').onclick = async ()=>{
      if(navigator.share){
        try{ await navigator.share({ title, text: p?.nombre || 'Tecnolap', url }); }catch(e){}
      }else{
        window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`,'_blank');
      }
    };
    return row;
  }

  function enhanceCards(){
    const grid = document.getElementById('productGrid'); if(!grid) return;
    grid.querySelectorAll('.card.item').forEach(card=>{
      if(card.getAttribute(processedAttr)) return;

      const btn = card.querySelector('button[onclick^="openProduct"]');
      if(!btn) return;
      const m = btn.getAttribute('onclick')?.match(/openProduct\('([^']+)'\)/);
      const id = m && m[1]; if(!id) return;

      const row = makeShareRow(id);
      card.appendChild(row);
      card.setAttribute(processedAttr, '1');
    });
  }

  function observe(){
    const grid = document.getElementById('productGrid'); if(!grid) return;
    const obs = new MutationObserver(()=>enhanceCards());
    obs.observe(grid, { childList:true, subtree:false });
    enhanceCards();
  }

  function mountInModal(id){
    const right = document.querySelector('.modal__right'); if(!right) return;
    let bar = document.getElementById('modalShareRow');
    if(bar) bar.remove();
    bar = makeShareRow(id);
    bar.id = 'modalShareRow';
    right.appendChild(bar);
  }

  // Hook: cuando se abra el producto, metemos los botones en el modal
  const hook = ()=>{
    if(typeof window.openProduct !== 'function'){ setTimeout(hook, 200); return; }
    const orig = window.openProduct;
    window.openProduct = function(id){
      const r = orig.apply(this, arguments);
      try{ mountInModal(id); }catch(e){}
      return r;
    };
  };

  window.Share = { init: observe, mountInModal };
  hook(); observe();
})();
</script>
