const Payment = require("../models/Payment");
const stripe = require("../utils/stripe");
const { sendPaymentInvoiceEmail } = require("../utils/notificationClient");

async function createCheckoutSession(req, res) {
  try {
    const {
      user_id,
      user_email,
      event_id,
      ticket_id,
      quantity = 1,
      total_amount,
      currency = "LKR",
    } = req.body;

    if (!user_id || !user_email || !event_id || !ticket_id || !total_amount) {
      return res.status(400).json({
        message:
          "user_id, user_email, event_id, ticket_id, and total_amount are required",
      });
    }

    const payment = await Payment.create({
      user_id,
      user_email,
      event_id,
      ticket_id,
      quantity,
      total_amount,
      currency,
      payment_status: "PENDING",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Ticket Payment - Event ${event_id}`,
              description: `Ticket ID: ${ticket_id}, Quantity: ${quantity}`,
            },
            unit_amount: Math.round(total_amount * 100),
          },
          quantity: 1,
        },
      ],

      customer_email: user_email,

      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${payment._id}`,

      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/payment-cancel?payment_id=${payment._id}`,

      metadata: {
        payment_id: payment._id.toString(),
        user_id,
        user_email,
        event_id,
        ticket_id,
      },
    });

    payment.stripe_session_id = session.id;
    await payment.save();

    return res.status(201).json({
      message: "Checkout session created",
      payment,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return res.status(500).json({
      message: "Failed to create checkout session",
      error: err.message,
    });
  }
}

async function confirmPaymentSession(req, res) {
  try {
    const { session_id, payment_id } = req.body;

    if (!session_id && !payment_id) {
      return res.status(400).json({
        message: "session_id or payment_id is required",
      });
    }

    let payment;

    if (payment_id) {
      payment = await Payment.findById(payment_id);
    } else {
      payment = await Payment.findOne({ stripe_session_id: session_id });
    }

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const session = await stripe.checkout.sessions.retrieve(
      session_id || payment.stripe_session_id
    );

    if (session.payment_status !== "paid") {
      payment.payment_status = "FAILED";
      await payment.save();

      return res.status(400).json({
        message: "Payment is not completed",
        stripePaymentStatus: session.payment_status,
        payment,
      });
    }

    payment.payment_status = "PAID";
    payment.stripe_payment_intent_id = session.payment_intent;
    await payment.save();

    let invoiceEmailStatus = "sent";

    try {
      await sendPaymentInvoiceEmail(payment);
    } catch (err) {
      console.error("Invoice email failed:", err.message);
      invoiceEmailStatus = "failed";
    }

    return res.json({
      message: "Payment confirmed",
      payment,
      invoiceEmailStatus,
    });
  } catch (err) {
    console.error("Confirm payment error:", err);
    return res.status(500).json({
      message: "Failed to confirm payment",
      error: err.message,
    });
  }
}

async function getPaymentById(req, res) {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.json({ payment });
  } catch (err) {
    console.error("Get payment error:", err);
    return res.status(500).json({
      message: "Failed to get payment",
      error: err.message,
    });
  }
}

module.exports = {
  createCheckoutSession,
  confirmPaymentSession,
  getPaymentById,
};