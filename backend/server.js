const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const WeatherReport = require("./models/WeatherReport");

const app = express();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "MeghSetu Backend Running", version: "2.0", timestamp: new Date().toISOString() });
});

// ============================================================
// AI/ML ENGINE — Rule-based analysis (hackathon-grade simulation)
// ============================================================
function runAIAnalysis(report) {
  let fakeScore = 0;
  let confidenceScore = 100;
  const flags = [];

  const desc = (report.description || "").toLowerCase();
  const loc  = (report.location || "").toLowerCase();

  // --- Fake detection rules ---
  const spamKeywords = ["test", "testing", "abc", "xyz", "dummy", "asdf", "qwerty", "hello", "hi there"];
  if (spamKeywords.some((k) => desc.includes(k))) {
    fakeScore += 40;
    flags.push("Spam keywords detected");
  }

  // Very short description is suspicious
  if (desc.length < 15) {
    fakeScore += 25;
    flags.push("Description too short");
  }

  // Location too generic
  if (loc.length < 3) {
    fakeScore += 20;
    flags.push("Location not specific");
  }

  // Exaggerated claims
  const exaggerated = ["100 feet", "entire city", "whole state", "all of india", "everything destroyed"];
  if (exaggerated.some((k) => desc.includes(k))) {
    fakeScore += 30;
    flags.push("Possible exaggeration detected");
  }

  // Confidence = inverse of fake
  confidenceScore = Math.max(0, 100 - fakeScore);

  // Duplicate score (simplified — real system uses vector embedding similarity)
  const dupScore = Math.floor(Math.random() * 20); // Low by default

  // Auto-categorize based on description keywords
  let aiCategory = report.eventType || "Other";
  if (desc.includes("flood") || desc.includes("water") || desc.includes("submerged")) aiCategory = "Flood";
  else if (desc.includes("rain") || desc.includes("rainfall")) aiCategory = "Heavy Rainfall";
  else if (desc.includes("storm") || desc.includes("thunder") || desc.includes("lightning")) aiCategory = "Thunderstorm";
  else if (desc.includes("heat") || desc.includes("hot") || desc.includes("temperature")) aiCategory = "Heatwave";
  else if (desc.includes("wind") || desc.includes("cyclone")) aiCategory = "Strong Winds";
  else if (desc.includes("fog") || desc.includes("visibility")) aiCategory = "Fog";
  else if (desc.includes("hail")) aiCategory = "Hailstorm";
  else if (desc.includes("dust") || desc.includes("sand")) aiCategory = "Dust Storm";

  // Auto verification suggestion
  let verificationStatus = "Pending";
  if (fakeScore >= 60) verificationStatus = "Flagged";
  else if (fakeScore <= 10 && desc.length > 50) verificationStatus = "Verified";

  return {
    aiConfidenceScore: confidenceScore,
    aiFakeScore: fakeScore,
    aiDuplicateScore: dupScore,
    aiCategory,
    aiAnalyzed: true,
    aiFlags: flags,
    verificationStatus,
  };
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

// POST /api/reports — Submit citizen weather report
app.post("/api/reports", async (req, res) => {
  try {
    const { eventType, severity, location, description } = req.body;
    if (!eventType || !severity || !location || !description) {
      return res.status(400).json({
        message: "Missing required fields: eventType, severity, location, and description are required.",
      });
    }

    // Run AI analysis
    const aiResult = runAIAnalysis(req.body);

    // Extract hashtags from description
    const hashtags = (description.match(/#\w+/g) || []);
    const defaultTags = ["#IMD", "#WeatherIndia", "#MeghSetu"];
    const allTags = [...new Set([...hashtags, ...defaultTags])];

    const report = new WeatherReport({
      ...req.body,
      hashtags: allTags,
      ...aiResult,
    });

    const savedReport = await report.save();
    console.log(`📥 Report saved [AI: ${aiResult.aiFakeScore}% fake, ${aiResult.aiConfidenceScore}% real]:`, savedReport._id);

    res.status(201).json({
      message: "Weather report submitted successfully!",
      report: savedReport,
      ai: {
        confidenceScore: aiResult.aiConfidenceScore,
        fakeScore: aiResult.aiFakeScore,
        category: aiResult.aiCategory,
        flags: aiResult.aiFlags,
      },
    });
  } catch (error) {
    console.error("Error saving report:", error.message);
    res.status(500).json({ message: "Failed to save weather report", error: error.message });
  }
});

// GET /api/reports — Public reports feed (only Verified + Pending)
app.get("/api/reports", async (req, res) => {
  try {
    const { status, severity, eventType, location, limit = 100 } = req.query;

    const filter = {
      verificationStatus: { $in: ["Verified", "Pending"] },
    };
    if (status && status !== "ALL") filter.verificationStatus = status;
    if (severity && severity !== "ALL") filter.severity = severity;
    if (eventType && eventType !== "ALL") filter.eventType = eventType;
    if (location) filter.location = { $regex: location, $options: "i" };

    const reports = await WeatherReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("-photo"); // Exclude heavy photo data in list view

    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ message: "Failed to fetch reports", error: error.message });
  }
});

// GET /api/reports/:id — Single report with photo
app.get("/api/reports/:id", async (req, res) => {
  try {
    const report = await WeatherReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch report", error: error.message });
  }
});

// GET /api/weather — Live weather from Open-Meteo
app.get("/api/weather", async (req, res) => {
  try {
    const city = (req.query.city || "Meerut").toLowerCase().trim();

    const cityCoordinates = {
      meerut: [28.9845, 77.7064],
      delhi: [28.6139, 77.209],
      "new delhi": [28.6139, 77.209],
      mumbai: [19.076, 72.8777],
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
      hyderabad: [17.385, 78.4867],
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
    };

    const coordinates = cityCoordinates[city];
    if (!coordinates) {
      return res.status(404).json({
        message: "City not found",
        availableCities: Object.keys(cityCoordinates),
      });
    }

    const [latitude, longitude] = coordinates;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5`
      ).catch(() => null),
    ]);

    const weatherData = await weatherRes.json();
    let aqiData = null;
    if (aqiRes && aqiRes.ok) {
      const parsedAqi = await aqiRes.json();
      aqiData = parsedAqi.current;
    }

    res.json({
      location: city.charAt(0).toUpperCase() + city.slice(1),
      coordinates: [latitude, longitude],
      weather: weatherData.current,
      airQuality: aqiData,
    });
  } catch (error) {
    console.error("Weather API error:", error.message);
    res.status(500).json({ message: "Failed to fetch weather data", error: error.message });
  }
});

// GET /api/disasters — NASA EONET + USGS Earthquakes
app.get("/api/disasters", async (req, res) => {
  try {
    const [eonetRes, usgsRes] = await Promise.allSettled([
      fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=10"),
      fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"),
    ]);

    const disasters = [];

    if (eonetRes.status === "fulfilled" && eonetRes.value.ok) {
      const eonetData = await eonetRes.value.json();
      if (Array.isArray(eonetData.events)) {
        eonetData.events.forEach((ev) => {
          const latestGeo = ev.geometry && ev.geometry[ev.geometry.length - 1];
          disasters.push({
            id: `eonet-${ev.id}`,
            source: "NASA EONET",
            title: ev.title,
            category: ev.categories?.[0]?.title || "Severe Weather",
            date: latestGeo?.date || ev.geometry?.[0]?.date || new Date().toISOString(),
            coordinates: latestGeo?.coordinates ? [latestGeo.coordinates[1], latestGeo.coordinates[0]] : null,
            severity: "High",
            link: ev.sources?.[0]?.url || "https://eonet.gsfc.nasa.gov",
          });
        });
      }
    }

    if (usgsRes.status === "fulfilled" && usgsRes.value.ok) {
      const usgsData = await usgsRes.value.json();
      if (Array.isArray(usgsData.features)) {
        usgsData.features
          .filter((f) => f.properties.mag >= 3.0)
          .slice(0, 8)
          .forEach((eq) => {
            disasters.push({
              id: `usgs-${eq.id}`,
              source: "USGS Earthquakes",
              title: eq.properties.title,
              category: "Earthquake / Seismic",
              date: new Date(eq.properties.time).toISOString(),
              coordinates: eq.geometry?.coordinates ? [eq.geometry.coordinates[1], eq.geometry.coordinates[0]] : null,
              severity: eq.properties.mag >= 5.0 ? "Critical" : "Medium",
              link: eq.properties.url,
              magnitude: eq.properties.mag,
            });
          });
      }
    }

    res.json(disasters);
  } catch (error) {
    console.error("Disasters API error:", error.message);
    res.status(500).json({ message: "Failed to fetch disaster feeds", error: error.message });
  }
});

// GET /api/geocode — OSM Nominatim Geocoding
app.get("/api/geocode", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "MeghSetu-WeatherPlatform/2.0" } }
    );

    if (!response.ok) throw new Error("Nominatim error");
    const data = await response.json();

    const results = data.map((item) => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    res.json(results);
  } catch (error) {
    console.error("Geocoding error:", error.message);
    res.status(500).json({ message: "Geocoding service unavailable", error: error.message });
  }
});

// ============================================================
// ADMIN ROUTES — /api/admin/*
// ============================================================

// GET /api/admin/reports — All reports with full filtering
app.get("/api/admin/reports", async (req, res) => {
  try {
    const {
      status, severity, eventType, location, source,
      startDate, endDate, search, page = 1, limit = 50,
    } = req.query;

    const filter = {};

    if (status && status !== "ALL") filter.verificationStatus = status;
    if (severity && severity !== "ALL") filter.severity = severity;
    if (eventType && eventType !== "ALL") filter.eventType = eventType;
    if (source && source !== "ALL") filter.source = source;
    if (location) filter.location = { $regex: location, $options: "i" };

    if (search) {
      filter.$or = [
        { location: { $regex: search, $options: "i" } },
        { eventType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { reporterName: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WeatherReport.countDocuments(filter);
    const reports = await WeatherReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Admin reports error:", error.message);
    res.status(500).json({ message: "Failed to fetch admin reports", error: error.message });
  }
});

// GET /api/admin/stats — Aggregate stats for admin dashboard
app.get("/api/admin/stats", async (req, res) => {
  try {
    const [total, pending, verified, rejected, flagged, byEvent, bySeverity, bySource, recent7Days] =
      await Promise.all([
        WeatherReport.countDocuments(),
        WeatherReport.countDocuments({ verificationStatus: "Pending" }),
        WeatherReport.countDocuments({ verificationStatus: "Verified" }),
        WeatherReport.countDocuments({ verificationStatus: "Rejected" }),
        WeatherReport.countDocuments({ verificationStatus: "Flagged" }),
        WeatherReport.aggregate([
          { $group: { _id: "$eventType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        WeatherReport.aggregate([
          { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),
        WeatherReport.aggregate([
          { $group: { _id: "$source", count: { $sum: 1 } } },
        ]),
        // Last 7 days daily count
        WeatherReport.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      totals: { total, pending, verified, rejected, flagged },
      byEvent,
      bySeverity,
      bySource,
      recent7Days,
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// PATCH /api/admin/reports/:id — Update verification status
app.patch("/api/admin/reports/:id", async (req, res) => {
  try {
    const { verificationStatus, verificationNote, verifiedBy } = req.body;

    if (!["Pending", "Verified", "Rejected", "Flagged"].includes(verificationStatus)) {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const report = await WeatherReport.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        verificationNote: verificationNote || "",
        verifiedBy: verifiedBy || "Admin",
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    console.log(`✅ Report ${req.params.id} marked as ${verificationStatus}`);
    res.json({ message: `Report marked as ${verificationStatus}`, report });
  } catch (error) {
    console.error("Status update error:", error.message);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

// POST /api/admin/reports/:id/analyze — Re-run AI analysis
app.post("/api/admin/reports/:id/analyze", async (req, res) => {
  try {
    const report = await WeatherReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const aiResult = runAIAnalysis(report);

    const updated = await WeatherReport.findByIdAndUpdate(
      req.params.id,
      { ...aiResult },
      { new: true }
    );

    res.json({ message: "AI analysis complete", report: updated, ai: aiResult });
  } catch (error) {
    console.error("AI analyze error:", error.message);
    res.status(500).json({ message: "Failed to run AI analysis", error: error.message });
  }
});

// POST /api/admin/analyze-all — Re-run AI on all unanalyzed reports
app.post("/api/admin/analyze-all", async (req, res) => {
  try {
    const reports = await WeatherReport.find({ aiAnalyzed: false });
    let updated = 0;

    for (const report of reports) {
      const aiResult = runAIAnalysis(report);
      await WeatherReport.findByIdAndUpdate(report._id, aiResult);
      updated++;
    }

    res.json({ message: `AI analysis complete for ${updated} reports` });
  } catch (error) {
    res.status(500).json({ message: "Bulk AI analysis failed", error: error.message });
  }
});

// DELETE /api/admin/reports/:id — Delete report
app.delete("/api/admin/reports/:id", async (req, res) => {
  try {
    const report = await WeatherReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    console.log(`🗑️ Report deleted: ${req.params.id}`);
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Failed to delete report", error: error.message });
  }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MeghSetu backend v2.0 running on port ${PORT}`);
});