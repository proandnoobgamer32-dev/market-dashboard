
export default async (request) => {
  const API_KEY = process.env.TWELVE_DATA_API_KEY;

  if (!API_KEY) {
    return Response.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "EUR/USD";

  const allowed = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "AUD/USD",
    "USD/CAD",
    "USD/CHF",
    "NZD/USD"
  ];

  if (!allowed.includes(symbol)) {
    return Response.json(
      { error: "Unsupported symbol" },
      { status: 400 }
    );
  }

  try {
    const apiUrl = new URL(
      "https://api.twelvedata.com/price"
    );

    apiUrl.searchParams.set("symbol", symbol);
    apiUrl.searchParams.set("apikey", API_KEY);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.status === "error" || !data.price) {
      return Response.json(
        { error: data.message || "Market data unavailable" },
        { status: 502 }
      );
    }

    return Response.json({
      symbol,
      price: Number(data.price),
      source: "Twelve Data",
      status: "connected"
    });

  } catch (error) {
    return Response.json(
      { error: "Unable to fetch market data" },
      { status: 500 }
    );
  }
};
