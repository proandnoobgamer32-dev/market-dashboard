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
  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  if (losses === 0) return 100;

  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

function analyze(candles) {
  if (!Array.isArray(candles) || candles.length < 30) {
    return "WAIT";
  }

  const closes = candles.map(c => Number(c.close));
  if (closes.some(v => !Number.isFinite(v))) return "WAIT";

  const fast = ema(closes, 9);
  const slow = ema(closes, 21);
  const strength = rsi(closes);

  if (fast > slow && strength > 52 && strength < 70) {
    return "UP";
  }

  if (fast < slow && strength < 48 && strength > 30) {
    return "DOWN";
  }

  return "WAIT";
}

export default async (request) => {
  try {
    const key = process.env.OTCHARTS_API_KEY;

    if (!key) {
      return Response.json({
        status: "error",
        message: "OTCHARTS_API_KEY missing"
      }, { status: 500 });
    }

    const signals = [];

    for (const pair of PAIRS) {
      const url = new URL("https://otcharts.com/v1/candles");

      url.searchParams.set("venue", "quotex");
      url.searchParams.set("symbol", pair);
      url.searchParams.set("tf", "60");
      url.searchParams.set("limit", "100");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${key}`
        }
      });

      if (!response.ok) {
        signals.push({
          pair: pair.replace("_otc", "-OTC"),
          time: "--:--",
          signal: "WAIT"
        });
        continue;
      }

      const data = await response.json();
      const signal = analyze(data.candles || []);

      signals.push({
        pair: pair.replace("_otc", "-OTC"),
        time: new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(new Date()),
        signal
      });
    }

    return Response.json({
      status: "connected",
      market: "QUOTEX OTC",
      timeframe: "M1",
      signals
    });

  } catch (error) {
    return Response.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
};
