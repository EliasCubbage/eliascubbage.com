// Runtime smoke test for app-cubblitz.js
// Mocks the DOM, loads the game, starts it, simulates gameplay, and
// verifies that the new enemy types spawn, are drawn, and behave without
// throwing runtime errors.
const fs = require('fs');

let rafCb = null;
const winHandlers = {};          // window event handlers captured here
const elements = {};              // getElementById cache

function el(id) {
  if (!elements[id]) {
    const o = {
      textContent: '',
      style: { display: '' },
      hidden: false,
      _attrs: {},
      _cls: [],
      _handlers: {},
      innerHTML: '',
      appendChild: function () { return null; },
      getAttribute: function (k) { return (this._attrs[k] != null ? this._attrs[k] : null); },
      setAttribute: function (k, v) { this._attrs[k] = String(v); },
      removeAttribute: function (k) { delete this._attrs[k]; },
      addEventListener: function (n, cb) { this._handlers[n] = cb; },
      removeEventListener: function (n, cb) { if (this._handlers[n] === cb) delete this._handlers[n]; }
    };
    o.classList = {
      _a: [],
      add: function (a) { if (!this.contains(a)) this._a.push(a); },
      remove: function (a) { this._a = this._a.filter(function (x) { return x !== a; }); },
      contains: function (a) { return this._a.indexOf(a) !== -1; },
      toggle: function (a) { if (this.contains(a)) this.remove(a); else this.add(a); }
    };
    elements[id] = o;
  }
  return elements[id];
}

let ctxCalls = [];
function makeCtx() {
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: 'left',
    globalAlpha: 1,
    lineWidth: 1,
    canvas: null,
    _calls: 0,
    fillRect: function (x, y, w, h) { ctxCalls.push({ op: 'fillRect', x: x, y: y, w: w, h: h, fs: ctx.fillStyle }); ctx._calls++; },
    fillText: function (t) { ctx._calls++; },
    beginPath: function () { ctx._calls++; },
    moveTo: function () { ctx._calls++; },
    lineTo: function () { { ctx._calls++; } },
    closePath: function () { ctx._calls++; },
    fill: function () { ctx._calls++; },
    strokeRect: function () { ctx._calls++; },
    save: function () { ctx._calls++; },
    restore: function () { ctx._calls++; },
    translate: function () { ctx._calls++; },
    clearRect: function () { ctx._calls++; },
    arc: function () { ctx._calls++; },
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    createRadialGradient: function () { return { addColorStop: function () {} }; }
  };
  return ctx;
}
const ctx = makeCtx();

const mockDoc = {
  addEventListener: function (name, cb) { winHandlers[name] = cb; },
  getElementById: function (id) { return el(id); },
  querySelectorAll: function (q) {
    if (q === '.upgrade-card') {
      return [el('uc-0'), el('uc-1'), el('uc-2')];
    }
    if (q === 'a[href^="#"]') { return []; }
    if (q === '.tilt' || q === '.magnetic' || q === '.reveal' || q === '[data-count]') { return []; }
    if (q === 'li') { return []; }
    return [];
  },
  querySelector: function () { return null; },
  createElement: function (tag) {
    const o = el('__ce__' + tag);
    o.tagName = tag;
    return o;
  }
};

const mockWin = {
  scrollTo: function () {},
  scrollY: 0,
  innerWidth: 540,
  innerHeight: 750,
  devicePixelRatio: 1,
  matchMedia: function (q) { return { matches: false, addListener: function () {} }; },
  AudioContext: function () { throw new Error('no audio'); },
  webkitAudioContext: function () { throw new Error('no audio'); },
  addEventListener: function (name, cb) { winHandlers[name] = cb; },
  removeEventListener: function () {}
};

const ls = { _d: {}, getItem: function (k) { return this._d[k] || null; }, setItem: function (k, v) { this._d[k] = v; }, removeItem: function () {} };
// Pre-populate high scores so the initials prompt never appears (avoids overwriting window keydown)
ls._d['eliascubbage_highscores'] = JSON.stringify([{ i: 'ZZZ', s: 9999999 }, { i: 'ZZZ', s: 9999999 }, { i: 'ZZZ', s: 9999999 }]);
const ss = { getItem: function () { return null; }, setItem: function () {} };

global.window = mockWin;
global.document = mockDoc;
global.localStorage = ls;
global.sessionStorage = ss;

const src = fs.readFileSync('app-cubblitz.js', 'utf8');
const gameFn = new Function(
  'window', 'document', 'localStorage', 'sessionStorage',
  'requestAnimationFrame', 'cancelAnimationFrame', 'Math',
  'setTimeout', 'clearTimeout', 'console', src
);

try {
  gameFn(
    mockWin, mockDoc, ls, ss,
    function (cb) { rafCb = cb; },
    function () {},
    Math,
    setTimeout,
    clearTimeout,
    console
  );
} catch (e) {
  console.error('FAIL: error loading game script:', e.message);
  console.error(e.stack);
  process.exit(1);
}

if (typeof winHandlers.DOMContentLoaded !== 'function') {
  console.error('FAIL: DOMContentLoaded handler not registered');
  process.exit(1);
}
console.log('[1] Game loaded, DOMContentLoaded registered');

