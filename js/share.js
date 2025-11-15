// js/share.js
(function () {
  // Construye URL del producto con hash #p=ID (tu página ya abre el modal por hash)
  function buildUrlForId(id) {
    // Soporte si origin no está disponible (file:// o proxys raros)
    const base =
      (location.origin && location.origin !== 'null')
        ? location.origin + location.pathname
        : location.protocol + '//' + location.host + location.pathname;
    return id ? `${base}#p=${encodeURIComponent(id)}` : base;
  }

  // URLs para compartir en redes
  function shareUrls({ title, text, url }) {
    const enc = encodeURIComponent;
    return {
      whatsapp: `https://wa.me/?text=${enc(`${text} ${url}`)}`, // compartir a cualquier chat
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
      twitter:  `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      email:    `mailto:?subject=${enc(title)}&body=${enc(`${text}\n${url}`)}`
    };
  }

  // Intenta Web Share API (móviles/desktop compatibles)
  async function tryNativeShare({ title, text, url }) {
    if (navigator.share && typeof navigator.share === 'function') {
      try { await navigator.share({ title, text, url }); return true; }
      catch (e) { /* cancelado o no soportado */ }
    }
    return false;
  }

  // Popup fallback con botones de redes + copiar enlace
  function makePopup({ title, text, url }) {
    const css = `
      .shareOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);
        display:flex;align-items:center;justify-content:center;z-index:300}
      .shareBox{background:#0f1530;border:1px solid rgba(255,255,255,.12);border-radius:16px;
        width:min(92vw,520px);padding:14px;box-shadow:0 12px 30px rgba(0,0,0,.35);color:#eaf1ff}
      .shareHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
      .shareGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .shareBtn{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:12px;
        border:1px solid rgba(255,255,255,.15);text-decoration:none;color:#eaf1ff;background:transparent}
      .shareClose{border:0;background:transparent;color:#eaf1ff;font-size:18px;cursor:pointer}
      @media (max-width:420px){.shareGrid{grid-template-columns:repeat(2,1fr)}}
    `;
    const urls = shareUrls({ title, text, url });

    const overlay = document.createElement('div');
    overlay.className = 'shareOverlay';
    overlay.innerHTML = `
      <style>${css}</style>
      <div class="shareBox">
        <div class="shareHead">
          <strong>Compartir</strong>
          <button class="shareClose" aria-label="Cerrar">✕</button>
        </div>
        <div class="mini" style="opacity:.9;margin:0 0 10px">${text}</div>
        <div class="shareGrid">
          <a class="shareBtn" target="_blank" rel="noopener" href="${urls.whatsapp}">🟢 WhatsApp</a>
          <a class="shareBtn" target="_blank" rel="noopener" href="${urls.facebook}">🔵 Facebook</a>
          <a class="shareBtn" target="_blank" rel="noopener" href="${urls.telegram}">💬 Telegram</a>
          <a class="shareBtn" target="_blank" rel="noopener" href="${urls.twitter}">𝕏 Twitter</a>
          <a class="shareBtn" target="_blank" rel="noopener" href="${urls.linkedin}">🔗 LinkedIn</a>
          <a class="shareBtn" href="${urls.email}">✉️ Email</a>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <input id="shareCopy" style="flex:1;min-width:180px;background:#0b1020;border:1px solid rgba(255,255,255,.15);
            color:#eaf1ff;border-radius:10px;padding:8px" value="${url}" readonly />
          <button id="shareCopyBtn" class="shareBtn" style="border-style:solid">📋 Copiar enlace</button>
        </div>
        <div class="mini" style="opacity:.7;margin-top:8px">
          Tip: En móviles, el botón nativo permite elegir Instagram, Stories, etc.
        </div>
      </div>
    `;
    overlay.querySelector('.shareClose').onclick = () => document.body.removeChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
    overlay.querySelector('#shareCopyBtn').onclick = async () => {
      try { await navigator.clipboard.writeText(url);
            overlay.querySelector('#shareCopyBtn').textContent = '✅ Copiado'; }
      catch {
        const inp = overlay.querySelector('#shareCopy');
        inp.select(); document.execCommand('copy');
      }
    };
    document.body.appendChild(overlay);
  }

  async function share({ title, text, url }) {
    const usedNative = await tryNativeShare({ title, text, url });
    if (!usedNative) makePopup({ title, text, url });
  }

  // API pública para compartir toda la web (si quieres un botón global)
  window.shareSite = function () {
    const title = document.title;
    const url = buildUrlForId(null);
    const text = 'Catálogo de Grupo Tecnolap EIRL — laptops, impresoras, CCTV y más.';
    share({ title, text, url });
  };

  // API pública: compartir un producto (la usas desde botones y desde el modal)
  window.shareProduct = function (id) {
    try {
      const p = (window.P || {})[id];
      const title = p?.nombre || document.title;
      const url = buildUrlForId(id);
      const text = p ? `${p.nombre}${p.precio ? ' — ' + p.precio : ''}` : 'Mira este producto';
      share({ title, text, url });
    } catch (e) {
      share({ title: document.title, text: 'Mira este producto', url: buildUrlForId(id) });
    }
  };
})();
