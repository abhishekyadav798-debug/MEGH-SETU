import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WeatherWidget from "../WeatherWidget";
import { API_BASE } from "../config";

function Home() {
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/reports`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const activeAlerts = data.filter(
            (report) =>
              (report.severity === "High" || report.severity === "Critical") &&
              report.verificationStatus === "Verified"
          );
          setAlerts(activeAlerts);
        }
      })
      .catch((error) => {
        console.error("Alert loading error:", error);
      })
      .finally(() => {
        setLoadingAlerts(false);
      });
  }, []);

  return (
    <div className="home-page">

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-badge">LIVE METEOROLOGY</span>
            <span>National Weather Intelligence & Early Warning Network</span>
          </div>

          <h1 className="hero-title">
            Connecting India<br />
            Through <span>Weather Intelligence</span>
          </h1>

          <p className="hero-description">
            MeghSetu combines real-time weather data, citizen
            observations and intelligent analytics to build a
            smarter disaster-management network for India.
          </p>

          <div className="hero-buttons">
            <Link to="/map" className="primary-btn glow-btn">
              Explore Live Map →
            </Link>

            <Link to="/report" className="secondary-btn">
              <span>⚡</span> Report Weather Event
            </Link>
          </div>

          {/* Quick Hero Highlights */}
          <div className="hero-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-number">10+</span>
              <span className="stat-text">Active Met Stations</span>
            </div>
            <div className="quick-stat-divider"></div>
            <div className="quick-stat-item">
              <span className="stat-number">Real-Time</span>
              <span className="stat-text">Telemetry Ingestion</span>
            </div>
            <div className="quick-stat-divider"></div>
            <div className="quick-stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-text">Early Disaster Alerting</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="radar-card">
            <div className="radar-header">
              <span className="radar-live-indicator">
                <span className="radar-dot"></span> LIVE SATELLITE RADAR
              </span>
              <span className="radar-region">All-India Domain</span>
            </div>
            <div className="radar-circle-container">
              <div className="radar-sweep"></div>
              <div className="radar-ring ring-1"></div>
              <div className="radar-ring ring-2"></div>
              <div className="radar-ring ring-3"></div>
              <div className="radar-center-point">
                <span>📍</span>
                <p>National Command</p>
              </div>
            </div>
            <div className="radar-footer">
              <div>
                <small>Active Stream</small>
                <p>Open-Meteo & Sensors</p>
              </div>
              <div>
                <small>Disaster Watch</small>
                <p className="status-green">Normal / Monitored</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROJECT INTRODUCTION & MISSION */}
      <section className="intro-section">
        <div className="intro-box">
          <div className="intro-header">
            <span className="eyebrow">NATIONAL MANDATE</span>
            <h2>Bridging The Gap Between Meteorology & Citizens</h2>
            <p>
              Traditional weather models often lack hyper-local ground verification. MeghSetu bridges this critical gap by fusing satellite feeds, meteorological REST APIs, and crowdsourced citizen observations into a single high-availability intelligence platform.
            </p>
          </div>

          <div className="mission-cards-grid">
            <div className="mission-card">
              <div className="mission-icon">🛰️</div>
              <h3>Real-Time Data Ingestion</h3>
              <p>Continuous telemetry collection covering temperature, precipitation, wind speed, and humidity.</p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">👥</div>
              <h3>Citizen Ground-Truthing</h3>
              <p>Empowering local communities to flag floods, hailstorms, and heavy rainfall with geotagged reports.</p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🛡️</div>
              <h3>Disaster Early Warning</h3>
              <p>High and critical event aggregation providing immediate actionable insights for emergency response teams.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE WEATHER ALERTS */}
      <section className="alerts-section">
        <div className="section-heading">
          <p className="eyebrow">REAL-TIME MONITORING</p>
          <h2>Weather Alerts</h2>
          <p className="section-subtitle">Continuous automated scanning of citizen and sensor reported anomalies across India.</p>
        </div>

        {loadingAlerts ? (
          <div className="alert-loading-card">
            <div className="spinner-small"></div>
            <span>Checking national alert stream...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="no-alert-box">
            <div className="alert-icon-wrap status-green-glow">
              <span className="alert-icon">🟢</span>
            </div>
            <div>
              <h3>No Active Weather Alerts</h3>
              <p>
                No high or critical citizen-reported weather events are currently active. All monitored meteorological zones are operating within nominal baseline parameters.
              </p>
            </div>
          </div>
        ) : (
          <div className="alerts-list">
            <div className="alert-banner-header">
              <span>🚨 <strong>{alerts.length}</strong> Active Severe Weather {alerts.length === 1 ? "Alert" : "Alerts"} Detected</span>
            </div>
            {alerts.map((alert) => (
              <div className={`alert-card alert-card-${alert.severity?.toLowerCase()}`} key={alert._id}>
                <div className="alert-card-left">
                  <div className="alert-pulse-icon">
                    {alert.severity === "Critical" ? "🚨" : "⚠️"}
                  </div>
                  <div className="alert-content">
                    <div className="alert-meta-top">
                      <h3>{alert.eventType}</h3>
                      <span className={`severity-tag tag-${alert.severity?.toLowerCase()}`}>
                        {alert.severity} Severity
                      </span>
                    </div>

                    <p className="alert-loc">
                      📍 <strong>Location:</strong> {alert.location}
                    </p>

                    <p className="alert-desc">
                      {alert.description}
                    </p>

                    <div className="alert-time">
                      <span>🕒 Reported: {new Date(alert.createdAt || Date.now()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                    </div>
                  </div>
                </div>

                <div className="alert-card-right">
                  <span className="alert-status-badge">ACTIVE</span>
                  <Link to="/map" className="alert-action-btn">
                    View on Map →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. LIVE WEATHER CARDS (WEATHER WIDGET) */}
      <WeatherWidget />

      {/* 5. PLATFORM FEATURES */}
      <section className="features-section">
        <div className="section-heading">
          <p className="eyebrow">INTELLIGENCE PLATFORM CAPABILITIES</p>
          <h2>One Network. Multiple Intelligence Layers.</h2>
          <p className="section-subtitle">Engineered for national resilience, civil defense, and everyday citizen awareness.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌦️</div>
            <h3>Live Weather Dashboard</h3>
            <p>
              Real-time atmospheric readings directly streamed from meteorological sensors and APIs across 10 major Indian urban clusters.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Interactive Live Map</h3>
            <p>
              Geographical Leaflet visualization pinpointing weather telemetry and geo-located citizen incident markers across India.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚨</div>
            <h3>Early Disaster Alerts</h3>
            <p>
              Automated high and critical severity detection alerting disaster response authorities and citizens to localized threats.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Citizen Ground Surveillance</h3>
            <p>
              Decentralized crowd-reporting allowing any citizen to submit localized weather observations with photo and severity data.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Big Data Analytics</h3>
            <p>
              Multi-dimensional analysis of event frequency, severity distributions, geographic hot-spots, and meteorological patterns.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI/ML Predictive Risk</h3>
            <p>
              Rule-based and machine-learning risk prediction engines evaluating atmospheric variables and report density to forecast flash risks.
            </p>
          </div>
        </div>
      </section>

      {/* 6, 7, 8. INTERACTIVE CTA SECTIONS */}
      <section className="ctas-section">
        <div className="cta-grid">
          {/* Live Map CTA */}
          <div className="cta-card cta-map">
            <div className="cta-badge">GIS MAPPING</div>
            <h3>Explore The National Weather Map</h3>
            <p>
              Visualize real-time temperature, wind, humidity, and active citizen distress signals plotted geographically across Indian states.
            </p>
            <Link to="/map" className="cta-btn primary-btn">
              Launch Live Map →
            </Link>
          </div>

          {/* Report Event CTA */}
          <div className="cta-card cta-report">
            <div className="cta-badge">CITIZEN NETWORK</div>
            <h3>Witnessing Severe Weather?</h3>
            <p>
              Submit an on-ground weather report in under 60 seconds. Your submission helps authorities safeguard nearby communities.
            </p>
            <Link to="/report" className="cta-btn secondary-btn">
              Report An Event Now →
            </Link>
          </div>

          {/* Analytics CTA */}
          <div className="cta-card cta-analytics">
            <div className="cta-badge">BIG DATA INSIGHTS</div>
            <h3>Weather Intelligence Analytics</h3>
            <p>
              Explore historical distributions, severity metrics, and regional event trends processed directly from the MeghSetu database.
            </p>
            <Link to="/analytics" className="cta-btn tertiary-btn">
              View Deep Analytics →
            </Link>
          </div>
        </div>
      </section>

      {/* 9. EMERGENCY ADVISORY BANNER */}
      <section className="emergency-banner-section">
        <div className="emergency-banner">
          <div className="emergency-banner-left">
            <span className="emergency-icon">🛡️</span>
            <div>
              <h4>National Disaster Helpline Advisory</h4>
              <p>In case of life-threatening flash floods, cyclonic winds, or severe landslides, dial <strong>1078</strong> (NDRF) or <strong>112</strong> immediately.</p>
            </div>
          </div>
          <div className="emergency-banner-right">
            <span className="helpline-number">📞 1078 / 112</span>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;