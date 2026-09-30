import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

const SUGGESTED_CITIES = [
  "Meerut","Delhi","Mumbai","Lucknow","Jaipur","Patna","Kolkata","Indore",
  "Varanasi","Dehradun","Bengaluru","Chennai","Hyderabad","Ahmedabad","Pune",
  "Chandigarh","Bhopal","Guwahati","Srinagar","Ranchi","Bhubaneswar","Shimla",
  "Agra","Kanpur","Prayagraj","Noida","Gurugram","Amritsar","Nagpur","Coimbatore",
  "Visakhapatnam","Kochi","Thiruvananthapuram","Mysuru","Jammu","Imphal","Shillong",
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi (NCT)",
];

function ReportEvent() {
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [aiResult, setAiResult]     = useState(null);

  const [formData, setFormData] = useState({
    eventType: "",
    severity: "",
    location: "",
    stateProvince: "",
    description: "",
    reporterName: "",
    photo: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB image allowed."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setFormData((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setAiResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "Citizen Report" }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setAiResult(data.ai);
        setFormData({ eventType: "", severity: "", location: "", stateProvince: "", description: "", reporterName: "", photo: "" });
        setPhotoPreview(null);
      } else {
        setErrorMsg(data.message || "Failed to submit report.");
      }
    } catch (error) {
      setErrorMsg("Cannot connect to backend. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.3px" };

  return (
    <div className="report-page">
      <div className="report-header">
        <p className="eyebrow">CITIZEN WEATHER SURVEILLANCE</p>
        <h1>Report Severe Weather Event</h1>
        <p>Your on-ground observation feeds directly into the national disaster early-warning pipeline with AI verification.</p>
      </div>

      {submitted ? (
        <div className={`success-box ${aiResult?.verificationStatus === "Rejected" ? "rejected-box" : aiResult?.verificationStatus === "Flagged" ? "flagged-box" : ""}`} style={{
          border: aiResult?.verificationStatus === "Rejected"
            ? "1px solid rgba(255, 77, 79, 0.5)"
            : aiResult?.verificationStatus === "Flagged"
            ? "1px solid rgba(255, 146, 43, 0.5)"
            : "1px solid rgba(0, 230, 118, 0.4)",
          background: aiResult?.verificationStatus === "Rejected"
            ? "rgba(255, 77, 79, 0.08)"
            : aiResult?.verificationStatus === "Flagged"
            ? "rgba(255, 146, 43, 0.08)"
            : "rgba(0, 230, 118, 0.05)",
        }}>
          <div className="success-icon" style={{ fontSize: "48px" }}>
            {aiResult?.verificationStatus === "Verified"
              ? "✅"
              : aiResult?.verificationStatus === "Rejected"
              ? "🚫"
              : aiResult?.verificationStatus === "Flagged"
              ? "⚠️"
              : "⏳"}
          </div>

          <h2 style={{
            color: aiResult?.verificationStatus === "Verified"
              ? "#00e676"
              : aiResult?.verificationStatus === "Rejected"
              ? "#ff4d4f"
              : aiResult?.verificationStatus === "Flagged"
              ? "#ff922b"
              : "#ffb703",
            margin: "10px 0"
          }}>
            {aiResult?.verificationStatus === "Verified"
              ? "Report Verified & Published!"
              : aiResult?.verificationStatus === "Rejected"
              ? "Fake / Inaccurate Report Rejected by AI"
              : aiResult?.verificationStatus === "Flagged"
              ? "Suspicious Report Flagged by AI"
              : "Report Queued for Verification"}
          </h2>

          <p style={{ maxWidth: "560px", margin: "0 auto 16px", fontSize: "14px", lineHeight: "1.6", color: "var(--text-muted)" }}>
            {aiResult?.verificationStatus === "Verified"
              ? "Your observation was cross-checked with real-time satellite telemetry and successfully verified. It is now active on emergency alert channels."
              : aiResult?.verificationStatus === "Rejected"
              ? "Severe discrepancy detected against real-time satellite radar and ground sensors. To protect the public from panic and false warnings, this report is REJECTED and SUPPRESSED from public alerts."
              : aiResult?.verificationStatus === "Flagged"
              ? "Real-time meteorological telemetry indicates conditions inconsistent with your claim. This report is FLAGGED as suspicious and will NOT appear as an active severe alert until investigated by an administrator."
              : "Your report has been logged and is pending verification. It will only be posted to active alert feeds once corroborated."}
          </p>

          {/* AI Result Card */}
          {aiResult && (
            <div style={{
              margin: "20px auto", maxWidth: "480px", background: "rgba(0,0,0,0.35)",
              border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "18px 22px", textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa" }}>🧠 AI Verification Analysis</span>
                <span style={{
                  fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px",
                  background: aiResult.verificationStatus === "Verified" ? "rgba(0,230,118,0.2)" : aiResult.verificationStatus === "Rejected" ? "rgba(255,77,79,0.2)" : "rgba(255,146,43,0.2)",
                  color: aiResult.verificationStatus === "Verified" ? "#00e676" : aiResult.verificationStatus === "Rejected" ? "#ff4d4f" : "#ff922b",
                  border: `1px solid ${aiResult.verificationStatus === "Verified" ? "rgba(0,230,118,0.4)" : aiResult.verificationStatus === "Rejected" ? "rgba(255,77,79,0.4)" : "rgba(255,146,43,0.4)"}`
                }}>
                  {aiResult.verificationStatus?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", rowGap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)" }}>AI Fake/Spam Risk</span>
                  <span style={{ fontWeight: 800, color: aiResult.fakeScore > 40 ? "#ff4d4f" : "#00e676" }}>
                    {aiResult.fakeScore}%
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Authenticity Score</span>
                  <span style={{ fontWeight: 800, color: aiResult.confidenceScore >= 70 ? "#00e676" : "#ffb703" }}>
                    {aiResult.confidenceScore}% Genuine
                  </span>
                </div>

                {aiResult.verdictReason && (
                  <div style={{ marginTop: "4px", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", fontSize: "12px", color: "var(--text-main)", lineHeight: "1.5" }}>
                    <strong>Verdict:</strong> {aiResult.verdictReason}
                  </div>
                )}

                {aiResult.telemetry && (
                  <div style={{ marginTop: "6px", padding: "8px 12px", borderRadius: "8px", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", fontSize: "12px", color: "#a5d8ff" }}>
                    🛰️ <strong>Satellite Telemetry at location:</strong> {aiResult.telemetry.temperature}°C, {aiResult.telemetry.rainMm}mm rain, Wind: {aiResult.telemetry.windSpeedKm} km/h (WMO Code: {aiResult.telemetry.weatherCode})
                  </div>
                )}

                {aiResult.flags?.length > 0 && (
                  <div style={{ marginTop: "6px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", margin: "0 0 4px", textTransform: "uppercase" }}>Detection Notes</p>
                    {aiResult.flags.map((flag) => (
                      <div key={flag} style={{ fontSize: "11px", color: "#ff922b", background: "rgba(255,146,43,0.1)", padding: "4px 8px", borderRadius: "4px", marginBottom: "4px" }}>
                        ⚠️ {flag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
            <Link to="/map" className="primary-btn">🗺️ View Live Map</Link>
            <Link to="/events" className="secondary-btn">📋 View Events Registry</Link>
            <button className="secondary-btn" onClick={() => { setSubmitted(false); setAiResult(null); }}>
              + Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        <form className="report-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(255,77,79,0.15)", border: "1px solid rgba(255,77,79,0.4)", color: "#ff7875", marginBottom: "20px", fontSize: "14px" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* AI Notice Banner */}
          <div style={{
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: "10px", padding: "12px 16px", marginBottom: "22px",
            display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#a78bfa",
          }}>
            <span style={{ fontSize: "20px" }}>🧠</span>
            <span>Your report will be automatically analyzed by our AI engine for authenticity and duplicate detection before publishing.</span>
          </div>

          {/* Row 1: Event Type + Severity */}
          <div className="form-row">
            <div className="form-group">
              <label style={labelStyle}>Weather Event Type *</label>
              <select name="eventType" value={formData.eventType} onChange={handleChange} required>
                <option value="">Select weather event</option>
                <option value="Heavy Rainfall">🌧️ Heavy Rainfall</option>
                <option value="Flood">🌊 Flood / Waterlogging</option>
                <option value="Thunderstorm">⛈️ Thunderstorm / Lightning</option>
                <option value="Heatwave">☀️ Extreme Heatwave</option>
                <option value="Hailstorm">🌨️ Hailstorm</option>
                <option value="Strong Winds">💨 Strong Winds / Cyclone</option>
                <option value="Fog">🌫️ Fog / Low Visibility</option>
                <option value="Dust Storm">🏜️ Dust Storm / Sandstorm</option>
                <option value="Cyclone">🌀 Cyclone / Tropical Storm</option>
                <option value="Landslide">⛰️ Landslide / Mudslide</option>
                <option value="Other">⚠️ Other Meteorological Hazard</option>
              </select>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Severity Level *</label>
              <select name="severity" value={formData.severity} onChange={handleChange} required>
                <option value="">Select severity level</option>
                <option value="Low">🟢 Low — Routine / Mild</option>
                <option value="Medium">⚡ Medium — Disruptive / Monitored</option>
                <option value="High">⚠️ High — Hazardous / Structural Threat</option>
                <option value="Critical">🚨 Critical — Life-Threatening / Emergency</option>
              </select>
            </div>
          </div>

          {/* Row 2: City + State */}
          <div className="form-row">
            <div className="form-group">
              <label style={labelStyle}>City / Location *</label>
              <input
                type="text" name="location" list="city-suggestions"
                value={formData.location} onChange={handleChange}
                placeholder="e.g. Meerut, Delhi, Mumbai..." required
              />
              <datalist id="city-suggestions">
                {SUGGESTED_CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
              <small>Recognized cities are instantly plotted on the GIS map.</small>
            </div>

            <div className="form-group">
              <label style={labelStyle}>State / Province</label>
              <select name="stateProvince" value={formData.stateProvince} onChange={handleChange}>
                <option value="">Select state (optional)</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label style={labelStyle}>Observations &amp; Description *</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange}
              rows="5"
              placeholder="Describe what you witnessed — water level on roads, wind damage, rainfall intensity, structural damage, visibility conditions... Use #IMD #WeatherIndia hashtags for better indexing."
              required
            ></textarea>
            <small>More detail = higher AI confidence score. Include hashtags like #IMD, #FloodAlert, #HeavyRain.</small>
          </div>

          {/* Reporter Name */}
          <div className="form-group">
            <label style={labelStyle}>Your Name (Optional)</label>
            <input
              type="text" name="reporterName"
              value={formData.reporterName} onChange={handleChange}
              placeholder="e.g. Rahul Sharma (leave blank to report anonymously)"
            />
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label style={labelStyle}>Upload Photographic Evidence (Optional)</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <small>Max 5MB. Upload an image to help authorities verify the ground situation.</small>

            {photoPreview && (
              <div style={{ marginTop: "12px", position: "relative", display: "inline-block" }}>
                <img src={photoPreview} alt="Preview" style={{ maxHeight: "150px", borderRadius: "8px", border: "1px solid var(--border-cyan)" }} />
                <button
                  type="button" onClick={removePhoto}
                  style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.7)", color: "#ff7875", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                >✕</button>
              </div>
            )}
          </div>

          <button type="submit" className="submit-report-btn" disabled={loading}>
            {loading ? "🔄 Transmitting & Analyzing Report..." : "⚡ Submit Weather Report →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ReportEvent;