# Product Requirements & Technical Architecture Document (PRD)
## Roadside Vehicle Assistance & Mechanic Booking Platform

---

## 1. Executive Summary & Problem Statement

Vehicle breakdowns—especially on high-speed highways or remote connectors—cause severe stress and delays due to:
- Difficulty discovering nearby verified mechanics and towing services.
- Opaque, predatory pricing models without upfront estimates.
- High cancellation rates when relying on a single mechanic.
- Lack of real-time GPS tracking and live in-app communication.

**Roadside Rescue** solves this by providing an Uber/Rapido-style multi-mechanic broadcast platform connecting stranded vehicle owners with nearby verified mechanics. The platform broadcasts emergency requests simultaneously to the nearest 5 mechanics, guarantees transparent upfront pricing (₹), live GPS map arrival tracking with countdown timers, in-app live chat, and instant digital receipt generation.

---

## 2. Final Technology Stack Architecture Specification

| Category | Technology | Purpose & Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js (Vite)** | Lightning-fast Single Page Application (SPA) client built with React 18 & Vite bundler. |
| **Styling** | **Tailwind CSS** | Utility-first, responsive CSS design system with custom glassmorphism components. |
| **Backend Runtime & Framework**| **Node.js + Express.js** | High-performance asynchronous REST API backend and WebSocket broadcast server. |
| **Database** | **Supabase (PostgreSQL)** | Managed cloud PostgreSQL relational database with real-time subscriptions and row-level security. |
| **ORM** | **Prisma ORM** | Type-safe database client and automated migration tool for PostgreSQL schemas. |
| **Authentication** | **JWT + bcryptjs** | Secure JSON Web Token authentication with salted password hashing for Users, Partners, and Admins. |
| **Maps & Tracking** | **Leaflet + OpenStreetMap** | Open-source interactive map rendering, custom vector markers, polyline routing, and GPS simulation. |
| **Storage** | **Supabase Storage** | S3-compatible cloud object storage for mechanic verification IDs, profile avatars, and invoices. |
| **API Testing** | **Postman** | API collection suite for automated testing of REST endpoints and WebSocket payloads. |
| **Version Control** | **Git & GitHub** | CI/CD automated repository workflow, feature branching, and pull request reviews. |
| **Deployment & Hosting** | **Vercel + Render + Supabase** | Frontend deployed on **Vercel**, Express backend on **Render**, and Database/Storage on **Supabase**. |

---

## 3. Database Schema (Prisma ORM - `prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  PARTNER
  ADMIN
}

enum ServiceStatus {
  SEARCHING
  ACCEPTED
  MECHANIC_ON_THE_WAY
  REACHED
  REPAIR_STARTED
  COMPLETED
  CANCELLED
}

model User {
  id            String           @id @default(uuid())
  name          String
  email         String           @unique
  phone         String
  passwordHash  String
  role          Role             @default(CUSTOMER)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  vehicles      Vehicle[]
  requests      ServiceRequest[] @relation("CustomerRequests")
  reviews       Review[]
}

model Vehicle {
  id           String           @id @default(uuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id])
  make         String           // e.g. Honda, Royal Enfield, Toyota
  model        String           // e.g. Activa 6G, Classic 350
  year         Int
  licensePlate String           @unique
  type         String           // Motorbike, Scooter, Car, SUV
  fuel         String           // Petrol, Diesel, Electric
  requests     ServiceRequest[]
}

model Partner {
  id                 String           @id @default(uuid())
  name               String
  company            String
  phone              String           @unique
  email              String           @unique
  passwordHash       String
  rating             Float            @default(4.9)
  jobsCompleted      Int              @default(0)
  status             String           @default("online") // online | offline
  verificationStatus String           @default("verified") // verified | pending | rejected
  lat                Float
  lng                Float
  priceRupees        Int              @default(350)
  services           String[]
  requests           ServiceRequest[] @relation("PartnerRequests")
  reviews            Review[]
}

