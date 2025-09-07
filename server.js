import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Serve frontend files from public/
app.use(express.static("public"));

const ACCOUNT_KEY = process.env.ACCOUNT_KEY;

// Backend API endpoint (proxy to LTA)
app.get("/api/carparks", async (req, res) => {
  try {
    const response = await fetch("https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2", {
      headers: {
        AccountKey: process.env.ACCOUNT_KEY,
        accept: "application/json"
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: "Failed to fetch from LTA API" });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("API fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
