/* Shoprise — menu mobilne i formularz kontaktowy (Formspree). */
(() => {
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
    window.matchMedia('(min-width: 54rem)').addEventListener('change', () => setOpen(false));
  }

  /* ---------- Formularz ---------- */
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.noValidate = true; // walidacja niżej, z komunikatami przy polach
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;
  const message = form.querySelector('#f-msg');

  // Link „Zapytaj o ten pakiet” przekazuje nazwę pakietu: ?pakiet=Sklep%20Pro#kontakt
  const pkg = new URLSearchParams(window.location.search).get('pakiet');
  if (pkg && message && !message.value) {
    message.value = `Interesuje mnie pakiet „${pkg.slice(0, 60)}”. `;
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
      button.textContent = 'Wiadomość wysłana';
      setStatus('ok', 'Dzięki, wiadomość dotarła. Odpiszemy w ciągu 24 godzin.');
    } catch (err) {
      button.disabled = false;
      button.textContent = buttonLabel;
      setStatus('error', 'Nie udało się wysłać wiadomości. Spróbuj jeszcze raz albo napisz na <a href="mailto:biuro@shoprise.pl">biuro@shoprise.pl</a>.');
    }
  });
})();
