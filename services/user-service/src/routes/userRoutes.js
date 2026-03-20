const express = require("express");
const {
  getMe,
  listUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  changePassword
} = require("../controllers/userController");
const { requireAuth, requirePermissions } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, getMe);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  requireAuth,
  requirePermissions(["users:read"]),
  listUsers
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a user (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, roleId]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Email already in use
 */
router.post(
  "/",
  requireAuth,
  requirePermissions(["users:write"]),
  createUser
);

/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id/role",
  requireAuth,
  requirePermissions(["users:write"]),
  updateUserRole
);

/**
 * @openapi
 * /api/users/{id}/status:
 *   patch:
 *     summary: Update a user's status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id/status",
  requireAuth,
  requirePermissions(["users:write"]),
  updateUserStatus
);

/**
 * @openapi
 * /api/users/me/change-password:
 *   post:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.post("/me/change-password", requireAuth, changePassword);

module.exports = router;
