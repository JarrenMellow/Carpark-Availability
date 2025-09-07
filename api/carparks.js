export default async function handler(req, res) {
  const ACCOUNT_KEY = process.env.ACCOUNT_KEY; // from env vars

  try {
    const response = await fetch(
      "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2",
      {
        headers: {
          AccountKey: ACCOUNT_KEY,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch LTA API" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
