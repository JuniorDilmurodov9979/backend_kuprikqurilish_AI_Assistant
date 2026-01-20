import express from "express";
import cors from "cors";
import assistantRoute from "./routes/assistant.js";
import chatHistoryRoute from "./routes/chatHistory.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://kuprikqurilish.uz",
      "http://kuprikqurilish.uz",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/assistant", assistantRoute);
app.use("/chatHistory", chatHistoryRoute);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(4000, () => {
  console.log("🚀 AI Navigator backend running on port 4000");
});
