import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  fetchConversations,
  createConversation,
  deleteConversation,
  restoreConversation,
} from "../controllers/conversation.controller";

const router = Router();

// All conversation routes require authentication
router.use(verifyToken);

/**
 * @openapi
 * /conversations:
 *   get:
 *     tags:
 *       - Conversations
 *     summary: List all conversations for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of conversation summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConversationSummary'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", fetchConversations);

/**
 * @openapi
 * /conversations:
 *   post:
 *     tags:
 *       - Conversations
 *     summary: Start a new conversation (or return existing one)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversationRequest'
 *     responses:
 *       201:
 *         description: Conversation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: c1d2e3f4-0000-0000-0000-000000000001
 *       200:
 *         description: Conversation already exists — returns existing record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: c1d2e3f4-0000-0000-0000-000000000001
 *       400:
 *         description: Missing participant_id or trying to message yourself
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Participant user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", createConversation);

/**
 * @openapi
 * /conversations/{id}:
 *   delete:
 *     tags:
 *       - Conversations
 *     summary: Soft-delete a conversation for the current user. Permanently deletes when both users have deleted it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Conversation deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Conversation not found or already deleted by you
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", deleteConversation);

/**
 * @openapi
 * /conversations/{id}/restore:
 *   post:
 *     tags:
 *       - Conversations
 *     summary: Restore a previously soft-deleted conversation (only if the other user hasn't deleted it)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation restored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Conversation restored
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Conversation not found or has not been deleted by you
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/restore", restoreConversation);

export default router;
