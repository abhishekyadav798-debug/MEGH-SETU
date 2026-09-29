import { useEffect, useState } from "react";
import { API_BASE } from "./config";

// Returns an icon based on news title keywords
function getNewsIcon(title = "") {
  const t = title.toLowerCase();
  if (t.includes("cyclone") || t.includes("storm")) return "🌀";
  if (t.includes("flood") || t.includes("waterlog")) return "🌊";
  if (t.includes("rain") || t.includes("rainfall") || t.includes("monsoon")) return "🌧️";
  if (t.includes("thunder") || t.includes("lightning")) return "⛈️";
  if (t.includes("heat") || t.includes("hot") || t.includes("temperature")) return "🌡️";
  if (t.includes("earthquake") || t.includes("seismic")) return "🔴";
  if (t.includes("fog")) return "🌫️";
  if (t.includes("wind")) return "💨";
  if (t.includes("cold") || t.includes("snow")) return "❄️";
  if (t.includes("landslide") || t.includes("avalanche")) return "⛰️";
  if (t.includes("drought")) return "☀️";
  if (t.includes("alert") || t.includes("warning")) return "🚨";
  return "📰";
}

function timeAgo(pubDate) {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function WeatherNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/news`);
      if (!res.ok) throw new Error("Feed unavailable");
      const data = await res.json();
      setNews(data);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError("Unable to load weather news feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 10 minutes
    const timer = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="news-sidebar" id="weather-news-sidebar">
      {/* Header */}
      <div className="news-sidebar-header">
        <div>
          <p className="eyebrow" style={{ fontSize: "10px", marginBottom: "4px" }}>LIVE WEATHER NEWS</p>
          <h3>📰 News Feed</h3>
        </div>
        <button
          className="news-refresh-btn"
          onClick={fetchNews}
          disabled={loading}
          title="Refresh news"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {lastUpdated && (
        <div className="news-last-updated">
          🕒 Updated at {lastUpdated} IST
        </div>
      )}

      {/* News List */}
      <div className="news-list">
        {loading ? (
          <div className="news-loading">
            <div className="spinner-small" style={{ margin: "0 auto 10px" }}></div>
            <p>Loading live news...</p>
          </div>
        ) : error ? (
          <div className="news-error">
            <p>⚠️ {error}</p>
            <button className="news-retry-btn" onClick={fetchNews}>Retry</button>
          </div>
        ) : news.length === 0 ? (
          <div className="news-empty">
            <p>🔎 No weather news found at the moment.</p>
          </div>
        ) : (
          news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-item-icon">{getNewsIcon(item.title)}</div>
              <div className="news-item-body">
                <p className="news-item-title">{item.title}</p>
                {item.description && (
                  <p className="news-item-desc">{item.description.slice(0, 100)}...</p>
                )}
                <div className="news-item-meta">
                  <span className="news-source-badge">{item.source}</span>
                  <span className="news-time">{timeAgo(item.pubDate)}</span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && news.length > 0 && (
        <div className="news-sidebar-footer">
          <span>📡 Sources: The Hindu, NDTV, HT, Indian Express</span>
        </div>
      )}
    </aside>
  );
}

export default WeatherNews;
