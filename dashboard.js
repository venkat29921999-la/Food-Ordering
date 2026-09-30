/* ==========================================================================
   STACKLY — dashboard.js  (admin + user dashboards, everything rendered dynamically)
   ========================================================================== */
(() => {
  const A = window.StacklyAuth;
  const ROLE = document.body.dataset.role;
  const session = A.getSession();
  if (!session || session.role !== ROLE) { location.replace('login.html'); return; }

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PX_OVERRIDE = { 4773767: 'fo7_11zon.webp', 7859827: 'fo7_11zon.webp', 9975765: 'fo12_11zon.webp', 33213590: 'fo13_11zon.webp' };
  const PX = id => `Assest/${PX_OVERRIDE[id] || `dish-${id}.webp`}`;
  const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const ago = m => m < 1 ? 'Just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.floor(m / 60) + 'h ago' : Math.floor(m / 1440) + 'd ago';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = A.toast;

  document.body.classList.add('ready');

  /* ---------- sample data ---------- */
  const DISHES = [
    { n: 'Truffle Tagliatelle', p: 18, img: 1437267, tag: 'Pasta' }, { n: 'Neapolitan Margherita', p: 14, img: 4773767, tag: 'Pizza' },
    { n: 'Wagyu Steak Bowl', p: 24, img: 769289, tag: 'Grill' }, { n: 'Korean Fried Chicken', p: 17, img: 9975765, tag: 'Crispy' },
    { n: 'Basque Cheesecake', p: 8, img: 4078187, tag: 'Dessert' }, { n: 'Rainbow Quinoa Bowl', p: 12, img: 3872373, tag: 'Fresh' },
    { n: 'Smash Burger & Fries', p: 15, img: 33213590, tag: 'Burger' }, { n: 'Latte Art Coffee', p: 6, img: 7859827, tag: 'Coffee' }
  ];
  const NAMES = ['Amara Osei', 'Diego Marín', 'Priya Nair', 'Liam Carter', 'Sofia Rossi', 'Noah Kim', 'Zara Ahmed', 'Ethan Brooks', 'Mia Chen', 'Lucas Dubois'];
  const STATUS = [['delivered', 'Delivered', 'st-delivered'], ['preparing', 'Preparing', 'st-preparing'], ['way', 'On the way', 'st-way'], ['cancelled', 'Cancelled', 'st-cancelled']];
  const statusInfo = k => STATUS.find(s => s[0] === k);
  let orderSeq = 4820;
  const mkOrder = (who, dish, status, minsAgo) => ({ id: '#' + (orderSeq++), who, dish: dish.n, img: dish.img, total: dish.p + Math.round((dish.p * .12) * 100) / 100, status, mins: minsAgo });

  let orders = ROLE === 'admin'
    ? Array.from({ length: 12 }, (_, i) => mkOrder(NAMES[i % NAMES.length], DISHES[i % DISHES.length], ['delivered', 'delivered', 'way', 'preparing', 'delivered', 'cancelled'][i % 6], 6 + i * 23)).reverse()
    : [mkOrder(session.name, DISHES[0], 'delivered', 2880), mkOrder(session.name, DISHES[3], 'delivered', 5760), mkOrder(session.name, DISHES[4], 'delivered', 8600), mkOrder(session.name, DISHES[6], 'cancelled', 12000)].reverse();
  orders.sort((a, b) => a.mins - b.mins);

  /* ---------- inbox data (persisted per account) ---------- */
  const MAILKEY = 'stackly_mail_' + session.email;
  const seedMail = ROLE === 'admin' ? [
    ['Casa Marín', 'hello@casamarin.com', 'Partnership renewal for Q4', 'Hi team,\n\nWe would love to renew our partnership for the next quarter and add two new menu items to the platform. Could we schedule a quick call this week?\n\nThanks,\nDiego', 14, 1],
    ['Payments Bot', 'billing@stackly.com', 'Weekly payout report is ready', 'Your weekly payout summary is ready.\n\nTotal payouts: $48,210.40\nPending: $2,300.00\nDisputes: 3\n\nOpen the finance tab for the full breakdown.', 95, 1],
    ['Priya Nair', 'priya.n@gmail.com', 'Refund request for order #4815', 'Hello,\n\nMy order arrived cold and I would like a refund for order #4815. Photos attached in my account.\n\nRegards,\nPriya', 210, 1],
    ['Ops Monitor', 'alerts@stackly.com', 'Rider capacity low in Portside', 'Heads up: rider capacity in the Portside district dropped below 70% for the dinner window. Consider enabling the boost bonus.', 480, 0],
    ['Green Fork Kitchen', 'apply@greenfork.io', 'New kitchen application', 'We are a plant-based kitchen with 4 years of experience and a 4.8 rating on other platforms. Please review our application.', 1300, 0],
    ['Growth Team', 'growth@stackly.com', 'October campaign results', 'The autumn pumpkin campaign drove 18% more repeat orders. Full deck is in the shared drive.', 3000, 0]
  ] : [
    ['Stackly Orders', 'orders@stackly.com', 'Your order is on the way', 'Good news! Your Truffle Tagliatelle has left the kitchen and your rider is heading to you now.\n\nTrack it live from the Overview tab.', 8, 1],
    ['Stackly Rewards', 'rewards@stackly.com', 'You earned 120 points', 'Thanks for ordering! 120 loyalty points were added to your account. You are 80 points away from a free dessert.', 120, 1],
    ['Casa Marín', 'hello@casamarin.com', 'A little thank-you from our kitchen', 'Thank you for ordering from us. Use code THANKS10 for 10% off your next order.', 760, 0],
    ['Stackly Receipts', 'receipts@stackly.com', 'Receipt for order #4818', 'Your receipt is below.\n\nSubtotal: $17.00\nDelivery: $0.00\nTotal: $17.00\n\nEnjoy your meal!', 2880, 0],
    ['Stackly Team', 'hello@stackly.com', 'Welcome to Stackly', 'We are delighted to have you. Browse hundreds of kitchens, save favourites and reorder in one tap.', 9000, 0]
  ];
  const INCOMING = ROLE === 'admin' ? [
    ['Noah Kim', 'noah.k@mail.com', 'Wrong item delivered', 'Hi, my burger order arrived without fries. Can you help?', 0],
    ['Sunrise Bakery', 'hi@sunrisebakery.com', 'Can we add a breakfast menu?', 'We would like to list a breakfast menu from 7am. What are the steps?', 0],
    ['Ops Monitor', 'alerts@stackly.com', 'Delivery times back to normal', 'Portside average delivery time is back to 17 minutes.', 0]
  ] : [
    ['Stackly Promos', 'promos@stackly.com', 'Free dessert this weekend', 'Order any main this weekend and get a free Basque cheesecake. Auto-applied at checkout.', 0],
    ['Stackly Orders', 'orders@stackly.com', 'How was your last order?', 'Tell us how your Wagyu Steak Bowl was and earn 20 points.', 0],
    ['Stackly Rewards', 'rewards@stackly.com', 'Your points are about to double', 'Double points weekend starts now. Happy ordering!', 0]
  ];
  let mails = null;
  try { mails = JSON.parse(localStorage.getItem(MAILKEY)); } catch (e) {}
  let mid = 1;
  if (!Array.isArray(mails)) {
    mails = seedMail.map(m => ({ id: 'm' + (mid++), from: m[0], email: m[1], subject: m[2], body: m[3], mins: m[4], unread: !!m[5], starred: false, folder: 'inbox' }));
  } else mid = mails.length + 100;
  const saveMail = () => localStorage.setItem(MAILKEY, JSON.stringify(mails));
  let incomingIdx = 0;

  /* ---------- shell: sidebar, nav, user card ---------- */
  const sidebar = $('#sidebar'), overlay = $('#dashOverlay'), ham = $('#hamburger');
  const setSide = open => { sidebar.classList.toggle('open', open); overlay.classList.toggle('show', open); ham.classList.toggle('active', open); document.body.style.overflow = open ? 'hidden' : ''; };
  ham.addEventListener('click', () => setSide(!sidebar.classList.contains('open')));
  overlay.addEventListener('click', () => setSide(false));
  addEventListener('resize', () => { if (innerWidth > 1024) setSide(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { setSide(false); closeModal(); } });

  $('#suName').textContent = session.name; $('#suAvatar').textContent = initials(session.name); $('#topAvatar').textContent = initials(session.name);
  $$('.logout').forEach(b => b.addEventListener('click', () => { A.clearSession(); location.href = 'login.html'; }));

  const titles = {
    overview: [ROLE === 'admin' ? 'Admin overview' : 'My dashboard', ROLE === 'admin' ? 'Live view of orders, revenue and partners' : 'Track orders and discover new favourites'],
    orders: [ROLE === 'admin' ? 'All orders' : 'My orders', 'Search, filter and follow every order'],
    inbox: ['Inbox', 'Messages arrive here in real time'],
    people: [ROLE === 'admin' ? 'Users' : 'Favourites', ROLE === 'admin' ? 'Everyone registered on Stackly' : 'Dishes you love, one tap away'],
    settings: ['Settings', 'Manage your profile and notifications']
  };
  function showView(name) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    $$('.side-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
    $('#pageTitle').textContent = titles[name][0]; $('#pageSub').textContent = titles[name][1];
    setSide(false); scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'overview') animateOverview();
  }
  $$('.side-link').forEach(l => l.addEventListener('click', () => showView(l.dataset.view)));
  $('#bellBtn').addEventListener('click', () => showView('inbox'));
  $('#topAvatarBtn').addEventListener('click', () => showView('settings'));

  /* ---------- counters ---------- */
  function countTo(el, to, fmt = v => Math.round(v).toLocaleString(), dur = 1400) {
    const from = parseFloat(el.dataset.cur || 0), t0 = performance.now();
    el.dataset.cur = to;
    if (reduce) { el.textContent = fmt(to); return; }
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  const spark = pts => { const w = 100, h = 40, mx = Math.max(...pts), mn = Math.min(...pts); return `<svg class="sc-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${pts.map((v, i) => (i ? 'L' : 'M') + (i / (pts.length - 1) * w).toFixed(1) + ' ' + (h - 4 - (v - mn) / ((mx - mn) || 1) * (h - 10)).toFixed(1)).join(' ')}"/></svg>`; };

  /* ==================== OVERVIEW ==================== */
  let stats;
  function renderOverview() {
    const v = $('#view-overview');
    if (ROLE === 'admin') {
      const users = (A.getUsers() || []).length;
      stats = { revenue: 128450, orders: 3892, users: 1200 + users, kitchens: 1248 };
      v.innerHTML = `
        <div class="dgrid g4 stagger">
          ${[['fa-dollar-sign', 'revenue', 'Revenue', '+12.4%', [3, 5, 4, 7, 6, 9, 8, 11], 1], ['fa-bag-shopping', 'orders', 'Orders', '+8.1%', [5, 4, 6, 5, 8, 7, 9, 10], 0], ['fa-users', 'users', 'Registered users', '+5.6%', [2, 3, 3, 5, 4, 6, 7, 7], 0], ['fa-store', 'kitchens', 'Partner kitchens', '+2.3%', [4, 4, 5, 5, 6, 6, 7, 8], 1]].map((c, i) => `
          <div class="dcard stat-card ${c[5] ? 'dcard--dark' : ''}" style="--i:${i}">
            <div class="sc-icon"><i class="fa-solid ${c[0]}"></i></div><span class="sc-trend"><i class="fa-solid fa-arrow-trend-up"></i>${c[3]}</span>
            <div class="sc-num" data-stat="${c[1]}">0</div><div class="sc-label">${c[2]}</div>${spark(c[4])}
          </div>`).join('')}
        </div>
        <div class="dgrid g2-1" style="margin-top:20px">
          <div class="dcard">
            <div class="dcard-head"><h3>Orders overview</h3><div class="seg" id="rangeSeg"><button class="active" data-r="7">7 days</button><button data-r="30">30 days</button></div></div>
            <div class="chart" id="chart"></div>
          </div>
          <div class="dcard dcard--dark">
            <div class="dcard-head"><h3><span class="live-dot"></span>Live orders</h3></div>
            <div class="feed" id="feed"></div>
          </div>
        </div>
        <div class="dcard" style="margin-top:20px"><div class="dcard-head"><h3>Top dishes this week</h3></div><div id="topDishes"></div></div>`;
      drawChart(7); drawFeed(); drawTop();
      $$('#rangeSeg button').forEach(b => b.addEventListener('click', () => { $$('#rangeSeg button').forEach(x => x.classList.toggle('active', x === b)); drawChart(+b.dataset.r); }));
    } else {
      const spent = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
      stats = { orders: orders.length, points: 1240, saved: Math.round(spent * .08) };
      const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
      v.innerHTML = `
        <div class="dcard dcard--dark stagger" style="--i:0">
          <div class="hello"><div><h2>${greet}, <em>${esc(session.name.split(' ')[0])}</em></h2><p style="color:var(--cream-dim);margin-top:8px">Your Truffle Tagliatelle is being prepared.</p></div><span class="eta"><i class="fa-solid fa-clock"></i><span id="eta">Arriving in 18 min</span></span></div>
          <div class="tracker" id="tracker">
            <div class="tracker-fill" id="trackFill"></div>
            ${[['fa-receipt', 'Confirmed'], ['fa-fire-burner', 'Preparing'], ['fa-motorcycle', 'On the way'], ['fa-house-chimney', 'Delivered']].map((s, i) => `<div class="tk-step" data-i="${i}"><div class="tk-dot"><i class="fa-solid ${s[0]}"></i></div><div><strong>${s[1]}</strong><small>${['2 min ago', 'In progress', 'Soon', 'Soon'][i]}</small></div></div>`).join('')}
          </div>
        </div>
        <div class="dgrid g3 stagger" style="margin-top:20px">
          ${[['fa-bag-shopping', 'orders', 'Orders placed', 0], ['fa-star', 'points', 'Reward points', 1], ['fa-piggy-bank', 'saved', 'Saved with offers ($)', 0]].map((c, i) => `
          <div class="dcard stat-card ${c[3] ? 'dcard--dark' : ''}" style="--i:${i + 1}"><div class="sc-icon"><i class="fa-solid ${c[0]}"></i></div><div class="sc-num" data-stat="${c[1]}">0</div><div class="sc-label">${c[2]}</div>${spark([3, 4, 3, 6, 5, 8, 7, 9])}</div>`).join('')}
        </div>
        <div class="dcard-head" style="margin:28px 0 14px"><h3 style="font-family:var(--font-display);font-size:24px">Picked for you</h3></div>
        <div class="dgrid g4 stagger" id="recs"></div>`;
      $('#recs').innerHTML = [DISHES[1], DISHES[2], DISHES[5], DISHES[7]].map((d, i) => recCard(d, i)).join('');
      bindRecs(); startTracker();
    }
  }
  function animateOverview() {
    $$('[data-stat]').forEach(el => { el.dataset.cur = 0; const k = el.dataset.stat; countTo(el, stats[k], k === 'revenue' || k === 'saved' ? v => '$' + Math.round(v).toLocaleString() : undefined); });
    requestAnimationFrame(() => $$('.bar').forEach(b => { b.style.height = b.dataset.h + '%'; }));
    $$('.dish-meter i').forEach(i => { i.style.width = i.dataset.w + '%'; });
  }
  function drawChart(range) {
    const days = range === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : Array.from({ length: 10 }, (_, i) => 'D' + (i * 3 + 1));
    const vals = days.map((_, i) => 40 + Math.round((Math.sin(i * 1.3 + range) + 1) * 26 + (i % 3) * 8));
    const mx = Math.max(...vals);
    $('#chart').innerHTML = days.map((d, i) => `<div class="bar-col"><div class="bar" style="--i:${i}" data-h="${Math.round(vals[i] / mx * 100)}" data-v="${vals[i] * (range === 7 ? 9 : 27)} orders"></div><span>${d}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.bar').forEach(b => { b.style.height = b.dataset.h + '%'; })));
  }
  const feedItem = o => `<div class="feed-item"><img src="${PX(o.img, 120)}" alt="" loading="lazy"><div class="fi-text"><strong>${esc(o.who)}</strong><small>${esc(o.dish)} · ${ago(o.mins)}</small></div><span class="fi-amt">${money(o.total)}</span></div>`;
  function drawFeed() { $('#feed').innerHTML = orders.slice(0, 5).map(feedItem).join(''); }
  function drawTop() {
    $('#topDishes').innerHTML = DISHES.slice(0, 5).map((d, i) => `<div class="dish-row"><img src="${PX(d.img, 120)}" alt="" loading="lazy"><div class="dr-t"><strong>${d.n}</strong><small>${d.tag} · ${money(d.p)}</small><div class="dish-meter"><i data-w="${96 - i * 15}"></i></div></div><strong>${420 - i * 58}</strong></div>`).join('');
  }
  const recCard = (d, i) => `<div class="dcard rec-card" style="--i:${i}"><img src="${PX(d.img, 500)}" alt="${esc(d.n)}" loading="lazy"><div class="rc-body"><h4>${esc(d.n)}</h4><p>${d.tag}</p><div class="rc-foot"><strong>${money(d.p)}</strong>
<button class="mini-btn" data-order="${DISHES.indexOf(d)}" onclick="location.href='404.html'">
  <i class="fa-solid fa-plus"></i> Order
</button>  </div></div></div>`;
  function bindRecs(root = document) {
    $$('[data-order]', root).forEach(b => b.onclick = () => {
      const o = mkOrder(session.name, DISHES[+b.dataset.order], 'preparing', 0);
      orders.unshift(o); drawOrders(); toast(`${o.dish} added to your orders`, 'fa-bag-shopping');
      const st = $('[data-stat="orders"]'); if (st) countTo(st, ++stats.orders, undefined, 600);
    });
  }
  function startTracker() {
    let step = 1; const steps = $$('.tk-step'), fill = $('#trackFill'), eta = $('#eta');
    const apply = () => {
      steps.forEach((s, i) => { s.classList.toggle('done', i <= step); s.classList.toggle('now', i === step && step < 3); });
      fill.style.width = (step / 3 * 75) + '%';
      const mins = [22, 16, 7, 0][step]; eta.textContent = step === 3 ? 'Delivered. Enjoy!' : `Arriving in ${mins} min`;
    };
    setTimeout(apply, 400);
    const t = setInterval(() => { if (step < 3) { step++; apply(); if (step === 2) toast('Your rider is on the way', 'fa-motorcycle'); if (step === 3) toast('Order delivered. Enjoy!', 'fa-house-chimney'); } else clearInterval(t); }, 7000);
  }

  /* ==================== ORDERS ==================== */
  let ofilter = 'all', oquery = '';
  function renderOrdersShell() {
    $('#view-orders').innerHTML = `
      <div class="dcard">
        <div class="tools"><div class="search"><i class="fa-solid fa-magnifying-glass"></i><input id="oSearch" type="search" placeholder="Search by order, customer or dish" aria-label="Search orders"></div>
        <div class="filters" id="oFilters">${[['all', 'All']].concat(STATUS.map(s => [s[0], s[1]])).map(f => `<button class="fchip ${f[0] === 'all' ? 'active' : ''}" data-f="${f[0]}">${f[1]}</button>`).join('')}</div></div>
        <div class="table" id="oTable"></div>
      </div>`;
    $('#oSearch').addEventListener('input', e => { oquery = e.target.value.toLowerCase(); drawOrders(); });
    $$('#oFilters .fchip').forEach(c => c.addEventListener('click', () => { ofilter = c.dataset.f; $$('#oFilters .fchip').forEach(x => x.classList.toggle('active', x === c)); drawOrders(); }));
    drawOrders();
  }
function drawOrders() {
  const t = $('#oTable'); if (!t) return;
  const rows = orders.filter(o => (ofilter === 'all' || o.status === ofilter) && (!oquery || (o.id + o.who + o.dish).toLowerCase().includes(oquery)));

  t.innerHTML = `<div class="trow head cols-orders"><span>Order</span><span>Customer</span><span>Dish</span><span>Total</span><span>Status</span><span>Placed</span></div>` +
    (rows.length ? rows.map((o, i) => {
      const s = statusInfo(o.status);
      return `<div class="trow cols-orders" style="--i:${i}; cursor:pointer" onclick="location.href='404.html'">
        <strong data-l="Order">${o.id}</strong>
        <span data-l="Customer">${esc(o.who)}</span>
        <span data-l="Dish">${esc(o.dish)}</span>
        <strong data-l="Total">${money(o.total)}</strong>
        <span data-l="Status"><span class="pill ${s[2]}">${s[1]}</span></span>
        <span data-l="Placed">${ago(o.mins)}</span>
      </div>`;
    }).join('')
    : `<div class="empty"><i class="fa-solid fa-bowl-food"></i>No orders match your search.</div>`);
}

  /* ==================== INBOX ==================== */
  let folder = 'inbox', mquery = '', openId = null;
  function renderInboxShell() {
    $('#view-inbox').innerHTML = `
      <div class="mail" id="mail">
        <div class="mail-side">
          <div class="mail-tools">
            <button class="compose-btn" id="composeBtn"><i class="fa-solid fa-pen"></i> Compose</button>
            <div class="mail-tabs" id="mTabs"><button class="fchip active" data-f="inbox">Inbox</button><button class="fchip" data-f="starred">Starred</button><button class="fchip" data-f="sent">Sent</button></div>
            <div class="search"><i class="fa-solid fa-magnifying-glass"></i><input id="mSearch" type="search" placeholder="Search mail" aria-label="Search mail"></div>
          </div>
          <div class="mail-list" id="mList"></div>
        </div>
        <div class="mail-read" id="mRead"></div>
      </div>`;
    $('#composeBtn').onclick = openCompose;
    $('#mSearch').addEventListener('input', e => { mquery = e.target.value.toLowerCase(); drawMail(); });
    $$('#mTabs .fchip').forEach(c => c.addEventListener('click', () => { folder = c.dataset.f; $$('#mTabs .fchip').forEach(x => x.classList.toggle('active', x === c)); drawMail(); }));
    drawMail(); drawReader();
  }
  const visible = () => mails.filter(m => (folder === 'starred' ? m.starred && m.folder === 'inbox' : m.folder === folder) && (!mquery || (m.from + m.subject + m.body).toLowerCase().includes(mquery)));
  function drawMail(newId) {
    const list = $('#mList'); if (!list) return;
    const v = visible();
    list.innerHTML = v.length ? v.map((m, i) => `
      <div class="mitem ${m.unread ? 'unread' : ''} ${m.id === openId ? 'active' : ''} ${m.id === newId ? 'new-in' : ''}" data-id="${m.id}" style="--i:${i}" tabindex="0" role="button">
        <div class="avatar">${initials(m.from)}</div>
        <div class="mi-body"><span class="from">${esc(m.folder === 'sent' ? 'To: ' + m.from : m.from)}</span><span class="subj">${esc(m.subject)}</span><span class="snip">${esc(m.body.replace(/\s+/g, ' '))}</span></div>
        <div class="mi-meta"><span>${ago(m.mins)}</span><i class="fa-solid fa-star ${m.starred ? 'on' : ''}" data-star="${m.id}" title="Star"></i></div>
      </div>`).join('') : `<div class="empty"><i class="fa-regular fa-envelope-open"></i>Nothing here yet.</div>`;
    $$('.mitem', list).forEach(el => {
      const open = () => openMail(el.dataset.id);
      el.addEventListener('click', e => { if (e.target.dataset.star) { toggleStar(e.target.dataset.star); } else open(); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
    updateBadges();
  }
  function drawReader() {
    const r = $('#mRead'); if (!r) return;
    const m = mails.find(x => x.id === openId);
    if (!m) { r.innerHTML = `<div class="mr-empty"><i class="fa-regular fa-envelope-open"></i><h3 style="font-family:var(--font-display);font-size:24px">Select a message</h3><p>Pick something from the list to read it here.</p></div>`; return; }
    r.innerHTML = `
      <button class="mr-back" id="mrBack"><i class="fa-solid fa-arrow-left"></i> Back to inbox</button>
      <div class="mr-head"><h2>${esc(m.subject)}</h2>
        <div class="mr-from"><div class="avatar">${initials(m.from)}</div><div><strong>${esc(m.from)}</strong><small>${esc(m.email)} · ${ago(m.mins)}</small></div></div>
        <div class="mr-actions"><button class="icon-pill" id="rStar" title="Star" aria-label="Star"><i class="fa-${m.starred ? 'solid' : 'regular'} fa-star" style="${m.starred ? 'color:var(--gold)' : ''}"></i></button><button class="icon-pill" id="rDel" title="Delete" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div></div>
      <div class="mr-body">${esc(m.body)}</div>
      ${m.folder === 'inbox' ? `<div class="mr-reply"><textarea id="rText" placeholder="Write a reply…" aria-label="Reply"></textarea>
<button class="mini-btn" id="rSend" onclick="location.href='404.html'">
  <i class="fa-solid fa-paper-plane"></i> Send reply
</button>        </div>` : ''}`;
    $('#mrBack').onclick = () => { $('#mail').classList.remove('reading'); openId = null; drawMail(); };
    $('#rStar').onclick = () => toggleStar(m.id);
    $('#rDel').onclick = () => removeMail(m.id);
    const send = $('#rSend'); if (send) send.onclick = () => {
      const t = $('#rText').value.trim(); if (!t) { $('#rText').focus(); toast('Write a reply first', 'fa-pen'); return; }
      mails.unshift({ id: 'm' + (mid++), from: m.from, email: m.email, subject: 'Re: ' + m.subject.replace(/^Re: /, ''), body: t, mins: 0, unread: false, starred: false, folder: 'sent' });
      saveMail(); $('#rText').value = ''; toast('Reply sent to ' + m.from, 'fa-paper-plane');
    };
  }
  function openMail(id) {
    const m = mails.find(x => x.id === id); if (!m) return;
    openId = id; if (m.unread) { m.unread = false; saveMail(); }
    $('#mail').classList.add('reading'); drawMail(); drawReader();
  }
  function toggleStar(id) { const m = mails.find(x => x.id === id); m.starred = !m.starred; saveMail(); drawMail(); drawReader(); }
  function removeMail(id) {
    const el = $(`.mitem[data-id="${id}"]`);
    const done = () => { mails = mails.filter(x => x.id !== id); if (openId === id) { openId = null; $('#mail').classList.remove('reading'); } saveMail(); drawMail(); drawReader(); toast('Message deleted', 'fa-trash'); };
    if (el && !reduce) { el.classList.add('removing'); setTimeout(done, 380); } else done();
  }
  const unreadCount = () => mails.filter(m => m.unread && m.folder === 'inbox').length;
  function updateBadges(pulse) {
    const n = unreadCount();
    [$('#inboxBadge'), $('#bellDot')].forEach(b => { if (!b) return; b.textContent = n; b.hidden = !n; if (pulse) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } });
  }
  function receiveMail() {
    if (incomingIdx >= INCOMING.length) return;
    const m = INCOMING[incomingIdx++];
    mails.unshift({ id: 'm' + (mid++), from: m[0], email: m[1], subject: m[2], body: m[3], mins: 0, unread: true, starred: false, folder: 'inbox' });
    saveMail(); updateBadges(true); drawMail(mails[0].id);
    const bell = $('#bellBtn i'); bell.classList.remove('bell-ring'); void bell.offsetWidth; bell.classList.add('bell-ring');
    toast(`New message from ${m[0]}`, 'fa-envelope');
  }
  // compose
  function openCompose() { $('#composeModal').classList.add('show'); setTimeout(() => $('#cTo').focus(), 200); }
  function closeModal() { const m = $('#composeModal'); m && m.classList.remove('show'); }
  $('#composeClose').onclick = closeModal; $('#composeModal').addEventListener('click', e => { if (e.target.id === 'composeModal') closeModal(); });
  $('#composeForm').addEventListener('submit', e => {
    e.preventDefault();
    const to = $('#cTo').value.trim(), sub = $('#cSub').value.trim(), body = $('#cBody').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) { $('#cTo').focus(); toast('Enter a valid recipient email', 'fa-circle-exclamation'); return; }
    if (!sub || !body) { toast('Add a subject and a message', 'fa-circle-exclamation'); return; }
    mails.unshift({ id: 'm' + (mid++), from: to.split('@')[0], email: to, subject: sub, body, mins: 0, unread: false, starred: false, folder: 'sent' });
    saveMail(); e.target.reset(); closeModal(); folder = 'sent';
    $$('#mTabs .fchip').forEach(x => x.classList.toggle('active', x.dataset.f === 'sent')); drawMail(mails[0].id); toast('Message sent', 'fa-paper-plane');
  });

  /* ==================== PEOPLE (admin: users / user: favourites) ==================== */
  function renderPeople() {
    const v = $('#view-people');
    if (ROLE === 'admin') {
      v.innerHTML = `<div class="dcard"><div class="tools"><div class="search"><i class="fa-solid fa-magnifying-glass"></i><input id="uSearch" type="search" placeholder="Search users" aria-label="Search users"></div>
        <div class="filters" id="uFilters"><button class="fchip active" data-f="all">All</button><button class="fchip" data-f="admin">Admins</button><button class="fchip" data-f="user">Users</button></div></div><div class="table" id="uTable"></div></div>`;
      let uf = 'all', uq = '';
      const draw = () => {
        const users = (A.getUsers() || []).filter(u => (uf === 'all' || u.role === uf) && (!uq || (u.name + u.email).toLowerCase().includes(uq)));
        $('#uTable').innerHTML = `<div class="trow head cols-users"><span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span>Action</span></div>` + (users.length ? users.map((u, i) => `
          <div class="trow cols-users" style="--i:${i}"><span data-l="Name" style="display:flex;align-items:center;gap:10px"><span class="avatar" style="width:34px;height:34px;font-size:12px">${initials(u.name)}</span><strong>${esc(u.name)}</strong></span><span data-l="Email">${esc(u.email)}</span><span data-l="Role"><span class="pill ${u.role === 'admin' ? 'role-admin' : ''}">${u.role}</span></span><span data-l="Joined">${new Date(u.created).toLocaleDateString()}</span>
          <span data-l="Action">${u.email === session.email ? '<span class="pill">You</span>' : `<button class="del-btn" data-del="${esc(u.email)}">Remove</button>`}</span></div>`).join('') : `<div class="empty"><i class="fa-solid fa-user-slash"></i>No users found.</div>`);
        $$('[data-del]').forEach(b => b.onclick = () => {
          if (!b.classList.contains('confirm')) { b.classList.add('confirm'); b.textContent = 'Tap to confirm'; setTimeout(() => { b.classList.remove('confirm'); b.textContent = 'Remove'; }, 3000); return; }
          A.saveUsers(A.getUsers().filter(u => u.email !== b.dataset.del)); draw(); toast('User removed', 'fa-user-minus');
        });
      };
      $('#uSearch').addEventListener('input', e => { uq = e.target.value.toLowerCase(); draw(); });
      $$('#uFilters .fchip').forEach(c => c.addEventListener('click', () => { uf = c.dataset.f; $$('#uFilters .fchip').forEach(x => x.classList.toggle('active', x === c)); draw(); }));
      draw();
    } else {
      const FAV = 'stackly_fav_' + session.email; let favs; try { favs = JSON.parse(localStorage.getItem(FAV)); } catch (e) {} if (!Array.isArray(favs)) favs = [0, 1, 4];
      v.innerHTML = `<div class="dgrid g4 stagger" id="favGrid"></div>`;
      const draw = () => {
        $('#favGrid').innerHTML = DISHES.map((d, i) => `<div class="dcard rec-card" style="--i:${i}"><img src="${PX(d.img, 500)}" alt="${esc(d.n)}" loading="lazy"><div class="rc-body"><h4>${esc(d.n)}</h4><p>${d.tag}</p><div class="rc-foot"><button class="heart ${favs.includes(i) ? 'on' : ''}" data-fav="${i}" aria-label="Favourite"><i class="fa-solid fa-heart"></i></button><button class="mini-btn" data-order="${i}"><i class="fa-solid fa-rotate-right"></i> Reorder</button></div></div></div>`).join('');
        $$('[data-fav]').forEach(b => b.onclick = () => { const i = +b.dataset.fav; favs = favs.includes(i) ? favs.filter(x => x !== i) : favs.concat(i); localStorage.setItem(FAV, JSON.stringify(favs)); b.classList.toggle('on'); toast(favs.includes(i) ? 'Saved to favourites' : 'Removed from favourites', 'fa-heart'); });
        bindRecs($('#favGrid'));
      };
      draw();
    }
  }

  /* ==================== SETTINGS ==================== */
  function renderSettings() {
    const PK = 'stackly_prefs_' + session.email; let p; try { p = JSON.parse(localStorage.getItem(PK)); } catch (e) {} p = p || { mail: true, orders: true, promo: false };
    $('#view-settings').innerHTML = `<div class="dgrid g2-1">
      <div class="dcard"><h3 style="margin-bottom:18px">Profile</h3><form id="profileForm"><div class="form-grid">
        <div class="field plain"><input id="pName" value="${esc(session.name)}" placeholder=" " required><label for="pName">Full name</label></div>
        <div class="field plain"><input id="pEmail" value="${esc(session.email)}" placeholder=" " readonly><label for="pEmail">Email</label></div>
        <div class="field plain"><input id="pRole" value="${ROLE === 'admin' ? 'Admin' : 'User'}" placeholder=" " readonly><label for="pRole">Role</label></div></div>
        <button class="btn btn-primary" type="submit"><span class="btn-label">Save changes</span></button></form></div>
      <div class="dcard"><h3 style="margin-bottom:6px">Notifications</h3>
        ${[['mail', 'Email alerts', 'Get notified about new messages'], ['orders', 'Order updates', 'Live status of every order'], ['promo', 'Offers & news', 'Occasional deals from Stackly']].map(r => `<div class="set-row"><div><strong>${r[1]}</strong><small>${r[2]}</small></div><label class="switch"><input type="checkbox" data-pref="${r[0]}" ${p[r[0]] ? 'checked' : ''} aria-label="${r[1]}"></label></div>`).join('')}</div></div>`;
    $$('[data-pref]').forEach(i => i.addEventListener('change', () => { p[i.dataset.pref] = i.checked; localStorage.setItem(PK, JSON.stringify(p)); toast(i.checked ? 'Turned on' : 'Turned off', 'fa-bell'); }));
    $('#profileForm').addEventListener('submit', e => {
      e.preventDefault(); const n = $('#pName').value.trim(); if (n.length < 2) { toast('Enter your name', 'fa-circle-exclamation'); return; }
      session.name = n; const st = A.getUsers().map(u => u.email === session.email ? { ...u, name: n } : u); A.saveUsers(st);
      const remember = !!localStorage.getItem('stackly_session'); A.setSession(session, remember);
      $('#suName').textContent = n; $('#suAvatar').textContent = initials(n); $('#topAvatar').textContent = initials(n); toast('Profile updated', 'fa-user-check');
    });
  }

  /* ---------- live simulation ---------- */
  if (ROLE === 'admin') {
    setInterval(() => {
      const o = mkOrder(NAMES[Math.floor(Math.random() * NAMES.length)], DISHES[Math.floor(Math.random() * DISHES.length)], 'preparing', 0);
      orders.unshift(o); orders = orders.slice(0, 40);
      const feed = $('#feed'); if (feed) { feed.insertAdjacentHTML('afterbegin', feedItem(o)); while (feed.children.length > 5) feed.lastElementChild.remove(); }
      stats.orders++; stats.revenue += Math.round(o.total); const a = $('[data-stat="orders"]'), b = $('[data-stat="revenue"]');
      a && countTo(a, stats.orders, undefined, 700); b && countTo(b, stats.revenue, v => '$' + Math.round(v).toLocaleString(), 700); drawOrders();
    }, 6500);
  }
  setTimeout(receiveMail, 9000); setInterval(receiveMail, 32000);
  setInterval(() => { $$('.mi-meta span:first-child').length; }, 60000);

  /* ---------- boot ---------- */
  renderOverview(); renderOrdersShell(); renderInboxShell(); renderPeople(); renderSettings(); updateBadges();
  showView('overview');
})();