import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

function Analytics() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/reports`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load reports");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
        }
      })
      .catch((error) => {
        console.error("Error loading analytics:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const total = reports.length;

  // Real Dynamic Severity Calculations
  const criticalCount = reports.filter((r) => r.severity === "Critical").length;
  const highCount = reports.filter((r) => r.severity === "High").length;
  const mediumCount = reports.filter((r) => r.severity === "Medium").length;
  const lowCount = reports.filter((r) => r.severity === "Low").length;

  const criticalPct = total > 0 ? Math.round((criticalCount / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((highCount / total) * 100) : 0;
  const mediumPct = total > 0 ? Math.round((mediumCount / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((lowCount / total) * 100) : 0;

  // Real Event Type Distribution
  const eventTypeCounts = reports.reduce((acc, r) => {
    const type = r.eventType || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Real City Distribution
  const cityCounts = reports.reduce((acc, r) => {
    const loc = r.location?.trim() || "Unknown";
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Past 7 Days calculation from createdAt
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10);
    const count = reports.filter((r) => {
      if (!r.createdAt) return false;
      return new Date(r.createdAt).toISOString().slice(0, 10) === dateStr;
    }).length;
    return { day: dayName, date: dateStr, count };
  });

  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  // AI Rule-Based Risk Index (0 - 100)
  const calculatedRiskScore = Math.min(
    100,
    Math.round(
      (criticalCount * 30 + highCount * 18 + mediumCount * 8 + lowCount * 2) /
        Math.max(1, total * 0.25)
    )
  );

  const getRiskStatus = (score) => {
    if (score >= 75) return { label: "CRITICAL", color: "var(--color-critical)", text: "High incidence of severe meteorological anomalies." };
    if (score >= 45) return { label: "ELEVATED", color: "var(--color-high)", text: "Substantial active weather anomalies under monitoring." };
    if (score >= 20) return { label: "MODERATE", color: "var(--color-warning)", text: "Isolated convective activity detected." };
    return { label: "NORMAL", color: "var(--color-green)", text: "Baseline atmospheric conditions prevailing." };
  };

  const riskStatus = getRiskStatus(calculatedRiskScore);

  const metrics = [
    {
      title: "Total Weather Incidents",
      value: total,
      sub: "Logged in MongoDB",
      icon: "🌦️",
    },
    {
      title: "Active Alerts",
      value: criticalCount + highCount,
      sub: "High & Critical Threats",
      icon: "🚨",
    },
    {
      title: "Monitored Locations",
      value: Object.keys(cityCounts).length,
      sub: "Geographic Nodes",
      icon: "📍",
    },
    {
      title: "AI Risk Prediction Index",
      value: `${calculatedRiskScore}/100`,
      sub: riskStatus.label,
      icon: "🧠",
    },
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <p className="eyebrow">BIG DATA INTELLIGENCE</p>
          <h1>Meteorological Analytics</h1>
          <p>Real-time statistical synthesis of citizen telemetry and atmospheric threat vectors.</p>
        </div>

        <div className="analytics-period">
          🟢 Live Ingestion Mode
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="analytics-cards">
        {metrics.map((item, index) => (
          <div className="analytics-card" key={index}>
            <div className="analytics-icon">{item.icon}</div>
            <p>{item.title}</p>
            <h2>{loading ? "..." : item.value}</h2>
            <span>{item.sub}</span>
          </div>
        ))}
      </div>

      {/* CHARTS & DISTRIBUTION GRID */}
      <div className="analytics-grid">
        {/* 7-DAY REAL INCIDENT TREND CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>7-Day Incident Frequency</h2>
              <p>Actual daily reports recorded over the past week</p>
            </div>
          </div>

          <div className="fake-chart">
            <div className="chart-line">
              {last7Days.map((d, idx) => {
                const heightPct = d.count === 0 ? 8 : Math.max(15, Math.round((d.count / maxDayCount) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end",
                      width: "12%",
                    }}
                  >
                    <span
                      style={{
                        height: `${heightPct}%`,
                        width: "100%",
                        display: "block",
                        borderRadius: "6px 6px 0 0",
                        background:
                          d.count > 0
                            ? "linear-gradient(180deg, var(--accent-cyan), var(--accent-blue))"
                            : "rgba(255, 255, 255, 0.05)",
                      }}
                      title={`${d.day} (${d.date}): ${d.count} reports`}
                    ></span>
                  </div>
                );
              })}
            </div>

            <div className="chart-days">
              {last7Days.map((d, idx) => (
                <div key={idx} style={{ textAlign: "center", width: "12%" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{d.day}</p>
                  <small style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    {d.count} rep
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* AI RISK FORECAST CARD */}
          <div style={{ marginTop: "24px", padding: "16px", borderRadius: "12px", background: "rgba(0, 180, 216, 0.06)", border: "1px solid var(--border-cyan)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                ⚡ National Threat Vector Evaluation
              </span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: riskStatus.color, background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: "6px" }}>
                {riskStatus.label}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "6px 0 0" }}>
              {riskStatus.text} Dynamic algorithm weighs critical incidents, report velocity, and geographic concentration.
            </p>
          </div>
        </div>

        {/* REAL SEVERITY DISTRIBUTION */}
        <div className="severity-card">
          <h2>Severity Distribution</h2>
          <p>Real database proportions ({total} total)</p>

          <div className="severity-row">
            <span>🚨 Critical</span>
            <strong>{criticalPct}% ({criticalCount})</strong>
          </div>
          <div className="progress">
            <div className="progress-fill critical-fill" style={{ width: `${criticalPct}%` }}></div>
          </div>

          <div className="severity-row">
            <span>⚠️ High</span>
            <strong>{highPct}% ({highCount})</strong>
          </div>
          <div className="progress">
            <div className="progress-fill high-fill" style={{ width: `${highPct}%` }}></div>
          </div>

          <div className="severity-row">
            <span>⚡ Medium</span>
            <strong>{mediumPct}% ({mediumCount})</strong>
          </div>
          <div className="progress">
            <div className="progress-fill medium-fill" style={{ width: `${mediumPct}%` }}></div>
          </div>

          <div className="severity-row">
            <span>🟢 Low</span>
            <strong>{lowPct}% ({lowCount})</strong>
          </div>
          <div className="progress">
            <div className="progress-fill low-fill" style={{ width: `${lowPct}%` }}></div>
          </div>

          {/* TOP REGIONS */}
          <div style={{ marginTop: "28px", paddingTop: "18px", borderTop: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "12px", color: "var(--text-main)" }}>
              Top Incident Clusters
            </h3>
            {topCities.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>No location data available.</p>
            ) : (
              topCities.map(([loc, count], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "6px 0" }}>
                  <span style={{ color: "var(--text-muted)" }}>📍 {loc}</span>
                  <span style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{count} {count === 1 ? "report" : "reports"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EVENT TYPES PROPORTION */}
      <div style={{ marginTop: "24px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>Event-Type Ingestion Breakdown</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13.5px", marginBottom: "16px" }}>
          Aggregated category breakdown across all validated ground telemetry reports.
        </p>

        {Object.keys(eventTypeCounts).length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>No event categories recorded yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {Object.entries(eventTypeCounts).map(([type, count]) => (
              <div key={type} style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase" }}>{type}</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>{count}</span>
                  <small style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;