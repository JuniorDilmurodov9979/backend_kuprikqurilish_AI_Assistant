// middleware/requestLogger.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, "../logs");
const REQUESTS_LOG = path.join(LOG_DIR, "requests.json");
const DAILY_LOG_DIR = path.join(LOG_DIR, "daily");

// Create log directories if they don't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

if (!fs.existsSync(DAILY_LOG_DIR)) {
  fs.mkdirSync(DAILY_LOG_DIR, { recursive: true });
}

// Initialize requests log file
if (!fs.existsSync(REQUESTS_LOG)) {
  fs.writeFileSync(REQUESTS_LOG, JSON.stringify({ requests: [] }, null, 2));
}

/**
 * Log a request with all details
 */
export function logRequest({
  query,
  model,
  responseType,
  tokens = null,
  ip,
  userAgent,
  processingTime,
  error = null,
}) {
  const timestamp = new Date();
  const logEntry = {
    id: generateId(),
    timestamp: timestamp.toISOString(),
    date: timestamp.toLocaleDateString("en-US"),
    time: timestamp.toLocaleTimeString("en-US"),
    query,
    model,
    responseType,
    tokens,
    ip,
    userAgent,
    processingTime: `${processingTime}ms`,
    error,
  };

  // Append to main log file
  appendToMainLog(logEntry);

  // Append to daily log file
  appendToDailyLog(logEntry, timestamp);

  // Console output
  console.log(
    `📊 [${logEntry.time}] ${model} | ${responseType} | "${query.substring(
      0,
      50,
    )}..." | ${processingTime}ms`,
  );

  return logEntry;
}

/**
 * Append to main requests.json
 */
function appendToMainLog(entry) {
  try {
    const data = JSON.parse(fs.readFileSync(REQUESTS_LOG, "utf-8"));
    data.requests.push(entry);

    // Keep only last 1000 requests in main file
    if (data.requests.length > 1000) {
      data.requests = data.requests.slice(-1000);
    }

    fs.writeFileSync(REQUESTS_LOG, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to main log:", error);
  }
}

/**
 * Append to daily log file (YYYY-MM-DD.json)
 */
function appendToDailyLog(entry, timestamp) {
  try {
    const dateStr = timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
    const dailyLogFile = path.join(DAILY_LOG_DIR, `${dateStr}.json`);

    let dailyData = { date: dateStr, requests: [] };

    if (fs.existsSync(dailyLogFile)) {
      dailyData = JSON.parse(fs.readFileSync(dailyLogFile, "utf-8"));
    }

    dailyData.requests.push(entry);
    fs.writeFileSync(dailyLogFile, JSON.stringify(dailyData, null, 2));
  } catch (error) {
    console.error("Error writing to daily log:", error);
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get statistics
 */
export function getStats(days = 7) {
  try {
    const data = JSON.parse(fs.readFileSync(REQUESTS_LOG, "utf-8"));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentRequests = data.requests.filter(
      (r) => new Date(r.timestamp) > cutoffDate,
    );

    const stats = {
      totalRequests: recentRequests.length,
      byType: {},
      byModel: {},
      avgProcessingTime: 0,
      errors: 0,
      totalTokens: 0,
    };

    let totalTime = 0;

    recentRequests.forEach((r) => {
      // Count by type
      stats.byType[r.responseType] = (stats.byType[r.responseType] || 0) + 1;

      // Count by model
      stats.byModel[r.model] = (stats.byModel[r.model] || 0) + 1;

      // Sum processing time
      totalTime += parseInt(r.processingTime);

      // Count errors
      if (r.error) stats.errors++;

      // Sum tokens
      if (r.tokens) stats.totalTokens += r.tokens;
    });

    stats.avgProcessingTime =
      recentRequests.length > 0
        ? Math.round(totalTime / recentRequests.length)
        : 0;

    return stats;
  } catch (error) {
    console.error("Error getting stats:", error);
    return null;
  }
}

/**
 * Clean old logs (keep last 30 days)
 */
export function cleanOldLogs(daysToKeep = 30) {
  try {
    const files = fs.readdirSync(DAILY_LOG_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let cleaned = 0;

    files.forEach((file) => {
      if (!file.endsWith(".json")) return;

      const dateStr = file.replace(".json", "");
      const fileDate = new Date(dateStr);

      if (fileDate < cutoffDate) {
        fs.unlinkSync(path.join(DAILY_LOG_DIR, file));
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old log files`);
    }

    return cleaned;
  } catch (error) {
    console.error("Error cleaning logs:", error);
    return 0;
  }
}

// Auto-clean logs every 24 hours
setInterval(
  () => {
    cleanOldLogs(30);
  },
  24 * 60 * 60 * 1000,
);
