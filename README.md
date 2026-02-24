# Konektz App Backend

A RESTful API backend for the **Konektz** application, built with **Node.js**, **Express 5**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## Table of Contents

- [Konektz App Backend](#konektz-app-backend)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Database Setup](#database-setup)
      - [Schema Overview](#schema-overview)
    - [Running the Server](#running-the-server)
  - [API Reference](#api-reference)
    - [Base](#base)
    - [Health](#health)
    - [Auth](#auth)
      - [Register](#register)
      - [Login](#login)
    - [Conversations](#conversations)
      - [Get Conversations](#get-conversations)
      - [Create Conversation](#create-conversation)
      - [Get Messages](#get-messages)
      - [Send Message](#send-message)
      - [Delete Conversation](#delete-conversation)
      - [Restore Conversation](#restore-conversation)
  - [API Documentation (Swagger)](#api-documentation-swagger)
  - [Error Handling](#error-handling)
  - [Scripts](#scripts)

---

## Tech Stack

| Layer           | Technology                                                       |
| --------------- | ---------------------------------------------------------------- |
| Runtime         | Node.js 20+                                                      |
| Framework       | Express 5                                                        |
| Language        | TypeScript 5                                                     |
| ORM             | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)               |
| Database        | PostgreSQL (via `pg` Pool → Prisma `PrismaPg` adapter)           |
| Authentication  | JWT (`jsonwebtoken`) + bcrypt                                    |
| API Docs        | Swagger UI (`swagger-jsdoc` + `swagger-ui-express`)              |
| Dev Runner      | `tsx` (hot-reload)                                               |
| Package Manager | pnpm                                                             |

---

## Project Structure

```sh
konektz-app-backend/
├── prisma/
│   ├── schema.prisma         # Prisma data models (User, Conversation, Message)
│   └── migrations/           # Auto-generated migration files
├── prisma.config.ts          # Prisma v7 config (datasource URL)
├── src/
│   ├── index.ts              # Entry point — starts the HTTP server
│   ├── app.ts                # Express app setup (middleware, routes)
│   ├── config/
│   │   ├── env.ts            # Environment variable validation & typed exports
│   │   └── swagger.ts        # OpenAPI / Swagger configuration & schemas
│   ├── controllers/
│   │   ├── auth.controler.ts          # Register & login handlers
│   │   └── conversation.controller.ts # Conversation & message handlers
│   ├── generated/
│   │   └── prisma/           # Auto-generated Prisma client (gitignored)
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification middleware
│   │   └── errorHandler.ts     # Global error & 404 handlers
│   ├── models/
│   │   └── db.ts             # Prisma client singleton
│   ├── routes/
│   │   ├── auth.route.ts         # /auth routes
│   │   ├── conversation.route.ts # /conversations routes
│   │   └── health.route.ts       # /health route
│   ├── services/             # Business logic (reserved for future use)
│   └── utils/
│       └── AppError.ts       # Custom operational error class
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [PostgreSQL](https://www.postgresql.org/) v14+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd konektz-app-backend

# Install dependencies
pnpm install

# Generate the Prisma client
pnpm prisma:generate
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL (single connection string — required by Prisma)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/konektz_dev

# JWT
JWT_SECRET=your_super_secret_jwt_key
```

| Variable       | Default       | Required | Description                                 |
| -------------- | ------------- | -------- | ------------------------------------------- |
| `PORT`         | `5000`        | No       | HTTP port the server listens on             |
| `NODE_ENV`     | `development` | No       | `development` or `production`               |
| `DATABASE_URL` | —             | **Yes**  | PostgreSQL connection string used by Prisma |
| `JWT_SECRET`   | —             | **Yes**  | Secret key used to sign JWT tokens          |

> The server validates `DATABASE_URL` and `JWT_SECRET` on startup and exits immediately if either is missing.

### Database Setup

Apply the Prisma schema to your database to create all tables and relationships:

```bash
pnpm prisma:migrate
```

This runs `prisma migrate dev`, which:

1. Detects schema changes in `prisma/schema.prisma`
2. Generates a timestamped migration file under `prisma/migrations/`
3. Applies the migration to your PostgreSQL database
4. Regenerates the Prisma client

> Run this once on initial setup, and again whenever `prisma/schema.prisma` changes.

#### Schema Overview

| Table           | Description                                                                             |
| --------------- | --------------------------------------------------------------------------------------- |
| `users`         | User accounts (id, username, email, password)                                           |
| `conversations` | 1-to-1 conversations between two participants, with per-user soft-delete flags          |
| `messages`      | Messages belonging to a conversation                                                    |

All primary keys are **UUID strings** (`String @id @default(uuid())`).

The `conversations` table has two boolean columns — `deleted_by_one` and `deleted_by_two` — to support per-user soft deletes. The row is permanently removed only when both participants have deleted it.

### Running the Server

```bash
# Development — hot-reload via tsx
pnpm dev

# Production build
pnpm build
pnpm start
```

The server will start at `http://localhost:5000` (or the `PORT` you configured).

---

## API Reference

All responses follow a consistent JSON shape:

```json
{
  "status": "success" | "error",
  "message": "...",
  "data": { }
}
```

### Base

| Method | Endpoint | Description          |
| ------ | -------- | -------------------- |
| GET    | `/`      | Welcome message      |

**Response `200`**

```json
{
  "status": "success",
  "message": "Welcome to Konektz API"
}
```

---

### Health

| Method | Endpoint  | Description       |
| ------ | --------- | ----------------- |
| GET    | `/health` | API health check  |

**Response `200`**

```json
{ "status": "OK" }
```

---

### Auth

#### Register

`POST /auth/register`

Creates a new user account.

**Request Body**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `username` | string | Yes      | Unique display name |
| `email`    | string | Yes      | Valid email address |
| `password` | string | Yes      | Plain-text password |

**Response `201`**

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2026-02-24T10:00:00.000Z",
      "updatedAt": "2026-02-24T10:00:00.000Z"
    }
  }
}
```

| Status | Meaning                          |
| ------ | -------------------------------- |
| `201`  | User created successfully        |
| `400`  | Missing required fields          |
| `409`  | Email or username already in use |

---

#### Login

`POST /auth/login`

Authenticates a user and returns a signed JWT.

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`**

```json
{
  "status": "success",
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

The returned `token` is a **Bearer JWT** valid for **7 days**. Include it in all authenticated requests:

```sh
Authorization: Bearer <JWT_TOKEN>
```

| Status | Meaning                   |
| ------ | ------------------------- |
| `200`  | Login successful          |
| `400`  | Missing email or password |
| `401`  | Invalid credentials       |

---

### Conversations

All conversation routes require authentication via `Authorization: Bearer <token>`.

#### Get Conversations

`GET /conversations`

Returns all conversations the authenticated user is part of and has **not** deleted, including the other participant's details and the last message.

**Response `200`**

```json
{
  "status": "success",
  "conversations": [
    {
      "conversationId": "uuid",
      "participantId": "uuid",
      "participantName": "alice",
      "lastMessage": "Hey!",
      "lastMessageTime": "2026-02-24T10:00:00.000Z"
    }
  ]
}
```

---

#### Create Conversation

`POST /conversations`

Starts a new 1-to-1 conversation with another user.

**Request Body**

```json
{
  "participant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field            | Type          | Required | Description                        |
| ---------------- | ------------- | -------- | ---------------------------------- |
| `participant_id` | string (UUID) | Yes      | UUID of the other participant      |

**Response `201`**

```json
{
  "status": "success",
  "message": "Conversation created",
  "data": {
    "conversation": {
      "id": "uuid",
      "participantOneId": "uuid",
      "participantTwoId": "uuid"
    }
  }
}
```

| Status | Meaning                                                                   |
| ------ | ------------------------------------------------------------------------- |
| `201`  | Conversation created                                                      |
| `200`  | Conversation already exists — returns the existing record                 |
| `400`  | Missing `participant_id` or self-conversation                             |
| `404`  | Participant user not found                                                |

---

#### Get Messages

`GET /conversations/:id/messages`

Returns all messages in the specified conversation, ordered oldest to newest.

| Param | Type          | Description     |
| ----- | ------------- | --------------- |
| `id`  | string (UUID) | Conversation ID |

**Response `200`**

```json
{
  "status": "success",
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "johndoe",
      "content": "Hello!",
      "createdAt": "2026-02-24T10:00:00.000Z"
    }
  ]
}
```

| Status | Meaning                |
| ------ | ---------------------- |
| `200`  | Success                |
| `401`  | Unauthorized           |
| `404`  | Conversation not found |

---

#### Send Message

`POST /conversations/:id/messages`

Sends a message in the specified conversation.

| Param | Type          | Description     |
| ----- | ------------- | --------------- |
| `id`  | string (UUID) | Conversation ID |

**Request Body**

```json
{
  "content": "Hello there!"
}
```

**Response `201`**

```json
{
  "status": "success",
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "content": "Hello there!",
    "createdAt": "2026-02-24T10:00:00.000Z",
    "updatedAt": "2026-02-24T10:00:00.000Z",
    "sender": {
      "username": "johndoe"
    }
  }
}
```

| Status | Meaning                |
| ------ | ---------------------- |
| `201`  | Message sent           |
| `400`  | Missing `content`      |
| `401`  | Unauthorized           |
| `404`  | Conversation not found |

---

#### Delete Conversation

`DELETE /conversations/:id`

Soft-deletes the conversation for the authenticated user only. The other participant continues to see it. When **both** users have deleted the conversation, the record is permanently removed from the database.

| Param | Type          | Description     |
| ----- | ------------- | --------------- |
| `id`  | string (UUID) | Conversation ID |

**Response `200`**

```json
{
  "status": "success",
  "message": "Conversation deleted"
}
```

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| `200`  | Soft-deleted (or permanently deleted if both users deleted) |
| `401`  | Unauthorized                                                |
| `404`  | Conversation not found or already deleted by you            |

---

#### Restore Conversation

`POST /conversations/:id/restore`

Restores a conversation that the authenticated user previously soft-deleted, provided the conversation still exists (i.e. the other user has not also deleted it, which would have caused a permanent delete).

| Param | Type          | Description     |
| ----- | ------------- | --------------- |
| `id`  | string (UUID) | Conversation ID |

**Response `200`**

```json
{
  "status": "success",
  "message": "Conversation restored"
}
```

| Status | Meaning                                               |
| ------ | ----------------------------------------------------- |
| `200`  | Conversation restored                                 |
| `401`  | Unauthorized                                          |
| `404`  | Conversation not found or not previously deleted by you |

---

## API Documentation (Swagger)

Interactive Swagger UI is available at:

```sh
http://localhost:5000/docs
```

Raw OpenAPI JSON spec:

```sh
http://localhost:5000/docs.json
```

---

## Error Handling

All errors return a consistent JSON envelope:

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

The global error handler (`src/middleware/errorHandler.ts`) maps errors to appropriate HTTP status codes:

| Scenario                                    | Status |
| ------------------------------------------- | ------ |
| Prisma unique constraint violation (P2002)  | `409`  |
| Prisma foreign-key violation (P2003)        | `404`  |
| Prisma not-null violation (P2011)           | `400`  |
| Prisma record not found (P2025)             | `404`  |
| Prisma validation error                     | `400`  |
| Prisma initialization / connection error    | `503`  |
| Invalid JWT                                 | `401`  |
| Expired JWT                                 | `401`  |
| Operational / custom `AppError`             | Varies |
| Route not found                             | `404`  |
| Unhandled server errors                     | `500`  |

> In **development** mode, `500` responses include the stack trace. In **production** it is hidden.

---

## Scripts

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `pnpm dev`             | Start dev server with hot-reload (`tsx watch`)          |
| `pnpm build`           | Compile TypeScript to `dist/`                           |
| `pnpm start`           | Run the compiled production build                       |
| `pnpm prisma:generate` | Regenerate the Prisma client from `schema.prisma`       |
| `pnpm prisma:migrate`  | Create and apply a new migration (`prisma migrate dev`) |
