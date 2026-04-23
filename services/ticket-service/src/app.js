const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const ticketRoutes = require("./routes/ticketRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

dotenv.config();
connectDB();

const app = express();
const SERVICE_NAME = process.env.SERVICE_NAME || "ticket-service";
app.use(cors());
app.use(express.json());

app.use("/api/tickets", ticketRoutes);
app.use("/api/bookings", bookingRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
