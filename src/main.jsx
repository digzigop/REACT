import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldData from "world-atlas/countries-50m.json";
import "./styles.css";

const ASEAN = [
  { name: "Brunei", code: "BRN", mapId: "096", center: [114.7, 4.6], risk: "Medium", priority: 46, affected: 4200, deaths: 18, homes: 630, need: "Shelter & water", update: "Flood risk monitored" },
  { name: "Cambodia", code: "KHM", mapId: "116", center: [104.9, 12.6], risk: "High", priority: 72, affected: 38700, deaths: 41, homes: 5200, need: "Food & clean water", update: "River levels rising" },
  { name: "Indonesia", code: "IDN", mapId: "360", center: [117.0, -2.5], risk: "Critical", priority: 91, affected: 142000, deaths: 184, homes: 24800, need: "Medical & shelter", update: "Multiple sites affected" },
  { name: "Laos", code: "LAO", mapId: "418", center: [103.8, 18.2], risk: "High", priority: 69, affected: 29600, deaths: 27, homes: 4100, need: "Food & medicine", update: "Road access limited" },
  { name: "Malaysia", code: "MYS", mapId: "458", center: [109.7, 4.2], risk: "Medium", priority: 52, affected: 11800, deaths: 9, homes: 1700, need: "Water & transport", update: "Localized flooding" },
  { name: "Myanmar", code: "MMR", mapId: "104", center: [96.7, 20.9], risk: "Critical", priority: 95, affected: 218000, deaths: 312, homes: 41200, need: "Emergency medical aid", update: "Severe humanitarian need" },
  { name: "Philippines", code: "PHL", mapId: "608", center: [122.5, 12.2], risk: "Critical", priority: 88, affected: 186500, deaths: 226, homes: 31900, need: "Food, water & shelter", update: "Typhoon response active" },
  { name: "Singapore", code: "SGP", mapId: "702", center: [103.82, 1.35], risk: "Low", priority: 18, affected: 1800, deaths: 1, homes: 80, need: "Monitoring", update: "No major disruption" },
  { name: "Thailand", code: "THA", mapId: "764", center: [101.0, 15.0], risk: "High", priority: 63, affected: 52100, deaths: 38, homes: 8300, need: "Water & sanitation", update: "Flood response ongoing" },
  { name: "Timor-Leste", code: "TLS", mapId: "626", center: [125.9, -8.8], risk: "Medium", priority: 49, affected: 7600, deaths: 12, homes: 920, need: "Food & shelter", update: "Needs assessment active" },
  { name: "Vietnam", code: "VNM", mapId: "704", center: [107.8, 15.8], risk: "Critical", priority: 82, affected: 109400, deaths: 117, homes: 17300, need: "Shelter & medical", update: "Storm impacts expanding" }
];

const countryZoom = { SGP: 16000, BRN: 5000, TLS: 5000 };
const riskClass = (risk) => risk.toLowerCase();

