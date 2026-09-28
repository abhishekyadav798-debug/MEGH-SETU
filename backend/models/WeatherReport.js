const mongoose = require("mongoose");

const weatherReportSchema = new mongoose.Schema(
  {
    // Core event fields
    eventType: {
      type: String,
      required: true,
      enum: ["Heavy Rainfall", "Flood", "Thunderstorm", "Heatwave", "Hailstorm", "Strong Winds", "Fog", "Dust Storm", "Cyclone", "Landslide", "Other"],
    },
    severity: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Critical"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    stateProvince: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: "",
    },

    // Source & reporter metadata
    source: {
      type: String,
      enum: ["Citizen Report", "Social Media", "IMD Feed", "News API", "Auto-Sensor"],
      default: "Citizen Report",
    },
    reporterName: {
      type: String,
      default: "Anonymous Citizen",
      trim: true,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    gpsLat: {
      type: Number,
      default: null,
    },
    gpsLon: {
      type: Number,
      default: null,
    },

    // Admin verification
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Flagged"],
      default: "Pending",
    },
    verifiedBy: {
      type: String,
      default: "",
    },
    verificationNote: {
      type: String,
      default: "",
    },

    // AI/ML analysis fields
    aiConfidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiFakeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiDuplicateScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiCategory: {
      type: String,
      default: "",
    },
    aiAnalyzed: {
      type: Boolean,
      default: false,
    },
    aiFlags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast filtering
weatherReportSchema.index({ verificationStatus: 1 });
weatherReportSchema.index({ eventType: 1 });
weatherReportSchema.index({ location: 1 });
weatherReportSchema.index({ severity: 1 });
weatherReportSchema.index({ createdAt: -1 });
weatherReportSchema.index({ source: 1 });

module.exports = mongoose.model("WeatherReport", weatherReportSchema);