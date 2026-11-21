

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QUOTEX AI</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#080d18;color:#edf2fa;font-family:Arial,sans-serif}
header{padding:20px;background:#111a2b;border-bottom:1px solid #26344b}
h1{margin:0;color:#36d6a2;font-size:25px}
header p,.muted{color:#93a2b8;font-size:12px}
main{max-width:1000px;margin:auto;padding:15px}
nav{display:flex;gap:8px;overflow:auto;padding:12px 0}
button{background:#19263b;color:white;border:1px solid #34435d;padding:11px 14px;border-radius:9px;white-space:nowrap}
.card{background:#111a2b;border:1px solid #293851;border-radius:13px;padding:16px;margin:10px 0}
h3{font-size:14px;color:#aab8cb}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.value{font-size:20px;font-weight:bold}
.status{color:#ffc46b}
section[hidden]{display:none}
footer{text-align:center;padding:25px;color:#7e8ca2;font-size:12px}
@media(min-width:700px){.grid{grid-template-columns:repeat(4,1fr)}}
</style>
</head>
<body>
<header>
<h1>◈ QUOTEX AI</h1>
<p>LIVE MARKET DATA & EDUCATIONAL ANALYSIS</p>
</header>
<main>
<div class="card">
<strong>DATA CONNECTION:</strong>
<span class="status"> NOT CONNECTED</span>
<p class="muted">Verified market API required. No simulated prices are displayed.</p>
<strong id="clock">Bangladesh Time: --</strong>
</div>
<nav>
<button onclick="page('home')">Overview</button>
<button onclick="page('market')">Market</button>
<button onclick="page('scanner')">Scanner</button>
<button onclick="page('news')">News</button>
<button onclick="page('history')">History</button>
<button onclick="page('settings')">Settings</button>
</nav>
<section id="home">
<div class="grid">
<div class="card"><h3>LIVE PAIRS</h3><div class="value">--</div><p class="muted">API unavailable</p></div>
<div class="card"><h3>MARKET STATUS</h3><div class="value">--</div><p class="muted">Awaiting data</p></div>
<div class="card"><h3>NEWS STATUS</h3><div class="value">--</div><p class="muted">News API required</p></div>
<div class="card"><h3>DATA QUALITY</h3><div class="value">UNKNOWN</div><p class="muted">Not connected</p></div>
</div>
<div class="card"><h3>MARKET OVERVIEW</h3><p class="muted">Live analysis will appear after a verified data source is connected.</p></div>
</section>
<section id="market" hidden>
<div class="card"><h3>MARKET ANALYSIS</h3>
<p>Currency pair: --</p><p>Live price: --</p>
<p>RSI: --</p><p>MACD: --</p><p>EMA: --</p>
<p>Volatility: --</p><p>Trend: DATA UNAVAILABLE</p>
<p class="muted">Indicators require verified historical price data.</p>
</div></section>
<section id="scanner" hidden>
<div class="card"><h3>SMART SCANNER</h3>
<p class="muted">No verified currency feed connected.</p>
</div></section>
<section id="news" hidden>
<div class="card"><h3>ECONOMIC NEWS</h3>
<p class="muted">Connect a verified economic calendar source to display real events.</p>
</div></section>
<section id="history" hidden>
<div class="card"><h3>ANALYSIS HISTORY</h3>
<p class="muted">No verified records yet.</p></div>
</section>
<section id="settings" hidden>
<div class="card"><h3>SETTINGS</h3>
<p>Timezone: Bangladesh (UTC+6)</p>
<p>Data policy: Verified sources only</p>
<p>OTC: Unavailable until verified source is found</p>
</div></section>
</main>
<footer>QUOTEX AI • Educational Market Analysis • No guaranteed predictions</footer>
<script>
function page(id){
document.querySelectorAll('main section').forEach(x=>x.hidden=true);
document.getElementById(id).hidden=false;
}
function clock(){
document.getElementById('clock').textContent='Bangladesh Time: '+new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Dhaka'});
}
clock();setInterval(clock,1000);
</script>
</body>
</html>
