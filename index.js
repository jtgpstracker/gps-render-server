import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ================= CONFIG =================
const SUPABASE_URL =
  "https://zfigoukzmeklkciecthx.supabase.co/rest/v1/positions";

const SUPABASE_KEY = process.env.SUPABASE_KEY; // อ่านจาก Render ENV
const PORT = process.env.PORT || 3000;
// =========================================

// ===== DEBUG: CHECK ENV =====
console.log("===== ENV CHECK =====");
console.log("PORT:", PORT);
console.log("SUPABASE_KEY loaded:", !!SUPABASE_KEY);
console.log("=====================");

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    env_loaded: !!SUPABASE_KEY
  });
});

// รับข้อมูลจาก ESP32
app.post("/track", async (req, res) => {
  try {
    if (!SUPABASE_KEY) {
      return res.status(500).json({
        error: "SUPABASE_KEY not loaded from ENV"
      });
    }

    const { imei, lat, lon, source, bat, speed } = req.body;

    if (!imei || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const payload = {
      imei,
      lat,
      lon,
      source: source || "gps",
      bat: bat ?? null,
      speed: speed ?? null
    };

    const sb = await fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!sb.ok) {
      const text = await sb.text();
      return res.status(500).json({ supabase_error: text });
    }

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
