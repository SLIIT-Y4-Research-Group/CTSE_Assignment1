const express = require("express");
const {
  listRoles,
  createRole,
  updateRole,
  deleteRole
} = require("../controllers/roleController");
const { requireAuth, requirePermissions } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: List roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  "/",
  requireAuth,
  requirePermissions(["roles:read"]),
  listRoles
);

/**
 * @openapi
 * /api/roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Role already exists
 */
router.post(
  "/",
  requireAuth,
  requirePermissions(["roles:write"]),
  createRole
);

/**
 * @openapi
 * /api/roles/{id}:
 *   patch:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id",
  requireAuth,
  requirePermissions(["roles:write"]),
  updateRole
);

/**
 * @openapi
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Role is assigned to users
 *       404:
 *         description: Not found
 */
router.delete(
  "/:id",
  requireAuth,
  requirePermissions(["roles:write"]),
  deleteRole
);

module.exports = router;
