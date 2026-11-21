
const PAIRS = [
  "EURUSD_otc",
  "GBPUSD_otc",
  "USDJPY_otc",
  "BTCUSD_otc",
  "AUDUSD_otc"
];

function ema(values, period) {
  const k = 2 / (period + 1);
  let result = values[0];

  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }
  return result;
}

function rsi(values, period = 14) {
  let gain = 0, loss = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gain += change;
    else loss -= change;
  }

  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

function analyze(candles) {
  if (candles.length < 30) return "WAIT";

  const closes = candles.map(c => Number(c.close));
  if (closes.some(v => !Number.isFinite(v))) return "WAIT";

  const fast = ema(closes, 9);
  const slow = ema(closes, 21);
  const strength = rsi(closes);

  if (fast > slow && strength > 52 && strength < 70) return "UP";
  if (fast < slow && strength < 48 && strength > 30) return "DOWN";

  return "WAIT";
}

export default async function handler() {
  const key = process.env.OTCHARTS_API_KEY;

  if (!key) {
    return Response.json({
      status: "error",
      message: "OTCHARTS_API_KEY Netlify te set kora nai"
    }, { status: 500 });
  }

  const signals = [];

  for (const pair of PAIRS) {
    try {
      const url = new URL("https://otcharts.com/v1/candles");
      url.searchParams.set("venue", "quotex");
      url.searchParams.set("symbol", pair);
      url.searchParams.set("tf", "60");
      url.searchParams.set("limit", "100");

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` }
      });

      const raw = await response.text();

      if (!response.ok) {
        signals.push({
          pair,
          signal: "ERROR",
          time: "--:--",
          error: `HTTP ${response.status}: ${raw.slice(0, 300)}`
        });
        continue;
      }

      const data = JSON.parse(raw);
      const candles = data.candles || [];

      const last = candles[candles.length - 1];
      const time = last?.time
        ? new Date(last.time * 1000).toLocaleTimeString("en-GB", {
            timeZone: "Asia/Dhaka",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          })
        : "--:--";

      signals.push({
        pair: pair.replace("_otc", "-OTC"),
        time,
        signal: analyze(candles),
        candles: candles.length
      });

    } catch (error) {
      signals.push({
        pair,
        signal: "ERROR",
        time: "--:--",
        error: error.message
      });
    }
  }

  return Response.json({
    status: "checked",
    market: "QUOTEX OTC",
    timeframe: "M1",
    signals
  });
}
