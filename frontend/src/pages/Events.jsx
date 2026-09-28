import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

const getEventIcon = (type) => {
  switch (type) {
    case "Heavy Rainfall": return "🌧️";
    case "Flood": return "🌊";
    case "Thunderstorm": return "⛈️";
    case "Heatwave": return "☀️";
    case "Hailstorm": return "🌨️";
    case "Strong Winds": return "💨";
    default: return "⚠️";
  }
};

function Events() {
  const [weatherEvents, setWeatherEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEvents = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/reports`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load reports");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setWeatherEvents(data);
        }
      })
      .catch((error) => {
        console.error("Error loading events:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real Dynamic Metrics from Database
  const totalEvents = weatherEvents.length;
  const activeAlerts = weatherEvents.filter(
    (e) => e.severity === "High" || e.severity === "Critical"
  ).length;
  const highSeverityCount = weatherEvents.filter(
    (e) => e.severity === "High"
  ).length;
  const locationsCovered = new Set(
    weatherEvents.map((e) => e.location?.toLowerCase().trim()).filter(Boolean)
  ).size;

  // Filtered List
  const filteredEvents = weatherEvents.filter((event) => {
    const matchesSeverity =
      filterSeverity === "ALL" || event.severity?.toUpperCase() === filterSeverity;
    const matchesSearch =
      event.location?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.eventType?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="events-page">
      <div className="events-header">
        <div>
          <p className="eyebrow">NATIONAL WEATHER REPOSITORY</p>
          <h1>Weather Events Log</h1>
          <p>Real-time citizen observations and meteorological anomalies logged across India.</p>
        </div>

        <div className="events-header-actions">
          <Link to="/report" className="primary-btn" style={{ padding: "10px 18px", fontSize: "13px" }}>
            + Report New Event
          </Link>
          <div className="live-status">
            <span>●</span> LIVE DATABASE
          </div>
        </div>
      </div>

      {/* DYNAMIC REAL DATABASE METRICS */}
      <div className="event-stats">
        <div className="stat-card">
          <span>🌦️</span>
          <h2>{loading ? "..." : totalEvents}</h2>
          <p>Total Events Logged</p>
        </div>

        <div className="stat-card">
          <span>🚨</span>
          <h2>{loading ? "..." : activeAlerts}</h2>
          <p>Active Severe Alerts</p>
        </div>

        <div className="stat-card">
          <span>⚠️</span>
          <h2>{loading ? "..." : highSeverityCount}</h2>
          <p>High Severity Reports</p>
        </div>

        <div className="stat-card">
          <span>📍</span>
          <h2>{loading ? "..." : locationsCovered}</h2>
          <p>Locations Covered</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="events-controls-row">
        <div className="severity-filter-pills">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              className={`filter-pill ${filterSeverity === sev ? "active" : ""}`}
              onClick={() => setFilterSeverity(sev)}
            >
              {sev === "ALL" ? "All Severity" : sev}
            </button>
          ))}
        </div>

        <div className="events-search-wrap">
          <input
            type="text"
            placeholder="Search by city, event, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="weather-search-input"
            style={{ width: "280px" }}
          />
        </div>
      </div>

      {/* EVENTS LIST */}
      {loading ? (
        <div className="weather-loading-box">
          <div className="spinner"></div>
          <p>Loading real-time incidents from database...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="no-alert-box" style={{ textAlign: "center", justifyContent: "center", flexDirection: "column", padding: "50px 20px" }}>
          <span style={{ fontSize: "42px", marginBottom: "12px" }}>📋</span>
          <h3>No Weather Events Found</h3>
          <p style={{ maxWidth: "450px", margin: "0 auto 20px" }}>
            {searchTerm || filterSeverity !== "ALL"
              ? "No events match your current filter criteria. Try resetting filters."
              : "No weather events have been reported yet in this area. Be the first citizen observer!"}
          </p>
          <Link to="/report" className="primary-btn">
            Report Weather Event →
          </Link>
        </div>
      ) : (
        <div className="events-list">
          {filteredEvents.map((event) => (
            <div className={`weather-event-card border-${event.severity?.toLowerCase()}`} key={event._id || event.id}>
              <div className="event-main">
                <div className="big-event-icon">
                  {getEventIcon(event.eventType)}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3>{event.eventType}</h3>
                    <span className={`severity ${event.severity?.toLowerCase()}`}>
                      {event.severity}
                    </span>
                  </div>

                  <p className="event-location">
                    📍 <strong>Location:</strong> {event.location}
                  </p>

                  <p className="event-description-text" style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0" }}>
                    {event.description}
                  </p>

                  {event.photo && (
                    <div style={{ marginTop: "8px" }}>
                      <img
                        src={event.photo}
                        alt="Event evidence"
                        style={{ maxWidth: "160px", maxHeight: "100px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border-subtle)" }}
                      />
                    </div>
                  )}

                  <p className="event-time" style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                    🕒 Logged: {new Date(event.createdAt || Date.now()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>
              </div>

              <div className="event-info">
                <span className="event-status">
                  ● Verified Observation
                </span>
                <Link
                  to="/map"
                  className="secondary-btn"
                  style={{ padding: "6px 14px", fontSize: "12px" }}
                >
                  Locate on Map
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;