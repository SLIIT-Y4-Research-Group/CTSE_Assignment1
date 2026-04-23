require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const eventRoutes = require("./routes/eventRoutes");
const { swaggerSpec } = require("./swagger");

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || "service";
const MONGO_URI = process.env.MONGO_URI;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", eventRoutes);

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

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
