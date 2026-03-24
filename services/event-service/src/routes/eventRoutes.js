const express = require("express");
const {
  uploadBanner,
  createEvent,
  getAllEvents,
  getAllEventsForManagement,
  searchEventsForManagement,
  getFeaturedEvents,
  getUpcomingEvents,
  getEventsByOrganizer,
  getEventById,
  updateEvent,
  deleteEvent,
  searchEvents,
  validateEvent,
  publishEvent,
  cancelEvent,
} = require("../controllers/eventController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { uploadBannerMiddleware } = require("../middleware/uploadBanner");

const router = express.Router();

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, description, date, time, venue_name, city, category, organizer_id]
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               short_description:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *               venue_name:
 *                 type: string
 *               city:
 *                 type: string
 *               category:
 *                 type: string
 *               banner_image:
 *                 type: string
 *               is_featured:
 *                 type: boolean
 *               organizer_id:
 *                 type: string
 *           example:
 *             title: Tech Summit 2026
 *             slug: tech-summit-2026
 *             short_description: Annual software and startup conference
 *             description: Full-day conference with talks and networking sessions
 *             date: 2026-08-15T10:00:00.000Z
 *             time: 10:00 AM
 *             venue_name: Grand Expo Center
 *             city: Colombo
 *             category: Technology
 *             banner_image: https://cdn.example.com/events/tech-summit.jpg
 *             is_featured: true
 *             organizer_id: org_1001
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/events",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  createEvent,
);
router.post(
  "/events/upload-banner",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  uploadBannerMiddleware,
  uploadBanner,
);

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Get all published events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events", getAllEvents);
router.get(
  "/events/manage/all",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  getAllEventsForManagement,
);
router.get(
  "/events/manage/search",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  searchEventsForManagement,
);

/**
 * @openapi
 * /api/events/featured:
 *   get:
 *     summary: Get featured published events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of featured events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/featured", getFeaturedEvents);

/**
 * @openapi
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming published events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of upcoming events sorted by date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/upcoming", getUpcomingEvents);

/**
 * @openapi
 * /api/events/search:
 *   get:
 *     summary: Search events by city, category, and date
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Event category filter
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date filter in YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Matching events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       400:
 *         description: Invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/search", searchEvents);

/**
 * @openapi
 * /api/events/organizer/{organizerId}:
 *   get:
 *     summary: Get all events by organizer
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organizer ID
 *     responses:
 *       200:
 *         description: Organizer events sorted by creation date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/organizer/:organizerId", getEventsByOrganizer);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResponse'
 *       400:
 *         description: Invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/:id", getEventById);

/**
 * @openapi
 * /api/events/{id}/validate:
 *   get:
 *     summary: Validate event existence and booking availability
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventValidationResponse'
 *       400:
 *         description: Invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventExistsFalseResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/events/:id/validate", validateEvent);

/**
 * @openapi
 * /api/events/{id}/publish:
 *   patch:
 *     summary: Publish an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResponse'
 *       400:
 *         description: Invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/events/:id/publish",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  publishEvent,
);

/**
 * @openapi
 * /api/events/{id}/cancel:
 *   patch:
 *     summary: Cancel an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResponse'
 *       400:
 *         description: Invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/events/:id/cancel",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  cancelEvent,
);

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled, completed]
 *           example:
 *             title: Tech Summit 2026 - Updated
 *             status: published
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventResponse'
 *       400:
 *         description: Validation or ID error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/events/:id",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  updateEvent,
);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/events/:id",
  requireAuth,
  requireRole(["event_manager", "admin"]),
  deleteEvent,
);

module.exports = router;
