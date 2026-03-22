const express = require("express");
const { sendSmsHandler } = require("../controllers/smsController");
const { sendEmailHandler } = require("../controllers/emailController");
const { sendInAppNotification } = require("../controllers/inAppController");

const router = express.Router();

/**
 * @openapi
 * /api/notify/sms:
 *   post:
 *     summary: Send SMS notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, message]
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sent
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Provider not configured
 *       502:
 *         description: Provider error
 */
router.post("/sms", sendSmsHandler);

/**
 * @openapi
 * /api/notify/email:
 *   post:
 *     summary: Send email notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject]
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               text:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sent
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Provider not configured
 *       502:
 *         description: Provider error
 */
router.post("/email", sendEmailHandler);

/**
 * @openapi
 * /api/notify/in-app:
 *   post:
 *     summary: Send in-app notification via Socket.IO
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Optional. If provided, sends to that user only.
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Emitted
 */
router.post("/in-app", sendInAppNotification);

module.exports = router;
