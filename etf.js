/* ============================================================
   ETF Tracker — Top 50 ETFs by AUM
   Real-time data via Yahoo Finance (with CORS proxy)
   ============================================================ */
(function () {
  'use strict';

  var CORS_PROXY = 'https://api.allorigins.win/get?url=';

  // Top 50 ETFs by assets under management (B USD), ordered by AUM descending.
  var ETF_LIST = [
    { symbol: 'VOO',   name: 'Vanguard S&P 500 ETF',                      aumB: 1255 },
    { symbol: 'IVV',   name: 'iShares Core S&P 500 ETF',                  aumB: 1190 },
    { symbol: 'SPY',   name: 'State Street SPDR S&P 500 ETF Trust',       aumB: 655  },
    { symbol: 'VTI',   name: 'Vanguard Total Stock Market ETF',           aumB: 520  },
    { symbol: 'QQQ',   name: 'Invesco QQQ Trust',                         aumB: 335  },
    { symbol: 'VTV',   name: 'Vanguard Value ETF',                        aumB: 110  },
    { symbol: 'VXUS',  name: 'Vanguard Total International Stock ETF',    aumB: 92   },
    { symbol: 'BND',   name: 'Vanguard Total Bond Market ETF',            aumB: 108  },
    { symbol: 'AGG',   name: 'iShares Core U.S. Aggregate Bond ETF',      aumB: 105  },
    { symbol: 'VEA',   name: 'Vanguard FTSE Developed Markets ETF',       aumB: 60   },
    { symbol: 'VIG',   name: 'Vanguard Dividend Appreciation ETF',        aumB: 90   },
    { symbol: 'SCHD',  name: 'Schwab U.S. Dividend Equity ETF',           aumB: 75   },
    { symbol: 'VUG',   name: 'Vanguard Growth ETF',                       aumB: 70   },
    { symbol: 'IEFA',  name: 'iShares Core MSCI EAFE ETF',                aumB: 100  },
    { symbol: 'IJR',   name: 'iShares Core S&P Small-Cap ETF',            aumB: 80   },
    { symbol: 'IWM',   name: 'iShares Russell 2000 ETF',                  aumB: 65   },
    { symbol: 'VYM',   name: 'Vanguard High Dividend Yield ETF',          aumB: 65   },
    { symbol: 'XLF',   name: 'Financial Select Sector SPDR',              aumB: 42   },
    { symbol: 'XLK',   name: 'Technology Select Sector SPDR',             aumB: 80   },
    { symbol: 'XLE',   name: 'Energy Select Sector SPDR',                 aumB: 38   },
    { symbol: 'XLV',   name: 'Health Care Select Sector SPDR',            aumB: 40   },
    { symbol: 'VGT',   name: 'Vanguard Information Technology ETF',       aumB: 85   },
    { symbol: 'GLD',   name: 'SPDR Gold Shares',                          aumB: 78   },
    { symbol: 'VWO',   name: 'Vanguard FTSE Emerging Markets ETF',        aumB: 85   },
    { symbol: 'IWF',   name: 'iShares Russell 1000 Growth ETF',           aumB: 88   },
    { symbol: 'VHT',   name: 'Vanguard Health Care ETF',                  aumB: 30   },
    { symbol: 'EFA',   name: 'iShares MSCI EAFE ETF',                     aumB: 47   },
    { symbol: 'IWD',   name: 'iShares Russell 1000 Value ETF',            aumB: 65   },
    { symbol: 'TLT',   name: 'iShares 20+ Year Treasury Bond ETF',        aumB: 47   },
    { symbol: 'QQQM',  name: 'Invesco NASDAQ 100 ETF',                    aumB: 45   },
    { symbol: 'VNQ',   name: 'Vanguard Real Estate ETF',                  aumB: 28   },
    { symbol: 'VT',    name: 'Vanguard Total World Stock ETF',            aumB: 50   },
    { symbol: 'DIA',   name: 'SPDR Dow Jones Industrial Average ETF',     aumB: 35   },
    { symbol: 'IEMG',  name: 'iShares Core MSCI Emerging Markets ETF',    aumB: 70   },
    { symbol: 'LQD',   name: 'iShares iBoxx Investment Grade Bond',       aumB: 30   },
    { symbol: 'JEPI',  name: 'JPMorgan Equity Premium Income ETF',        aumB: 40   },
    { symbol: 'TQQQ',  name: 'ProShares UltraPro QQQ',                    aumB: 20   },
    { symbol: 'SHY',   name: 'iShares 1-3 Year Treasury Bond ETF',        aumB: 15   },
    { symbol: 'XLY',   name: 'Consumer Discretionary Select SPDR',        aumB: 25   },
    { symbol: 'XLP',   name: 'Consumer Staples Select Sector SPDR',       aumB: 16   },
    { symbol: 'HYG',   name: 'iShares iBoxx High Yield Corporate Bond',   aumB: 16   },
    { symbol: 'IEF',   name: 'iShares 7-10 Year Treasury Bond ETF',       aumB: 22   },
    { symbol: 'XLI',   name: 'Industrial Select Sector SPDR',             aumB: 20   },
    { symbol: 'SPYG',  name: 'SPDR Portfolio S&P 500 Growth ETF',         aumB: 20   },
    { symbol: 'XBI',   name: 'SPDR S&P Biotech ETF',                      aumB: 7    },
    { symbol: 'GDX',   name: 'VanEck Gold Miners ETF',                    aumB: 16   },
    { symbol: 'XLC',   name: 'Communication Services Select SPDR',        aumB: 15   },
    { symbol: 'BIL',   name: 'SPDR Bloomberg 1-3 Month T-Bill ETF',       aumB: 40   },
    { symbol: 'VB',    name: 'Vanguard Small-Cap ETF',                    aumB: 65   },
    { symbol: 'SPYV',  name: 'SPDR Portfolio S&P 500 Value ETF',          aumB: 10   },
    { symbol: 'VBR',   name: 'Vanguard Small-Cap Value ETF',              aumB: 55   },
    { symbol: 'SOXX',  name: 'iShares Semiconductor ETF',                 aumB: 15   },
    { symbol: 'ARKK',  name: 'ARK Innovation ETF',                        aumB: 6    },
    { symbol: 'SLV',   name: 'iShares Silver Trust',                      aumB: 14   },
    { symbol: 'USO',   name: 'United States Oil Fund',                    aumB: 2    },
    { symbol: 'VGK',   name: 'Vanguard FTSE Europe ETF',                  aumB: 20   },
    { symbol: 'XLB',   name: 'Materials Select Sector SPDR',              aumB: 7    },
    { symbol: 'XLU',   name: 'Utilities Select Sector SPDR',              aumB: 15   },
    { symbol: 'EEM',   name: 'iShares MSCI Emerging Markets ETF',         aumB: 18   },
    { symbol: 'DVY',   name: 'iShares Select Dividend ETF',               aumB: 18   },
    { symbol: 'SQQQ',  name: 'ProShares UltraPro Short QQQ',              aumB: 3    },
    { symbol: 'KRE',   name: 'SPDR S&P Regional Banking ETF',             aumB: 2    },
    { symbol: 'IBB',   name: 'iShares Biotechnology ETF',                 aumB: 8    },
    { symbol: 'MUB',   name: 'iShares National Muni Bond ETF',            aumB: 25   }
  ];

  // State
  var state = {
    etfs: [],
    search: '',
    sortKey: 'marketCap',
    sortDir: -1,
    loading: false,
    updatedAt: null
  };

  var els = {};

  /* ---------- Helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function fmtMoney(v) {
    if (v == null || isNaN(v)) return '—';
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6)  return '$' + (v / 1e6).toFixed(0) + 'M';
    return '$' + v.toFixed(2);
  }

  function fmtPrice(v) {
    if (v == null || isNaN(v)) return '—';
    return '$' + v.toFixed(2);
  }

  function fmtVolume(v) {
    if (v == null || isNaN(v)) return '—';
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    return v.toLocaleString();
  }

  function fmtChange(v) {
    if (v == null || isNaN(v)) return '—';
    var s = v > 0 ? '+' : '';
    return s + '$' + v.toFixed(2);
  }

  function fmtChangePct(v) {
    if (v == null || isNaN(v)) return '—';
    var s = v > 0 ? '+' : '';
    return s + v.toFixed(2) + '%';
  }

  function fmtPercent(v) {
    if (v == null || isNaN(v)) return '—';
    var s = v > 0 ? '+' : '';
    return s + v.toFixed(2) + '%';
  }

  function timeAgo(ts) {
    if (!ts) return '';
    var diff = (Date.now() - ts) / 1000;
    if (diff < 5) return 'just now';
    if (diff < 60) return Math.floor(diff) + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  function cleanName(raw) {
    if (!raw) return '—';
    return raw.replace(/ T$/, '').trim();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var map = {
      '&': '&' + 'amp;',
      '<': '&' + 'lt;',
      '>': '&' + 'gt;',
      '"': '&' + 'quot;',
      "'": '&' + '#39;'
    };
    return String(s).replace(/[&<>"']/g, function (c) { return map[c]; });
  }

  /* ---------- Data fetching ---------- */

  function parseProxyResponse(json) {
    if (!json) throw new Error('Empty response');
    if (typeof json.contents === 'string') {
      return JSON.parse(json.contents);
    }
    if (json.status && typeof json.status === 'object') {
      throw new Error('Proxy error: ' + (json.status.http_code || 'unknown'));
    }
    return json;
  }

  function fetchChartData(symbol) {
    var url = CORS_PROXY + encodeURIComponent(
      'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=1d'
    );
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(parseProxyResponse)
      .then(function (data) {
        var meta = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
        if (!meta) throw new Error('No chart data');
        var prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
        var price = meta.regularMarketPrice;
        var change = price != null && prevClose != null ? price - prevClose : null;
        var changePercent = change != null && prevClose ? (change / prevClose) * 100 : null;
        return {
          symbol: meta.symbol || symbol,
          name: cleanName(meta.shortName || meta.longName || symbol),
          price: price,
          change: change,
          changePercent: changePercent,
          volume: meta.regularMarketVolume != null ? meta.regularMarketVolume : null,
          high: meta.fiftyTwoWeekHigh != null ? meta.fiftyTwoWeekHigh : null,
          low: meta.fiftyTwoWeekLow != null ? meta.fiftyTwoWeekLow : null
        };
      });
  }

  function fetchAll(symbols, aumGetter) {
    var CONCURRENCY = 8;
    var results = [];
    var idx = 0;

    function worker() {
      if (idx >= symbols.length) return Promise.resolve();
      var i = idx++;
      var item = symbols[i];
      return fetchChartData(item.symbol)
        .then(function (d) {
          d.type = 'etf';
          d.marketCap = aumGetter(item) * 1e9;
          results.push(d);
        })
        .catch(function () {
          results.push({
            symbol: item.symbol,
            name: item.name,
            price: null,
            change: null,
            changePercent: null,
            volume: null,
            marketCap: aumGetter(item) * 1e9,
            high: null,
            low: null,
            type: 'etf'
          });
        })
        .then(worker);
    }

    var workers = [];
    for (var w = 0; w < CONCURRENCY; w++) {
      workers.push(worker());
    }
    return Promise.all(workers).then(function () { return results; });
  }

  function loadData() {
    if (state.loading) return;
    state.loading = true;
    setStatus('Loading ETF data…', true);

    var etfPromise = fetchAll(ETF_LIST, function (e) { return e.aumB; });

    etfPromise
      .then(function (etfs) {
        state.etfs = etfs;
        state.updatedAt = Date.now();
        state.etfs.sort(function (a, b) {
          return (b.marketCap || 0) - (a.marketCap || 0);
        });
        state.loading = false;
        render();
        updateStats();
      })
      .catch(function (e) {
        state.loading = false;
        setStatus('Failed to load ETF data. Refresh to retry.', false);
        console.error(e);
      });
  }

  /* ---------- Stats ---------- */

  function updateStats() {
    var etfs = state.etfs;
    if (!etfs.length) return;

    // Total AUM
    var totalAum = etfs.reduce(function (sum, e) { return sum + (e.marketCap || 0); }, 0);
    var totalAumEl = $('stat-total-aum');
    if (totalAumEl) totalAumEl.textContent = fmtMoney(totalAum);

    // Top gainer / loser by %
    var valid = etfs.filter(function (e) { return e.changePercent != null; });
    var topGainer = valid.length ? valid.reduce(function (a, b) { return a.changePercent > b.changePercent ? a : b; }) : null;
    var topLoser = valid.length ? valid.reduce(function (a, b) { return a.changePercent < b.changePercent ? a : b; }) : null;

    var gainerEl = $('stat-top-gainer');
    if (gainerEl) gainerEl.textContent = topGainer ? topGainer.symbol + ' ' + fmtPercent(topGainer.changePercent) : '—';

    var loserEl = $('stat-top-loser');
    if (loserEl) loserEl.textContent = topLoser ? topLoser.symbol + ' ' + fmtPercent(topLoser.changePercent) : '—';

    // Avg change %
    var avgChange = valid.length ? valid.reduce(function (sum, e) { return sum + e.changePercent; }, 0) / valid.length : null;
    var avgEl = $('stat-avg-change');
    if (avgEl) avgEl.textContent = avgChange != null ? fmtPercent(avgChange) : '—';
  }

  /* ---------- Rendering ---------- */

  function getFiltered() {
    var q = state.search.trim().toLowerCase();
    var all = state.etfs.slice();

    if (q) {
      all = all.filter(function (item) {
        return (item.symbol || '').toLowerCase().indexOf(q) !== -1 ||
               (item.name || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    var key = state.sortKey;
    var dir = state.sortDir;
    all = all.slice().sort(function (a, b) {
      var va = key === 'rank' ? a.marketCap : a[key];
      var vb = key === 'rank' ? b.marketCap : b[key];
      if (va == null) return -1 * dir;
      if (vb == null) return 1 * dir;
      if (typeof va === 'string') {
        return va.localeCompare(vb) * dir;
      }
      return (va - vb) * dir;
    });

    return all;
  }

  function render() {
    var all = getFiltered();
    var body = els.body;
    body.innerHTML = '';

    var rankCounter = 0;
    all.forEach(function (item) {
      rankCounter++;
      item._displayRank = rankCounter;
      var tr = document.createElement('tr');
      tr.setAttribute('data-symbol', item.symbol);
      tr.setAttribute('data-type', item.type);

      var changeCls = item.changePercent > 0 ? 'pos' : item.changePercent < 0 ? 'neg' : 'flat';

      tr.innerHTML =
        '<td class="rank">' + item._displayRank + '</td>' +
        '<td class="symbol-col">' +
          '<span class="ticker">' + escapeHtml(item.symbol) + '</span>' +
        '</td>' +
        '<td class="name-col">' + escapeHtml(item.name) + '</td>' +
        '<td class="num price">' + fmtPrice(item.price) + '</td>' +
        '<td class="num ' + changeCls + '">' + fmtChange(item.change) + '</td>' +
        '<td class="num ' + changeCls + '">' + fmtChangePct(item.changePercent) + '</td>' +
        '<td class="num muted">' + fmtVolume(item.volume) + '</td>' +
        '<td class="num marketcap">' + fmtMoney(item.marketCap) + '</td>' +
        '<td class="num muted">' + fmtPrice(item.high) + '</td>' +
        '<td class="num muted">' + fmtPrice(item.low) + '</td>';

      body.appendChild(tr);
    });

    els.count.textContent = all.length + ' ETFs';
    els.updated.textContent = state.updatedAt ? 'Updated ' + timeAgo(state.updatedAt) + ' · Yahoo Finance' : '';

    if (all.length > 0) {
      els.status.hidden = true;
      els.tableWrap.hidden = false;
    } else {
      els.status.hidden = false;
      els.tableWrap.hidden = true;
      setStatus(state.loading ? 'Loading…' : (state.search ? 'No matches found' : 'No data available'), !state.loading);
    }

    document.querySelectorAll('.etf-table th[data-sort]').forEach(function (th) {
      th.classList.toggle('sorted', th.getAttribute('data-sort') === state.sortKey);
      th.classList.toggle('asc', th.getAttribute('data-sort') === state.sortKey && state.sortDir === 1);
      th.classList.toggle('desc', th.getAttribute('data-sort') === state.sortKey && state.sortDir === -1);
    });
  }

  function setStatus(msg, isInfo) {
    if (els.status) {
      els.status.innerHTML = '';
      els.status.hidden = false;
      var icon;
      if (isInfo) {
        icon = '<div class="spinner"></div>';
      } else {
        icon = '<span class="status-icon">⚠</span>';
      }
      els.status.innerHTML = icon + '<p>' + escapeHtml(msg) + '</p>';
      if (!isInfo) {
        els.status.classList.add('error');
      } else {
        els.status.classList.remove('error');
      }
    }
  }

  /* ---------- Events ---------- */

  function initEvents() {
    var searchTimer;
    els.search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.search = els.search.value;
        render();
      }, 200);
    });

    els.refresh.addEventListener('click', function () {
      loadData();
    });

    document.querySelectorAll('.etf-table th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        if (state.sortKey === key) {
          state.sortDir *= -1;
        } else {
          state.sortKey = key;
          state.sortDir = 1;
        }
        render();
      });
    });

    var navToggle = $('nav-toggle');
    var nav = $('nav');
    if (navToggle && nav && !navToggle.dataset.etfBound) {
      navToggle.dataset.etfBound = '1';
      navToggle.addEventListener('click', function () {
        nav.classList.toggle('open');
      });
    }
  }

  /* ---------- Init ---------- */

  function init() {
    els.body = $('stocks-body');
    els.status = $('stocks-status');
    els.tableWrap = $('stocks-table-wrap');
    els.count = $('stocks-count');
    els.updated = $('stocks-updated');
    els.search = $('search-input');
    els.refresh = $('refresh-btn');

    if (!els.body) return;

    var yearEl = $('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initEvents();
    loadData();

    // Auto-refresh every 60 seconds
    setInterval(loadData, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();