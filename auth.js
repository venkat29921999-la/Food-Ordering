/* ==========================================================================
   STACKLY — auth.js
   Front-end demo auth: localStorage users, hashed passwords, role-based redirect.
   (A real product must do this on a server — see notes in the reply.)
   ========================================================================== */
(() => {
  const USERS = 'stackly_users', SESSION = 'stackly_session';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DASH = { admin: 'admin-dashboard.html', user: 'user-dashboard.html' };

  async function hash(pw) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('stackly::' + pw));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'plain:' + pw; }
  }
  const read = (store, key) => { try { return JSON.parse(store.getItem(key)); } catch (e) { return null; } };
  const getUsers = () => read(localStorage, USERS);
  const saveUsers = u => localStorage.setItem(USERS, JSON.stringify(u));
  async function seed() {
    let u = getUsers();
    if (!Array.isArray(u) || !u.length) {
      u = [
        { name: 'Ava Admin', email: 'admin@stackly.com', role: 'admin', hash: await hash('Admin@123'), created: Date.now() - 86400000 * 40 },
        { name: 'Uma User',  email: 'user@stackly.com',  role: 'user',  hash: await hash('User@123'),  created: Date.now() - 86400000 * 12 }
      ];
      saveUsers(u);
    }
    return u;
  }
  const getSession = () => read(localStorage, SESSION) || read(sessionStorage, SESSION);
  const setSession = (s, remember) => {
    localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
    (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s));
  };
  const clearSession = () => { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); };

  /* ---------- toast (used instead of alert) ---------- */
  function toast(msg, icon = 'fa-circle-check') {
    let wrap = $('#toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.className = 'toasts'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`; $('span', t).textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3600);
  }

  window.StacklyAuth = { hash, getUsers, saveUsers, seed, getSession, setSession, clearSession, toast, DASH };

  const page = document.body.dataset.page;
  if (page !== 'login' && page !== 'signup') return;

  /* ==================== shared auth-page behaviour ==================== */
  const form = $('#authForm'), msg = $('#formMsg'), card = $('.auth-card'), submit = $('#submitBtn');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  seed();

  // hamburger drawer
  const ham = $('#hamburger'), drawer = $('#mobileDrawer');
  ham && ham.addEventListener('click', () => {
    ham.classList.toggle('active'); drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
  });
  $$('.mobile-link').forEach(a => a.addEventListener('click', () => { ham.classList.remove('active'); drawer.classList.remove('open'); document.body.style.overflow = ''; }));

  // role toggle (sliding pill)
  const toggle = $('.role-toggle');
  const roleVal = () => ($('input[name="role"]:checked', form) || {}).value || 'user';
  if (toggle) {
    const sync = () => { toggle.dataset.role = roleVal(); };
    $$('input[name="role"]', toggle).forEach(r => r.addEventListener('change', sync)); sync();
  }

  // password eye
  $$('.eye').forEach(b => b.addEventListener('click', () => {
    const inp = $('input', b.parentElement), show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));

  // ripple on buttons
  $$('.btn').forEach(btn => btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span');
    d.className = 'ripple'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    btn.appendChild(d); setTimeout(() => d.remove(), 700);
  }));

  // subtle parallax on the visual side
  const vis = $('.auth-visual');
  if (vis && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const items = $$('.av-photo, .av-chip', vis);
    vis.addEventListener('mousemove', e => {
      const r = vis.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      items.forEach((el, i) => { el.style.marginLeft = nx * (18 + i * 8) + 'px'; el.style.marginTop = ny * (18 + i * 8) + 'px'; });
    });
  }

  const showMsg = (text, type = 'error') => {
    msg.className = 'form-msg ' + type; msg.hidden = false;
    msg.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span></span>`;
    $('span', msg).textContent = text;
    if (type === 'error') { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  };
  const fieldErr = (id, text) => {
    const f = $('#' + id).closest('.field'); f.classList.add('invalid'); $('.err', f).textContent = text;
  };
  const clearErrs = () => { msg.hidden = true; $$('.field').forEach(f => { f.classList.remove('invalid'); const e = $('.err', f); if (e) e.textContent = ''; }); };
  $$('.field input').forEach(i => i.addEventListener('input', () => { const f = i.closest('.field'); f.classList.remove('invalid'); const e = $('.err', f); if (e) e.textContent = ''; }));
  const busy = on => { submit.classList.toggle('loading', on); submit.disabled = on; };

  /* ==================== LOGIN ==================== */
  if (page === 'login') {
    const params = new URLSearchParams(location.search);
    if (params.get('registered')) {
      showMsg('Account created. Log in with your new details.', 'success');
      const last = sessionStorage.getItem('stackly_last_signup');
      if (last) { try { const l = JSON.parse(last); $('#email').value = l.email; $('input[value="' + l.role + '"]', form).checked = true; toggle.dataset.role = l.role; } catch (e) {} }
    }
    $$('.chip').forEach(c => c.addEventListener('click', () => {
      $('#email').value = c.dataset.email; $('#password').value = c.dataset.pass;
      $('input[value="' + c.dataset.role + '"]', form).checked = true; toggle.dataset.role = c.dataset.role;
      clearErrs();
    }));

    // Email and password must actually be filled in with a valid-looking
    // format before this goes anywhere — but we still never check them
    // against a stored account or reject a role mismatch (any real email +
    // password combination is accepted for whichever role is selected).
    form.addEventListener('submit', async e => {
      e.preventDefault(); clearErrs();
      const email = $('#email').value.trim().toLowerCase(), pass = $('#password').value, role = roleVal();
      let bad = false;
      if (!emailRe.test(email)) { fieldErr('email', 'Enter a valid email address.'); bad = true; }
      if (!pass) { fieldErr('password', 'Enter your password.'); bad = true; }
      if (bad) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); return; }

      busy(true);
      await new Promise(r => setTimeout(r, 500)); // brief "checking" animation only

      const users = await seed();
      let user = users.find(u => u.email === email);
      if (!user) {
        const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        user = { name, email, role, hash: await hash(pass), created: Date.now() };
        users.push(user); saveUsers(users);
      } else if (user.role !== role) {
        user.role = role; saveUsers(users); // role toggle always wins, never blocks
      }

      setSession({ name: user.name, email: user.email, role, at: Date.now() }, $('#remember').checked);
      submit.classList.remove('loading'); submit.classList.add('ok');
      $('.btn-label', submit).innerHTML = '<i class="fa-solid fa-check"></i> Welcome back'; submit.querySelector('.btn-label').style.display = 'inline';
      setTimeout(() => { location.href = DASH[role]; }, 600);
    });
  }

  /* ==================== SIGNUP ==================== */
  if (page === 'signup') {
    const pw = $('#password'), meter = $('.strength'), mlabel = $('.strength-label');
    const score = v => { let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return v ? Math.max(1, s) : 0; };
    pw.addEventListener('input', () => {
      const s = score(pw.value); meter.dataset.s = s;
      mlabel.textContent = ['', 'Weak', 'Fair', 'Good', 'Strong'][s];
    });

    // Every field is validated before anything is saved — nothing submits on
    // empty or malformed input. The one check we deliberately do NOT do is
    // rejecting an email because it's already registered (that used to block
    // people here); an existing email just gets its details updated instead.
    form.addEventListener('submit', async e => {
      e.preventDefault(); clearErrs();
      const name = $('#name').value.trim(), email = $('#email').value.trim().toLowerCase(), pass = pw.value, conf = $('#confirm').value, role = roleVal();
      let bad = false;
      if (name.length < 2) { fieldErr('name', 'Enter your full name.'); bad = true; }
      if (!emailRe.test(email)) { fieldErr('email', 'Enter a valid email address.'); bad = true; }
      if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) { fieldErr('password', 'Use 8+ characters with a letter and a number.'); bad = true; }
      if (conf !== pass) { fieldErr('confirm', 'Passwords do not match.'); bad = true; }
      if (!$('#terms').checked) { showMsg('Please accept the Terms & Privacy to continue.'); bad = true; }
      if (bad) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); return; }

      busy(true);
      const users = await seed();
      await new Promise(r => setTimeout(r, 600));

      const h = await hash(pass);
      const existing = users.find(u => u.email === email);
      if (existing) { existing.name = name; existing.role = role; existing.hash = h; }
      else users.push({ name, email, role, hash: h, created: Date.now() });
      saveUsers(users);

      sessionStorage.setItem('stackly_last_signup', JSON.stringify({ email, role }));
      $('#successScreen').classList.add('show');
      setTimeout(() => { location.href = 'login.html?registered=1'; }, 1600);
    });
  }
})();