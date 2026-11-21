/* MORROW — an accessible, client-side storefront demonstration.
   No backend, real payments, accounts or deliveries. All product data is fictional.
   Search, sorting, saved items and basket are powered by vanilla JavaScript. */
(() => {
  'use strict';

  const products = window.MORROW_PRODUCTS || [];
  const byId = new Map(products.map(p => [p.id, p]));
  const currency = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'});
  const $ = id => document.getElementById(id);
  const FALLBACK = 'image-fallback.svg';
  const CART_KEY = 'morrow-demo-cart-v1';
  const SAVED_KEY = 'morrow-demo-saved-v1';

  const readStored = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  };
  const saveStored = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const storedCart = readStored(CART_KEY, {});
  const cart = {};
  if (storedCart && typeof storedCart === 'object' && !Array.isArray(storedCart)) {
    for (const [id, qty] of Object.entries(storedCart)) {
      if (byId.has(Number(id)) && Number.isInteger(qty) && qty > 0) cart[id] = Math.min(20, qty);
    }
  }
  const storedSaved = readStored(SAVED_KEY, []);
  const saved = new Set(Array.isArray(storedSaved) ? storedSaved.map(Number).filter(id => byId.has(id)) : []);
  const state = {category:'All', query:'', sort:'featured', onlySaved:false, limit:8};
  let currentProduct = null;
  let activeLayer = null;
  let returnFocus = null;
  let toastTimer = null;

  const photo = (id, width=700) => `https://images.unsplash.com/${id}?w=${width}&q=82&fit=crop&auto=format`;
  const money = n => currency.format(n);
  const itemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const subtotal = () => Object.entries(cart).reduce((sum,[id,qty]) => sum + (byId.get(Number(id))?.price || 0) * qty, 0);
  const deliveryCost = amount => amount >= 100 || amount === 0 ? 0 : 6.50;

  function toast(message) {
    $('toast-text').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3100);
  }
  $('toast-close').addEventListener('click', () => $('toast').classList.remove('show'));

  function persist() { saveStored(CART_KEY, cart); saveStored(SAVED_KEY, [...saved]); }
  function updateCounters() {
    const count = itemCount();
    $('cart-count').textContent = count;
    $('cart-count').hidden = !count;
    $('cart-open').setAttribute('aria-label', `Open shopping bag, ${count} ${count===1?'item':'items'}`);
    $('wishlist-count').textContent = saved.size;
    $('wishlist-count').hidden = saved.size === 0;
    $('wishlist-toggle').setAttribute('aria-pressed', String(state.onlySaved));
    $('wishlist-toggle').setAttribute('aria-label', `Show saved items, ${saved.size} saved`);
    $('drawer-cart-count').textContent = `(${count})`;
  }

  function filteredProducts() {
    let list = products.filter(p => {
      const categoryOK = state.category === 'All' || p.category === state.category;
      const searchOK = !state.query || [p.name,p.category,p.description].join(' ').toLowerCase().includes(state.query.toLowerCase());
      return categoryOK && searchOK && (!state.onlySaved || saved.has(p.id));
    });
    if (state.sort === 'price-low') list.sort((a,b) => a.price - b.price);
    if (state.sort === 'price-high') list.sort((a,b) => b.price - a.price);
    if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
    if (state.sort === 'new') list.sort((a,b) => Number(b.isNew) - Number(a.isNew) || b.id - a.id);
    return list;
  }

  function productMarkup(p) {
    const isSaved = saved.has(p.id);
    const badge = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';
    const old = p.oldPrice ? `<span class="product-old-price">${money(p.oldPrice)}</span>` : '';
    return `<article class="product-card" data-id="${p.id}">
      <div class="product-image-wrap"><img src="${photo(p.image)}" alt="${p.name} — illustrative home and lifestyle photography" loading="lazy" decoding="async" onerror="this.src='${FALLBACK}'">
        ${badge}<button class="product-heart ${isSaved?'saved':''}" data-action="save" data-id="${p.id}" aria-pressed="${isSaved}" aria-label="${isSaved?'Remove':'Save'} ${p.name} ${isSaved?'from':'to'} favourites"><i class="${isSaved?'fa-solid':'fa-regular'} fa-heart" aria-hidden="true"></i></button>
        <button class="product-quick" data-action="quick" data-id="${p.id}"><i class="fa-regular fa-eye" aria-hidden="true"></i> Quick view</button>
      </div>
      <div class="product-description"><div class="product-topline"><span>${p.category}</span><span class="product-stars" aria-label="Rated ${p.rating} out of 5"><i class="fa-solid fa-star" aria-hidden="true"></i> ${p.rating} <span class="review-count">(${p.reviews})</span></span></div>
        <h3 class="product-name"><button data-action="quick" data-id="${p.id}">${p.name}</button></h3>
        <div class="price-line"><span class="product-price">${money(p.price)}${old}</span><button class="add-icon" data-action="add" data-id="${p.id}" aria-label="Add ${p.name} to bag"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const all = filteredProducts();
    const visible = all.slice(0,state.limit);
    $('product-grid').innerHTML = visible.map(productMarkup).join('');
    $('empty-results').hidden = all.length > 0;
    $('shop-bottom').hidden = all.length === 0;
    $('shown-count').textContent = `Showing ${visible.length} of ${all.length} ${all.length===1?'piece':'pieces'}`;
    $('load-more').hidden = all.length <= visible.length;
    $('results-note').textContent = state.onlySaved ? `Viewing ${all.length} saved ${all.length === 1?'piece':'pieces'}` : state.query ? `${all.length} ${all.length===1?'result':'results'} for “${state.query}”` : '';
    $('shop-total-label').innerHTML = `${all.length} thoughtfully chosen ${all.length===1?'piece':'pieces'} <i class="fa-solid fa-arrow-down-long" aria-hidden="true"></i>`;
    document.querySelectorAll('.filter-chip').forEach(btn => {
      const active = btn.dataset.filter === state.category;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    $('product-search').value = state.query;
    $('sort-products').value = state.sort;
    $('wishlist-toggle').classList.toggle('is-active',state.onlySaved);
    updateCounters();
  }
  function setCategory(category) {
    state.category = category;
    state.query = '';
    state.onlySaved = false;
    state.limit = 8;
    renderProducts();
    closeMenu();
    $('shop').scrollIntoView({behavior:motion(),block:'start'});
  }
  function motion() {return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto':'smooth';}

  function addToCart(id, amount=1) {
    const p = byId.get(Number(id));
    if (!p) return;
    const previous = cart[p.id] || 0;
    if (previous >= 20) {toast('Maximum 20 units of each piece in this demo.');return;}
    cart[p.id] = Math.min(20, previous + amount);
    persist(); updateCounters(); renderCart();
    toast(`${p.name} added to your bag`);
  }
  function toggleSaved(id) {
    const p = byId.get(Number(id)); if(!p) return;
    if (saved.has(p.id)) {saved.delete(p.id);toast(`${p.name} removed from saved items`);}
    else {saved.add(p.id);toast(`${p.name} saved for later`);}
    persist();renderProducts();
  }
  function renderCart() {
    const entries = Object.entries(cart).filter(([id,qty])=>qty > 0 && byId.has(Number(id)));
    const total = subtotal();
    $('cart-items').innerHTML = entries.length ? entries.map(([id,qty]) => {
      const p=byId.get(Number(id));
      return `<div class="cart-item"><img class="cart-item-image" src="${photo(p.image,250)}" alt="${p.name}" loading="lazy" onerror="this.src='${FALLBACK}'"><div class="cart-item-info"><span class="cart-item-category">${p.category}</span><span class="cart-item-title">${p.name}</span><span class="cart-item-price">${money(p.price * qty)}</span><div class="cart-item-bottom"><div class="cart-qty"><button data-cart-action="minus" data-id="${id}" aria-label="Remove one ${p.name}">−</button><span aria-label="Quantity ${qty}">${qty}</span><button data-cart-action="plus" data-id="${id}" aria-label="Add one ${p.name}">+</button></div><button class="cart-remove" data-cart-action="remove" data-id="${id}">Remove</button></div></div></div>`;
    }).join('') : `<div class="cart-empty"><span class="empty-icon"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i></span><h3>Nothing in your bag.</h3><p>There's always room for something lovely. Explore the collection and find a favourite.</p><button class="btn-main" id="empty-shop">Discover the collection <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>`;
    $('cart-footer').hidden = entries.length === 0;
    $('cart-subtotal').textContent = money(total);
    $('cart-shipping').textContent = deliveryCost(total) === 0 ? 'Complimentary' : money(deliveryCost(total));
    const left = Math.max(0,100-total);
    const progress = Math.min(100,total);
    $('delivery-message').innerHTML = left > 0
      ? `You're <strong>${money(left)}</strong> away from complimentary delivery.<div class="delivery-progress" aria-hidden="true"><div style="width:${progress}%"></div></div>`
      : `Lovely! Your demo order qualifies for complimentary delivery.<div class="delivery-progress" aria-hidden="true"><div style="width:100%"></div></div>`;
    updateCounters();
  }

  // A single active overlay and a keyboard focus trap for accessible dialogs.
  const focusables = root => [...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(e=>e.getClientRects().length && !e.hidden);
  function openLayer(element) {
    if (activeLayer) activeLayer.hidden = true;
    else returnFocus = document.activeElement;
    activeLayer = element;
    element.hidden = false;
    $('overlay').hidden = element === $('search-modal');
    document.body.classList.add('modal-open-custom');
    $('cart-open').setAttribute('aria-expanded',String(element === $('cart-drawer')));
    requestAnimationFrame(() => (focusables(element)[0] || element).focus());
  }
  function closeLayer() {
    if (!activeLayer) return;
    activeLayer.hidden = true; activeLayer = null;
    $('overlay').hidden = true;
    document.body.classList.remove('modal-open-custom');
    $('cart-open').setAttribute('aria-expanded','false');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll:true});
    returnFocus = null;
  }
  function openCart(){renderCart();openLayer($('cart-drawer'));}
  function openQuickview(id) {
    const p=byId.get(Number(id)); if(!p)return;
    currentProduct = p;
    $('quickview-image').src=photo(p.image,950);
    $('quickview-image').onerror=()=>{$('quickview-image').onerror=null;$('quickview-image').src=FALLBACK;};
    $('quickview-image').alt=`${p.name} illustrative product photo`;
    $('quickview-title').textContent=p.name;
    $('quickview-category').textContent=p.category.toUpperCase();
    $('quickview-rating').innerHTML=`<i class="fa-solid fa-star" aria-hidden="true"></i> ${p.rating} / 5 <span>${p.reviews} fictional reviews</span>`;
    $('quickview-price').innerHTML=`${money(p.price)} ${p.oldPrice?`<del>${money(p.oldPrice)}</del>`:''}`;
    $('quickview-description').textContent=p.description;
    $('quickview-qty').value=1;
    openLayer($('quickview'));
  }
  function openCheckout() {
    if (!itemCount()) return;
    $('checkout-content').innerHTML = `<span class="eyebrow">YOUR ALMOST-ORDER</span><h2 id="checkout-title">A thoughtful <em>checkout.</em></h2><p class="checkout-description">This is a simulation for a front-end portfolio. Use invented test details only. No payment is taken and no data is sent anywhere.</p><div class="checkout-summary" id="checkout-summary"></div><form id="checkout-form" novalidate><div class="form-grid"><label>Full name <input id="checkout-name" name="name" type="text" placeholder="Alex Example" minlength="2" maxlength="80" required autocomplete="off"></label><label>Email <input id="checkout-email" name="email" type="email" placeholder="alex@example.com" maxlength="120" required autocomplete="off"></label><label class="full-row">Delivery address <input id="checkout-address" name="address" type="text" placeholder="10 Example Street" minlength="5" maxlength="160" required autocomplete="off"></label><label>Town / City <input id="checkout-city" name="city" type="text" placeholder="Exampletown" minlength="2" maxlength="80" required autocomplete="off"></label><label>Postcode <input id="checkout-postcode" name="postcode" type="text" placeholder="AB1 2CD" minlength="4" maxlength="12" required autocomplete="off"></label></div><button type="submit" class="btn-main checkout-place">Place demo order <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button><p class="checkout-disclaimer"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Simulated order only. Nothing is purchased or delivered.</p></form>`;
    const sub = subtotal();
    $('checkout-summary').innerHTML=`<span>${itemCount()} ${itemCount()===1?'item':'items'} · ${deliveryCost(sub)?'Standard demo delivery':'Complimentary delivery'}</span><strong>${money(sub+deliveryCost(sub))}</strong>`;
    openLayer($('checkout-modal'));
  }

  $('product-grid').addEventListener('click',event=>{
    const btn=event.target.closest('[data-action]');if(!btn)return;
    const id=Number(btn.dataset.id);
    if (btn.dataset.action === 'save') toggleSaved(id);
    if (btn.dataset.action === 'add') addToCart(id);
    if (btn.dataset.action === 'quick') openQuickview(id);
  });
  $('cart-items').addEventListener('click',event=>{
    const btn=event.target.closest('[data-cart-action]');
    if (!btn) {
      if (event.target.closest('#empty-shop')) {closeLayer();$('shop').scrollIntoView({behavior:motion()});}
      return;
    }
    const id=Number(btn.dataset.id), action=btn.dataset.cartAction;
    if (!byId.has(id))return;
    if (action==='remove')delete cart[id];
    if (action==='minus') {cart[id]=(cart[id]||0)-1;if(cart[id]<1)delete cart[id];}
    if (action==='plus') {if(cart[id]>=20){toast('Maximum 20 units per piece.');return;}cart[id]=(cart[id]||0)+1;}
    persist();renderCart();
  });
  document.querySelectorAll('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{state.category=btn.dataset.filter;state.onlySaved=false;state.limit=8;renderProducts();}));
  $('product-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.limit=8;renderProducts();});
  $('sort-products').addEventListener('change',e=>{state.sort=e.target.value;renderProducts();});
  $('load-more').addEventListener('click',()=>{state.limit+=8;renderProducts();});
  $('clear-filters').addEventListener('click',()=>{state.query='';state.category='All';state.onlySaved=false;state.limit=8;renderProducts();});
  document.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>setCategory(btn.dataset.category)));
  document.querySelectorAll('[data-category-nav]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();setCategory(link.dataset.categoryNav);}));
  document.querySelectorAll('[data-menu-category]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();setCategory(link.dataset.menuCategory);}));
  $('wishlist-toggle').addEventListener('click',()=>{state.onlySaved=!state.onlySaved;state.category='All';state.query='';state.limit=8;renderProducts();$('shop').scrollIntoView({behavior:motion()});if(state.onlySaved)toast(saved.size?'Showing your saved pieces':'No saved pieces yet — tap a heart to save one');});
  $('footer-wishlist-open').addEventListener('click',()=>{$('wishlist-toggle').click();});
  $('cart-open').addEventListener('click',openCart);
  $('footer-cart-open').addEventListener('click',openCart);
  $('cart-close').addEventListener('click',closeLayer);
  $('continue-shopping').addEventListener('click',closeLayer);
  $('overlay').addEventListener('click',closeLayer);
  $('checkout-open').addEventListener('click',openCheckout);
  document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeLayer));
  $('quickview-minus').addEventListener('click',()=>{$('quickview-qty').value=Math.max(1,(Number($('quickview-qty').value)||1)-1);});
  $('quickview-plus').addEventListener('click',()=>{$('quickview-qty').value=Math.min(20,(Number($('quickview-qty').value)||1)+1);});
  $('quickview-add').addEventListener('click',()=>{if(!currentProduct)return;const qty=Math.max(1,Math.min(20,Number($('quickview-qty').value)||1));addToCart(currentProduct.id,qty);openCart();});
  $('checkout-content').addEventListener('submit',event=>{
    if(event.target.id!=='checkout-form')return;
    event.preventDefault();
    const form=event.target;
    if(!form.checkValidity()){form.reportValidity();return;}
    const code=`MW-${String(Date.now()).slice(-6)}`;
    Object.keys(cart).forEach(key=>delete cart[key]);persist();updateCounters();renderCart();
    $('checkout-content').innerHTML=`<div class="success-state"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><h2 id="checkout-title">Beautifully <em>done.</em></h2><p>Your simulated order <strong>${code}</strong> has been completed.<br>No payment, email, delivery or real order was created.</p><button class="btn-main" id="success-continue">Back to the collection <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>`;
    $('success-continue').addEventListener('click',()=>{closeLayer();$('shop').scrollIntoView({behavior:motion()});});
    $('success-continue').focus();
  });
  $('newsletter-form').addEventListener('submit',event=>{event.preventDefault();if($('newsletter-form').reportValidity()){toast('Thanks! This demo does not send or save emails.');$('newsletter-form').reset();}});

  $('search-open').addEventListener('click',()=>openLayer($('search-modal')));
  $('search-close').addEventListener('click',closeLayer);
  function doGlobalSearch(text){state.query=text.trim();state.category='All';state.onlySaved=false;state.limit=8;renderProducts();closeLayer();$('shop').scrollIntoView({behavior:motion()});}
  $('global-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doGlobalSearch(e.target.value);}});
  document.querySelectorAll('[data-suggestion]').forEach(btn=>btn.addEventListener('click',()=>doGlobalSearch(btn.dataset.suggestion)));
  function openMenu(){$('mobile-menu').hidden=false;$('menu-open').setAttribute('aria-expanded','true');document.body.classList.add('modal-open-custom');$('menu-close').focus();}
  function closeMenu(){if(!$('mobile-menu').hidden){$('mobile-menu').hidden=true;$('menu-open').setAttribute('aria-expanded','false');document.body.classList.remove('modal-open-custom');}}
  $('menu-open').addEventListener('click',openMenu);
  $('menu-close').addEventListener('click',()=>{closeMenu();$('menu-open').focus();});
  document.querySelectorAll('[data-close-menu]').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if(activeLayer)closeLayer();else if(!$('mobile-menu').hidden)closeMenu();return;}
    const current=activeLayer || (!$('mobile-menu').hidden ? $('mobile-menu'):null);
    if(event.key==='Tab'&&current){const list=focusables(current);if(!list.length)return;const first=list[0],last=list[list.length-1];if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}
  });
  window.addEventListener('resize',()=>{if(innerWidth>900)closeMenu();});
  window.addEventListener('scroll',()=>{$('site-header').classList.toggle('scrolled',scrollY>10);},{passive:true});
  $('year').textContent=new Date().getFullYear();
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('js-motion');
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});},{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('.reveal').forEach(node=>observer.observe(node));
  }
  renderProducts();renderCart();
})();
