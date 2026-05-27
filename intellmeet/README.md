# 🌌 IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform

Welcome to the **IntellMeet Developer Portal**! This repository houses the cloud-native, enterprise-grade backend engine for **IntellMeet** – a highly scalable SaaS platform designed for next-generation virtual collaboration.

This project is built under a strict, decoupled **MVC + Service-oriented monorepo architecture** using **Node.js (ES Modules)**, **Express.js**, **MongoDB Atlas**, and **Socket.io**.

---

## 🚀 Dev Team Quick Start

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v20+ recommended)
* **npm** (v10+ recommended)
* A **MongoDB Atlas** database account or local MongoDB instance.

### 2. Repository Structure
```text
intellmeet/
├── client/                          # Frontend React/Next.js client application (Placeholder)
├── server/                          # Production-grade Node/Express API server & Socket server
│   ├── src/
│   │   ├── config/                  # DB and environment configurations
│   │   ├── controllers/             # Action maps & HTTP request handlers
│   │   ├── middleware/              # JWT, RBAC, Rate Limiting, and Global Error handlers
│   │   ├── models/                  # Strict Mongoose schema models
│   │   ├── routes/                  # API router routing pipelines
│   │   ├── services/                # Decoupled business logic & DB queries
│   │   ├── sockets/                 # Real-time WebSocket handlers (Room loops)
│   │   ├── utils/                   # Shared helpers (logger, AppError, JWT utils)
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Server entry point wrapper (SIGTERM / SIGINT catches)
│   ├── .env.example                 # Reference configuration settings
│   └── package.json                 # Dependency and runner script manager
└── README.md                        # Project main documentation
```

---

## ⚙️ Environment Configuration

The server enforces standard security guidelines and will **gracefully abort initialization** if required environment parameters are missing. 

To configure your workspace:
1. Navigate to the server root:
   ```bash
   cd intellmeet/server
   ```
2. Create a new `.env` file from the reference template:
   ```bash
   cp .env.example .env
   ```
3. Open `server/.env` and configure the variables:

| Key | Description | Example / Requirement |
| :--- | :--- | :--- |
| `PORT` | Local server port listener | `8080` |
| `MONGO_URI` | MongoDB Atlas Cloud URI | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intellmeet?retryWrites=true&w=majority` |
| `JWT_SECRET` | Primary JWT Sign Secret | *Minimum 32 characters long secure string* |
| `JWT_REFRESH_SECRET` | Session Refresh token secret | *Minimum 32 characters long secure string* |
| `CLIENT_URL` | Deployed Frontend/Client Origin | `https://intellmeet.app` (or `http://localhost:3000` for local dev) |

---

## 🗄️ MongoDB Connection Setup & Troubleshooting

### ⚠️ Special Character URL-Encoding
If your database password has special characters (e.g. `$`, `@`, `#`), you **MUST** URL-encode them inside your `MONGO_URI`. 
* **Example**: If your password is `SHAN1pran2$`, the `$` character must be replaced with `%24`, making the password section: `SHAN1pran2%24`.
* **Atlas Placeholders**: Ensure you remove the `<` and `>` angle brackets around your password string!

### 📡 Local DNS SRV Issues (`querySrv ECONNREFUSED`)
When working in local Windows environments or behind corporate firewalls/VPNs, Node's internal DNS resolver can fail to lookup MongoDB Atlas SRV records, raising `querySrv ECONNREFUSED _mongodb._tcp...`.

To bypass this, we have provided a **Direct Replica-Set Connection URI** in your `.env` configuration. It connects directly to the underlying shard nodes, bypassing the DNS SRV resolution altogether:

```ini
# --- CHOICE A: Standard MongoDB Atlas SRV connection (Default) ---
MONGO_URI=mongodb+srv://shanjivkr931:SHAN1pran2%24@intellmeet-dev.akimsey.mongodb.net/intellmeet?retryWrites=true&w=majority&appName=intellmeet-dev

# --- CHOICE B: Direct Replica-Set connection (Fallback for local DNS block) ---
# MONGO_URI=mongodb://shanjivkr931:SHAN1pran2%24@ac-cudbfrd-shard-00-00.akimsey.mongodb.net:27017,ac-cudbfrd-shard-00-01.akimsey.mongodb.net:27017,ac-cudbfrd-shard-00-02.akimsey.mongodb.net:27017/intellmeet?ssl=true&replicaSet=atlas-e7z67w-shard-0&authSource=admin&retryWrites=true&w=majority
```

---

## 🛠️ Architecture & Code Layout

This repository utilizes a **Controller-Service-Model** structural pattern to achieve high modularity and separation of concerns.

```mermaid
graph TD
    Client[Web/App Client] -->|HTTP Request| Router[API Routes]
    Client -->|WebSocket Event| SocketServer[Socket.io Server]
    Router -->|Pipeline| Middleware[JWT Auth / RBAC / Rate Limiter]
    Middleware -->|Request Payload| Controller[Auth/Meeting Controllers]
    Controller -->|Delegates| Service[Business Logic Service]
    Service -->|Database Queries| Model[Mongoose Models]
    Model -->|Stores/Fetches| MongoDB[(MongoDB Atlas)]
```

### 🧱 Architectural Layers
* **Models (`/models`)**: Defines strict database schema structures with automated validation, sanitization rules, and password-hashing pre-save hooks.
* **Services (`/services`)**: Business processing logic. Contains raw calculations, payload transforms, and database CRUD orchestrations. Decouples operations from Express `req` and `res` signatures.
* **Controllers (`/controllers`)**: Standard action handlers. Maps incoming Express request bodies, headers, and query parameters to the designated Service method and formats standard JSON responses.
* **Routes (`/routes`)**: Mounts REST resources, binds rate limit parameters, and hooks up RBAC protection layers.

