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

      {/* 1. SIMPLE & CLEAR HERO SECTION */}
      <section className="hero-section simple-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-badge">🇮🇳 GOV METEOROLOGY</span>
            <span>National Weather Intelligence &amp; Early Warning Platform</span>
          </div>

          <h1 className="hero-title">
            Real-Time Weather &amp; <span>Early Warnings</span>
          </h1>

          <p className="hero-description">
            Live atmospheric data from satellites, crowdsourced citizen reports, and AI verification for instant, accurate weather intelligence across India.
          </p>

          <div className="hero-buttons">
            <Link to="/map" className="primary-btn glow-btn">
              🗺️ Explore Live Map
            </Link>
            <Link to="/report" className="secondary-btn">
              ⚡ Report Weather Event
            </Link>
            <Link to="/analytics" className="secondary-btn">
              📊 View Analytics
            </Link>
          </div>
        </div>

        {/* QUICK STATUS STRIP */}
        <div className="hero-status-strip">
          <div className="status-strip-card">
            <span className="status-strip-icon">🟢</span>
            <div>
              <strong>National Status</strong>
              <p>Nominal / Monitored</p>
            </div>
          </div>
          <div className="status-strip-card">
            <span className="status-strip-icon">🚨</span>
            <div>
              <strong>Verified Alerts</strong>
              <p>{loadingAlerts ? "Checking..." : `${alerts.length} Active`}</p>
            </div>
          </div>
          <div className="status-strip-card">
            <span className="status-strip-icon">📡</span>
            <div>
              <strong>Telemetry Feed</strong>
              <p>Open-Meteo &amp; Sensors</p>
            </div>
          </div>
          <div className="status-strip-card">
            <span className="status-strip-icon">📞</span>
            <div>
              <strong>NDRF Helpline</strong>
              <p>Dial 1078 or 112</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VERIFIED WEATHER ALERTS (IMMEDIATE VISIBILITY) */}
      <section className="alerts-section">
        <div className="section-heading">
          <p className="eyebrow">OFFICIAL EMERGENCY FEED</p>
          <h2>Severe Weather Alerts</h2>
          <p className="section-subtitle">Verified meteorological anomalies monitored across Indian states.</p>
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
              <h3>All Clear — No Active Severe Warnings</h3>
              <p>
                No high or critical verified weather hazards are currently active. All monitored meteorological zones are operating within nominal baseline parameters.
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
                  <span className="alert-status-badge">VERIFIED</span>
                  <Link to="/map" className="alert-action-btn">
                    View on Map →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. LIVE WEATHER STREAM (ACCURATE & FAST) */}
      <WeatherWidget />

      {/* 4. QUICK ACCESS PLATFORM SERVICES */}
      <section className="features-section">
        <div className="section-heading">
          <p className="eyebrow">KEY SERVICES</p>
          <h2>Fast Access Services</h2>
          <p className="section-subtitle">Direct tools for citizens, responders, and meteorological teams.</p>
        </div>

        <div className="simple-services-grid">
          <Link to="/map" className="service-card">
            <div className="service-icon">🗺️</div>
            <h3>Interactive Live Map</h3>
            <p>View temperature, wind, and citizen incident pins plotted across Indian states.</p>
            <span className="service-link-arrow">Open Map →</span>
          </Link>

          <Link to="/report" className="service-card">
            <div className="service-icon">⚡</div>
            <h3>Report Weather Incident</h3>
            <p>Witnessing heavy rain, storm, or flood? Submit a geotagged citizen report in 60 seconds.</p>
            <span className="service-link-arrow">Submit Report →</span>
          </Link>

          <Link to="/events" className="service-card">
            <div className="service-icon">📋</div>
            <h3>Weather Incident Feed</h3>
            <p>Filter, search, and view all verified citizen weather reports across India.</p>
            <span className="service-link-arrow">Browse Reports →</span>
          </Link>

          <Link to="/analytics" className="service-card">
            <div className="service-icon">📊</div>
            <h3>Big Data Analytics</h3>
            <p>Analyze past 7 days rainfall frequency, severity distribution, and regional risk metrics.</p>
            <span className="service-link-arrow">View Analytics →</span>
          </Link>
        </div>
      </section>

      {/* 5. EMERGENCY HELPLINES STRIP */}
      <section className="emergency-banner-section">
        <div className="emergency-banner">
          <div className="emergency-banner-left">
            <span className="emergency-icon">🛡️</span>
            <div>
              <h4>National Emergency &amp; Disaster Helplines</h4>
              <p>For immediate rescue or life-threatening weather hazards, contact the disaster authorities.</p>
            </div>
          </div>
          <div className="emergency-banner-right">
            <span className="helpline-number">📞 NDRF: 1078 | Emergency: 112 | IMD: 1800-180-1717</span>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;