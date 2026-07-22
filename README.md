# eliascubbage.com — Portfolio

This site is deployed from GitHub Pages.

## Files
- index.html
- styles-cubblitz.css
- app-cubblitz.js
- config.js

## High Scores

Cubblitz high scores sync through a GitHub Gist so they persist across devices without needing a local server.

### Setup
1. Go to https://github.com/settings/tokens and generate a Personal Access Token (classic) with the `gist` scope.
2. Create a private gist at https://gist.github.com/ with one empty file named `scores.json`. Copy the gist ID from the URL.
3. Edit `config.js` and fill in:
   - `githubToken`: the token
   - `gistId`: the gist ID

If `config.js` is left empty, the game falls back to browser localStorage.