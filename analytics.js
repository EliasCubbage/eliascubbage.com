/**
 * Traffic Analytics – Google Analytics 4 (GDPR-compliant)
 *
 * This module:
 *   1. Displays a lightweight cookie-consent banner.
 *   2. Only loads GA4 after the visitor accepts (or respects
 *      consent is "denied" by default for GDPR/CCPA safety).
 *   3. Reads the Measurement ID from window.CUBBLITZ_CONFIG.gaMeasurementId
 *      (set in config.js).
 */
(function () {
  'use strict';

  // --- Config ---------------------------------------------------------------
  var GA_MEASUREMENT_ID = '';
  if (window.CUBBLITZ_CONFIG && window.CUBBLITZ_CONFIG.gaMeasurementId) {
    GA_MEASUREMENT_ID = window.CUBBLITZ_CONFIG.gaMeasurementId;
  }

  // If no Measurement ID was provided, skip everything.
  if (!GA_MEASUREMENT_ID) {
    return;
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

    var msg = document.createElement('span');
    msg.textContent =
      'We use cookies to understand site traffic and improve your experience. ';

    var learnMore = document.createElement('a');
    learnMore.href = '/privacy.html';
    learnMore.textContent = 'Learn more';
    learnMore.style.cssText =
      'color:#8ae2ff;text-decoration:none;border-bottom:1px dotted #8ae2ff;';
    learnMore.target = '_blank';
    learnMore.rel = 'noopener';

    var acceptBtn = document.createElement('button');
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
      initGA4();
    });
    declineBtn.addEventListener('click', function () {
      setConsent(false);
      bar.remove();
      // Don't load GA4 on decline
    });

    bar.appendChild(msg);
    bar.appendChild(learnMore);
    bar.appendChild(acceptBtn);
    bar.appendChild(declineBtn);

    // Fade in
    bar.style.opacity = '0';
    bar.style.transition = 'opacity 0.3s';
    document.body.appendChild(bar);
    setTimeout(function () {
      bar.style.opacity = '1';
    }, 50);
  }

  // --- GA4 Init -------------------------------------------------------------
  // Defines the global gtag function, injects the GA4 library, and configures
  // tracking with GDPR-safe consent defaults.
  function initGA4() {
    // Standard Google Analytics 4 setup.
    // gtag must be global so the library can call it, and so the hashchange
    // handler below can fire events later.
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Inject the GA4 library script (async). The queued gtag calls will be
    // processed once the library finishes loading.
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);

    // Timestamp
    gtag('js', new Date());

    // Granular consent defaults (GDPR-safe — all denied initially).
    // GA will NOT set non-essential cookies until we grant them here.
    if (typeof gtag === 'function') {
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'denied',
      });

      // Now update to granted (analytics only) — we have explicit consent.
      gtag('consent', 'update', {
        analytics_storage: 'granted',
      });

      gtag('config', GA_MEASUREMENT_ID, {
        // Disable advertising features
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        // IP anonymization
        anonymize_ip: true,
      });

      // Track the initial page view
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
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
      // User previously accepted — load GA4 immediately
      initGA4();
    } else {
      createBanner();
    }
  });

  // Track SPA-style navigation (hash changes, e.g. anchor links)
  window.addEventListener('hashchange', function () {
    if (window.gtag && getConsent()) {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  });
})();
