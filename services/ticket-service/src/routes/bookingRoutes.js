const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/", requireAuth, controller.bookTickets);
router.get("/:id", controller.getBookingDetails);
router.get("/user/:userId", controller.getUserBookings);
router.delete("/:id", controller.cancelBooking);
router.post("/confirm-payment", controller.confirmPayment);

module.exports = router;