function CountryMap({ country, active = false, dashboard = false, sites = [], onCountryClick}) {
  const scale = dashboard ? (countryZoom[country.code] ?? 720) : (countryZoom[country.code] ? (active ? countryZoom[country.code] : countryZoom[country.code] * 0.7) : (active ? 850 : 620));
  const width = dashboard ? 820 : active ? 520 : 300;
  const height = dashboard ? 430 : active ? 350 : 230;

  return (
    <div className={`country-map ${active ? "active" : ""} ${dashboard ? "dashboard-map" : ""}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: country.center, scale }}
        width={width}
        height={height}
      >
        <defs>
          <filter id={`glow-${country.code}-${dashboard ? "dash" : "hero"}`}>
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`siteGlow-${country.code}`}>
            <stop offset="0%" stopColor="#ff5a3d" stopOpacity=".85" />
            <stop offset="100%" stopColor="#ff5a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Geographies geography={worldData}>
          {({ geographies }) => geographies.map((geo) => {
            const geoId = String(geo.id).padStart(3, "0");
            const isTarget = geoId === String(country.mapId).padStart(3, "0");
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick = {() => {
                  if(isTarget && onCountryClick){
                    onCountryClick(country.code);
                  }
                }}
                style={{
                  default: {
                    fill: isTarget ? (active || dashboard ? "#1677ff" : "#123f78") : "rgba(255,255,255,0.025)",
                    stroke: isTarget ? (active || dashboard ? "#ffffff" : "rgba(116,183,255,.35)") : "rgba(255,255,255,.02)",
                    strokeWidth: isTarget ? (active || dashboard ? 1.7 : .9) : .25,
                    outline: "none",
                    filter: isTarget && (active || dashboard) ? `url(#glow-${country.code}-${dashboard ? "dash" : "hero"})` : "none"
                  },
                  hover: { fill: isTarget ? "#2388ff" : "rgba(255,255,255,.025)", stroke: isTarget ? "#fff" : "rgba(255,255,255,.02)", outline: "none" },
                  pressed: { fill: isTarget ? "#2388ff" : "rgba(255,255,255,.025)", outline: "none" }
                }}
              />
            );
          })}
        </Geographies>
        {dashboard && sites.map((site) => (
          <Marker key={site.id} coordinates={site.coords}>
            <circle r="14" fill={`url(#siteGlow-${country.code})`} opacity=".55" />
            <circle r="6" fill={site.score >= 75 ? "#ff4f37" : site.score >= 50 ? "#ffb34f" : "#47d79a"} stroke="#fff" strokeWidth="2" />
            <text textAnchor="middle" y="-13" className="map-marker-label">{site.short}</text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}

function Arrow({ direction, onClick }) {
  return <button className="carousel-arrow" onClick={onClick} aria-label={`${direction} country`}>{direction === "left" ? "‹" : "›"}</button>;
}

function App() {
  const [index, setIndex] = useState(6);
  const [showDashboard, setShowDashboard] = useState(false);

  const [direction, setDirection] = useState("next");
  const [transitioning, setTransitioning] = useState(false);
  const [incomingIndex, setIncomingIndex] = useState(null);

  const selected = ASEAN[index];

  const visibleCountries = useMemo(() => ({
    previous: ASEAN[(index - 1 + ASEAN.length) % ASEAN.length],
    selected,
    next: ASEAN[(index + 1) % ASEAN.length]
  }), [index, selected]);

  const incomingCountries = useMemo(() => {
    if (incomingIndex === null) return null;

    const incomingSelected = ASEAN[incomingIndex];

    return {
      previous: ASEAN[(incomingIndex - 1 + ASEAN.length) % ASEAN.length],
      selected: incomingSelected,
      next: ASEAN[(incomingIndex + 1) % ASEAN.length]
    };
  }, [incomingIndex]);

  const move = (step) => {
    if (transitioning) return;

    const nextIndex =
      (index + step + ASEAN.length) % ASEAN.length;

    setDirection(step > 0 ? "next" : "prev");
    setIncomingIndex(nextIndex);
    setTransitioning(true);

    window.setTimeout(() => {
      setIndex(nextIndex);
      setIncomingIndex(null);
      setTransitioning(false);
    }, 500);
  };

  const selectCountry = (code) => {
    const targetIndex = ASEAN.findIndex(
      (country) => country.code === code
    );

    if (targetIndex === -1 || targetIndex === index || transitioning) {
      return;
    }

    move(targetIndex - index);
  };

  return (
    <main className="app-shell">
      <div className="noise" />
      <header className="topbar">
        <div className="brand">
          <img src="/react-logo.png" alt="REACT logo" />
          <div><strong>REACT</strong><span>Relief & Emergency Allocation Coordination Technology</span></div>
        </div>
        <div className="status-pill"><span className="status-dot" /> PROTOTYPE • ASEAN REGION</div>
      </header>

      {!showDashboard ? (
        <section className="landing">
          <div className="globe-orbit orbit-one" /><div className="globe-orbit orbit-two" /><div className="globe-core" />
          <div className="hero-copy">
            <div className="eyebrow">AI-ASSISTED DISASTER RELIEF INTELLIGENCE</div>
            <h1>From disaster data<br />to smarter relief decisions.</h1>
            <p>REACT combines verified disaster information, needs assessment, dynamic priority scoring and resource availability to help responders decide what should go where — and when.</p>
          </div>

          <div className="country-carousel">
  <Arrow
    direction="left"
    onClick={() => move(-1)}
  />

  <div className={`country-stage-container ${transitioning ? "is-transitioning" : ""}`}>

    {/* CURRENT COUNTRY STAGE */}
    <div className={`country-stage current-stage ${transitioning ? `transition-out-${direction}` : ""}`}>

      <div
        className="side-country left"
        onClick={() => move(-1)}
      style={{ cursor: "pointer" }}
    >
      <CountryMap country={visibleCountries.previous} />
      <span>{visibleCountries.previous.name}</span>
</div>

      <div className="center-country">
        <CountryMap
          country={visibleCountries.selected}
          active
        />

        <div className="country-label">
          <span>SELECTED REGION</span>
          <h2>{visibleCountries.selected.name}</h2>

          <div className={`risk-tag ${riskClass(selected.risk)}`}>
            {selected.risk.toUpperCase()} PRIORITY
          </div>
        </div>
      </div>

      <div
        className="side-country right"
        onClick={() => move(1)}
        style={{ cursor: "pointer" }}
      >
        <CountryMap country={visibleCountries.next} />
        <span>{visibleCountries.next.name}</span>
      </div>

    </div>


    {/* INCOMING COUNTRY STAGE */}
    {incomingCountries && (
      <div className={`country-stage incoming-stage transition-in-${direction}`}>

        <div
  className="side-country left"
  onClick={() => move(-1)}
  style={{ cursor: "pointer" }}
>
  <CountryMap country={incomingCountries.previous} />
  <span>{incomingCountries.previous.name}</span>
</div>

        <div className="center-country">
          <CountryMap
            country={incomingCountries.selected}
            active
          />

          <div className="country-label">
            <span>SELECTED REGION</span>
            <h2>{incomingCountries.selected.name}</h2>

            <div className={`risk-tag ${riskClass(incomingCountries.selected.risk)}`}>
              {incomingCountries.selected.risk.toUpperCase()} PRIORITY
            </div>
          </div>
        </div>

        <div
  className="side-country right"
  onClick={() => selectCountry(incomingCountries.next.code)}
  style={{ cursor: "pointer" }}
>
  <CountryMap country={incomingCountries.next} />
  <span>{incomingCountries.next.name}</span>
</div>

      </div>
    )}

  </div>

  <Arrow
    direction="right"
    onClick={() => move(1)}
  />
</div>

          <div className="brand-lockup"><div className="wordmark">RE<span>A</span>CT</div><div className="slogan">when disaster strikes, <b>REACT</b></div></div>
          <button className="enter-button" onClick={() => setShowDashboard(true)}>Open Command Center <span>→</span></button>
          <div className="carousel-hint"><span>←</span> Browse ASEAN countries <span>→</span></div>
        </section>
      ) : <Dashboard country={selected} onBack={() => setShowDashboard(false)} />}

      <footer className="footer"><span>REACT • Decision support, not autonomous deployment.</span><span>AI recommends. Humans decide.</span></footer>
    </main>
  );
}

const baseSites = [
  { id: 1, short: "A", name: "Site A — Coastal District", casualties: 1000, homes: 1240, aid: 72, budget: 61, workforce: 45, urgency: 92, vulnerability: 86, access: 58, coords: [121.7, 14.4] },
  { id: 2, short: "B", name: "Site B — River Community", casualties: 30, homes: 180, aid: 12, budget: 8, workforce: 15, urgency: 61, vulnerability: 72, access: 80, coords: [120.6, 15.1] },
  { id: 3, short: "C", name: "Site C — Mountain Barangays", casualties: 420, homes: 690, aid: 38, budget: 24, workforce: 32, urgency: 84, vulnerability: 79, access: 36, coords: [121.0, 16.4] }
];

function scoreSite(site, maxCasualties, maxHomes) {
  const impact = ((site.casualties / maxCasualties) * 0.65 + (site.homes / maxHomes) * 0.35) * 100;
  const unmet = ((100 - site.aid) * 0.55 + (100 - site.budget) * 0.2 + (100 - site.workforce) * 0.25);
  const accessibilityNeed = 100 - site.access;
  const score = impact * 0.35 + unmet * 0.30 + site.urgency * 0.20 + site.vulnerability * 0.10 + accessibilityNeed * 0.05;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function Dashboard({ country, onBack }) {
  const [sites, setSites] = useState(baseSites);
  const [toast, setToast] = useState("");
  const [lastAction, setLastAction] = useState("Waiting for an allocation decision");
  const [simulationTick, setSimulationTick] = useState(0);

  const ranked = useMemo(() => {
    const maxCasualties = Math.max(...sites.map(s => s.casualties), 1);
    const maxHomes = Math.max(...sites.map(s => s.homes), 1);
    return sites.map(site => ({ ...site, score: scoreSite(site, maxCasualties, maxHomes) })).sort((a, b) => b.score - a.score);
  }, [sites]);

  const flash = (message) => {
    setToast(message);
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => setToast(""), 3200);
  };

  const dispatchAid = (id) => {
    const target = sites.find(s => s.id === id);
    if (!target) return;
    setSites(current => current.map(site => site.id === id ? {
      ...site,
      aid: Math.min(100, site.aid + 20),
      budget: Math.min(100, site.budget + 10),
      workforce: Math.min(100, site.workforce + 15)
    } : site));
    setLastAction(`Allocation simulated for ${target.name}. Priority recalculated.`);
    flash(`Aid allocation recorded for ${target.short}. Priority will recalculate.`);
  };

  const simulateReport = () => {
    setSimulationTick(t => t + 1);
    setSites(current => current.map((site, i) => i === 1 ? {
      ...site,
      casualties: site.casualties + 45,
      homes: site.homes + 120,
      urgency: Math.min(100, site.urgency + 12)
    } : site));
    setLastAction("New field report ingested: Site B needs increased.");
    flash("New verified field report simulated. Priority queue updated.");
  };

  const resetSimulation = () => {
    setSites(baseSites);
    setSimulationTick(0);
    setLastAction("Simulation reset to baseline conditions.");
    flash("Priority simulation reset.");
  };

  const top = ranked[0];
  const topCountryPriority = Math.max(...ranked.map(s => s.score));
  const totalAid = Math.round(sites.reduce((sum, s) => sum + s.aid, 0) / sites.length);
  const dashboardCountry = country.code === "PHL" ? country : { ...country, center: country.center };

  return (
    <section className="dashboard">
      <button className="back-button" onClick={onBack}>← ASEAN overview</button>
      <div className="dashboard-header">
        <div><div className="eyebrow">REACT COMMAND CENTER</div><h1>{country.name} <span>• Decision Support Prototype</span></h1><p>REACT continuously reassesses need, impact, accessibility and aid coverage so limited resources can be redirected as the situation changes.</p></div>
        <div className="ai-state"><span className="status-dot" /> EXPLAINABLE AI ENGINE</div>
      </div>

      <div className="metric-grid">
        <Metric title="Affected population" value={country.affected.toLocaleString()} change="Verified / simulated" />
        <Metric title="Reported deaths" value={country.deaths.toLocaleString()} change="Impact indicator" />
        <Metric title="Homes damaged" value={country.homes.toLocaleString()} change="Impact indicator" />
        <Metric title="Highest site priority" value={`${topCountryPriority}/100`} change={topCountryPriority >= 75 ? "CRITICAL" : "MONITOR"} />
      </div>

      <div className="dashboard-grid">
        <section className="panel priority-panel">
          <div className="panel-title"><div><span className="eyebrow">DYNAMIC PRIORITY ENGINE</span><h2>Where should help go first?</h2></div><span className="live-badge">RECALCULATES LIVE</span></div>
          <div className="simulation-controls"><button onClick={simulateReport} className="secondary-action">＋ Simulate new field report</button><button onClick={resetSimulation} className="ghost-action">Reset</button><span className="simulation-status">Simulation cycle {simulationTick}</span></div>
          <div className="priority-list">
            {ranked.map((site, position) => (
              <article className={`priority-row ${position === 0 ? "top-row" : ""}`} key={site.id}>
                <div className="rank">{String(position + 1).padStart(2, "0")}</div>
                <div className="site-info"><strong>{site.name}</strong><span>{site.casualties.toLocaleString()} casualties • {site.homes.toLocaleString()} homes affected • {site.access}% access</span></div>
                <div className="priority-bar"><div style={{ width: `${site.score}%` }} /></div>
                <div className="score"><strong>{site.score}</strong><span>priority</span></div>
                <button className="dispatch" onClick={() => dispatchAid(site.id)}>Allocate aid</button>
              </article>
            ))}
          </div>
          <div className="logic-box">
            <div className="logic-icon">AI</div>
            <div><strong>Why the ranking changes</strong><p>Prototype score combines human impact, unmet needs, urgency, vulnerability and accessibility. Recorded aid reduces unmet need, while new reports can increase urgency and impact.</p></div>
          </div>
          <div className="factor-grid">
            <Factor label="Human impact" value="35%" /><Factor label="Unmet needs" value="30%" /><Factor label="Urgency" value="20%" /><Factor label="Vulnerability" value="10%" /><Factor label="Accessibility" value="5%" />
          </div>
        </section>

        <aside className="right-stack">
          <section className="panel map-panel">
            <div className="panel-title"><div><span className="eyebrow">SITUATIONAL MAP</span><h2>{country.name}</h2></div><span className="live-badge">DEMO DATA</span></div>
            <CountryMap country={dashboardCountry} dashboard sites={country.code === "PHL" ? ranked : []} />
            <div className="map-legend"><span><i className="legend-dot critical" /> Critical</span><span><i className="legend-dot high" /> High</span><span><i className="legend-dot monitored" /> Monitored</span></div>
          </section>

          <section className="panel allocation-panel">
            <div className="panel-title"><div><span className="eyebrow">AI RECOMMENDATION</span><h2>Suggested allocation</h2></div></div>
            <div className="recommendation"><div className="rec-top"><span>TOP PRIORITY</span><b>{top.name}</b></div><Allocation label="Relief goods" value="35,000 packs" /><Allocation label="Clean water" value="70,000 L" /><Allocation label="Medical kits" value="2,400" /><Allocation label="Emergency workforce" value="84 people" /><Allocation label="Recommended budget" value="$180,000" /><button className="approve-button" onClick={() => dispatchAid(top.id)}>Simulate approval →</button><small>AI recommends. Authorized responders approve, modify or reject.</small></div>
          </section>
        </aside>
      </div>

      <div className="bottom-grid">
        <section className="panel inventory-panel"><div className="panel-title"><div><span className="eyebrow">RESOURCE READINESS</span><h2>Available capacity</h2></div><span className="live-badge">ILLUSTRATIVE</span></div><Inventory label="Food packs" value={62000} max={100000} /><Inventory label="Clean water" value={74000} max={120000} /><Inventory label="Medical kits" value={8100} max={12000} /><Inventory label="Emergency workforce" value={168} max={250} /><div className="inventory-note">Coverage across connected warehouses / responders. Production version would ingest partner inventory APIs or operator updates.</div></section>
        <section className="panel sources-panel"><div className="panel-title"><div><span className="eyebrow">DATA FABRIC</span><h2>What REACT would ingest</h2></div></div><div className="source-row"><Source name="AHA Centre / ADINet" status="Historical & regional disaster records" /><Source name="National agencies" status="Forecasts, alerts & impact reports" /><Source name="GIS / population" status="Exposure, roads & vulnerability" /><Source name="Verified field reports" status="Current needs & aid received" /></div><div className="confidence-box"><span className="confidence-ring">87%</span><div><strong>Recommendation confidence</strong><p>Prototype value only. Production confidence would depend on source freshness, completeness and model validation.</p></div></div></section>
      </div>

      <div className="human-banner"><div><span className="eyebrow">HUMAN-IN-THE-LOOP</span><strong>AI recommends. Humans decide.</strong><p>Field responders retain final authority because real-world conditions can change faster than any model.</p></div><div className="last-action">{lastAction}</div></div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}

function Metric({ title, value, change }) { return <div className="metric-card"><span>{title}</span><strong>{value}</strong><small>{change}</small></div>; }
function Allocation({ label, value }) { return <div className="allocation-line"><span>{label}</span><strong>{value}</strong></div>; }
function Factor({ label, value }) { return <div className="factor"><span>{label}</span><strong>{value}</strong></div>; }
function Inventory({ label, value, max }) { const pct = Math.round((value / max) * 100); return <div className="inventory-item"><div><span>{label}</span><strong>{value.toLocaleString()}</strong></div><div className="inventory-track"><div style={{ width: `${pct}%` }} /></div><small>{pct}% available</small></div>; }
function Source({ name, status }) { return <div className="source-row-item"><div className="source-check">✓</div><div><strong>{name}</strong><span>{status}</span></div></div>; }

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
