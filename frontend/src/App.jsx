import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";

import Home from "./pages/Home";
import LiveMap from "./pages/LiveMap";
import Events from "./pages/Events";
import Analytics from "./pages/Analytics";
import ReportEvent from "./pages/ReportEvent";
import Admin from "./pages/Admin";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="app">

        {/* TOP GOV STATUS BAR */}
        <header className="gov-bar">
          <div className="gov-bar-content">
            <span className="gov-flag">🇮🇳</span>
            <span>NATIONAL WEATHER INTELLIGENCE &amp; DISASTER EARLY WARNING NETWORK — Problem #26069 | SIH 2026</span>
            <span className="gov-status-pill">
              <span className="pulse-dot"></span> LIVE NETWORK
            </span>
          </div>
        </header>

        {/* MAIN NAVIGATION */}
        <nav className="navbar">
          <Link to="/" className="logo" onClick={closeMenu}>
            <span className="logo-icon">🌦️</span>
            <div className="logo-text">
              <span className="brand-name">MeghSetu</span>
              <span className="brand-sub">Weather Intelligence</span>
            </div>
          </Link>

          <button
            className={`menu-toggle ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span><span></span><span></span>
          </button>

          <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu} end>
              Home
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>
              Live Map
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>
              Events
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>
              Analytics
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu} style={{ color: "#a78bfa" }}>
              🛡️ Admin
            </NavLink>
            <Link to="/report" className="report-btn" onClick={closeMenu}>
              <span className="report-btn-icon">⚡</span> Report Event
            </Link>
          </div>
        </nav>

        {/* PAGE ROUTES */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/events" element={<Events />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/report" element={<ReportEvent />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <span>🌦️</span>
                <h3>MeghSetu</h3>
              </div>
              <p className="footer-tagline">
                India's Weather Intelligence Network — Real-time meteorological observation, citizen crowdsensing, AI/ML analytics, and national disaster resilience.
              </p>
              <div className="footer-hackathon-info">
                <span>🏆 Smart India Hackathon 2026</span>
                <span>🔖 Problem #26069</span>
                <span>👥 Team CODEXAIV — ID 182006</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/">Live Dashboard</Link></li>
                <li><Link to="/map">Interactive Live Map</Link></li>
                <li><Link to="/events">Weather Events Log</Link></li>
                <li><Link to="/analytics">Analytics &amp; Risk Metrics</Link></li>
                <li><Link to="/report">Report Weather Event</Link></li>
                <li><Link to="/admin" style={{ color: "#a78bfa" }}>🛡️ Admin Panel</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Emergency Helplines</h4>
              <ul>
                <li><strong>NDRF Disaster Helpline:</strong> 1078</li>
                <li><strong>National Emergency:</strong> 112</li>
                <li><strong>IMD Meteorological:</strong> 1800-180-1717</li>
                <li><strong>State Disaster (SDMA):</strong> 1070</li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Data Sources</h4>
              <ul>
                <li><span>• Open-Meteo Weather API</span></li>
                <li><span>• NASA EONET Disaster Feed</span></li>
                <li><span>• USGS Earthquake Feed</span></li>
                <li><span>• OpenStreetMap / Leaflet GIS</span></li>
                <li><span>• MongoDB Atlas Cloud</span></li>
                <li><span>• OSM Nominatim Geocoding</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 MeghSetu — India's Weather Intelligence &amp; Early Warning Portal | SIH 2026 | Team CODEXAIV</p>
            <div className="footer-bottom-badges">
              <span className="badge-pill">Disaster Management</span>
              <span className="badge-pill">Meteorological Big Data</span>
              <span className="badge-pill">AI/ML Powered</span>
              <span className="badge-pill status-live">🟢 All Systems Operational</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;