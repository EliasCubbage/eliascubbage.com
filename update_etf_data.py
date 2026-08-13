#!/usr/bin/env python3
"""Fetch top-50 ETF prices from Yahoo Finance (server-side) and write etf-data.json.

Run from GitHub Actions (or locally) to refresh the static ETF data file.
"""

import json
import os
import sys
import urllib.request

# Top 50 ETFs: symbol -> AUM (B USD). Kept in sync with ETF_LIST in etf.js.
ETF_AUM = {
    "VOO": 1255, "IVV": 1190, "SPY": 655, "VTI": 520, "QQQ": 335,
    "VTV": 110, "VXUS": 92, "BND": 108, "AGG": 105, "VEA": 60,
    "VIG": 90, "SCHD": 75, "VUG": 70, "IEFA": 100, "IJR": 80,
    "IWM": 65, "VYM": 65, "XLF": 42, "XLK": 80, "XLE": 38,
    "XLV": 40, "VGT": 85, "GLD": 78, "VWO": 85, "IWF": 88,
    "VHT": 30, "EFA": 47, "IWD": 65, "TLT": 47, "QQQM": 45,
    "VNQ": 28, "VT": 50, "DIA": 35, "IEMG": 70, "LQD": 30,
    "JEPI": 40, "TQQQ": 20, "SHY": 15, "XLY": 25, "XLP": 16,
    "HYG": 16, "IEF": 22, "XLI": 20, "SPYG": 20, "XBI": 7,
    "GDX": 16, "XLC": 15, "BIL": 40, "VB": 65, "SPYV": 10,
}

# Fallback display names (only used if Yahoo omits names).
ETF_NAMES = {
    "VOO": "Vanguard S&P 500 ETF",
    "IVV": "iShares Core S&P 500 ETF",
    "SPY": "State Street SPDR S&P 500 ETF Trust",
    "VTI": "Vanguard Total Stock Market ETF",
    "QQQ": "Invesco QQQ Trust",
    "VTV": "Vanguard Value ETF",
    "VXUS": "Vanguard Total International Stock ETF",
    "BND": "Vanguard Total Bond Market ETF",
    "AGG": "iShares Core U.S. Aggregate Bond ETF",
    "VEA": "Vanguard FTSE Developed Markets ETF",
    "VIG": "Vanguard Dividend Appreciation ETF",
    "SCHD": "Schwab U.S. Dividend Equity ETF",
    "VUG": "Vanguard Growth ETF",
    "IEFA": "iShares Core MSCI EAFE ETF",
    "IJR": "iShares Core S&P Small-Cap ETF",
    "IWM": "iShares Russell 2000 ETF",
    "VYM": "Vanguard High Dividend Yield ETF",
    "XLF": "Financial Select Sector SPDR",
    "XLK": "Technology Select Sector SPDR",
    "XLE": "Energy Select Sector SPDR",
    "XLV": "Health Care Select Sector SPDR",
    "VGT": "Vanguard Information Technology ETF",
    "GLD": "SPDR Gold Shares",
    "VWO": "Vanguard FTSE Emerging Markets ETF",
    "IWF": "iShares Russell 1000 Growth ETF",
    "VHT": "Vanguard Health Care ETF",
    "EFA": "iShares MSCI EAFE ETF",
    "IWD": "iShares Russell 1000 Value ETF",
    "TLT": "iShares 20+ Year Treasury Bond ETF",
    "QQQM": "Invesco NASDAQ 100 ETF",
    "VNQ": "Vanguard Real Estate ETF",
    "VT": "Vanguard Total World Stock ETF",
    "DIA": "SPDR Dow Jones Industrial Average ETF",
    "IEMG": "iShares Core MSCI Emerging Markets ETF",
    "LQD": "iShares iBoxx Investment Grade Bond",
    "JEPI": "JPMorgan Equity Premium Income ETF",
    "TQQQ": "ProShares UltraPro QQQ",
    "SHY": "iShares 1-3 Year Treasury Bond ETF",
    "XLY": "Consumer Discretionary Select SPDR",
    "XLP": "Consumer Staples Select Sector SPDR",
    "HYG": "iShares iBoxx High Yield Corporate Bond",
    "IEF": "iShares 7-10 Year Treasury Bond ETF",
    "XLI": "Industrial Select Sector SPDR",
    "SPYG": "SPDR Portfolio S&P 500 Growth ETF",
    "XBI": "SPDR S&P Biotech ETF",
    "GDX": "VanEck Gold Miners ETF",
    "XLC": "Communication Services Select SPDR",
    "BIL": "SPDR Bloomberg 1-3 Month T-Bill ETF",
    "VB": "Vanguard Small-Cap ETF",
    "SPYV": "SPDR Portfolio S&P 500 Value ETF",
}

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def clean_name(raw):
    if not raw:
        return None
    return raw.strip()


def fetch_batch(symbols):
    """Fetch a batch of up to 20 symbols from Yahoo spark endpoint."""
    url = "https://query1.finance.yahoo.com/v7/finance/spark?symbols=" + \
          ",".join(symbols) + "&range=1d&interval=1d"
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    results = ((data or {}).get("spark") or {}).get("result") or []
    out = {}
    for entry in results:
        sym = entry.get("symbol")
        meta = ((entry.get("response") or [{}])[0]).get("meta") or {}
        if not sym or not meta:
            continue
        price = meta.get("regularMarketPrice")
        prev_close = meta.get("chartPreviousClose") or price
        change = (price - prev_close) if (price is not None and prev_close is not None) else None
        change_pct = (change / prev_close * 100) if (change is not None and prev_close) else None
        out[sym] = {
            "name": ETF_NAMES.get(sym, sym),
            "price": price,
            "change": round(change, 4) if change is not None else None,
            "changePercent": round(change_pct, 4) if change_pct is not None else None,
            "volume": meta.get("regularMarketVolume"),
            "high": meta.get("fiftyTwoWeekHigh"),
            "low": meta.get("fiftyTwoWeekLow"),
        }
    return out


def main():
    symbols = list(ETF_AUM.keys())

    # Yahoo limits spark to 20 symbols per request.
    batches = [symbols[i:i+20] for i in range(0, len(symbols), 20)]

    merged = {}
    for batch in batches:
        try:
            merged.update(fetch_batch(batch))
        except Exception as e:
            print("Warning: batch fetch failed:", e, file=sys.stderr)

    # Build final etf list, preserving AUM order.
    etfs = []
    for sym in symbols:
        entry = merged.get(sym, {})
        etfs.append({
            "symbol": sym,
            "name": entry.get("name") or ETF_NAMES.get(sym, sym),
            "price": entry.get("price"),
            "change": entry.get("change"),
            "changePercent": entry.get("changePercent"),
            "volume": entry.get("volume"),
            "high": entry.get("high"),
            "low": entry.get("low"),
            "marketCap": ETF_AUM[sym] * 1e9,
            "type": "etf",
        })

    payload = {
        "updatedAt": int(__import__("time").time() * 1000),
        "etfs": etfs,
    }

    with open("etf-data.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    print(f"Wrote {len(etfs)} ETFs to etf-data.json")


if __name__ == "__main__":
    main()