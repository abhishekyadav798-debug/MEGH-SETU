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

const INITIAL_CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Lucknow",
  "Jaipur",
  "Meerut",
  "Patna",
  "Ahmedabad",
  "Pune",
];

function WeatherWidget() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchingCity, setSearchingCity] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAllWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        INITIAL_CITIES.map(async (city) => {
          try {
            const res = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`);
            if (!res.ok) return { location: city, error: true };
            return await res.json();
          } catch {
            return { location: city, error: true };
          }
        })
      );
      setWeatherData(results);
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
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

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // If already in list, no need to re-fetch
    const alreadyExists = weatherData.find(
      (item) => item.location?.toLowerCase() === query.toLowerCase()
    );
    if (alreadyExists) return;

    setSearchingCity(true);
    try {
      const res = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Place newly searched city at the top
        setWeatherData((prev) => [
          data,
          ...prev.filter((p) => p.location?.toLowerCase() !== query.toLowerCase()),
        ]);
      } else {
        alert(`City "${query}" not found. Please verify spelling.`);
      }
    } catch (err) {
      alert("Failed to fetch weather for " + query);
    } finally {
      setSearchingCity(false);
    }
  };

  const filteredCities = weatherData.filter((item) =>
    item.location?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <section className="weather-widget" id="weather-section">
      <div className="weather-widget-header">
        <div>
          <p className="eyebrow">METEOROLOGICAL SENSING NODES</p>
          <h2>🌦️ Live City Weather</h2>
          <p>Real-time atmospheric readings from Open-Meteo across major Indian regions.</p>
        </div>

        <form className="weather-widget-controls" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="weather-search-input"
            placeholder="Search any city (e.g. Meerut, Pune, Dehradun)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="refresh-btn"
            disabled={searchingCity}
            title="Search Indian City"
          >
            {searchingCity ? "Searching..." : "🔍 Search"}
          </button>
          <button
            type="button"
            className="refresh-btn secondary-refresh"
            onClick={fetchAllWeather}
            disabled={loading}
            title="Refresh current meteorological observation"
          >
            {loading ? "..." : "🔄 Refresh"}
          </button>
        </form>
      </div>

      {lastUpdated && (
        <div className="last-updated-row">
          <span>🕒 Last synchronized: <strong>{lastUpdated} IST</strong></span>
          <span className="source-pill">📡 Source: Open-Meteo Satellite Feed</span>
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
            const weatherDesc = hasData
              ? getWeatherDescription(item.weather.weather_code)
              : { text: "Data Unavailable", icon: "⚠️" };

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
                        <span className="city-temperature">
                          {Math.round(item.weather.temperature_2m)}°C
                        </span>
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