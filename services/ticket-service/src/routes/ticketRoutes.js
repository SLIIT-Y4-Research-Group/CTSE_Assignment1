const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketController');

router.post('/', controller.createTicket);
router.put('/:id', controller.updateTicket);
router.delete('/:id', controller.deleteTicket);
router.get('/', controller.getTickets);
router.get('/event/:eventId', controller.getTicketsByEvent);
router.get('/:id', controller.getTicketDetails);
router.get('/availability/:id', controller.getAvailability);

module.exports = router;