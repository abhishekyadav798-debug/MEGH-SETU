import { useEffect, useState } from "react";
import { API_BASE } from "./config";

// Open-Meteo WMO Weather interpretation code mapper
const getWeatherDescription = (code) => {
  if (code === 0) return { text: "Clear Sky", icon: "☀️" };
  if (code >= 1 && code <= 3) return { text: "Partly Cloudy", icon: "⛅" };
  if (code === 45 || code === 48) return { text: "Fog / Haze", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { text: "Drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { text: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { text: "Snowfall", icon: "❄️" };
  if (code >= 80 && code <= 82) return { text: "Rain Showers", icon: "🌦️" };
  if (code >= 95 && code <= 99) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Moderate", icon: "🌤️" };
};

const CITIES = [
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

function WeatherWidget() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAllWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        CITIES.map(async (city) => {
          try {
            const res = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`);
            if (!res.ok) {
              return { location: city, error: true };
            }
            return await res.json();
          } catch {
            return { location: city, error: true };
          }
        })
      );
      setWeatherData(results);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError("Unable to connect to meteorological backend service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWeather();
  }, []);

  const filteredCities = weatherData.filter((item) =>
    item.location?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <section className="weather-widget">
      <div className="weather-widget-header">
        <div>
          <p className="eyebrow">METEOROLOGICAL SENSING NODES</p>
          <h2>🌦️ Live National Weather Stream</h2>
          <p>Real-time atmospheric telemetry ingested from Open-Meteo across 10 strategic Indian cities.</p>
        </div>

        <div className="weather-widget-controls">
          <input
            type="text"
            className="weather-search-input"
            placeholder="Search city (e.g. Delhi, Jaipur)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="refresh-btn"
            onClick={fetchAllWeather}
            disabled={loading}
            title="Refresh current meteorological observation"
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated-row">
          <span>🕒 Last sync with Open-Meteo: <strong>{lastUpdated} IST</strong></span>
          <span className="source-pill">📡 Source: Global Weather Forecast Model</span>
        </div>
      )}

      {loading && weatherData.length === 0 ? (
        <div className="weather-loading-box">
          <div className="spinner"></div>
          <p>Ingesting real-time telemetry from meteorological stations...</p>
        </div>
      ) : error ? (
        <div className="weather-error-box">
          <p>⚠️ {error}</p>
          <button className="primary-btn" onClick={fetchAllWeather}>Retry Connection</button>
        </div>
      ) : (
        <div className="weather-grid">
          {filteredCities.map((item) => {
            const hasData = item.weather && typeof item.weather.temperature_2m !== "undefined";
            const weatherDesc = hasData ? getWeatherDescription(item.weather.weather_code) : { text: "Data Unavailable", icon: "⚠️" };

            return (
              <div className="weather-city-card" key={item.location}>
                <div className="card-header-row">
                  <span className="city-name">📍 {item.location}</span>
                  <span className="live-pill">● LIVE</span>
                </div>

                {hasData ? (
                  <>
                    <div className="weather-primary-info">
                      <span className="weather-condition-icon">{weatherDesc.icon}</span>
                      <div className="temp-block">
                        <span className="city-temperature">{Math.round(item.weather.temperature_2m)}°C</span>
                        <span className="weather-condition-text">{weatherDesc.text}</span>
                      </div>
                    </div>

                    <div className="city-info-grid">
                      <div className="city-param">
                        <span className="param-label">💧 Humidity</span>
                        <span className="param-val">{item.weather.relative_humidity_2m}%</span>
                      </div>
                      <div className="city-param">
                        <span className="param-label">💨 Wind</span>
                        <span className="param-val">{item.weather.wind_speed_10m} km/h</span>
                      </div>
                      <div className="city-param">
                        <span className="param-label">🌧️ Rainfall</span>
                        <span className="param-val">{item.weather.rain || 0} mm</span>
                      </div>
                      <div className="city-param">
                        <span className="param-label">☔ Precip.</span>
                        <span className="param-val">{item.weather.precipitation || 0} mm</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="weather-unavailable">
                    <p>Sensory feed offline or unreachable.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default WeatherWidget;