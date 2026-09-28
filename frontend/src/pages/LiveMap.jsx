import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE } from "../config";
import { Link } from "react-router-dom";

// Comprehensive Indian Coordinates Dictionary
const CITY_COORDINATES = {
  meerut: [28.9845, 77.7064],
  delhi: [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  lucknow: [26.8467, 80.9462],
  jaipur: [26.9124, 75.7873],
  patna: [25.5941, 85.1376],
  kolkata: [22.5726, 88.3639],
  indore: [22.7196, 75.8577],
  varanasi: [25.3176, 82.9739],
  dehradun: [30.3165, 78.0322],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.3850, 78.4867],
  ahmedabad: [23.0225, 72.5714],
  pune: [18.5204, 73.8567],
  chandigarh: [30.7333, 76.7794],
  bhopal: [23.2599, 77.4126],
  guwahati: [26.1445, 91.7362],
  srinagar: [34.0837, 74.7973],
  ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245],
  shimla: [31.1048, 77.1734],
  agra: [27.1767, 78.0081],
  kanpur: [26.4499, 80.3319],
  prayagraj: [25.4358, 81.8463],
  allahabad: [25.4358, 81.8463],
  noida: [28.5355, 77.3910],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
};

const MET_CITIES = [
  "Meerut",
  "Delhi",
  "Mumbai",
  "Lucknow",
  "Jaipur",
  "Patna",
  "Kolkata",
  "Indore",
  "Varanasi",
  "Dehradun",
];

// Recenter Map Helper
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function LiveMap() {
  const [reports, setReports] = useState([]);
  const [cityWeather, setCityWeather] = useState([]);
  const [activeLayer, setActiveLayer] = useState("ALL"); // ALL, WEATHER, REPORTS, SEVERE
  const [loading, setLoading] = useState(true);

  // Load citizen reports from MongoDB
  useEffect(() => {
    fetch(`${API_BASE}/api/reports`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch((err) => console.error("Map reports error:", err));
  }, []);

  // Load live weather for core cities
  useEffect(() => {
    Promise.all(
      MET_CITIES.map((city) =>
        fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    )
      .then((data) => {
        setCityWeather(data.filter(Boolean));
      })
      .catch((err) => console.error("Map weather error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Location resolver helper
  const getCoordinatesForLocation = (locationName) => {
    if (!locationName) return null;
    const clean = locationName.toLowerCase().trim();
    if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
    // Check partial matches
    for (const key of Object.keys(CITY_COORDINATES)) {
      if (clean.includes(key) || key.includes(clean)) {
        return CITY_COORDINATES[key];
      }
    }
    return null;
  };

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "#ff4d4f";
      case "high": return "#ff922b";
      case "medium": return "#ffb703";
      default: return "#00e676";
    }
  };

  // Filtered reports
  const displayedReports = reports.filter((rep) => {
    if (activeLayer === "WEATHER") return false;
    if (activeLayer === "SEVERE") {
      return rep.severity === "High" || rep.severity === "Critical";
    }
    return true;
  });

  const showWeatherMarkers = activeLayer === "ALL" || activeLayer === "WEATHER";

  return (
    <div className="map-page">
      <div className="map-header">
        <p className="eyebrow">NATIONAL GIS METEOROLOGY</p>
        <h1>Interactive Live Weather Map</h1>
        <p>Real-time atmospheric telemetry and geotagged citizen incident logs mapped across India.</p>

        {/* MAP LAYER CONTROLS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "🗺️ All Layers" },
            { id: "WEATHER", label: "🌦️ Met Stations Only" },
            { id: "REPORTS", label: "👥 Citizen Reports Only" },
            { id: "SEVERE", label: "🚨 Severe Alerts Only" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-pill ${activeLayer === tab.id ? "active" : ""}`}
              onClick={() => setActiveLayer(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAP VIEW CONTAINER */}
      <div className="map-container" style={{ position: "relative" }}>
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. METEOROLOGICAL STATIONS */}
          {showWeatherMarkers &&
            cityWeather.map((item) => {
              const coords = getCoordinatesForLocation(item.location);
              if (!coords || !item.weather) return null;

              return (
                <CircleMarker
                  key={`met-${item.location}`}
                  center={coords}
                  radius={13}
                  pathOptions={{
                    fillColor: "#00b4d8",
                    fillOpacity: 0.85,
                    color: "#ffffff",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: "180px", color: "#fff" }}>
                      <h4 style={{ fontSize: "16px", margin: "0 0 6px", color: "var(--accent-cyan)" }}>
                        📍 {item.location}
                      </h4>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        🌡️ <strong>Temp:</strong> {Math.round(item.weather.temperature_2m)}°C
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        💧 <strong>Humidity:</strong> {item.weather.relative_humidity_2m}%
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        💨 <strong>Wind:</strong> {item.weather.wind_speed_10m} km/h
                      </p>
                      <p style={{ margin: "2px 0", fontSize: "13px" }}>
                        🌧️ <strong>Rain:</strong> {item.weather.rain || 0} mm
                      </p>
                      <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", color: "var(--color-green)", fontWeight: 700 }}>
                        ● Live Meteorological Feed
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* 2. CITIZEN INCIDENT REPORTS */}
          {displayedReports.map((report) => {
            const coords = getCoordinatesForLocation(report.location);
            if (!coords) return null;

            const sevColor = getSeverityColor(report.severity);

            return (
              <CircleMarker
                key={`rep-${report._id}`}
                center={coords}
                radius={report.severity === "Critical" ? 16 : 12}
                pathOptions={{
                  fillColor: sevColor,
                  fillOpacity: 0.9,
                  color: "#ffffff",
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ minWidth: "210px", color: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", color: sevColor }}>
                        ⚠️ {report.eventType}
                      </h4>
                      <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: "rgba(255,255,255,0.15)" }}>
                        {report.severity}
                      </span>
                    </div>

                    <p style={{ margin: "3px 0", fontSize: "13px" }}>
                      📍 <strong>Location:</strong> {report.location}
                    </p>

                    <p style={{ margin: "5px 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {report.description}
                    </p>

                    {report.photo && (
                      <div style={{ marginTop: "6px" }}>
                        <img
                          src={report.photo}
                          alt="Reported condition"
                          style={{ width: "100%", maxHeight: "90px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      </div>
                    )}

                    <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", color: "var(--text-dim)" }}>
                      🕒 {new Date(report.createdAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • Citizen Observation
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* MAP LEGEND OVERLAY */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          zIndex: 1000,
          background: "rgba(6, 15, 30, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
        }}>
          <strong style={{ display: "block", marginBottom: "8px", color: "var(--text-main)" }}>Map Legend</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00b4d8" }}></span>
              <span>Live Meteorological Station</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff4d4f" }}></span>
              <span>Critical Citizen Incident</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff922b" }}></span>
              <span>High Severity Threat</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00e676" }}></span>
              <span>Moderate / Normal Observation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMap;