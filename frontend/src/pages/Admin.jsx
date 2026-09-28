import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

const STATUS_COLORS = {
  Pending:  { bg: "rgba(255,183,3,0.15)",  border: "rgba(255,183,3,0.4)",  text: "#ffb703" },
  Verified: { bg: "rgba(0,230,118,0.12)",  border: "rgba(0,230,118,0.4)",  text: "#00e676" },
  Rejected: { bg: "rgba(255,77,79,0.12)",  border: "rgba(255,77,79,0.4)",  text: "#ff4d4f" },
  Flagged:  { bg: "rgba(255,146,43,0.12)", border: "rgba(255,146,43,0.4)", text: "#ff922b" },
};

const EVENT_ICONS = {
  "Heavy Rainfall": "🌧️", Flood: "🌊", Thunderstorm: "⛈️",
  Heatwave: "☀️", Hailstorm: "🌨️", "Strong Winds": "💨",
  Fog: "🌫️", "Dust Storm": "🏜️", Cyclone: "🌀",
  Landslide: "⛰️", Other: "⚠️",
};

const SEVERITY_COLORS = {
  Critical: "#ff4d4f", High: "#ff922b", Medium: "#ffb703", Low: "#00e676",
};

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "14px",
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      borderTop: `3px solid ${color}`,
    }}>
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <div>
        <p style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color, margin: 0 }}>{value}</h2>
      </div>
    </div>
  );
}

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("meghsetu_admin_auth") === "true";
  });
  const [officerName, setOfficerName] = useState(() => {
    return sessionStorage.getItem("meghsetu_admin_user") || "Officer In-Charge";
  });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [reports, setReports]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [selectedReport, setSelectedReport] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: "ALL", severity: "ALL", eventType: "ALL", source: "ALL",
    startDate: "", endDate: "", search: "",
  });

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error("Stats fetch error:", e); }
    finally { setStatsLoading(false); }
  }, [isAuthenticated]);

  const fetchReports = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.severity !== "ALL") params.set("severity", filters.severity);
      if (filters.eventType !== "ALL") params.set("eventType", filters.eventType);
      if (filters.source !== "ALL") params.set("source", filters.source);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`${API_BASE}/api/admin/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (e) { console.error("Reports fetch error:", e); }
    finally { setLoading(false); }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchReports(1);
    }
  }, [isAuthenticated, fetchStats, fetchReports]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");
    const u = loginForm.username.trim().toLowerCase();
    const p = loginForm.password.trim();

    if ((u === "admin" || u === "officer" || u === "imd") && (p === "meghsetu2026" || p === "admin123" || p === "meghsetu@2026")) {
      const name = loginForm.username.trim();
      sessionStorage.setItem("meghsetu_admin_auth", "true");
      sessionStorage.setItem("meghsetu_admin_user", name);
      setOfficerName(name);
      setIsAuthenticated(true);
    } else {
      setLoginError("Invalid credentials. Try Officer ID: admin | Passcode: meghsetu2026");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("meghsetu_admin_auth");
    sessionStorage.removeItem("meghsetu_admin_user");
    setIsAuthenticated(false);
    setLoginForm({ username: "", password: "" });
    setLoginError("");
  };

  const handleAutoFill = () => {
    setLoginForm({ username: "admin", password: "meghsetu2026" });
    setLoginError("");
  };

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(id + newStatus);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: newStatus, verifiedBy: "Admin Panel" }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => r._id === id ? { ...r, verificationStatus: newStatus } : r)
        );
        fetchStats();
      }
    } catch (e) { console.error("Status update error:", e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this report?")) return;
    setActionLoading(id + "del");
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== id));
        fetchStats();
        if (selectedReport?._id === id) setSelectedReport(null);
      }
    } catch (e) { console.error("Delete error:", e); }
    finally { setActionLoading(null); }
  };

  const handleAiAnalyze = async (id) => {
    setActionLoading(id + "ai");
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports/${id}/analyze`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReports((prev) => prev.map((r) => r._id === id ? data.report : r));
        if (selectedReport?._id === id) setSelectedReport(data.report);
      }
    } catch (e) { console.error("AI analyze error:", e); }
    finally { setActionLoading(null); }
  };

  const handleAnalyzeAll = async () => {
    if (!window.confirm("Run AI analysis on ALL unanalyzed reports? This may take a moment.")) return;
    setActionLoading("analyze-all");
    try {
      const res = await fetch(`${API_BASE}/api/admin/analyze-all`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchReports(1);
        fetchStats();
      }
    } catch (e) { alert("AI analysis failed"); }
    finally { setActionLoading(null); }
  };

  const filterBarStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "20px",
  };

  const selectStyle = {
    background: "var(--bg-surface)",
    color: "var(--text-main)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
  };

  const inputStyle = { ...selectStyle };

  const actionBtn = (color, onClick, children, loading) => (
    <button
      onClick={onClick}
      disabled={!!loading}
      style={{
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color: color,
        borderRadius: "6px",
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "..." : children}
    </button>
  );

  // If not authenticated, show Government Security Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(180deg, #0c1b30 0%, #081322 100%)",
          border: "1px solid rgba(0, 212, 255, 0.25)",
          borderRadius: "20px",
          padding: "36px 32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(0, 212, 255, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top subtle glow bar */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #00d4ff, #7c3aed, #00d4ff)",
          }}></div>

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(0, 212, 255, 0.08)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              margin: "0 auto 16px",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)",
            }}>
              🛡️
            </div>
            <p style={{
              fontSize: "10px",
              color: "var(--accent-cyan)",
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}>
              RESTRICTED ACCESS • DISASTER CELL
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
              MeghSetu Command Center
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Authorized meteorological officers &amp; disaster triage personnel only.
            </p>
          </div>

          {loginError && (
            <div style={{
              background: "rgba(255, 77, 79, 0.12)",
              border: "1px solid rgba(255, 77, 79, 0.4)",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "20px",
              color: "#ff7875",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span>⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Officer ID / Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. admin"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-surface)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Security Passcode
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                style={{
                  width: "100%",
                  background: "var(--bg-surface)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #0077b6 100%)",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                color: "#030c17",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                marginTop: "4px",
                boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              🔓 Authenticate &amp; Access Admin
            </button>
          </form>

          {/* Quick Demo Credentials Pill for Evaluators */}
          <div style={{
            marginTop: "20px",
            background: "rgba(0, 212, 255, 0.05)",
            border: "1px dashed rgba(0, 212, 255, 0.3)",
            borderRadius: "10px",
            padding: "12px 14px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "0 0 6px", fontWeight: 600 }}>
              💡 Hackathon Evaluator Credentials:
            </p>
            <p style={{ fontSize: "12px", color: "var(--accent-cyan)", margin: "0 0 8px", fontFamily: "monospace" }}>
              ID: <strong>admin</strong> | Pass: <strong>meghsetu2026</strong>
            </p>
            <button
              type="button"
              onClick={handleAutoFill}
              style={{
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                color: "var(--accent-cyan)",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⚡ Auto-Fill Credentials
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link to="/" style={{ color: "var(--text-dim)", fontSize: "12px", textDecoration: "none" }}>
              ← Return to Citizen Public Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 5%", maxWidth: "1400px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
              MEGHSETU ADMIN CONTROL
            </span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0, 230, 118, 0.1)",
              border: "1px solid rgba(0, 230, 118, 0.3)",
              color: "#00e676",
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "20px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00e676", display: "inline-block" }}></span>
              Officer: {officerName}
            </span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Manage, verify, and analyze all incoming weather reports.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleAnalyzeAll}
            disabled={actionLoading === "analyze-all"}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none", color: "#fff", borderRadius: "10px",
              padding: "10px 18px", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {actionLoading === "analyze-all" ? "🔄 Running AI..." : "🧠 Run AI Analysis"}
          </button>
          <button
            onClick={() => { fetchReports(1); fetchStats(); }}
            style={{
              background: "rgba(0,212,255,0.1)", border: "1px solid var(--border-cyan)",
              color: "var(--accent-cyan)", borderRadius: "10px",
              padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255, 77, 79, 0.12)", border: "1px solid rgba(255, 77, 79, 0.4)",
              color: "#ff7875", borderRadius: "10px",
              padding: "10px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <StatCard icon="📊" label="Total Reports" value={statsLoading ? "..." : stats?.totals?.total ?? 0} color="var(--accent-cyan)" />
        <StatCard icon="⏳" label="Pending Review" value={statsLoading ? "..." : stats?.totals?.pending ?? 0} color="#ffb703" />
        <StatCard icon="✅" label="Verified" value={statsLoading ? "..." : stats?.totals?.verified ?? 0} color="#00e676" />
        <StatCard icon="🚩" label="Flagged by AI" value={statsLoading ? "..." : stats?.totals?.flagged ?? 0} color="#ff922b" />
        <StatCard icon="❌" label="Rejected" value={statsLoading ? "..." : stats?.totals?.rejected ?? 0} color="#ff4d4f" />
      </div>

      {/* Filter Bar */}
      <div style={filterBarStyle}>
        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>🔍 SEARCH</label>
          <input
            type="text"
            style={inputStyle}
            placeholder="City, event, reporter..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchReports(1)}
          />
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>🔖 STATUS</label>
          <select style={selectStyle} value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Flagged">Flagged</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>⚡ SEVERITY</label>
          <select style={selectStyle} value={filters.severity} onChange={(e) => handleFilterChange("severity", e.target.value)}>
            <option value="ALL">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>🌩️ EVENT TYPE</label>
          <select style={selectStyle} value={filters.eventType} onChange={(e) => handleFilterChange("eventType", e.target.value)}>
            <option value="ALL">All Types</option>
            {["Heavy Rainfall","Flood","Thunderstorm","Heatwave","Hailstorm","Strong Winds","Fog","Dust Storm","Cyclone","Landslide","Other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>📡 SOURCE</label>
          <select style={selectStyle} value={filters.source} onChange={(e) => handleFilterChange("source", e.target.value)}>
            <option value="ALL">All Sources</option>
            <option value="Citizen Report">Citizen Report</option>
            <option value="Social Media">Social Media</option>
            <option value="IMD Feed">IMD Feed</option>
            <option value="News API">News API</option>
            <option value="Auto-Sensor">Auto-Sensor</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>📅 START DATE</label>
          <input type="date" style={inputStyle} value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: "4px" }}>📅 END DATE</label>
          <input type="date" style={inputStyle} value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={() => fetchReports(1)}
            style={{
              background: "var(--accent-cyan)", color: "#000",
              border: "none", borderRadius: "8px",
              padding: "9px 16px", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", width: "100%",
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
            Weather Reports ({pagination.total} total)
          </h3>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              <p style={{ color: "var(--text-muted)" }}>Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <p style={{ fontSize: "36px", marginBottom: "12px" }}>📋</p>
              <p style={{ color: "var(--text-muted)" }}>No reports match your filters.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Event", "Location", "Severity", "Source", "AI Score", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--text-dim)", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const sc = STATUS_COLORS[r.verificationStatus] || STATUS_COLORS.Pending;
                  const isLoading = (key) => actionLoading === r._id + key;
                  return (
                    <tr
                      key={r._id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        background: selectedReport?._id === r._id ? "rgba(0,212,255,0.05)" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = selectedReport?._id === r._id ? "rgba(0,212,255,0.05)" : "transparent"}
                    >
                      <td style={{ padding: "12px 14px" }} onClick={() => setSelectedReport(r)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px" }}>{EVENT_ICONS[r.eventType] || "⚠️"}</span>
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{r.eventType}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)" }} onClick={() => setSelectedReport(r)}>
                        📍 {r.location}
                      </td>
                      <td style={{ padding: "12px 14px" }} onClick={() => setSelectedReport(r)}>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                          color: SEVERITY_COLORS[r.severity] || "#fff",
                          background: `${SEVERITY_COLORS[r.severity]}22`,
                        }}>
                          {r.severity}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-dim)", fontSize: "12px" }} onClick={() => setSelectedReport(r)}>
                        {r.source || "Citizen"}
                      </td>
                      <td style={{ padding: "12px 14px" }} onClick={() => setSelectedReport(r)}>
                        {r.aiAnalyzed ? (
                          <div>
                            <div style={{ fontSize: "11px", color: "#00e676", fontWeight: 700 }}>
                              ✓ {r.aiConfidenceScore}% real
                            </div>
                            {r.aiFakeScore > 30 && (
                              <div style={{ fontSize: "10px", color: "#ff922b" }}>
                                ⚠ {r.aiFakeScore}% suspicious
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Not analyzed</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                        }}>
                          {r.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-dim)", fontSize: "11px", whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        <br />
                        {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          {r.verificationStatus !== "Verified" && actionBtn("#00e676", () => handleStatusChange(r._id, "Verified"), "✓ Verify", isLoading("Verified"))}
                          {r.verificationStatus !== "Rejected" && actionBtn("#ff4d4f", () => handleStatusChange(r._id, "Rejected"), "✗ Reject", isLoading("Rejected"))}
                          {r.verificationStatus !== "Flagged" && actionBtn("#ff922b", () => handleStatusChange(r._id, "Flagged"), "🚩 Flag", isLoading("Flagged"))}
                          {actionBtn("#a78bfa", () => handleAiAnalyze(r._id), "🧠 AI", isLoading("ai"))}
                          {actionBtn("#ff4d4f", () => handleDelete(r._id), "🗑", isLoading("del"))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "center", gap: "8px" }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchReports(p)}
                style={{
                  background: p === pagination.page ? "var(--accent-cyan)" : "var(--bg-surface)",
                  color: p === pagination.page ? "#000" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)", borderRadius: "6px",
                  width: "36px", height: "36px", cursor: "pointer", fontWeight: 700, fontSize: "13px",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Side Panel */}
      {selectedReport && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: "420px", height: "100vh",
          background: "var(--bg-card)", borderLeft: "1px solid var(--border-subtle)",
          overflowY: "auto", zIndex: 1000, padding: "24px",
          boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "17px" }}>📄 Report Detail</h3>
            <button
              onClick={() => setSelectedReport(null)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "var(--text-main)", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>

          {/* Status Badge */}
          <div style={{ marginBottom: "16px" }}>
            {(() => {
              const sc = STATUS_COLORS[selectedReport.verificationStatus] || STATUS_COLORS.Pending;
              return (
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                  {selectedReport.verificationStatus}
                </span>
              );
            })()}
          </div>

          <div style={{ display: "grid", rowGap: "12px" }}>
            {[
              ["🌩️ Event Type", selectedReport.eventType],
              ["⚡ Severity", selectedReport.severity],
              ["📍 Location", selectedReport.location],
              ["🗺️ State", selectedReport.stateProvince || "—"],
              ["📡 Source", selectedReport.source],
              ["👤 Reporter", selectedReport.reporterName || "Anonymous"],
              ["🕒 Submitted", new Date(selectedReport.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
            ].map(([label, val]) => (
              <div key={label} style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: "14px", color: "var(--text-main)", margin: 0, fontWeight: 500 }}>{val}</p>
              </div>
            ))}

            <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "0 0 4px" }}>📝 Description</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{selectedReport.description}</p>
            </div>

            {selectedReport.hashtags?.length > 0 && (
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "0 0 6px" }}>🔖 Hashtags</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedReport.hashtags.map((tag) => (
                    <span key={tag} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(0,212,255,0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Box */}
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px", padding: "14px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa", margin: "0 0 10px" }}>🧠 AI Analysis</p>
              {selectedReport.aiAnalyzed ? (
                <div style={{ display: "grid", rowGap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-dim)" }}>Confidence (Real)</span>
                    <span style={{ color: "#00e676", fontWeight: 700 }}>{selectedReport.aiConfidenceScore}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${selectedReport.aiConfidenceScore}%`, background: "#00e676", borderRadius: "2px" }}></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "6px" }}>
                    <span style={{ color: "var(--text-dim)" }}>Fake/Spam Risk</span>
                    <span style={{ color: selectedReport.aiFakeScore > 40 ? "#ff4d4f" : "#ffb703", fontWeight: 700 }}>{selectedReport.aiFakeScore}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${selectedReport.aiFakeScore}%`, background: selectedReport.aiFakeScore > 40 ? "#ff4d4f" : "#ffb703", borderRadius: "2px" }}></div>
                  </div>
                  {selectedReport.aiFlags?.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      {selectedReport.aiFlags.map((flag) => (
                        <div key={flag} style={{ fontSize: "11px", color: "#ff922b", background: "rgba(255,146,43,0.1)", padding: "3px 8px", borderRadius: "4px", marginBottom: "3px" }}>
                          ⚠️ {flag}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                    AI Category: <strong style={{ color: "var(--text-main)" }}>{selectedReport.aiCategory || selectedReport.eventType}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0 }}>Not yet analyzed.</p>
              )}
            </div>

            {selectedReport.verificationNote && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "var(--text-muted)" }}>
                💬 Note: {selectedReport.verificationNote}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={() => handleStatusChange(selectedReport._id, "Verified")}
                style={{ background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.4)", color: "#00e676", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                ✅ Verify
              </button>
              <button
                onClick={() => handleStatusChange(selectedReport._id, "Rejected")}
                style={{ background: "rgba(255,77,79,0.12)", border: "1px solid rgba(255,77,79,0.4)", color: "#ff4d4f", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleStatusChange(selectedReport._id, "Flagged")}
                style={{ background: "rgba(255,146,43,0.12)", border: "1px solid rgba(255,146,43,0.4)", color: "#ff922b", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                🚩 Flag
              </button>
              <button
                onClick={() => handleAiAnalyze(selectedReport._id)}
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", borderRadius: "8px", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                🧠 Re-Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