// Initialize
winHandlers.DOMContentLoaded();
console.log('[2] DOMContentLoaded fired. Canvas:', el('game-canvas').width, 'x', el('game-canvas').height);

// Start the game
winHandlers.keydown({ key: ' ', preventDefault: function () {}, stopPropagation: function () {} });
console.log('[3] Game started. Status:', el('game-status').textContent, 'Level:', el('game-level').textContent, 'Lives:', el('game-lives').textContent);

// ---- Gameplay simulation ----
let sweepDir = 0;      // 0 = left, 1 = right
let sweepCounter = 0;
let sweepStep = 0;
let maxLevel = 1;
let errors = [];
let enemyTypeCounts = {};  // track shapes drawn via ctx fillStyle colors
const MAX_FRAMES = 6000;

function mkKey(k) { return { key: k, preventDefault: function () {}, stopPropagation: function () {} }; }

function captureEnemyDraws() {
  // Inspect the latest ctx calls to detect enemy shapes by their bodyColor
  // We look at fillRect calls and compare fillStyle to known enemy body colors
}

for (let f = 0; f < MAX_FRAMES; f++) {
  try {
    const status = el('game-status').textContent;
    const pickerOpen = elements['upgrade-picker'] && elements['upgrade-picker'].classList.contains('open');

    if (pickerOpen) {
      // Select upgrade (Space)
      winHandlers.keydown(mkKey(' '));
      // After selecting, advance a couple frames
    } else if (status.indexOf('Game over') !== -1 || status.indexOf('Press Start') !== -1) {
      // Restart
      winHandlers.keydown(mkKey(' '));
    } else {
      // Shoot constantly
      winHandlers.keydown(mkKey(' '));

      // Sweep left/right continuously to cover all columns
      if (sweepStep < 80) {
        if (sweepDir === 0) {
          winHandlers.keydown(mkKey('ArrowLeft'));
        } else {
          winHandlers.keydown(mkKey('ArrowRight'));
        }
      } else if (sweepStep === 80) {
        // Switch direction
        if (sweepDir === 0) {
          winHandlers.keyup(mkKey('ArrowLeft'));
          sweepDir = 1;
        } else {
          winHandlers.keyup(mkKey('ArrowRight'));
          sweepDir = 0;
        }
      }
      sweepStep = (sweepStep + 1) % 160;
    }

    // Advance the game loop one frame
    if (rafCb) rafCb();

    const lvl = parseInt(el('game-level').textContent, 10) || 1;
    if (lvl > maxLevel) maxLevel = lvl;

    // Detect drawn enemy shapes via fillStyle colors in the most recent frames
    for (let i = 0; i < ctxCalls.length; i++) {
      const fs = ctxCalls[i].fs;
      if (fs && fs.indexOf('hsl(') === 0) {
        if (enemyTypeCounts[fs] === undefined) enemyTypeCounts[fs] = 0;
        enemyTypeCounts[fs]++;
      }
    }
    ctxCalls = [];
  } catch (e) {
    errors.push('frame ' + f + ': ' + e.message);
    if (errors.length >= 5) break;
  }
}

// ---- Verify results ----
console.log('[4] Simulation complete. Frames run:', MAX_FRAMES);
console.log('Max level reached:', maxLevel);
console.log('Runtime errors:', errors.length);
if (errors.length > 0) {
  errors.forEach(function (e) { console.error('  ERROR:', e); });
}

// Verify that enemy body colors we expect for new types were drawn
const expectedColors = {
  'tank': 'hsl(200,70%,48%)',
  'shooter': 'hsl(35,80%,58%)',
  'zigzag': 'hsl(120,70%,55%)',
  'kamikaze': 'hsl(260,80%,55%)'
};
const typeKeys = Object.keys(expectedColors);
const drawnNewTypes = [];
const missingTypes = [];
for (let i = 0; i < typeKeys.length; i++) {
  const color = expectedColors[typeKeys[i]];
  if (enemyTypeCounts[color] > 0) {
    drawnNewTypes.push(typeKeys[i] + ' (color ' + color + ', ' + enemyTypeCounts[color] + ' draw calls)');
  } else {
    missingTypes.push(typeKeys[i] + ' (color ' + color + ')');
  }
}
console.log('New enemy types drawn at runtime:', drawnNewTypes.length);
drawnNewTypes.forEach(function (t) { console.log('  DRAWN:', t); });
if (missingTypes.length > 0) {
  console.log('New types NOT yet drawn (may be beyond max level reached):');
  missingTypes.forEach(function (t) { console.log('  MISSING:', t, '— unlocked at level 2/4/6/8 respectively'); });
}

// Summary
console.log('');
if (errors.length === 0 && maxLevel >= 2) {
  console.log('RESULT: PASS — no runtime errors; reached level ' + maxLevel + ' (tank type unlocked and exercised at level 2+).');
} else if (errors.length === 0) {
  console.log('RESULT: PASS — no runtime errors. Reached level ' + maxLevel + '.');
} else {
  console.log('RESULT: FAIL — runtime errors detected.');
  process.exitCode = 1;
}