model ServiceRequest {
  id           String        @id @default(uuid())
  customerId   String
  customer     User          @relation("CustomerRequests", fields: [customerId], references: [id])
  partnerId    String?
  partner      Partner?      @relation("PartnerRequests", fields: [partnerId], references: [id])
  vehicleId    String
  vehicle      Vehicle       @relation(fields: [vehicleId], references: [id])
  serviceType  String        // Flat Tyre Repair, Battery Jump Start, Fuel Delivery, etc.
  address      String
  lat          Float
  lng          Float
  status       ServiceStatus @default(SEARCHING)
  costRupees   Float
  etaMins      Int           @default(8)
  createdAt    DateTime      @default(now())
  completedAt  DateTime?
  messages     ChatMessage[]
  review       Review?
}

model ChatMessage {
  id         String         @id @default(uuid())
  requestId  String
  request    ServiceRequest @relation(fields: [requestId], references: [id])
  senderRole String         // customer | partner
  senderName String
  text       String
  createdAt  DateTime       @default(now())
}

model Review {
  id         String         @id @default(uuid())
  requestId  String         @unique
  request    ServiceRequest @relation(fields: [requestId], references: [id])
  customerId String
  customer   User           @relation(fields: [customerId], references: [id])
  partnerId  String
  partner    Partner        @relation(fields: [partnerId], references: [id])
  rating     Int            // 1 to 5
  comment    String
  createdAt  DateTime       @default(now())
}
```

---

## 4. REST API Endpoint Specifications (Node.js + Express.js)

### 4.1 Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a Customer or Partner user. Generates salted `bcryptjs` hash and stores in Supabase PostgreSQL.
- `POST /api/auth/login` — Authenticates user credentials and returns a signed `JWT token` payload.
- `GET /api/auth/me` — Fetches current user profile via JWT Bearer authentication header.

### 4.2 Booking & Dispatch Endpoints (`/api/requests`)
- `POST /api/requests/broadcast` — Submits a 4-step assistance request. Triggers real-time WebSocket broadcast to the 5 nearest online mechanics with a 90-second acceptance timer.
- `POST /api/requests/:id/accept` — Allows a partner mechanic to accept a broadcasted request. Stops active countdown timer and transitions request state to `ACCEPTED`.
- `PATCH /api/requests/:id/status` — Updates job status (`ACCEPTED` ➔ `MECHANIC_ON_THE_WAY` ➔ `REACHED` ➔ `REPAIR_STARTED` ➔ `COMPLETED`).
- `GET /api/requests/active` — Fetches active live request for current logged-in customer or mechanic.

### 4.3 In-App Live Chat Endpoints (`/api/chat`)
- `GET /api/chat/:requestId` — Retrieves chat message history for an active job.
- `POST /api/chat/:requestId` — Sends a message between customer and mechanic with instant push notification update.

---

## 5. Deployment Blueprint

```
+-----------------------------------------------------------------------------------+
|                                  PRODUCTION DEPLOYMENT                            |
|                                                                                   |
|   +--------------------------+                 +------------------------------+   |
|   |    VERCEL PLATFORM       |                 |       RENDER CLOUD           |   |
|   |  (React.js + Tailwind)   | <--- REST / WS --->  (Node.js + Express backend) |   |
|   +--------------------------+                 +--------------|---------------+   |
|                                                               |                   |
|                                                     [Prisma ORM Client]           |
|                                                               |                   |
|                                                +--------------v---------------+   |
|                                                |    SUPABASE CLOUD PLATFORM   |   |
|                                                |  - PostgreSQL Database       |   |
|                                                |  - Supabase Storage (Files)  |   |
|                                                +------------------------------+   |
+-----------------------------------------------------------------------------------+
```

1. **Frontend Deployment (Vercel)**:
   - Automated git push deployment from GitHub `main` branch.
   - Global CDN edge acceleration with SSL encryption.
2. **Backend API Deployment (Render)**:
   - Node.js runtime environment running `express` server and `prisma` client.
   - Environment variables configured for `DATABASE_URL` and `JWT_SECRET`.
3. **Database & Storage (Supabase)**:
   - PostgreSQL relational instance with connection pooling.
   - S3 object storage for partner verification documents and dynamic invoice PDFs.
