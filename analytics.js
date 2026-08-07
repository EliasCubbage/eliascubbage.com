/**
 * Traffic Analytics — Consent Banner for Google Analytics 4
 *
 * The GA4 library (gtag.js) and the default consent policy are initialized
 * in the <head> of index.html using Google Consent Mode. This file handles
 * the UI: it shows a cookie-consent banner and, on acceptance, calls
 * gtag('consent', 'update', ...) to flip analytics_storage to "granted".
 *
 * Behaviour:
 *   - If no Measurement ID is set in config.js → nothing happens.
 *   - If the visitor already accepted → skip banner, call consent update.
 *   - Otherwise → show banner. Accept → grant consent. Decline → no tracking.
 */
(function () {
  'use strict';

  // Only run if GA4 is configured
  var GA_MEASUREMENT_ID = '';
  if (window.CUBBLITZ_CONFIG && window.CUBBLITZ_CONFIG.gaMeasurementId) {
    GA_MEASUREMENT_ID = window.CUBBLITZ_CONFIG.gaMeasurementId;
  }
  if (!GA_MEASUREMENT_ID) {
    return; // no GA4 configured, nothing to do
  }

  var CONSENT_KEY = 'ga_consent_given';

  // --- Helpers --------------------------------------------------------------
  function getConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setConsent(val) {
    try {
      localStorage.setItem(CONSENT_KEY, val ? 'true' : 'false');
    } catch (e) {}
  }

  // Grant analytics consent via Google Consent Mode
  function grantConsent() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        functionality_storage: 'granted',
        personalization_storage: 'granted',
        security_storage: 'granted',
      });
    }
  }

  // --- Consent Banner -------------------------------------------------------
  function createBanner() {
    var bar = document.createElement('div');
    bar.id = 'consent-banner';
    bar.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:1rem',
      'padding:1rem 1.5rem',
      'background:rgba(15,23,42,0.95)',
      'backdrop-filter:blur(10px)',
      'border-top:1px solid rgba(255,255,255,0.1)',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:0.9rem',
      'color:rgba(255,255,255,0.9)',
      'z-index:9999',
      'box-shadow:0 -2px 20px rgba(0,0,0,0.3)',
    ].join(';');
    bar.style.opacity = '0';
    bar.style.transition = 'opacity 0.3s';

    var msg = document.createElement('span');
    msg.textContent =
      'We use cookies to understand site traffic and improve your experience. ';

    var learnMore = document.createElement('a');
    learnMore.href = '/privacy.html';
    learnMore.textContent = 'Learn more';
    learnMore.target = '_blank';
    learnMore.rel = 'noopener';
    learnMore.style.cssText =
      'color:#8ae2ff;text-decoration:none;border-bottom:1px dotted #8ae2ff;';

    var acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.textContent = 'Accept';
    acceptBtn.style.cssText = [
      'background:#0d9488',
      'color:#fff',
      'border:none',
      'padding:0.5rem 1.25rem',
      'border-radius:6px',
      'font-family:inherit',
      'font-size:0.9rem',
      'font-weight:600',
      'cursor:pointer',
      'transition:background 0.15s',
    ].join(';');
    acceptBtn.addEventListener('mouseenter', function () {
      acceptBtn.style.background = '#0d7b73';
    });
    acceptBtn.addEventListener('mouseleave', function () {
      acceptBtn.style.background = '#0d9488';
    });

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.textContent = 'Decline';
    declineBtn.style.cssText = [
      'background:transparent',
      'color:rgba(255,255,255,0.6)',
      'border:1px solid rgba(255,255,255,0.2)',
      'padding:0.5rem 1.25rem',
      'border-radius:6px',
      'font-family:inherit',
      'font-size:0.9rem',
      'font-weight:600',
      'cursor:pointer',
      'transition:background 0.15s',
    ].join(';');

    acceptBtn.addEventListener('click', function () {
      setConsent(true);
      bar.remove();
      grantConsent();
    });

    declineBtn.addEventListener('click', function () {
      setConsent(false);
      bar.remove();
      // Consent stays "denied" — no GA4 tracking.
    });

    bar.appendChild(msg);
    bar.appendChild(learnMore);
    bar.appendChild(acceptBtn);
    bar.appendChild(declineBtn);

    document.body.appendChild(bar);
    // Fade in after the next tick so the transition fires
    setTimeout(function () {
      bar.style.opacity = '1';
    }, 50);
  }

  // --- Init -----------------------------------------------------------------
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    if (getConsent()) {
      // User previously accepted — grant consent immediately
      grantConsent();
    } else {
      createBanner();
    }
  });

  // Track SPA-style navigation (hash changes, e.g. anchor links)
  window.addEventListener('hashchange', function () {
    if (getConsent() && typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  });
})();
