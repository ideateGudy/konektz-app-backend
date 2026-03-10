import "./config/env"; // Loads .env and validates required vars

import app from "./app";
import { Server } from "socket.io";
import http from "http";
import { sendMessage } from "./controllers/message.controller";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ─── Socket.IO Setup ─────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("joinConversation", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on(
    "sendMessage",
    async (data: {
      conversationId: string;
      senderId: string;
      content: any;
    }) => {
      const { conversationId, senderId, content } = data;
      console.log(
        `Received message for conversation ${conversationId}:`,
        content,
      );

      const { message, status } = await sendMessage(
        conversationId,
        senderId,
        content,
      );

      console.log(`Message send status: ${status}`, message);
      if (status === "success") {
        socket.to(conversationId).emit("newMessage", message);
        socket.emit("conversationUpdated", {
          conversationId,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
        });
      } else {
        console.error(message);
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

// ─── Error Handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ─── Process-level crash guards ───────────────────────────────────────────────
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Promise Rejection:", reason);
  // Graceful shutdown: let in-flight requests finish, then exit
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  server.close(() => {
    process.exit(1);
  });
});
