// routes/chatHistory.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getStats } from "../middleware/requestLogger.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, "../logs");
const REQUESTS_LOG = path.join(LOG_DIR, "requests.json");
const DAILY_LOG_DIR = path.join(LOG_DIR, "daily");

/**
 * GET /chatHistory - View all chat logs with filtering and stats
 */
router.get("/", (req, res) => {
  try {
    const { limit = 50, date, model, type, format = "html" } = req.query;

    // Read the main log file
    let data = { requests: [] };
    if (fs.existsSync(REQUESTS_LOG)) {
      data = JSON.parse(fs.readFileSync(REQUESTS_LOG, "utf-8"));
    }

    // Apply filters
    let filteredRequests = data.requests;

    if (date) {
      filteredRequests = filteredRequests.filter((r) => r.date === date);
    }

    if (model) {
      filteredRequests = filteredRequests.filter((r) => r.model === model);
    }

    if (type) {
      filteredRequests = filteredRequests.filter(
        (r) => r.responseType === type,
      );
    }

    // Sort by most recent first
    filteredRequests.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    // Limit results
    const limitedRequests = filteredRequests.slice(0, parseInt(limit));

    // Get statistics
    const stats = getStats(7);

    // Return JSON if requested
    if (format === "json") {
      return res.json({
        total: filteredRequests.length,
        showing: limitedRequests.length,
        stats,
        requests: limitedRequests,
      });
    }

    // Return HTML view
    res.send(generateHTML(limitedRequests, stats, req.query));
  } catch (error) {
    console.error("Error reading chat history:", error);
    res.status(500).send(`
      <h1>Error Loading Chat History</h1>
      <p>${error.message}</p>
      <a href="/chatHistory">Try Again</a>
    `);
  }
});

/**
 * GET /chatHistory/daily/:date - View logs for a specific date
 */
