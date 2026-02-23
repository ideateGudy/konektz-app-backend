# Konektz App Backend

A RESTful API backend for the **Konektz** application, built with **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL**.

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
    - [Running the Server](#running-the-server)
  - [API Reference](#api-reference)
    - [Base](#base)
    - [Health](#health)
    - [Auth](#auth)
      - [Register](#register)
        - [**Request Body**](#request-body)
      - [Login](#login)
  - [API Documentation (Swagger)](#api-documentation-swagger)
  - [Error Handling](#error-handling)
  - [Scripts](#scripts)

---

## Tech Stack

| Layer          | Technology                         |
| -------------- | ---------------------------------- |
| Runtime        | Node.js                            |
| Framework      | Express 5                          |
| Language       | TypeScript 5                       |
| Database       | PostgreSQL (via `pg` Pool)         |
| Authentication | JWT (`jsonwebtoken`) + bcrypt      |
| API Docs       | Swagger UI (`swagger-jsdoc`)       |
| Package Manager| pnpm                               |

---

## Project Structure

```sh
konektz-app-backend/
├── src/
│   ├── index.ts              # Entry point — starts the HTTP server
│   ├── app.ts                # Express app setup (middleware, routes)
│   ├── config/
│   │   └── swagger.ts        # OpenAPI / Swagger configuration
│   ├── controller/
│   │   └── auth.controller.ts # Register & login handlers
│   ├── middleware/
│   │   └── errorHandler.ts   # Global error & 404 handlers
│   ├── models/
│   │   └── db.ts             # PostgreSQL connection pool
│   ├── routes/
│   │   ├── auth.route.ts     # /auth routes
│   │   └── health.route.ts   # /health route
│   ├── services/             # Business logic (to be implemented)
│   └── utils/
│       └── AppError.ts       # Custom operational error class
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+
- [PostgreSQL](https://www.postgresql.org/) v14+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd konektz-app-backend

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=konektz
DB_USER=postgres
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
```

| Variable      | Default       | Description                          |
| ------------- | ------------- | ------------------------------------ |
| `PORT`        | `5000`        | HTTP port the server listens on      |
| `NODE_ENV`    | —             | `development` or `production`        |
| `DB_HOST`     | `localhost`   | PostgreSQL host                      |
| `DB_PORT`     | `5432`        | PostgreSQL port                      |
| `DB_NAME`     | `konektz`     | PostgreSQL database name             |
| `DB_USER`     | `postgres`    | PostgreSQL user                      |
| `DB_PASSWORD` | —             | PostgreSQL password                  |
| `JWT_SECRET`  | —             | Secret key used to sign JWT tokens   |

### Database Setup

Run the following SQL to create the required `users` table:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Running the Server

```bash
# Development (hot-reload via ts-node-dev)
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

##### **Request Body**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field      | Type   | Required | Description          |
| ---------- | ------ | -------- | -------------------- |
| `username` | string | Yes      | Unique display name  |
| `email`    | string | Yes      | Valid email address  |
| `password` | string | Yes      | Plain-text password  |

**Response `201`**

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "username": "johndoe",
      "email": "john@example.com",
      "created_at": "2026-02-23T10:00:00.000Z",
      "updated_at": "2026-02-23T10:00:00.000Z"
    }
  }
}
```

| Status | Meaning                              |
| ------ | ------------------------------------ |
| `201`  | User created successfully            |
| `400`  | Missing required fields              |
| `409`  | Email or username already in use     |

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

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `email`    | string | Yes      | Registered email    |
| `password` | string | Yes      | Account password    |

**Response `200`**

```json
{
  "status": "success",
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

The returned `token` is a **Bearer JWT** valid for **7 days**. Include it in subsequent authenticated requests:

```sh
Authorization: Bearer <JWT_TOKEN>
```

| Status | Meaning                    |
| ------ | -------------------------- |
| `200`  | Login successful           |
| `400`  | Missing email or password  |
| `401`  | Invalid credentials        |

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

The global error handler (`src/middleware/errorHandler.ts`) automatically maps:

| Scenario                         | Status |
| -------------------------------- | ------ |
| Validation / operational errors  | Varies |
| PostgreSQL unique violation      | `409`  |
| PostgreSQL foreign-key violation | `404`  |
| PostgreSQL not-null violation    | `400`  |
| Invalid JWT                      | `401`  |
| Expired JWT                      | `401`  |
| Route not found                  | `404`  |
| Unhandled server errors          | `500`  |

> In **development** mode, the `500` response also includes the `stack` trace. In **production** it is hidden.

---

## Scripts

| Command       | Description                                    |
| ------------- | ---------------------------------------------- |
| `pnpm dev`    | Start dev server with hot-reload (ts-node-dev) |
| `pnpm build`  | Compile TypeScript to `dist/`                  |
| `pnpm start`  | Run the compiled production build              |
