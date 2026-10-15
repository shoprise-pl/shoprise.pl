/* Shoprise — czysty adres, menu mobilne, pasek szybkiego kontaktu i formularz (Formspree). */
(() => {
  /* ---------- Czysty adres ----------
     „Przejdź do treści” i „Na górę” prowadzą do #main: bez JS działają jak zwykła kotwica, z JS przewijamy
     i przenosimy fokus, nie dopisując #main do adresu. Kto wejdzie z linku z #main albo ze starym .html
     (np. /sklepy-internetowe.html), zobaczy w pasku czysty adres; strona się nie przeładowuje. */
  const main = document.getElementById('main');
  const path = location.pathname
    .replace(/^\/index(\.html)?$/, '/')
    .replace(/^\/(?!404\.html$)([^/]+)\.html$/, '/$1');
  const hash = location.hash === '#main' ? '' : location.hash;
  if (path !== location.pathname || hash !== location.hash) {
    history.replaceState(history.state, '', path + location.search + hash);
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#main"]');
    if (!link || !main || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.scrollTo({ top: 0 }); // płynnie albo od razu, jak każe scroll-behavior (przy ograniczonym ruchu od razu)
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  });

  /* ---------- Menu ---------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');

  if (header && toggle && nav) {
    const label = toggle.querySelector('.menu-toggle-label');
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open) => {
      header.dataset.menu = open ? 'open' : 'closed';
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Zamknij' : 'Menu';
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });
    window.matchMedia('(min-width: 64rem)').addEventListener('change', () => setOpen(false));
  }

  /* ---------- Pasek szybkiego kontaktu (tylko telefon) ----------
     Pojawia się, gdy przyciski z nagłówka strony znikną z ekranu,
     i chowa się nad formularzem i stopką, żeby nie zasłaniać kontaktu. */
  const bar = document.querySelector('.quick-bar');
  if (bar && 'IntersectionObserver' in window) {
    const start = document.querySelector('.hero, .page-head');
    const stops = [...document.querySelectorAll('#kontakt, .site-footer')];
    let pastStart = !start;
    const visibleStops = new Set();
    const update = () => {
      bar.dataset.visible = String(pastStart && visibleStops.size === 0);
    };

    if (start) {
      new IntersectionObserver(([entry]) => {
        pastStart = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      }).observe(start);
    }
    const stopObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleStops.add(entry.target);
        else visibleStops.delete(entry.target);
      });
      update();
    });
    stops.forEach((el) => stopObserver.observe(el));
  }

  /* ---------- Formularz ---------- */
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.noValidate = true; // walidacja niżej, z komunikatami przy polach
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;
  const message = form.querySelector('#f-msg');

  // Przyciski „Zapytaj o wycenę” na podstronach przekazują zakres: ?pakiet=Sklep%20Pro#kontakt
  const pkg = new URLSearchParams(window.location.search).get('pakiet');
  if (pkg && message && !message.value) {
    message.value = `Interesuje mnie zakres „${pkg.slice(0, 60)}”. `;
  }

  const messages = {
    name: 'Wpisz imię albo nazwę firmy.',
    contact: 'Podaj e-mail albo numer telefonu, żebyśmy mogli odpisać.',
    contactFormat: 'To nie wygląda na e-mail ani numer telefonu. Sprawdź, czy nie brakuje znaku.',
    message: 'Napisz w kilku słowach, co sprzedajesz.'
  };

  const looksLikeContact = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || v.replace(/\D/g, '').length >= 9;

  const hintId = (field) => (field.getAttribute('aria-describedby') || '')
    .split(' ').filter((id) => id && !id.endsWith('-error')).join(' ');

  const setError = (field, text) => {
    const id = `${field.id}-error`;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('p');
      el.id = id;
      el.className = 'field-error';
      field.insertAdjacentElement('afterend', el);
    }
    el.textContent = text;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', [hintId(field), id].filter(Boolean).join(' '));
  };

  const clearError = (field) => {
    document.getElementById(`${field.id}-error`)?.remove();
    field.removeAttribute('aria-invalid');
    const rest = hintId(field);
    if (rest) field.setAttribute('aria-describedby', rest);
    else field.removeAttribute('aria-describedby');
  };

  const validate = (field) => {
    const v = field.value.trim();
    if (!v) { setError(field, messages[field.name]); return false; }
    if (field.name === 'contact' && !looksLikeContact(v)) { setError(field, messages.contactFormat); return false; }
    clearError(field);
    return true;
  };

  const setStatus = (state, html) => {
    status.dataset.state = state;
    status.innerHTML = html;
    status.hidden = false;
  };

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') validate(e.target);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('[required]')];
    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) { invalid[0].focus(); return; }

    button.disabled = true;
    button.textContent = 'Wysyłanie…';
    status.hidden = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      button.textContent = 'Zapytanie wysłane';
      setStatus('ok', 'Dzięki, zapytanie dotarło. Odpiszemy w ciągu 24 godzin.');
    } catch (err) {
      button.disabled = false;
      button.textContent = buttonLabel;
      setStatus('error', 'Nie udało się wysłać zapytania. Spróbuj jeszcze raz albo napisz na <a href="mailto:biuro@shoprise.pl">biuro@shoprise.pl</a>.');
    }
  });
})();
