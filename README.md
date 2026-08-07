# eliascubbage.com — Portfolio

This site is deployed from GitHub Pages.

## Files
- index.html
- styles-cubblitz.css
- app-cubblitz.js
- analytics.js
- config.js
- privacy.html

## Traffic Analytics (Google Analytics 4)

This site uses **Google Analytics 4** to track visitor traffic in a
GDPR-compliant manner via **Google Consent Mode**.

### How it works

1. The GA4 `gtag.js` library and a default consent policy are loaded in the
   `<head>` of `index.html`. Consent defaults to `"denied"` — meaning **no
   tracking cookies are set** until the visitor explicitly accepts.
2. A lightweight **cookie-consent banner** appears at the bottom of the screen
   on every visit.
3. The visitor can **Accept** (enables GA4 tracking) or **Decline** (blocks
   all GA4 tracking). The choice is saved in `localStorage` and remembered on
   future visits.
4. Additional privacy measures:
   - `anonymize_ip: true` — IP addresses are masked
   - `allow_google_signals: false` — advertising features disabled
   - `allow_ad_personalization_signals: false` — no ad personalization

### Setup

1. Create a Google Analytics 4 property at https://analytics.google.com.
2. Navigate to **Admin** → **Data Streams** → **Web** → **Create Stream**.
3. Enter your domain (`https://eliascubbage.com`) and click **Create**.
4. Copy the **Measurement ID** (e.g. `G-XXXXXXXXXX`).
5. Edit `config.js` and paste the ID into the `gaMeasurementId` field:

```js
window.CUBBLITZ_CONFIG = {
  githubToken: '',
  gistId: '',
  gaMeasurementId: 'G-XXXXXXXXXX'
};
```

6. The Measurement ID is also referenced in the `<head>` of `index.html` in
   the async `gtag.js` script URL. If you change it in `config.js`, make sure
   the ID in `index.html` matches.
7. Commit and push to `main` — GitHub Pages will redeploy automatically.

If `gaMeasurementId` is left empty, the consent banner and GA4 features are
completely disabled.

### Privacy

A privacy policy is available at [`privacy.html`](privacy.html). The consent
banner also links to it ("Learn more").

## High Scores

Cubblitz high scores sync through a GitHub Gist so they persist across devices
without needing a local server.

### Setup
1. Go to https://github.com/settings/tokens and generate a Personal Access Token
   (classic) with the `gist` scope.
2. Create a private gist at https://gist.github.com/ with one empty file named
   `scores.json`. Copy the gist ID from the URL.
3. Edit `config.js` and fill in:
   - `githubToken`: the token
   - `gistId`: the gist ID

If `config.js` is left empty, the game falls back to browser localStorage.
