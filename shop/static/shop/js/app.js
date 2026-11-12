// Update the shop details here.
  const SHOP = {
    whatsapp: '91XXXXXXXXXX', // 91 + 10 digit number, without + or spaces
    phone: '+91 XXXXX XXXXX',
    address: '[Your Shop Address]',
    goal: 1000,
    discount: 85
  };

  const SCHOOLS = JSON.parse(document.getElementById('schools-data').textContent);
  const COMMON = JSON.parse(document.getElementById('common-data').textContent);
  const ICONS = { shirt:'👕', dress:'👗', trouser:'👖', tie:'👔', belt:'🪢', shoes:'👟', socks:'🧦', bag:'🎒', tiffin:'🍱', bottle:'🍶' };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function icon(name) {
    const n = String(name || '').toLowerCase();
    for (const key in ICONS) if (n.includes(key)) return ICONS[key];
    return '🏷️';
  }

  function card(p) {
    const sizes = p.sizes ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const sel = sizes.length
      ? '<select class="size-sel" aria-label="Size">' + sizes.map(s => '<option>' + esc(s) + '</option>').join('') + '</select>'
      : '';
    const pic = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : '<div class="product-icon">' + icon(p.name) + '</div>';
    return '<article class="product">' + pic +
      '<h3>' + esc(p.name) + '</h3>' +
      (p.cls ? '<div class="pinfo">' + esc(p.cls) + '</div>' : '') +
      '<div class="price">₹' + esc(p.price) + '</div>' + sel +
      '<button type="button" class="add-cart" data-id="' + esc(p.id) + '">🛒 Add to Cart</button></article>';
  }

  document.getElementById('schoolList').innerHTML = SCHOOLS
    .map(s => '<option value="' + esc(s.name) + '" label="' + esc(s.area) + '"></option>').join('');

  if (COMMON.length) {
    document.getElementById('commonHead').style.display = 'block';
    document.getElementById('commonList').innerHTML = COMMON.map(p => card(p)).join('');
  }

  let current = null, currentClass = 'All';
  function drawProducts() {
    const list = document.getElementById('productList');
    const msg = document.getElementById('schoolMsg');
    const tabs = document.getElementById('classTabs');
    if (!current) {
      list.innerHTML = ''; tabs.innerHTML = '';
      msg.style.display = 'block';
      msg.textContent = 'Select your school above to view its uniform list here.';
      return;
    }
    const all = current.products || [];
    const classes = ['All', ...new Set(all.map(p => p.cls).filter(Boolean))];
    tabs.innerHTML = classes.map(c =>
      '<button type="button" class="tab' + (c === currentClass ? ' on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('');
    tabs.querySelectorAll('.tab').forEach(b => b.onclick = () => { currentClass = b.dataset.c; drawProducts(); });
    const shown = currentClass === 'All' ? all : all.filter(p => p.cls === currentClass);
    if (!all.length) {
      msg.style.display = 'block';
      msg.textContent = 'Uniform list for this school will be added soon. Please contact us on WhatsApp.';
    } else {
      msg.style.display = 'none';
    }
    list.innerHTML = shown.map(p => card(p)).join('');
  }

  document.getElementById('schoolInput').addEventListener('input', e => {
    const value = e.target.value.trim().toLowerCase();
    current = SCHOOLS.find(s => s.name.toLowerCase() === value) || null;
    currentClass = 'All';
    drawProducts();
    if (!current && value) {
      const msg = document.getElementById('schoolMsg');
      msg.style.display = 'block';
      msg.textContent = 'School not found in the list. Please contact us to check availability.';
    }
  });

  const waText = encodeURIComponent('Namaste, mujhe school uniform order karni hai.');
  document.getElementById('wa-hero').href = 'https://wa.me/' + SHOP.whatsapp + '?text=' + waText;
  document.getElementById('f-addr').textContent = SHOP.address;
  document.getElementById('f-phone').textContent = SHOP.phone;

  function csrfToken() {
    const el = document.querySelector('[name=csrfmiddlewaretoken]');
    return el ? el.value : '';
  }
  function showMsg(text, ok) {
    const m = document.getElementById('msg');
    m.className = 'msg ' + (ok ? 'success' : 'error');
    m.style.display = 'block';
    m.textContent = text;
  }
  let otpPhone = '';
  const otpEntry = document.getElementById('otpEntry');
  const otpEmail = document.getElementById('otpEmail');
  const otpChannel = document.getElementById('otpChannel');
  otpChannel.addEventListener('change', () => {
    otpEmail.hidden = document.querySelector('input[name="otpChannel"]:checked').value !== 'email';
  });
  function registerCustomer() {
    const phone = document.getElementById('phone').value.trim();
    const btn = document.getElementById('regBtn');
    const result = document.getElementById('result');
    result.style.display = 'none';
    if (!/^[6-9]\d{9}$/.test(phone)) {
      result.style.display = 'none';
      showMsg('Enter a valid 10-digit mobile number.', false);
      return;
    }
    const channel = document.querySelector('input[name="otpChannel"]:checked').value;
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail.value.trim())) {
      showMsg('Enter a valid email address.', false);
      return;
    }
    otpPhone = phone;
    otpEntry.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Sending OTP...';
    fetch('/register/', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken':csrfToken()},
      body: new URLSearchParams({phone, channel, email: otpEmail.value.trim()})
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showMsg('✅ ' + data.message, true);
        otpEntry.hidden = false;
        document.getElementById('otpCode').focus();
      } else {
        result.style.display = 'none';
        showMsg('❌ ' + (data.message || 'Unable to continue. Please try again.'), false);
      }
    })
    .catch(() => showMsg('❌ Something went wrong. Please try again in a moment.', false))
    .finally(() => { btn.disabled = false; btn.textContent = 'Continue →'; });
  }
  function verifyCustomerOtp() {
    const otp = document.getElementById('otpCode').value.trim();
    const btn = document.getElementById('verifyBtn');
    if (!/^\d{4}$/.test(otp)) { showMsg('Enter your 4-digit OTP.', false); return; }
    btn.disabled = true;
    fetch('/verify-otp/', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken':csrfToken()},
      body:new URLSearchParams({phone:otpPhone, otp})
    }).then(r => r.json()).then(data => {
      if (!data.success) { showMsg('❌ ' + (data.message || 'OTP verification failed.'), false); return; }
      showMsg('✅ ' + data.message, true);
      const points = Number(data.points) || 0;
      document.getElementById('ptsNum').textContent = points.toLocaleString('en-IN');
      document.getElementById('fill').style.width = Math.min(points / SHOP.goal * 100, 100) + '%';
      const remaining = Math.max(SHOP.goal - points, 0);
      document.getElementById('remain').textContent = remaining
        ? '🎯 ' + remaining + ' more points to unlock ₹' + SHOP.discount + ' off.'
        : '🎉 Congratulations! You can redeem ₹' + SHOP.discount + ' off on your next purchase.';
      document.getElementById('result').style.display = 'block';
      document.getElementById('phone').readOnly = true;
      otpChannel.hidden = true; otpEmail.hidden = true; otpEntry.hidden = true;
      document.getElementById('regBtn').hidden = true;
      document.getElementById('changeNumber').hidden = false;
    }).catch(() => showMsg('❌ Something went wrong. Please try again.', false))
      .finally(() => { btn.disabled = false; });
  }
  window.verifyCustomerOtp = verifyCustomerOtp;
  document.getElementById('changeNumber').addEventListener('click', () => {
    document.getElementById('phone').readOnly = false;
    document.getElementById('phone').value = '';
    document.getElementById('regBtn').hidden = false;
    document.getElementById('changeNumber').hidden = true;
    otpChannel.hidden = false; otpEntry.hidden = true;
    document.getElementById('result').style.display = 'none';
    showMsg('', false);
    document.getElementById('phone').focus();
  });
  document.getElementById('phone').addEventListener('keydown', e => {
    if (e.key === 'Enter') registerCustomer();
  });

  // ---------- CART ----------
  const PRODUCTS = {};
  SCHOOLS.forEach(s => (s.products || []).forEach(p => { PRODUCTS[p.id] = Object.assign({}, p, {school: s.name}); }));
  COMMON.forEach(p => { PRODUCTS[p.id] = Object.assign({}, p, {school: 'All schools'}); });

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('sku_cart') || '[]'); } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter(i => i && i.id);   // purane (bina id wale) items hata do

  const rupee = n => '₹' + Number(n).toLocaleString('en-IN');

  function saveCart() {
    try { localStorage.setItem('sku_cart', JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }
  function addToCart(id, size) {
    const p = PRODUCTS[id];
    if (!p) return;
    const key = id + '|' + size;
    const found = cart.find(i => i.key === key);
    if (found) found.qty += 1;
    else cart.push({ key, id, name: p.name, school: p.school, cls: p.cls || '', size, price: Number(p.price), qty: 1 });
    saveCart();
  }
  function renderCart() {
    const box = document.getElementById('cartItems');
    document.getElementById('cartCount').textContent = cart.reduce((a, i) => a + i.qty, 0);
    if (!cart.length) {
      box.innerHTML = '<div class="cart-empty">Cart khali hai.<br>Uniform chun kar Add to Cart dabao.</div>';
      document.getElementById('cartTotal').textContent = rupee(0);
      return;
    }
    box.innerHTML = cart.map(i =>
      '<div class="ci"><div class="info"><b>' + esc(i.name) + '</b>' +
      '<small>' + esc(i.school) + (i.cls ? ' | ' + esc(i.cls) : '') + (i.size ? ' | Size ' + esc(i.size) : '') + '</small>' +
      '<small>' + rupee(i.price) + ' each</small></div>' +
      '<div class="qty"><button type="button" data-act="dec" data-key="' + esc(i.key) + '">−</button><b>' + i.qty +
      '</b><button type="button" data-act="inc" data-key="' + esc(i.key) + '">+</button></div>' +
      '<button type="button" class="del" data-act="del" data-key="' + esc(i.key) + '">✕</button></div>').join('');
    document.getElementById('cartTotal').textContent = rupee(cart.reduce((a, i) => a + i.price * i.qty, 0));
  }
  function toggleCart(open) {
    document.getElementById('cartPanel').classList.toggle('open', open);
    document.getElementById('cartOverlay').style.display = open ? 'block' : 'none';
  }

  async function placeOrder() {
    const msg = document.getElementById('coMsg');
    const btn = document.getElementById('orderBtn');
    const show = t => { msg.style.display = 'block'; msg.textContent = t; };
    if (!cart.length) return show('Cart khali hai.');
    const body = {
      first_name: document.getElementById('coFirst').value.trim(),
      last_name: document.getElementById('coLast').value.trim(),
      phone: document.getElementById('coPhone').value.trim(),
      address: document.getElementById('coAddress').value.trim(),
      payment: document.querySelector('input[name=pay]:checked').value,
      cart: cart.map(i => ({ id: i.id, size: i.size, qty: i.qty }))
    };
    btn.disabled = true; btn.textContent = 'Please wait...';
    try {
      const r = await fetch('/order/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if (d.success) {
        cart = []; saveCart();
        window.location.href = d.bill_url;
        return;
      }
      show(d.message || 'Order nahi ho paya.');
    } catch (e) {
      show('Kuch gadbad hui, dobara try karo.');
    }
    btn.disabled = false; btn.textContent = '✅ Place Order';
  }

  // Add to Cart, quantity (+/-) aur delete ke buttons
  document.addEventListener('click', e => {
    const add = e.target.closest('.add-cart');
    if (add) {
      const sel = add.closest('.product').querySelector('.size-sel');
      addToCart(add.dataset.id, sel ? sel.value : '');
      add.textContent = '✅ Added';
      setTimeout(() => { add.textContent = '🛒 Add to Cart'; }, 1000);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const i = cart.find(x => x.key === act.dataset.key);
      if (!i) return;
      if (act.dataset.act === 'inc') i.qty += 1;
      if (act.dataset.act === 'dec') i.qty -= 1;
      if (act.dataset.act === 'del' || i.qty < 1) cart = cart.filter(x => x.key !== i.key);
      saveCart();
    }
  });

  // Cart kholna aur band karna
  document.getElementById('cartFab').onclick = () => toggleCart(true);
  document.getElementById('cartClose').onclick = () => toggleCart(false);
  document.getElementById('cartOverlay').onclick = () => toggleCart(false);
  document.getElementById('orderBtn').onclick = placeOrder;
  renderCart();

  // Gentle reveal animation as sections enter the screen.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Hero ke card mein items badalte rehna
  (() => {
    const items = [
      { emoji: "👕", name: "Shirts" },
      { emoji: "👖", name: "Trousers" },
      { emoji: "👟", name: "Shoes" },
      { emoji: "🎒", name: "School Bags" },
      { emoji: "🧦", name: "Socks" },
      { emoji: "👔", name: "Ties" },
      { emoji: "🍱", name: "Lunch Box" }
    ];
    const cardEl = document.getElementById('uniformCard');
    const art = document.getElementById('uniformArt');
    const label = document.getElementById('uniformRotator');
    if (!cardEl || !art || !label) return;
    let index = 0;
    window.setInterval(() => {
      cardEl.classList.add('changing');
      window.setTimeout(() => {
        index = (index + 1) % items.length;
        art.textContent = items[index].emoji;
        label.textContent = items[index].name;
        cardEl.classList.remove('changing');
      }, 300);
    }, 1800);
  })();
