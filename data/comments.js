<script>
// js/comments.js
(function(){
  const APP_ID = 'YOUR_FB_APP_ID';   // <-- REEMPLAZA
  const LOCALE = 'es_LA';            // Idioma del SDK

  function ensureSdk(){
    if(document.getElementById('facebook-jssdk')) return;

    if(!document.getElementById('fb-root')){
      const r = document.createElement('div');
      r.id = 'fb-root';
      document.body.prepend(r);
    }

    window.fbAsyncInit = function(){
      FB.init({ appId: APP_ID, xfbml: true, version: 'v19.0' });
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = `https://connect.facebook.net/${LOCALE}/sdk.js`;
    document.body.appendChild(js);
  }

  function urlFor(id){
    return `${location.origin}${location.pathname}#p=${id}`;
  }

  function mountComments(id){
    ensureSdk();
    const right = document.querySelector('.modal__right'); if(!right) return;

    let box = document.getElementById('fbCommentsBox');
    if(box) box.remove();

    box = document.createElement('div');
    box.id = 'fbCommentsBox';
    box.style.marginTop = '16px';
    box.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">Opiniones</div>
      <div class="fb-comments" data-href="${urlFor(id)}" data-numposts="6" data-width="100%"></div>
    `;
    right.appendChild(box);

    if(window.FB && FB.XFBML && FB.XFBML.parse){
      FB.XFBML.parse(box);
    }
  }

  // Hook: al abrir un producto, montamos el plugin
  const hook = ()=>{
    if(typeof window.openProduct !== 'function'){ setTimeout(hook, 200); return; }
    const orig = window.openProduct;
    window.openProduct = function(id){
      const r = orig.apply(this, arguments);
      try{ mountComments(id); }catch(e){}
      return r;
    };
  };

  hook(); ensureSdk();
})();
</script>
