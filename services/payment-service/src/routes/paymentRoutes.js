const express = require("express");
const router = express.Router();

const {
  createCheckoutSession,
  getPaymentById,
  confirmPaymentSession,
} = require("../controllers/paymentController");

router.post("/checkout", createCheckoutSession);
router.post("/confirm", confirmPaymentSession);
router.get("/:id", getPaymentById);

module.exports = router;