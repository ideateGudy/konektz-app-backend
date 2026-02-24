import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Konektz API",
      version: "1.0.0",
      description: "REST API documentation for the Konektz application",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
            username: { type: "string", example: "johndoe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string", example: "johndoe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "secret123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "secret123",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Something went wrong" },
          },
        },
        ConversationSummary: {
          type: "object",
          properties: {
            conversationId: {
              type: "string",
              format: "uuid",
              example: "c1d2e3f4-0000-0000-0000-000000000001",
            },
            participantId: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
            participantName: { type: "string", example: "janedoe" },
            lastMessage: {
              type: "string",
              nullable: true,
              example: "Hey there!",
            },
            lastMessageTime: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "m1m2m3m4-0000-0000-0000-000000000001",
            },
            senderId: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
            senderName: { type: "string", example: "johndoe" },
            content: { type: "string", example: "Hello!" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateConversationRequest: {
          type: "object",
          required: ["participant_id"],
          properties: {
            participant_id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          },
        },
        SendMessageRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", example: "Hey, how are you?" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
