// routes/assistant.js - With request logging
import express from "express";
import {
  detectNavigation,
  generateChatResponse,
  generateGeneralChat,
} from "../services/aiService.js";
import { rateLimiter, getRateLimitStatus } from "../middleware/rateLimiter.js";
import { logRequest, getStats } from "../middleware/requestLogger.js";

const router = express.Router();

router.use(rateLimiter);

/**
 * POST /api/assistant/chat
 * Main chat endpoint with logging
 */
router.post("/chat", async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return res.status(400).json({
        error: "Bo'sh xabar yuborib bo'lmaydi",
      });
    }

    if (trimmedQuery.length > 500) {
      return res.status(400).json({
        error: "Xabar juda uzun (maksimal 500 belgi)",
      });
    }

    console.log(`📨 New query from ${req.ip}: "${trimmedQuery}"`);

    // Detect navigation/FAQ
    const detectionResult = await detectNavigation(trimmedQuery);

    // Generate response
    const aiResponse = await generateChatResponse(
      trimmedQuery,
      detectionResult,
    );

    const processingTime = Date.now() - startTime;

    // Log the request
    logRequest({
      query: trimmedQuery,
      model: aiResponse.model || detectionResult.model || "unknown",
      responseType: detectionResult.type,
      tokens: aiResponse.tokens || detectionResult.tokens || 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
      error: aiResponse.error || null,
    });

    const rateLimitStatus = getRateLimitStatus(req);

    // Return FAQ answer
    if (detectionResult && detectionResult.type === "FAQ") {
      return res.json({
        message: aiResponse.message || aiResponse,
        type: "FAQ",
        faq: {
          id: detectionResult.faq.id,
          question: detectionResult.faq.question,
          category: detectionResult.faq.category,
        },
        meta: {
          model: aiResponse.model || "keyword-match",
          tokens: aiResponse.tokens || 0,
          processingTime: `${processingTime}ms`,
        },
        rateLimit: {
          remaining: rateLimitStatus.remaining,
          resetAt: rateLimitStatus.resetAt,
        },
      });
    }

    // Return navigation response
    if (
      detectionResult &&
      detectionResult.type === "NAVIGATION" &&
      detectionResult.matched &&
      detectionResult.url !== "NOT_FOUND"
    ) {
      return res.json({
        message: aiResponse.message || aiResponse,
        type: "NAVIGATION",
        navigation: {
          url: detectionResult.url,
          intent: detectionResult.intent,
        },
        meta: {
          model: aiResponse.model || detectionResult.model || "unknown",
          tokens: aiResponse.tokens || detectionResult.tokens || 0,
          processingTime: `${processingTime}ms`,
        },
        rateLimit: {
          remaining: rateLimitStatus.remaining,
          resetAt: rateLimitStatus.resetAt,
        },
      });
    }

    // General chat response
    return res.json({
      message: aiResponse.message || aiResponse,
      type: "CHAT",
      meta: {
        model: aiResponse.model || "unknown",
        tokens: aiResponse.tokens || 0,
        processingTime: `${processingTime}ms`,
      },
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        resetAt: rateLimitStatus.resetAt,
      },
    });
  } catch (err) {
    const processingTime = Date.now() - startTime;

    console.error("Chat error:", err);

    // Log error
    logRequest({
      query: req.body.query || "unknown",
      model: "error",
      responseType: "ERROR",
      tokens: 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
      error: err.message,
    });

    return res.status(500).json({
      error: "Internal server error",
      message: "Kechirasiz, xatolik yuz berdi. Qaytadan urinib ko'ring.",
    });
  }
});

/**
 * POST /api/assistant/navigate
 */
router.post("/navigate", async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    console.log(`🧭 Navigation query from ${req.ip}: "${query}"`);

    const result = await detectNavigation(query);
    const processingTime = Date.now() - startTime;

    // Log the request
    logRequest({
      query,
      model: result.model || "keyword-match",
      responseType: result.type === "NAVIGATION" ? "NAVIGATION" : "NOT_FOUND",
      tokens: result.tokens || 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
    });

    const rateLimitStatus = getRateLimitStatus(req);

    if (!result || result.type !== "NAVIGATION" || result.url === "NOT_FOUND") {
      return res.json({
        type: "NOT_FOUND",
        meta: {
          processingTime: `${processingTime}ms`,
        },
        rateLimit: {
          remaining: rateLimitStatus.remaining,
          resetAt: rateLimitStatus.resetAt,
        },
      });
    }

    return res.json({
      type: "NAVIGATE",
      url: result.url,
      intent: result.intent,
      meta: {
        model: result.model || "keyword-match",
        tokens: result.tokens || 0,
        processingTime: `${processingTime}ms`,
      },
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        resetAt: rateLimitStatus.resetAt,
      },
    });
  } catch (err) {
    const processingTime = Date.now() - startTime;

    console.error("Navigate error:", err);

    logRequest({
      query: req.body.query || "unknown",
      model: "error",
      responseType: "ERROR",
      tokens: 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
      error: err.message,
    });

    return res.status(500).json({
      error: "Internal server error",
      message: "Kechirasiz, xatolik yuz berdi.",
    });
  }
});

/**
 * POST /api/assistant/talk
 */
router.post("/talk", async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Query is required",
      });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return res.status(400).json({
        error: "Bo'sh xabar yuborib bo'lmaydi",
      });
    }

    if (trimmedQuery.length > 500) {
      return res.status(400).json({
        error: "Xabar juda uzun (maksimal 500 belgi)",
      });
    }

    console.log(`💬 Talk query from ${req.ip}: "${trimmedQuery}"`);

    const aiResponse = await generateGeneralChat(trimmedQuery);
    const processingTime = Date.now() - startTime;

    // Log the request
    logRequest({
      query: trimmedQuery,
      model: aiResponse.model || "unknown",
      responseType: "CHAT",
      tokens: aiResponse.tokens || 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
      error: aiResponse.error || null,
    });

    const rateLimitStatus = getRateLimitStatus(req);

    return res.json({
      message: aiResponse.message || aiResponse,
      type: "CHAT",
      meta: {
        model: aiResponse.model || "unknown",
        tokens: aiResponse.tokens || 0,
        processingTime: `${processingTime}ms`,
      },
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        resetAt: rateLimitStatus.resetAt,
      },
    });
  } catch (err) {
    const processingTime = Date.now() - startTime;

    console.error("Talk error:", err);

    logRequest({
      query: req.body.query || "unknown",
      model: "error",
      responseType: "ERROR",
      tokens: 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
      processingTime,
      error: err.message,
    });

    return res.status(500).json({
      error: "Internal server error",
      message: "Kechirasiz, xatolik yuz berdi.",
    });
  }
});

/**
 * GET /api/assistant/stats
 * Get usage statistics
 */
router.get("/stats", (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = getStats(days);

    if (!stats) {
      return res.status(500).json({
        error: "Failed to retrieve statistics",
      });
    }

    return res.json({
      period: `Last ${days} days`,
      ...stats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/assistant/health
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Kuprik Qurilish AI Assistant",
  });
});

export default router;
