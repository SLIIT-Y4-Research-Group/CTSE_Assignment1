require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";
const MONGO_URI = process.env.MONGO_URI;

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`${SERVICE_NAME} connected to MongoDB Atlas`);
  })
  .catch((err) => {
    console.error(`${SERVICE_NAME} DB connection error: ${err.message}`);
  });

app.get("/", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    message: `${SERVICE_NAME} is running`,
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "ok",
  });
});

app.get("/db-check", (req, res) => {
  const state = mongoose.connection.readyState;

  res.json({
    service: SERVICE_NAME,
    dbConnected: state === 1,
    mongoState: state,
  });
});

app.use("/api/payments", paymentRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
//ticket service deployment test