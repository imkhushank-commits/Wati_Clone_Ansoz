const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Shopify webhook endpoint
app.post(
  "/webhooks/shopify/orders-create",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const hmac = req.get("X-Shopify-Hmac-Sha256");

    if (!hmac) {
      return res.status(401).send("Missing webhook signature");
    }

    // Verify the HMAC signature here before trusting the payload.
    // Do not process the order until verification succeeds.

    try {
      const order = JSON.parse(req.body.toString("utf8"));

      console.log("Shopify order received:", order.id);

      // Next:
      // 1. Save the event in the database.
      // 2. Trigger the required automation.
      // 3. Queue a WhatsApp message if configured.

      return res.sendStatus(200);
    } catch (error) {
      console.error("Invalid webhook payload:", error.message);
      return res.status(400).send("Invalid payload");
    }
  }
);

app.get("/", (req, res) => {
  res.send("WATI Dashboard Backend is running");
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});