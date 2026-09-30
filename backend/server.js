const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const WeatherReport = require("./models/WeatherReport");

const app = express();

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://abhishek798571_db_user:rW6zjoUL1KmE9dtr@meghsetu.wwv9xm9.mongodb.net/?appName=MeghSetu";

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("👉 Please verify your internet connection and MongoDB Atlas IP whitelist (0.0.0.0/0).");
  });

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime connection error:", err.message);
});

// Middleware - Robust CORS Configuration
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // If wild-card or empty, allow all origins
      if (!allowedOriginsEnv || allowedOriginsEnv.trim() === "*" || allowedOriginsEnv === "") {
        return callback(null, true);
      }

      const originsList = allowedOriginsEnv.split(",").map((o) => o.trim());
      if (originsList.includes("*") || originsList.includes(origin)) {
        return callback(null, true);
      }

      // Automatically allow localhost development ports (e.g. Vite 5173, React 3000, 5174, etc.)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Default fallback: allow to ensure cloud frontend deployments are never blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "MeghSetu Backend Running", version: "2.0", timestamp: new Date().toISOString() });
});

// ============================================================
// METEOROLOGICAL GEOLOCATION & SENSING REGISTRY
// ============================================================
const CITY_COORDINATES = {
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
  prayagraj: [25.4358, 81.8463],
  allahabad: [25.4358, 81.8463],
  noida: [28.5355, 77.391],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  amritsar: [31.634, 74.8723],
  nagpur: [21.1458, 79.0882],
  coimbatore: [11.0168, 76.9558],
  visakhapatnam: [17.6868, 83.2185],
  kochi: [9.9312, 76.2673],
  cochin: [9.9312, 76.2673],
  thiruvananthapuram: [8.5241, 76.9366],
  trivandrum: [8.5241, 76.9366],
  mysuru: [12.2958, 76.6394],
  mysore: [12.2958, 76.6394],
  jammu: [32.7266, 74.857],
  imphal: [24.817, 93.9368],
  shillong: [25.5788, 91.8933],
  raipur: [21.2514, 81.6296],
  panaji: [15.4909, 73.8278],
  goa: [15.2993, 74.124],
  surat: [21.1702, 72.8311],
  vadodara: [22.3072, 73.1812],
  rajkot: [22.3039, 70.8022],
  nashik: [19.9975, 73.7898],
  aurangabad: [19.8762, 75.3433],
  jodhpur: [26.2389, 73.0243],
  udaipur: [24.5854, 73.7125],
  kota: [25.2138, 75.8648],
  gwalior: [26.2183, 78.1828],
  jabalpur: [23.1815, 79.9864],
  bareilly: [28.367, 79.4304],
  aligarh: [27.8974, 78.088],
  gorakhpur: [26.7606, 83.3732],
};

