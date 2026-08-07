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

This site uses **Google Analytics 4** to track visitor traffic. The setup is
GDPR-compliant:

- A lightweight **cookie-consent banner** appears on every visit.
- GA4 is loaded **only after the visitor accepts**. No cookies are set until
  consent is given.
- `anonymize_ip` is enabled, and advertising features are disabled.
- The visitor's consent choice is persisted in `localStorage` for future visits.

### Setup

1. Create a Google Analytics 4 property (or reuse an existing one) at
   https://analytics.google.com.
2. Navigate to **Admin** → **Data Streams** → **Web**, then click **Create
   Stream**.
3. Enter your domain (e.g. `https://eliascubbage.com`) and click **Create**.
4. Copy the **Measurement ID** (it looks like `G-XXXXXXXXXX`).
5. Edit `config.js` and paste the ID into the `gaMeasurementId` field:

```js
window.CUBBLITZ_CONFIG = {
  githubToken: '',
  gistId: '',
  gaMeasurementId: 'G-YOUR-ID-HERE'  // ← paste Measurement ID here
};
```

6. Commit and push to `main` — GitHub Pages will redeploy automatically.

If `gaMeasurementId` is left empty, the analytics banner and GA4 script are
**not loaded at all** (graceful degradation).

### Privacy

A privacy policy is available at [`privacy.html`](privacy.html). The consent
banner also links to it.

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
