import { useEffect, useState, useMemo, useRef } from "react";
import { API_BASE } from "./config";

const FILTERS = [
  "All",
  "India",
  "Uttar Pradesh",
  "Flood",
  "Heavy Rain",
  "Cyclone",
  "Storm",
  "Heatwave",
  "Lightning",
  "Other Alerts",
];

const FALLBACK_CATEGORY_IMAGES = {
  Cyclone: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=80",
  Flood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
  "Heavy Rain": "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80",
  Storm: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&auto=format&fit=crop&q=80",
  Heatwave: "https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=800&auto=format&fit=crop&q=80",
  Lightning: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
  "Other Alerts": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80",
};

function formatPublishedTime(pubDate) {
  if (!pubDate) return "Recently";
  const dateObj = new Date(pubDate);
  if (isNaN(dateObj.getTime())) return pubDate;

  const diffMs = Date.now() - dateObj.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  return dateObj.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityBadge(severity) {
  switch (severity) {
    case "Critical":
      return { label: "Critical", icon: "🔴", className: "severity-critical" };
    case "Warning":
      return { label: "Warning", icon: "🟠", className: "severity-warning" };
    case "Information":
      return { label: "Information", icon: "🔵", className: "severity-info" };
    default:
      return { label: "Normal Update", icon: "🟢", className: "severity-normal" };
  }
}

function WeatherNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newArticleKeys, setNewArticleKeys] = useState(new Set());
  const initialLoadDone = useRef(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/api/news`);
      if (!res.ok) throw new Error("Feed request failed");
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setError(true);
        setNews([]);
      } else {
        // Track new items after first load
        if (initialLoadDone.current && news.length > 0) {
          const existingUrls = new Set(news.map((item) => item.sourceUrl || item.title));
          const freshKeys = new Set();
          data.forEach((item) => {
            const key = item.sourceUrl || item.title;
            if (!existingUrls.has(key)) freshKeys.add(key);
          });
          setNewArticleKeys(freshKeys);
        } else {
          initialLoadDone.current = true;
        }

        setNews(data);
        const now = new Date();
        setLastUpdated(
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    } catch (err) {
      console.error("Weather news error:", err);
      setError(true);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered & Searched News
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const summary = (item.summary || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const category = item.category || "Other Alerts";
      const q = searchQuery.trim().toLowerCase();

      // Search matching: city, state, disaster type, headline, summary
      const matchesSearch =
        !q ||
        title.includes(q) ||
        summary.includes(q) ||
        location.includes(q) ||
        category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Filter matching
      if (selectedFilter === "All") return true;
      if (selectedFilter === "India") {
        return (
          location.includes("india") ||
          location.includes("national") ||
          title.includes("india") ||
          summary.includes("india")
        );
      }
      if (selectedFilter === "Uttar Pradesh") {
        const upKeywords = [
          "uttar pradesh",
          "up",
          "meerut",
          "lucknow",
          "noida",
          "varanasi",
          "kanpur",
          "agra",
          "prayagraj",
          "ghaziabad",
          "gorakhpur",
          "aligarh",
          "bareilly",
        ];
        return (
          upKeywords.some((k) => location.includes(k)) ||
          upKeywords.some((k) => title.includes(k)) ||
          upKeywords.some((k) => summary.includes(k))
        );
      }

      // Category matches
      return category.toLowerCase() === selectedFilter.toLowerCase();
    });
  }, [news, selectedFilter, searchQuery]);

  const featuredStory = filteredNews.length > 0 ? filteredNews[0] : null;
  const gridStories = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  return (
    <section className="news-section" id="news-section" aria-label="Live Weather and Disaster News">
      {/* SECTION HEADER */}
      <div className="section-heading news-heading-wrap">
        <div className="news-live-pill-wrap">
          <span className="live-pulse-badge">
            <span className="pulse-dot"></span> LIVE NEWS FEED
          </span>
          {lastUpdated && (
            <span className="news-last-updated-text">
              Last updated: <strong>{lastUpdated}</strong>
            </span>
          )}
          <button
            className="news-refresh-icon-btn"
            onClick={fetchNews}
            disabled={loading}
            title="Refresh news feed"
            aria-label="Refresh news"
          >
            {loading ? "⏳" : "🔄"}
          </button>
        </div>

        <h2 className="news-section-title">LIVE WEATHER &amp; DISASTER NEWS</h2>
        <p className="section-subtitle">
          Latest weather alerts, disaster updates and verified reports from trusted sources across India.
        </p>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="news-controls-container">
        {/* Search Field */}
        <div className="news-search-wrapper">
          <span className="news-search-icon">🔍</span>
          <input
            type="text"
            className="news-search-input"
            placeholder="Search weather news by city, state, disaster type, headline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search weather news"
          />
          {searchQuery && (
            <button
              className="news-search-clear"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic Category & Location Filter Buttons */}
        <div className="news-filter-pills" role="tablist" aria-label="News Filters">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`news-filter-pill ${selectedFilter === filter ? "active" : ""}`}
              onClick={() => setSelectedFilter(filter)}
              role="tab"
              aria-selected={selectedFilter === filter}
            >
              {filter === "All" && "🌐 "}
              {filter === "India" && "🇮🇳 "}
              {filter === "Uttar Pradesh" && "📍 "}
              {filter === "Flood" && "🌊 "}
              {filter === "Heavy Rain" && "🌧️ "}
              {filter === "Cyclone" && "🌀 "}
              {filter === "Storm" && "⛈️ "}
              {filter === "Heatwave" && "🌡️ "}
              {filter === "Lightning" && "⚡ "}
              {filter === "Other Alerts" && "🚨 "}
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && news.length === 0 && (
        <div className="news-loading-container">
          <div className="news-loading-banner">
            <div className="spinner-small"></div>
            <span>Fetching latest weather updates...</span>
          </div>

          {/* Skeleton Featured Card */}
          <div className="news-featured-card news-skeleton-card">
            <div className="news-skeleton-img"></div>
            <div className="news-featured-content">
              <div className="skeleton-line" style={{ width: "30%", height: "20px" }}></div>
              <div className="skeleton-line" style={{ width: "80%", height: "28px" }}></div>
              <div className="skeleton-line" style={{ width: "95%", height: "16px" }}></div>
              <div className="skeleton-line" style={{ width: "60%", height: "16px" }}></div>
            </div>
          </div>

          {/* Skeleton Grid */}
          <div className="news-cards-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="news-card news-skeleton-card">
                <div className="news-skeleton-img" style={{ height: "180px" }}></div>
                <div className="news-card-body">
                  <div className="skeleton-line" style={{ width: "40%", height: "16px" }}></div>
                  <div className="skeleton-line" style={{ width: "90%", height: "20px" }}></div>
                  <div className="skeleton-line" style={{ width: "70%", height: "14px" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="news-error-container">
          <div className="news-error-box">
            <span className="news-error-icon">⚠️</span>
            <h3>Weather news temporarily unavailable.</h3>
            <p>Unable to fetch the latest updates from official meteorological feeds.</p>
            <button className="primary-btn news-retry-button" onClick={fetchNews}>
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {/* NO RESULTS FOR FILTER/SEARCH */}
      {!loading && !error && filteredNews.length === 0 && (
        <div className="news-empty-state">
          <span className="news-empty-icon">🔎</span>
          <h3>No weather news found for this criteria.</h3>
          <p>
            No active reports match "{selectedFilter}"
            {searchQuery ? ` and query "${searchQuery}"` : ""}.
          </p>
          <button
            className="secondary-btn"
            style={{ marginTop: "14px" }}
            onClick={() => {
              setSelectedFilter("All");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* NEWS CONTENT DISPLAY */}
      {!loading && !error && filteredNews.length > 0 && (
        <div className="news-content-stream">
          {/* 4. FEATURED STORY (LARGE CARD) */}
          {featuredStory && (
            <article className="news-featured-card">
              <div className="news-featured-img-wrap">
                <img
                  src={featuredStory.image || FALLBACK_CATEGORY_IMAGES[featuredStory.category] || FALLBACK_CATEGORY_IMAGES["Other Alerts"]}
                  alt={featuredStory.title}
                  className="news-featured-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      FALLBACK_CATEGORY_IMAGES[featuredStory.category] ||
                      FALLBACK_CATEGORY_IMAGES["Other Alerts"];
                  }}
                />
                <div className="news-img-badges">
                  <span className="news-category-badge">{featuredStory.category}</span>
                  {(() => {
                    const sev = getSeverityBadge(featuredStory.severity);
                    return (
                      <span className={`news-severity-badge ${sev.className}`}>
                        {sev.icon} {sev.label}
                      </span>
                    );
                  })()}
                  {newArticleKeys.has(featuredStory.sourceUrl || featuredStory.title) && (
                    <span className="news-new-badge">NEW</span>
                  )}
                </div>
              </div>

              <div className="news-featured-content">
                <div className="news-featured-meta-top">
                  <span className="news-featured-loc">📍 {featuredStory.location}</span>
                  <span className="news-featured-time">🕒 {formatPublishedTime(featuredStory.publishedAt)}</span>
                </div>

                <h3 className="news-featured-title">
                  <a
                    href={featuredStory.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {featuredStory.title}
                  </a>
                </h3>

                <p className="news-featured-summary">
                  {featuredStory.summary}
                </p>

                <div className="news-featured-footer">
                  <div className="news-source-tag">
                    <span className="news-source-bullet">🏢</span>
                    <strong>Source:</strong> {featuredStory.source}
                  </div>

                  <a
                    href={featuredStory.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-read-more-btn"
                  >
                    Read More →
                  </a>
                </div>
              </div>
            </article>
          )}

          {/* 5. NEWS CARDS GRID (3-COLUMN RESPONSIVE) */}
          {gridStories.length > 0 && (
            <div className="news-cards-grid">
              {gridStories.map((item, idx) => {
                const sev = getSeverityBadge(item.severity);
                const isNew = newArticleKeys.has(item.sourceUrl || item.title);

                return (
                  <article className="news-card" key={idx}>
                    <div className="news-card-img-wrap">
                      <img
                        src={item.image || FALLBACK_CATEGORY_IMAGES[item.category] || FALLBACK_CATEGORY_IMAGES["Other Alerts"]}
                        alt={item.title}
                        className="news-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            FALLBACK_CATEGORY_IMAGES[item.category] ||
                            FALLBACK_CATEGORY_IMAGES["Other Alerts"];
                        }}
                      />
                      <div className="news-img-badges">
                        <span className="news-category-badge">{item.category}</span>
                        <span className={`news-severity-badge ${sev.className}`}>
                          {sev.icon} {sev.label}
                        </span>
                        {isNew && <span className="news-new-badge">NEW</span>}
                      </div>
                    </div>

                    <div className="news-card-body">
                      <div className="news-card-meta-top">
                        <span className="news-card-loc">📍 {item.location}</span>
                        <span className="news-card-time">🕒 {formatPublishedTime(item.publishedAt)}</span>
                      </div>

                      <h4 className="news-card-title">
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.title}
                        >
                          {item.title}
                        </a>
                      </h4>

                      <p className="news-card-summary">
                        {item.summary}
                      </p>

                      <div className="news-card-footer">
                        <span className="news-card-source">
                          🏢 {item.source}
                        </span>

                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-card-link"
                        >
                          Read More →
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default WeatherNews;