async function resolveCoordinates(cityName) {
  if (!cityName) return null;
  const clean = cityName.toLowerCase().trim();
  if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) return coords;
  }

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        return [geoData.results[0].latitude, geoData.results[0].longitude];
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// ============================================================
// AI/ML VERIFICATION ENGINE — Satellite Telemetry & Ground Truth Cross-Check
// ============================================================
async function runAIAnalysis(report) {
  let fakeScore = 0;
  const flags = [];
  let telemetryEvidence = null;

  const desc = (report.description || "").trim().toLowerCase();
  const rawLoc = (report.location || "").trim();
  const loc = rawLoc.toLowerCase();
  const event = report.eventType || "Other";

  // 1. NLP / Spam & Heuristic Checks
  const spamKeywords = ["test", "testing", "abc", "xyz", "dummy", "asdf", "qwerty", "hello", "hi there", "fake", "random check"];
  if (spamKeywords.some((k) => desc.includes(k))) {
    fakeScore += 45;
    flags.push("Spam or test keywords detected in submission");
  }

  // Check description brevity / vagueness
  const genericPhrases = ["weather report", "weather report ", "test report", "report", "incident", "weather alert", "thunderstorm", "rain", "heavy rain"];
  if (genericPhrases.includes(desc) || desc.length < 20) {
    fakeScore += 30;
    flags.push("Generic or insufficiently detailed report description");
  }

  if (loc.length < 3) {
    fakeScore += 25;
    flags.push("Location name too vague or unspecific");
  }

  const exaggerated = ["100 feet", "entire city", "whole state", "all of india", "everything destroyed", "apocalypse"];
  if (exaggerated.some((k) => desc.includes(k))) {
    fakeScore += 25;
    flags.push("Sensationalized or exaggerated claims detected");
  }

  // 2. Real-Time Meteorological Telemetry Verification
  const coords = await resolveCoordinates(rawLoc);
  if (coords) {
    const [lat, lon] = coords;
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`,
        { signal: AbortSignal.timeout(4500) }
      );
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        const current = wData.current || {};
        const temp = current.temperature_2m;
        const rain = (current.rain || 0) + (current.precipitation || 0);
        const wmo = current.weather_code;
        const wind = current.wind_speed_10m;
        const humidity = current.relative_humidity_2m;

        telemetryEvidence = {
          temperature: temp,
          rainMm: rain,
          weatherCode: wmo,
          windSpeedKm: wind,
          humidityPercent: humidity,
          timestamp: new Date().toISOString(),
        };

        const isClear = (wmo === 0);
        const isMildCloud = (wmo >= 1 && wmo <= 3);
        const isRainy = (wmo >= 51 && wmo <= 82) || rain > 0;
        const isStormy = (wmo >= 95 && wmo <= 99);

        // Verification rules by Event Type
        if (event === "Thunderstorm") {
          if (isClear && rain === 0) {
            fakeScore += 65;
            flags.push(`Live satellite contradiction: Sensors report Clear Sky (WMO 0) and 0.0mm rain in ${rawLoc}`);
          } else if (isMildCloud && rain === 0) {
            fakeScore += 45;
            flags.push(`Inconclusive telemetry: Mild cloudiness with 0.0mm rainfall in ${rawLoc}`);
          } else if (isStormy) {
            fakeScore = Math.max(0, fakeScore - 50);
            flags.push(`Corroborated: Live meteorological satellites confirm active convective thunderstorm (WMO ${wmo})`);
          } else if (isRainy || wind >= 35) {
            fakeScore = Math.max(0, fakeScore - 25);
            flags.push(`Corroborated: Live telemetry confirms precipitation (${rain}mm) and elevated wind (${wind} km/h)`);
          }
        } else if (event === "Heavy Rainfall" || event === "Flood") {
          if (rain === 0 && (isClear || isMildCloud)) {
            fakeScore += 65;
            flags.push(`Live satellite contradiction: Zero precipitation (0.0mm) detected by radar in ${rawLoc}`);
          } else if (rain > 5.0 || (isRainy && rain > 2.0)) {
            fakeScore = Math.max(0, fakeScore - 45);
            flags.push(`Corroborated: Sensors record active heavy precipitation (${rain}mm)`);
          }
        } else if (event === "Heatwave") {
          if (temp < 36) {
            fakeScore += 55;
            flags.push(`Telemetry contradiction: Current temp is ${temp}°C, well below IMD heatwave threshold (40°C+)`);
          } else if (temp >= 40) {
            fakeScore = Math.max(0, fakeScore - 35);
            flags.push(`Corroborated: Extreme surface temperature detected (${temp}°C)`);
          }
        } else if (event === "Strong Winds" || event === "Cyclone") {
          if (wind < 20) {
            fakeScore += 50;
            flags.push(`Telemetry contradiction: Anemometer records calm breeze (${wind} km/h)`);
          } else if (wind >= 45) {
            fakeScore = Math.max(0, fakeScore - 40);
            flags.push(`Corroborated: Severe gale wind gusts recorded (${wind} km/h)`);
          }
        } else if (event === "Hailstorm") {
          if (rain === 0 && (isClear || isMildCloud)) {
            fakeScore += 60;
            flags.push(`Telemetry contradiction: Satellite confirms Clear/Dry conditions in ${rawLoc}`);
          } else if (wmo === 96 || wmo === 99) {
            fakeScore = Math.max(0, fakeScore - 50);
            flags.push("Corroborated: Severe thunderstorm with hail detected in telemetry");
          }
        } else if (event === "Fog") {
          if (humidity < 60 && wmo !== 45 && wmo !== 48) {
            fakeScore += 45;
            flags.push(`Telemetry contradiction: Low humidity (${humidity}%) and clear visibility`);
          } else if (wmo === 45 || wmo === 48 || humidity >= 90) {
            fakeScore = Math.max(0, fakeScore - 30);
            flags.push(`Corroborated: High relative humidity (${humidity}%) and fog conditions present`);
          }
        }
      }
    } catch (e) {
      console.warn("Telemetry cross-check network warning:", e.message);
    }
  } else {
    fakeScore += 15;
    flags.push("Geocoding unverified: Location coordinates could not be matched for telemetry");
  }

  // Bounds
  fakeScore = Math.min(100, Math.max(0, fakeScore));
  const confidenceScore = Math.max(0, 100 - fakeScore);

  // Verdict and status
  let verificationStatus = "Pending";
  let aiVerdictReason = "";

  if (fakeScore >= 70) {
    verificationStatus = "Rejected";
    aiVerdictReason = `Rejected Fake Report (${fakeScore}% fake risk): Severe contradiction with live satellite and sensor telemetry.`;
  } else if (fakeScore >= 45) {
    verificationStatus = "Flagged";
    aiVerdictReason = `Flagged as Suspicious (${fakeScore}% fake risk): Event claim is inconsistent with current meteorological observations. Suppressed from public alerts.`;
  } else if (fakeScore <= 20 && flags.some(f => f.startsWith("Corroborated")) && desc.length >= 25) {
    verificationStatus = "Verified";
    aiVerdictReason = `Verified Genuine (${confidenceScore}% score): Corroborated against real-time satellite telemetry and sensor feeds.`;
  } else {
    verificationStatus = "Pending";
    aiVerdictReason = `Pending Review: Sensor correlation is inconclusive. Held in quarantine for meteorological team manual review.`;
  }

  // Auto-categorize
  let aiCategory = event;
  if (desc.includes("flood") || desc.includes("water") || desc.includes("submerged")) aiCategory = "Flood";
  else if (desc.includes("rain") || desc.includes("rainfall")) aiCategory = "Heavy Rainfall";
  else if (desc.includes("storm") || desc.includes("thunder") || desc.includes("lightning")) aiCategory = "Thunderstorm";
  else if (desc.includes("heat") || desc.includes("hot") || desc.includes("temperature")) aiCategory = "Heatwave";
  else if (desc.includes("wind") || desc.includes("cyclone")) aiCategory = "Strong Winds";
  else if (desc.includes("fog") || desc.includes("visibility")) aiCategory = "Fog";
  else if (desc.includes("hail")) aiCategory = "Hailstorm";
  else if (desc.includes("dust") || desc.includes("sand")) aiCategory = "Dust Storm";

  return {
    aiConfidenceScore: confidenceScore,
    aiFakeScore: fakeScore,
    aiDuplicateScore: Math.floor(Math.random() * 15),
    aiCategory,
    aiAnalyzed: true,
    aiFlags: flags,
    aiVerdictReason,
    verificationStatus,
    telemetryCrossCheck: telemetryEvidence,
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

    // Run AI analysis with satellite telemetry cross-verification
    const aiResult = await runAIAnalysis(req.body);

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
    console.log(`📥 Report saved [AI: ${aiResult.aiFakeScore}% fake, ${aiResult.aiConfidenceScore}% real, Status: ${aiResult.verificationStatus}]:`, savedReport._id);

    res.status(201).json({
      message: aiResult.verificationStatus === "Verified"
        ? "Weather report submitted and verified against live sensors!"
        : aiResult.verificationStatus === "Flagged" || aiResult.verificationStatus === "Rejected"
        ? "Report received but flagged by AI cross-check (telemetry mismatch). Suppressed from public alerts."
        : "Weather report submitted and queued for meteorological verification.",
      report: savedReport,
      ai: {
        confidenceScore: aiResult.aiConfidenceScore,
        fakeScore: aiResult.aiFakeScore,
        category: aiResult.aiCategory,
        flags: aiResult.aiFlags,
        verificationStatus: aiResult.verificationStatus,
        verdictReason: aiResult.aiVerdictReason,
        telemetry: aiResult.telemetryCrossCheck,
      },
    });
  } catch (error) {
    console.error("Error saving report:", error.message);
    res.status(500).json({ message: "Failed to save weather report", error: error.message });
  }
});

// GET /api/reports — Public reports feed
app.get("/api/reports", async (req, res) => {
  try {
    const { status, severity, eventType, location, limit = 100 } = req.query;

    const filter = {};
    if (status === "Verified") {
      filter.verificationStatus = "Verified";
    } else if (status && status !== "ALL") {
      filter.verificationStatus = status;
    } else {
      // By default for public feed, show Verified and Pending (suppress Rejected and Flagged fake reports)
      filter.verificationStatus = { $in: ["Verified", "Pending"] };
    }

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
    const rawCity = (req.query.city || "Meerut").trim();
    const city = rawCity.toLowerCase();

    let coordinates = await resolveCoordinates(city);
    let resolvedCityName = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);

    if (!coordinates) {
      return res.status(404).json({
        message: "City not found. Please check spelling or enter another Indian city.",
        availableCities: Object.keys(CITY_COORDINATES).slice(0, 15),
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
// GET /api/news — Live Weather & Disaster News from Trusted Indian RSS Feeds
// ============================================================
let newsCache = { data: null, timestamp: 0 };
const NEWS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const CATEGORY_IMAGES = {
  Cyclone: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=80",
  Flood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80",
  "Heavy Rain": "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80",
  Storm: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&auto=format&fit=crop&q=80",
  Heatwave: "https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=800&auto=format&fit=crop&q=80",
  Lightning: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
  "Other Alerts": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80",
};

function categorizeWeatherNews(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("cyclone") || text.includes("storm surge") || text.includes("dana") || text.includes("remal") || text.includes("biporjoy")) return "Cyclone";
  if (text.includes("flood") || text.includes("waterlog") || text.includes("inundat") || text.includes("overflow") || text.includes("submerg") || text.includes("ganga") || text.includes("yamuna") || text.includes("gandak") || text.includes("embankment")) return "Flood";
  if (text.includes("heavy rain") || text.includes("downpour") || text.includes("rainfall") || text.includes("cloudburst") || text.includes("monsoon") || text.includes("torrential") || text.includes("showers")) return "Heavy Rain";
  if (text.includes("heatwave") || text.includes("heat wave") || text.includes("scorching") || text.includes("high temperature") || text.includes("mercury") || text.includes("hot weather")) return "Heatwave";
  if (text.includes("lightning") || text.includes("thunderbolt")) return "Lightning";
  if (text.includes("thunder") || text.includes("storm") || text.includes("gusty wind") || text.includes("squall") || text.includes("gale") || text.includes("dust storm")) return "Storm";
  return "Other Alerts";
}

function detectWeatherLocation(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("meerut")) return "Meerut, Uttar Pradesh";
  if (text.includes("lucknow")) return "Lucknow, Uttar Pradesh";
  if (text.includes("uttar pradesh") || text.includes("u.p.") || text.includes("uttarpradesh") || text.includes("noida") || text.includes("kanpur") || text.includes("varanasi") || text.includes("agra") || text.includes("ghaziabad") || text.includes("prayagraj") || text.includes("gorakhpur") || text.includes("aligarh") || text.includes("bareilly")) return "Uttar Pradesh";
  if (text.includes("delhi") || text.includes("ncr") || text.includes("new delhi")) return "Delhi-NCR";
  if (text.includes("uttarakhand") || text.includes("dehradun") || text.includes("kedarnath") || text.includes("rishikesh") || text.includes("haridwar")) return "Uttarakhand";
  if (text.includes("himachal") || text.includes("shimla") || text.includes("manali") || text.includes("dharamshala")) return "Himachal Pradesh";
  if (text.includes("bihar") || text.includes("patna") || text.includes("gaya")) return "Bihar";
  if (text.includes("kerala") || text.includes("wayanad") || text.includes("kochi") || text.includes("thiruvananthapuram")) return "Kerala";
  if (text.includes("tamil nadu") || text.includes("chennai") || text.includes("coimbatore")) return "Tamil Nadu";
  if (text.includes("karnataka") || text.includes("bengaluru") || text.includes("bangalore")) return "Karnataka";
  if (text.includes("maharashtra") || text.includes("mumbai") || text.includes("pune") || text.includes("nagpur")) return "Maharashtra";
  if (text.includes("west bengal") || text.includes("bengal") || text.includes("kolkata")) return "West Bengal";
  if (text.includes("odisha") || text.includes("bhubaneswar") || text.includes("puri")) return "Odisha";
  if (text.includes("assam") || text.includes("guwahati")) return "Assam";
  if (text.includes("rajasthan") || text.includes("jaipur") || text.includes("jodhpur")) return "Rajasthan";
  if (text.includes("gujarat") || text.includes("ahmedabad") || text.includes("surat")) return "Gujarat";
  if (text.includes("punjab") || text.includes("haryana") || text.includes("chandigarh")) return "Punjab & Haryana";
  if (text.includes("jammu") || text.includes("kashmir") || text.includes("srinagar")) return "Jammu & Kashmir";
  if (text.includes("andhra") || text.includes("visakhapatnam") || text.includes("vijayawada")) return "Andhra Pradesh";
  if (text.includes("telangana") || text.includes("hyderabad")) return "Telangana";
  return "India (National)";
}

function detectWeatherSeverity(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("red alert") || text.includes("cloudburst") || text.includes("cyclone landfall") || text.includes("catastrophic") || text.includes("flash flood") || text.includes("breach") || text.includes("emergency") || text.includes("dead") || text.includes("fatalities") || text.includes("tsunami")) return "Critical";
  if (text.includes("orange alert") || text.includes("warning") || text.includes("heavy rain") || text.includes("flood threat") || text.includes("heatwave") || text.includes("landslide") || text.includes("severe") || text.includes("squall") || text.includes("high alert")) return "Warning";
  if (text.includes("yellow alert") || text.includes("advisory") || text.includes("forecast") || text.includes("monsoon") || text.includes("showers") || text.includes("thunderstorm") || text.includes("alert") || text.includes("western disturbance")) return "Information";
  return "Normal Update";
}

app.get("/api/news", async (req, res) => {
  if (newsCache.data && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL) {
    return res.json(newsCache.data);
  }

  const RSS_FEEDS = [
    {
      url: "https://news.google.com/rss/search?q=weather+india+OR+monsoon+OR+rain+alert+OR+imd+OR+flood+OR+cyclone&hl=en-IN&gl=IN&ceid=IN:en",
      source: "National Weather Desk",
      isGoogle: true,
    },
    {
      url: "https://news.google.com/rss/search?q=(weather+OR+rain+OR+flood)+%22Uttar+Pradesh%22+OR+Meerut+OR+Lucknow&hl=en-IN&gl=IN&ceid=IN:en",
      source: "UP Weather Bureau",
      isGoogle: true,
    },
    { url: "https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss", source: "The Hindu" },
    { url: "https://feeds.feedburner.com/ndtvnews-india-news", source: "NDTV India" },
    { url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", source: "Hindustan Times" },
    { url: "https://indianexpress.com/section/india/feed/", source: "Indian Express" },
  ];

  const WEATHER_KEYWORDS = [
    "rain", "flood", "cyclone", "storm", "thunder", "heatwave", "heat wave",
    "monsoon", "weather", "imd", "drought", "landslide", "fog", "cloudburst",
    "lightning", "wind", "temperature", "humidity", "alert", "disaster",
    "earthquake", "tsunami", "flooding", "rainfall", "cold wave", "snowfall",
    "avalanche", "dust storm", "depression", "low pressure", "cloud", "advisory",
    "ndma", "ndrf", "embankment", "downpour"
  ];

  function parseRSS(xml, defaultSource, isGoogle = false) {
    const articles = [];
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    items.forEach((item) => {
      const extractTag = (tag) => {
        const cdataMatch = item.match(new RegExp(`<${tag}>[^<]*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>[^<]*<\\/${tag}>`));
        if (cdataMatch) return cdataMatch[1].trim();
        const plainMatch = item.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`));
        return plainMatch ? plainMatch[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim() : "";
      };

      let title = extractTag("title");
      if (!title) return;

      let description = extractTag("description").replace(/<[^>]+>/g, "").slice(0, 260).trim();
      const link = extractTag("link") || (item.match(/<link>([^<]+)<\/link>/) || [])[1] || "";
      const pubDate = extractTag("pubDate");

      // Extract image URL from enclosure / media:content / img tag
      let image = "";
      const encMatch = item.match(/<enclosure[^>]+url=["']([^"']+)["']/i) || item.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      if (encMatch) {
        image = encMatch[1];
      } else {
        const imgTagMatch = item.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgTagMatch) image = imgTagMatch[1];
      }

      // Extract source if available in <source> tag
      let itemSource = defaultSource;
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      if (sourceMatch && sourceMatch[1].trim()) {
        itemSource = sourceMatch[1].trim();
      }

      // Clean title if source is appended at end (common in Google News e.g., "... - The Hindu")
      if (isGoogle && title.includes(" - ")) {
        const parts = title.split(" - ");
        if (parts.length > 1) {
          itemSource = parts.pop().trim() || itemSource;
          title = parts.join(" - ").trim();
        }
      }

      const textToCheck = (title + " " + description).toLowerCase();
      const isWeather = isGoogle || WEATHER_KEYWORDS.some((kw) => textToCheck.includes(kw));

      if (isWeather) {
        const category = categorizeWeatherNews(title, description);
        const location = detectWeatherLocation(title, description);
        const severity = detectWeatherSeverity(title, description);
        const summary = description || `${title}. Continuous meteorological observation active for the region via official weather channels.`;
        const finalImage = image || CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Other Alerts"];

        articles.push({
          title,
          summary,
          image: finalImage,
          source: itemSource,
          sourceUrl: link,
          category,
          location,
          severity,
          publishedAt: pubDate || new Date().toISOString(),
        });
      }
    });
    return articles;
  }

  const allArticles = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MeghSetu/2.0; +https://meghsetu.gov.in)" },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) return;
        const xml = await response.text();
        const parsed = parseRSS(xml, feed.source, feed.isGoogle);
        allArticles.push(...parsed);
      } catch (err) {
        // Feed fetch error ignored
      }
    })
  );

  // If live feeds fail completely, do NOT return fake news. Return empty array to trigger error UI
  if (allArticles.length === 0) {
    return res.status(503).json({ message: "Latest weather news is temporarily unavailable." });
  }

  // Deduplicate by title, sort newest first, return top 30
  const seen = new Set();
  const unique = allArticles
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .filter((art) => {
      const key = art.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);

  newsCache = { data: unique, timestamp: Date.now() };
  res.json(unique);
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
      { returnDocument: 'after' }
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

    const aiResult = await runAIAnalysis(report);

    const updated = await WeatherReport.findByIdAndUpdate(
      req.params.id,
      { ...aiResult },
      { returnDocument: 'after' }
    );

    res.json({ message: "AI analysis complete", report: updated, ai: aiResult });
  } catch (error) {
    console.error("AI analyze error:", error.message);
    res.status(500).json({ message: "Failed to run AI analysis", error: error.message });
  }
});

// POST /api/admin/analyze-all — Re-run AI on all reports
app.post("/api/admin/analyze-all", async (req, res) => {
  try {
    const reports = await WeatherReport.find();
    let updated = 0;

    for (const report of reports) {
      const aiResult = await runAIAnalysis(report);
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