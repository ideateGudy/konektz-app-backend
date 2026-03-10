import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    getMessages,
    sendMessage,
} from "../controllers/message.controller";

const router = Router();

// All message routes require authentication
router.use(verifyToken);

/**
 * @openapi
 * /conversations/{id}/messages:
 *   get:
 *     tags:
 *       - Conversations
 *     summary: Get all messages in a conversation
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
 *         description: List of messages ordered oldest to newest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Conversation not found or user is not a participant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:conversationId", getMessages);


export default router;