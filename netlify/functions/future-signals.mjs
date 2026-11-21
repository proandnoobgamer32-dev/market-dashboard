
const PAIRS = [
  "EURUSD_otc",
  "GBPUSD_otc",
  "USDJPY_otc",
  "BTCUSD_otc",
  "AUDUSD_otc"
];

const BASE = "https://otcharts.com";

function bdTime(timestamp) {
  if (!timestamp) return "--:--";

  let value = Number(timestamp);
  if (!Number.isFinite(value)) {
    value = Date.parse(timestamp);
  } else if (value < 100000000000) {
    value *= 1000;
  }

  if (!Number.isFinite(value)) return "--:--";

  return new Date(value).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function ema(values, period) {
  const k = 2 / (period + 1);
  let result = values[0];

  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }

  return result;
}

function rsi(values, period = 14) {
  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];

    if (change > 0) gains += change;
    else losses -= change;
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function analyze(candles) {
  if (!Array.isArray(candles) || candles.length < 30) {
    return "WAIT";
  }

  const closes = candles.map(c => Number(c.close));

  if (closes.some(v => !Number.isFinite(v))) {
    return "WAIT";
  }

  const fast = ema(closes, 9);
  const slow = ema(closes, 21);
  const strength = rsi(closes);

  if (fast > slow && strength >= 52 && strength < 70) {
    return "UP";
  }

  if (fast < slow && strength <= 48 && strength > 30) {
    return "DOWN";
  }

  return "WAIT";
}

async function apiGet(path, key) {
  const response = await fetch(BASE + path, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    }
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("API returned invalid JSON");
  }

  if (!response.ok) {
    throw new Error(
      `API HTTP ${response.status}: ${
        data.message || data.error || raw.slice(0, 200)
      }`
    );
  }

  return data;
}

export default async function handler() {
  const key = process.env.OTCHARTS_API_KEY;

  if (!key) {
    return Response.json({
      status: "error",
      message: "Netlify OTCHARTS_API_KEY missing"
    }, { status: 500 });
  }

  try {
    // Check which market book this key can access
    const venueData = await apiGet("/v1/venues", key);

    const venues = venueData.venues || [];
    const quotex = venues.find(v => v.id === "quotex");

    if (!quotex || !quotex.open) {
      return Response.json({
        status: "error",
        message: "Your API key does not have Quotex venue access",
        venues
      }, { status: 403 });
    }

    // Get the actual available Quotex symbols
    const symbolData = await apiGet(
      "/v1/symbols?venue=quotex",
      key
    );

    const available = new Set(
      (symbolData.symbols || []).map(s => s.symbol)
    );

    const signals = [];

    for (const pair of PAIRS) {
      try {
        if (!available.has(pair)) {
          signals.push({
            pair: pair.replace("_otc", "-OTC"),
            time: "--:--",
            signal: "NO DATA",
            error: "Symbol not available in Quotex catalogue"
          });
          continue;
        }

        const query = new URLSearchParams({
          venue: "quotex",
          symbol: pair,
          tf: "60",
          limit: "100"
        });

        const data = await apiGet(
          `/v1/candles?${query.toString()}`,
          key
        );

        const candles = data.candles || [];

        if (!candles.length) {
          signals.push({
            pair: pair.replace("_otc", "-OTC"),
            time: "--:--",
            signal: "NO DATA",
            error: "No candles returned by API"
          });
          continue;
        }

        const last = candles[candles.length - 1];

        signals.push({
          pair: pair.replace("_otc", "-OTC"),
          time: bdTime(last.time),
          signal: analyze(candles),
          candles: candles.length
        });

      } catch (error) {
        signals.push({
          pair: pair.replace("_otc", "-OTC"),
          time: "--:--",
          signal: "ERROR",
          error: error.message
        });
      }
    }

    return Response.json({
      status: "connected",
      market: "QUOTEX OTC",
      timeframe: "M1",
      zone: "UTC+06:00",
      signals
    });

  } catch (error) {
    return Response.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