router.get("/daily/:date", (req, res) => {
  try {
    const { date } = req.params;
    const dailyLogFile = path.join(DAILY_LOG_DIR, `${date}.json`);

    if (!fs.existsSync(dailyLogFile)) {
      return res.status(404).send(`
        <h1>No logs found for ${date}</h1>
        <a href="/chatHistory">Back to Chat History</a>
      `);
    }

    const dailyData = JSON.parse(fs.readFileSync(dailyLogFile, "utf-8"));
    res.json(dailyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /chatHistory/stats - Get statistics only
 */
router.get("/stats", (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = getStats(days);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate HTML view for chat history
 */
function generateHTML(requests, stats, filters) {
  const modelOptions = ["claude-3-5-sonnet-20241022", "gpt-4", "gpt-3.5-turbo"];
  const typeOptions = ["text", "json", "html", "code"];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat History</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    h1 {
      color: #667eea;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .filters {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .filter-group label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .filter-group input,
    .filter-group select {
      padding: 8px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .filter-group input:focus,
    .filter-group select:focus {
      border-color: #667eea;
    }
    
    button {
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s;
    }
    
    button:hover {
      transform: translateY(-2px);
    }
    
    .requests-container {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .request-card {
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      transition: all 0.2s;
    }
    
    .request-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    
    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .request-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .badge-model {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .badge-type {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    
    .badge-time {
      background: #e8f5e9;
      color: #388e3c;
    }
    
    .badge-error {
      background: #ffebee;
      color: #c62828;
    }
    
    .request-query {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      word-break: break-word;
    }
    
    .request-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      font-size: 13px;
      color: #666;
      margin-top: 10px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    
    .detail-label {
      font-weight: 500;
      color: #999;
      font-size: 11px;
      text-transform: uppercase;
    }
    
    .detail-value {
      margin-top: 2px;
    }
    
    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .refresh-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
      
      .filters {
        flex-direction: column;
      }
      
      .filter-group {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        <span>💬</span>
        Chat History
      </h1>
      
      ${
        stats
          ? `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalRequests}</div>
          <div class="stat-label">Total Requests (7d)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.avgProcessingTime}ms</div>
          <div class="stat-label">Avg Response Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalTokens.toLocaleString()}</div>
          <div class="stat-label">Total Tokens</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.errors}</div>
          <div class="stat-label">Errors</div>
        </div>
      </div>
      `
          : ""
      }
    </div>
    
    <div class="filters">
      <div class="filter-group">
        <label>Limit</label>
        <input type="number" id="limit" value="${filters.limit || 50}" min="1" max="1000">
      </div>
      
      <div class="filter-group">
        <label>Date</label>
        <input type="date" id="date" value="${filters.date || ""}">
      </div>
      
      <div class="filter-group">
        <label>Model</label>
        <select id="model">
          <option value="">All Models</option>
          ${modelOptions
            .map(
              (m) =>
                `<option value="${m}" ${filters.model === m ? "selected" : ""}>${m}</option>`,
            )
            .join("")}
        </select>
      </div>
      
      <div class="filter-group">
        <label>Type</label>
        <select id="type">
          <option value="">All Types</option>
          ${typeOptions
            .map(
              (t) =>
                `<option value="${t}" ${filters.type === t ? "selected" : ""}>${t}</option>`,
            )
            .join("")}
        </select>
      </div>
      
      <button onclick="applyFilters()">Apply Filters</button>
      <button onclick="clearFilters()">Clear</button>
      <button onclick="downloadJSON()">Download JSON</button>
    </div>
    
    <div class="requests-container">
      <h2 style="margin-bottom: 20px; color: #333;">
        Recent Requests (${requests.length})
      </h2>
      
      ${
        requests.length === 0
          ? `
        <div class="no-results">
          <h3>No requests found</h3>
          <p>Try adjusting your filters or wait for new requests to come in.</p>
        </div>
      `
          : requests
              .map(
                (r) => `
        <div class="request-card">
          <div class="request-header">
            <div class="request-meta">
              <span class="badge badge-model">${r.model}</span>
              <span class="badge badge-type">${r.responseType}</span>
              <span class="badge badge-time">${r.processingTime}</span>
              ${r.error ? '<span class="badge badge-error">ERROR</span>' : ""}
            </div>
            <div style="font-size: 12px; color: #999;">
              ${r.date} ${r.time}
            </div>
          </div>
          
          <div class="request-query">
            ${escapeHtml(r.query)}
          </div>
          
          <div class="request-details">
            <div class="detail-item">
              <span class="detail-label">Request ID</span>
              <span class="detail-value">${r.id}</span>
            </div>
            ${
              r.tokens
                ? `
            <div class="detail-item">
              <span class="detail-label">Tokens</span>
              <span class="detail-value">${r.tokens}</span>
            </div>
            `
                : ""
            }
            <div class="detail-item">
              <span class="detail-label">IP Address</span>
              <span class="detail-value">${r.ip}</span>
            </div>
            ${
              r.error
                ? `
            <div class="detail-item">
              <span class="detail-label">Error</span>
              <span class="detail-value" style="color: #c62828;">${escapeHtml(r.error)}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>
      `,
              )
              .join("")
      }
    </div>
  </div>
  
  <button class="refresh-btn" onclick="location.reload()" title="Refresh">
    🔄
  </button>
  
  <script>
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function applyFilters() {
      const limit = document.getElementById('limit').value;
      const date = document.getElementById('date').value;
      const model = document.getElementById('model').value;
      const type = document.getElementById('type').value;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (date) params.append('date', date);
      if (model) params.append('model', model);
      if (type) params.append('type', type);
      
      window.location.href = '/chatHistory?' + params.toString();
    }
    
    function clearFilters() {
      window.location.href = '/chatHistory';
    }
    
    function downloadJSON() {
      const params = new URLSearchParams(window.location.search);
      params.set('format', 'json');
      window.open('/chatHistory?' + params.toString(), '_blank');
    }
  </script>
</body>
</html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export default router;