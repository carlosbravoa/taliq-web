/* ===========================================================
   TALIQ — JavaScript del sitio
   =========================================================== */
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Header: sombra al hacer scroll ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menú mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var navMobile = document.querySelector('.nav-mobile');
  if (toggle && navMobile) {
    toggle.addEventListener('click', function () {
      var open = navMobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Modal de demo ---------- */
  var overlay = document.getElementById('modal-demo');
  var form = document.getElementById('form-demo');
  var success = document.querySelector('.modal__success');
  var lastFocused = null;

  var openedAt = Date.now();
  function openModal() {
    if (!overlay) return;
    openedAt = Date.now();
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('input:not([tabindex="-1"]), select, button');
    if (first) first.focus();
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-demo]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  var closeBtn = document.querySelector('.modal__close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---------- Envío del formulario ---------- */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var payload = Object.fromEntries(new FormData(form).entries());
      payload.privacidad = !!payload.privacidad;
      payload.elapsed_ms = Date.now() - openedAt;

      var submitBtn = form.querySelector('button[type="submit"]');
      var errorBox = form.querySelector('.form-error');
      if (!errorBox) {
        errorBox = document.createElement('p');
        errorBox.className = 'form-error';
        errorBox.setAttribute('role', 'alert');
        submitBtn.insertAdjacentElement('beforebegin', errorBox);
      }
      errorBox.textContent = '';
      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Enviando…';

      fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status));
        });
      }).then(function () {
        form.style.display = 'none';
        if (success) success.style.display = 'block';
        var modalBox = form.closest('.modal');
        if (modalBox) modalBox.classList.add('is-sent');
      }).catch(function (err) {
        var msg = 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos a hola@taliq.cl.';
        if (err && (err.message === 'disposable_email' || err.message === 'email_domain_no_mx')) {
          msg = 'Ingresa un correo corporativo válido (no aceptamos correos temporales).';
        } else if (err && err.message === 'invalid_email') {
          msg = 'Revisa el formato del correo.';
        }
        errorBox.textContent = msg;
        if (window.console) console.error('Demo form error:', err);
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
    });
  }

  /* ---------- Acordeón FAQ ---------- */
  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var wasOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq__item').forEach(function (i) {
        i.classList.remove('is-open');
        i.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Primera pregunta abierta por defecto */
  var firstFaq = document.querySelector('.faq__item');
  if (firstFaq) {
    firstFaq.classList.add('is-open');
    firstFaq.querySelector('.faq__q').setAttribute('aria-expanded', 'true');
  }

  /* ---------- Scroll suave con offset del header ---------- */
  document.querySelectorAll('a[href^="#"]:not([data-demo])').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (navMobile) navMobile.classList.remove('is-open');
      var top = target.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- Reveal al entrar en viewport ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Failsafe: si por cualquier motivo el observer no dispara,
     el contenido se muestra igual pasado un momento. */
  setTimeout(function () {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }, 1200);

  /* ---------- Aviso de cookies / consentimiento ----------
     Hoy el sitio no usa cookies ni analítica. Este bloque guarda la
     preferencia y expone window.taliqConsent() para que cualquier
     herramienta futura se active sólo si analytics === true. */
  var CONSENT_KEY = 'taliq-consent';
  var banner = document.getElementById('cookie-banner');
  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (e) { return null; }
  }
  function writeConsent(analytics) {
    var value = { v: 1, analytics: !!analytics, ts: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (e) { /* modo privado, etc. */ }
    return value;
  }
  window.taliqConsent = function () { return readConsent() || { v: 1, analytics: false, ts: null }; };
  if (banner) {
    if (!readConsent()) banner.hidden = false;
    banner.querySelectorAll('[data-consent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = writeConsent(btn.getAttribute('data-consent') === 'all');
        banner.hidden = true;
        document.dispatchEvent(new CustomEvent('taliq:consent', { detail: value }));
      });
    });
    document.querySelectorAll('[data-cookies]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        banner.hidden = false;
        banner.querySelector('[data-consent="all"]').focus();
      });
    });
  }

});
