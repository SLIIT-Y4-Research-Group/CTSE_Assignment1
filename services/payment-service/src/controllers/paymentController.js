const Payment = require("../models/Payment");
const stripe = require("../utils/stripe");

const createCheckoutSession = async (req, res) => {
  try {
    const { user_id, event_id, ticket_id, quantity, total_amount } = req.body;

    if (!user_id || !event_id || !ticket_id || !quantity || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "user_id, event_id, ticket_id, quantity, and total_amount are required",
      });
    }

    if (Number(quantity) <= 0 || Number(total_amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity and total_amount must be greater than 0",
      });
    }

    const payment = await Payment.create({
      user_id,
      event_id,
      ticket_id,
      quantity: Number(quantity),
      total_amount: Number(total_amount),
      payment_status: "PENDING",
    });

    const unitAmount = Math.round((Number(total_amount) / Number(quantity)) * 100);
    const frontendUrl = process.env.FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: "Event Ticket Payment",
              description: `Event: ${event_id} | Ticket: ${ticket_id}`,
            },
            unit_amount: unitAmount,
          },
          quantity: Number(quantity),
        },
      ],
      success_url: `${frontendUrl}/dashboard?payment=success`,
      cancel_url: `${frontendUrl}/payment?payment=cancelled`,
      metadata: {
        payment_id: payment._id.toString(),
        user_id,
        event_id,
        ticket_id,
      },
    });

    payment.stripe_session_id = session.id;
    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      payment,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Create checkout session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

const confirmPaymentSession = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const payment = await Payment.findOne({ stripe_session_id: session_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this session",
      });
    }

    if (session.payment_status === "paid") {
      payment.payment_status = "PAID";
      payment.stripe_payment_intent_id = session.payment_intent;
    } else if (session.status === "expired") {
      payment.payment_status = "FAILED";
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment status checked successfully",
      payment_status: payment.payment_status,
      payment,
      stripe_session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("Confirm payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  getPaymentById,
  confirmPaymentSession,
};