---

## 🔒 Security Hardening

To prepare IntellMeet for production deployment, several active security frameworks are running under the hood:

1. **Helmet protection**: Configures secure HTTP headers to prevent Clickjacking, Cross-Site Scripting (XSS), and MIME-sniffing exploits.
2. **CORS strict rules**: Rejects connections from unauthorized domains. Only the frontends declared in `CLIENT_URL` are permitted.
3. **Payload restrictions**: Restricts request payload body limits to `10kb` to thwart DDoS-style buffer-overflow memory attacks.
4. **JWT Session Lifecycle**: Employs short-lived Access Tokens (15m validity) paired with long-lived, securely refreshable Refresh Tokens (7d validity) for state security.
5. **Rate-limiting (Throttling)**: Sensitive authentication routes (registration and login) are restricted to a maximum of `30 requests per 15 minutes` from a single IP to block brute-force attempts.

---

## 📦 API Resource Contracts

All JSON responses return a standardized structure:
```json
{
  "success": true,
  "message": "Action summary message.",
  "data": { ... }
}
```

### 1. User Registration (`POST /api/auth/register`)
* **Access**: Public | **Rate-Limited**: Yes
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@intellmeet.app",
    "password": "Password123!",
    "role": "MEMBER" // Options: MEMBER, ADMIN, HOST
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "id": "651a0293eb...",
        "name": "Jane Doe",
        "email": "jane.doe@intellmeet.app",
        "role": "MEMBER",
        "createdAt": "2026-05-27T17:02:44Z"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUz...",
        "refreshToken": "eyJhbGciOiJIUz..."
      }
    }
  }
  ```

### 2. User Authentication (`POST /api/auth/login`)
* **Access**: Public | **Rate-Limited**: Yes
* **Request Body**:
  ```json
  {
    "email": "jane.doe@intellmeet.app",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK)**:
  *(Returns a matching user object and a fresh set of Access and Refresh tokens).*

### 3. Retrieve Session Profile (`GET /api/auth/me`)
* **Access**: Protected (Requires valid Bearer token in headers)
* **Headers**: `Authorization: Bearer <accessToken>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User session verified.",
    "data": {
      "user": {
        "id": "651a0293eb...",
        "name": "Jane Doe",
        "email": "jane.doe@intellmeet.app",
        "role": "MEMBER"
      }
    }
  }
  ```

---

## 📡 Real-Time Socket Event Pipeline

The backend hosts an event-driven **Socket.io** gateway mapping client sockets to isolated session streams, laying the groundwork for WebRTC video sync in subsequent milestones.

### Client connection setup
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  withCredentials: true,
  transports: ['websocket']
});
```

### Event Contracts

#### 1. Join Room (`join-room`)
* **Payload**: `roomId` (String)
* **Action**: Hooks the socket stream to the matching room identifier and alerts present participants.
* **Server Broadcast Event**: `user-joined` -> `{ socketId: "...", message: "Client joined." }`

#### 2. Chat Messaging (`message`)
* **Payload**:
  ```json
  {
    "roomId": "meeting-room-01",
    "message": "Let's align on the roadmap.",
    "senderName": "Jane Doe"
  }
  ```
* **Server Broadcast Event**: `room-message` -> *(Dispatches payload, sender ID, and timestamp to all listeners in the room).*

#### 3. Room Departure (`leave-room` / `disconnect`)
* **Payload**: `roomId` (String)
* **Server Broadcast Event**: `user-left` -> `{ socketId: "...", message: "Client left." }`

---

## 👥 Dev Team Collaboration & Git Workflow

To maintain a clean, high-performance git tree, all developers must adhere to the following workflow when pushing to **`Shanjiv931/IntellMeet-dev-team1`**:

### 1. Working on Features
Never commit directly to the `main` or `master` branch. Always work in structured feature branches:
```bash
# 1. Pull down the latest updates
git checkout main
git pull origin main

# 2. Spin up your custom branch (use descriptive name tags)
git checkout -b feature/auth-refactor
# OR
git checkout -b bugfix/jwt-expiration
```

### 2. Standardized Commit Format
Commit messages should be clear and semantic. Use the following prefixes:
* `feat:` for brand-new features
* `fix:` for bug fixes
* `docs:` for readme or comment edits
* `refactor:` for code cleanups without functional changes
* `test:` for adding or updating tests

*Example*:
```bash
git commit -m "feat(auth): add JWT access & refresh token rotation lifecycle"
```

### 3. Merging Changes via Pull Requests
1. Push your branch to the origin repository:
   ```bash
   git push -u origin feature/auth-refactor
   ```
2. Navigate to [GitHub Repository Portal](https://github.com/Shanjiv931/IntellMeet-dev-team1) and submit a **Pull Request (PR)** against the `main` branch.
3. Ensure you link the corresponding issues and ask for a peer review prior to merging.

---

## ☁️ Deployment readiness
This backend engine conforms to standard **Cloud-Native Twelve-Factor App** design criteria, ensuring seamless out-of-the-box compatibility with hosting options like **Render**, **Railway**, or **AWS ECS**:
1. **Dynamic Port Allocation**: Listens correctly to `process.env.PORT` automatically provided by cloud service providers.
2. **CORS Alignment**: Simply set `CLIENT_URL` to your production frontend URL (e.g. `https://intellmeet.app`) in the deployment dashboard, and CORS will enforce it immediately.
3. **Graceful Shutdowns**: Responds to `SIGTERM` and `SIGINT` signals, closing connections to MongoDB Atlas gracefully before terminating.
