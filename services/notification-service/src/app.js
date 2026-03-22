require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");

const notificationRoutes = require("./routes/notificationRoutes");
const { swaggerSpec } = require("./utils/swagger");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join", ({ userId }) => {
    if (userId) {
      socket.join(userId);
    }
  });
});

app.locals.io = io;

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";
const MONGO_URI = process.env.MONGO_URI;

app.use(helmet());
app.use(cors());
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

app.use("/api/notify", notificationRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

server.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
