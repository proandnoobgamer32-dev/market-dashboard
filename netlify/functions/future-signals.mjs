
const PAIRS = [
  "EURUSD_otc",
  "GBPUSD_otc",
  "USDJPY_otc",
  "BTCUSD_otc",
  "AUDUSD_otc"
];

const BASE = "https://otcharts.com";

function bdTime(timestamp = Date.now()) {
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

  if (gains === 0 && losses === 0) return 50;
  if (losses === 0) return 100;
  if (gains === 0) return 0;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function analyze(candles) {
  if (!Array.isArray(candles) || candles.length < 30) {
    return "WAIT";
  }

  const sorted = [...candles].sort(
    (a, b) => Number(a.time) - Number(b.time)
  );

  const closes = sorted.map(c => Number(c.close));

  if (closes.some(v => !Number.isFinite(v))) {
    return "WAIT";
  }

  const fast = ema(closes, 9);
  const slow = ema(closes, 21);
  const strength = rsi(closes, 14);

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
    throw new Error(
      `Invalid API response. HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${
        data.error || data.message || "API request failed"
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
      message: "OTCHARTS_API_KEY missing in Netlify"
    }, { status: 500 });
  }

  const signals = [];

  for (const pair of PAIRS) {
    try {
      const params = new URLSearchParams({
        venue: "quotex",
        symbol: pair,
        tf: "60",
        limit: "100"
      });

      const data = await apiGet(
        `/v1/candles?${params.toString()}`,
        key
      );

      const candles = data.candles;

      if (!Array.isArray(candles) || candles.length === 0) {
        throw new Error("No candle data received");
      }

      const sorted = [...candles].sort(
        (a, b) => Number(a.time) - Number(b.time)
      );

      const last = sorted[sorted.length - 1];

      signals.push({
        pair: pair.replace("_otc", "-OTC"),
        time: bdTime(Date.now()),
        candleTime: bdTime(last.time),
        signal: analyze(sorted),
        candles: sorted.length,
        price: Number(last.close),
        error: null
      });

    } catch (error) {
      signals.push({
        pair: pair.replace("_otc", "-OTC"),
        time: bdTime(Date.now()),
        candleTime: "--:--",
        signal: "ERROR",
        candles: 0,
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
}
