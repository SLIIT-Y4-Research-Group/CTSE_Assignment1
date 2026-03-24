const express = require("express");
const router = express.Router();
const controller = require("../controllers/ticketController");

router.post("/", controller.createTicket);
router.put("/:id", controller.updateTicket);
router.delete("/:id", controller.deleteTicket);
router.patch("/event/:eventId/cancel", controller.cancelTicketsByEvent);
router.get("/", controller.getTickets);
router.get("/event/:eventId", controller.getTicketsByEvent);
router.get("/event/:eventId/summary", controller.getEventTicketSummary);
router.get("/:id", controller.getTicketDetails);
router.get("/availability/:id", controller.getAvailability);

module.exports = router;
