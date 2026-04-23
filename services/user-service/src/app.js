require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
//swagger documenttation
const { ensureDefaultRoles } = require("./utils/ensureRoles");
const { swaggerSpec } = require("./utils/swagger");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";
const MONGO_URI = process.env.MONGO_URI;

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`${SERVICE_NAME} connected to MongoDB Atlas`);
    await ensureDefaultRoles();
  })
  .catch((err) => {
    console.error(`${SERVICE_NAME} DB connection error: ${err.message}`);
  });

app.get("/", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    message: `${SERVICE_NAME} is running`
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "ok"
  });
});

app.get("/db-check", (req, res) => {
  const state = mongoose.connection.readyState;

  res.json({
    service: SERVICE_NAME,
    dbConnected: state === 1,
    mongoState: state
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
