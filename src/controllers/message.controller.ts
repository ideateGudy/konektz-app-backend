import { AppError } from "../utils/AppError";
import prisma from "../models/db";
import { Request, Response } from "express";

// GET /messages/:conversationId
export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;
  const conversationId = String(req.params.conversationId);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: userId }, { participantTwoId: userId }],
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { username: true } },
    },
  });

  const result = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender.username,
    content: m.content,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  res.status(200).json({ status: "success", messages: result });
};

// POST /messages/:conversationId
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
): Promise<{ status: string; message: any }> => {

  if (!content || String(content).trim() === "") {
    throw new AppError("content is required", 400);
  }

  if (!conversationId || !senderId) {
    throw new AppError("conversationId and senderId are required", 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: senderId }, { participantTwoId: senderId }],
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: senderId,
      content: content.trim(),
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      sender: { select: { username: true } },
    },
  });

  if (!message) {
    return { status: "error", message: "Failed to send message" };
  }

  return { status: "success", message };
};
