import { Request, Response } from "express";
import prisma from "../models/db";
import { AppError } from "../utils/AppError";

// GET /conversations
export const fetchConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participantOneId: userId, deletedByOne: false },
        { participantTwoId: userId, deletedByTwo: false },
      ],
    },
    include: {
      participantOne: { select: { id: true, username: true } },
      participantTwo: { select: { id: true, username: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true },
      },
    },
    orderBy: { id: "desc" },
  });

  const result = conversations.map((c) => {
    const participant =
      c.participantOneId === userId ? c.participantTwo : c.participantOne;
    const lastMessage = c.messages[0] ?? null;
    return {
      conversationId: c.id,
      participantId: participant.id,
      participantName: participant.username,
      lastMessage: lastMessage?.content ?? null,
      lastMessageTime: lastMessage?.createdAt ?? null,
    };
  });

  res.status(200).json({ status: "success", conversations: result });
};

// POST /conversations
export const createConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const currentUserId = req.user.id;
  const { participant_id } = req.body;

  if (!participant_id) {
    throw new AppError("participant_id is required", 400);
  }

  const participantId = String(participant_id);

  if (participantId === currentUserId) {
    throw new AppError("Cannot create a conversation with yourself", 400);
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: participantId },
    select: { id: true },
  });

  if (!otherUser) {
    throw new AppError("User not found", 404);
  }

  // Return existing conversation if one already exists between the two users
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { participantOneId: currentUserId, participantTwoId: participantId },
        { participantOneId: participantId, participantTwoId: currentUserId },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    res.status(200).json({ status: "success", conversation: existing });
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      participantOneId: currentUserId,
      participantTwoId: participantId,
    },
    select: { id: true },
  });

  res.status(201).json({ status: "success", conversation });
};

// GET /conversations/:id/messages
export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;
  const conversationId = String(req.params.id);

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
  }));

  res.status(200).json({ status: "success", messages: result });
};

// POST /conversations/:id/messages
export const sendMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;
  const conversationId = String(req.params.id);
  const { content } = req.body;

  if (!content || String(content).trim() === "") {
    throw new AppError("content is required", 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: userId }, { participantTwoId: userId }],
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
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

  res.status(201).json({ status: "success", message });
};

// DELETE /conversations/:id
export const deleteConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;
  const conversationId = String(req.params.id);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { participantOneId: userId, deletedByOne: false },
        { participantTwoId: userId, deletedByTwo: false },
      ],
    },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const isParticipantOne = conversation.participantOneId === userId;

  // If the other user already deleted it, permanently delete the whole record
  const otherAlreadyDeleted = isParticipantOne
    ? conversation.deletedByTwo
    : conversation.deletedByOne;

  if (otherAlreadyDeleted) {
    await prisma.conversation.delete({ where: { id: conversationId } });
  } else {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isParticipantOne ? { deletedByOne: true } : { deletedByTwo: true },
    });
  }

  res.status(200).json({ status: "success", message: "Conversation deleted" });
};

// POST /conversations/:id/restore
export const restoreConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const userId = req.user.id;
  const conversationId = String(req.params.id);

  // Find the conversation where the current user is a participant AND has soft-deleted it
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { participantOneId: userId, deletedByOne: true },
        { participantTwoId: userId, deletedByTwo: true },
      ],
    },
  });

  if (!conversation) {
    throw new AppError(
      "Conversation not found or has not been deleted by you",
      404,
    );
  }

  const isParticipantOne = conversation.participantOneId === userId;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: isParticipantOne ? { deletedByOne: false } : { deletedByTwo: false },
  });

  res.status(200).json({ status: "success", message: "Conversation restored" });
};
