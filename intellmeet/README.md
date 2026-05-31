# 🌌 IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform

Welcome to the **IntellMeet Production Guide & Technical Documentation**! This portal houses the cloud-native, enterprise-grade codebase for **IntellMeet** – a highly scalable SaaS platform engineered using the MERN stack (**React 19 + Express + MongoDB + Socket.io**) that combines real-time video meetings, multi-peer WebRTC mesh conferencing, AI-powered meeting notes, and collaborative workspace boards.

---

## 🛠️ Production Architecture

This repository operates on a fully decoupled **Monorepo Architecture** with independent, production-ready applications:
* **`/client`**: Modern React 19 single-page client built on Vite, customized with premium Vanilla CSS tokens.
* **`/server`**: Twelve-Factor cloud-native Express backend combined with an event-driven Socket.io signaling server.

```mermaid
graph TD
    subgraph Client Application (Vercel / Netlify)
        React["React 19 Frontend SPA"]
        API["api.js Fetch client (JWT Interceptors)"]
        SocketClient["Socket.io-client Gateway"]
    end
    
    subgraph Server Application (Render / Railway / AWS)
        Express["Express MVC Middleware Pipeline"]
        MeetingCRUD["Meeting CRUD Handlers"]
        AuthRot["Auth /refresh & /avatar Routing"]
        SocketServer["Socket.io Server (WebRTC Signals)"]
        CacheService["Cache Service (Redis / Local Memory)"]
        DBService["Resilient DB Connection Gateway"]
    end

    subgraph Managed Cloud Infrastructure
        MongoDB[("MongoDB Atlas Sharded Cluster")]
        Redis[("Upstash / Redis Labs Cloud Cache")]
        Cloudinary[("Cloudinary Media CDN")]
    end

    React -->|Interactions & State| API
    React -->|Real-Time WebRTC Streams| SocketClient
    API -->|Secure HTTPS Requests| Express
    SocketClient -->|SDP Offers / ICE candidates| SocketServer
    Express -->|CRUD Logic| MeetingCRUD
    Express -->|Auth Verification| AuthRot
    MeetingCRUD -->|Session Caching| CacheService
    MeetingCRUD -->|Schema Writes| DBService
    AuthRot -->|User Sessions| DBService
    
    CacheService -->|TLS Key-Value Sync| Redis
    DBService -->|Direct Replica-Set Connections| MongoDB
    AuthRot -->|Base64 Asset Uploads| Cloudinary
```

---

## 🔒 Cloud-Native Twelve-Factor Security Hardening

To ensure enterprise-grade stability, zero-downtime deployments, and absolute data privacy:
1. **Helmet protection**: Establishes secure HTTP headers, mitigating clickjacking, MIME-sniffing, and XSS vector exploits.
2. **CORS strict filters**: Rejects network handshakes originating from unauthorized domains. Only the client origin configured in `CLIENT_URL` is admitted.
3. **Payload constraints**: Restricts request payload body limits to `10kb` to thwart DDoS-style buffer-overflow attempts.
4. **JWT Session Lifecycle**: Employs short-lived Access Tokens (15m validity) paired with long-lived, securely refreshable Refresh Tokens (7d validity) for state security.
5. **Rate-limiting (Throttling)**: Sensitive authentication routes (registration and login) are restricted to a maximum of `30 requests per 15 minutes` from a single IP to block brute-force attempts.
6. **OS Signal Catching**: Handles `SIGTERM` and `SIGINT` triggers gracefully, guaranteeing database connections close safely prior to container scaling.

---

## ⚡ High-Performance Resilient Fallback Architecture

IntellMeet implements state-of-the-art **Fault Tolerance and Resilient Fallbacks** inside development environments. If external cloud resources are unreachable or credentials are not yet whitelisted:
* **Database Fallback**: If a developer's local execution IP isn't whitelisted on MongoDB Atlas (triggering firewall handshakes issues or SSL errors), `db.js` prevents startup crash. The backend transparently transitions into a thread-safe **In-Memory Fallback Store** to handle all Auth and Meeting CRUD mock queries.
* **Cache Fallback**: `cache.service.js` attempts to connect to Redis Labs or Upstash if `REDIS_URL` is set, dynamically falling back to a clean local `Map`-based caching structure on connection failure.
* **Storage Fallback**: If Cloudinary credentials are not configured, profile pictures automatically fallback to beautiful, seed-based SVG avatar generation.

---

## 🚀 100% Online Production Cloud Deployment Guide

Follow this guide to host IntellMeet completely online without using `localhost` references.

### 📡 1. MongoDB Atlas (Cloud Database) Setup
To host your MongoDB sharded clusters completely online:
1. Sign up for a free tier at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Shared Cluster and navigate to **Security** -> **Network Access**.
3. **CRITICAL STEP**: Click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`). This is mandatory so that cloud hosting providers (e.g. Render, Railway) with dynamic outbound IPs can connect successfully.
4. Go to **Database Access** and create an administrator user with read/write privileges.
5. **Special Password Character Encoding**: If your database password contains special characters (e.g. `$`, `@`, `#`), you **MUST** URL-encode them inside your connection string. 
   * *Example*: A password of `my$Password` becomes `my%24Password`.
6. Retrieve your Connection String:
   * **Choice A (Standard SRV URL)**: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intellmeet?retryWrites=true&w=majority`
   * **Choice B (Direct Replica-Set connection - Fallback for local DNS blocks)**: `mongodb://<username>:<password>@ac-cudbfrd-shard-00-00.akimsey.mongodb.net:27017,ac-cudbfrd-shard-00-01.akimsey.mongodb.net:27017,ac-cudbfrd-shard-00-02.akimsey.mongodb.net:27017/intellmeet?ssl=true&replicaSet=atlas-e7z67w-shard-0&authSource=admin&retryWrites=true&w=majority`

### ⚡ 2. Redis Cloud Cache Setup
To host cache layers on cloud instances:
1. Sign up at [Upstash](https://upstash.com) or [Redis Labs](https://redis.com/redis-enterprise-cloud).
2. Deploy a free Serverless Redis database instance.
3. Enable **TLS/SSL encryption** for secure production transport.
4. Retrieve the secure connection URL. It must use the `rediss://` protocol (the extra `s` denotes TLS connection):
   * *Example*: `rediss://default:AbCdEfGh1234567890@us1-fine-snail-40000.upstash.io:40000`

### ☁️ 3. Cloudinary Avatar CDN Setup
To host user avatars and uploaded media CDN online:
1. Create a free account at [Cloudinary](https://cloudinary.com).
2. From the Console Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Format your connection URL:
   * *Example*: `cloudinary://<api_key>:<api_secret>@<cloud_name>`
   * *Example*: `cloudinary://9876543210:XyZAbCdEfGh12345@my-cloudinary-cloud-name`

---

## 🎛️ Production Environment Variables Reference

When deploying online, you **MUST** configure these environment parameters in your hosting dashboards. **Strictly avoid localhost paths.**

### 🗄️ Backend Server Environment Configuration (`server`)
Configure these keys in **Render.com** or **Railway.app** Environment Variables tab:

| Variable Name | Required | Description | Production Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Local execution port mapping | `8080` (Standard for Render/Railway) |
| `NODE_ENV` | Yes | Current application runner mode | `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string (whitelisted) | `mongodb+srv://admin:pass%24word@cluster.mongodb.net/...` |
| `REDIS_URL` | No | Secure Cloud Redis Connection URI (with TLS) | `rediss://default:token@us1-fine-snail-40000.upstash.io:40000` |
| `CLOUDINARY_URL` | No | Cloudinary API secure credentials link | `cloudinary://9876:xyz@my-cloud-name` |
| `JWT_SECRET` | Yes | Primary JWT access token sign secret | *Secure 32+ character alphanumeric key* |
| `JWT_REFRESH_SECRET`| Yes | Session refresh rotation lifecycle secret | *Secure 32+ character alphanumeric key* |
| `CLIENT_URL` | Yes | Active Front-End Web URL (strictly no localhost) | `https://intellmeet-client.vercel.app` |

### 💻 Frontend Client Environment Configuration (`client`)
Configure these keys in **Vercel** or **Netlify** Environment Variables tab:

| Variable Name | Required | Description | Production Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Public Backend HTTPS REST Route origin | `https://intellmeet-api.onrender.com/api` |
| `VITE_SOCKET_URL`| Yes | Public Backend WebSocket origin for signaling | `https://intellmeet-api.onrender.com` |

---

## ☁️ Zero-Localhost Deployment Workflow

Follow these steps to deploy IntellMeet live:

```mermaid
sequenceDiagram
    participant Dev as Local Developer Workspace
    participant Git as GitHub Monorepo
    participant Mongo as MongoDB Atlas
    participant Redis as Upstash Redis
    participant Back as Cloud Backend (Render/Railway)
    participant Front as Cloud Frontend (Vercel/Netlify)

    Dev->>Mongo: Whitelist 0.0.0.0/0 (All IP access)
    Dev->>Redis: Create Redis Instance (Enable TLS)
    Dev->>Git: Commit and push branches
    Git->>Back: Auto-Trigger Render Build (Inject MONGO_URI, REDIS_URL, CLIENT_URL)
    Git->>Front: Auto-Trigger Vercel Build (Inject VITE_API_URL, VITE_SOCKET_URL)
    Front->>Back: Secure API HTTPS Handshakes (JWT + CORS)
    Front->>Back: Establish Socket.io signaling channels
```

### Step 1: Deploy Backend (`/server`)
1. Create a new **Web Service** on [Render](https://render.com) or a project on [Railway](https://railway.app).
2. Connect your GitHub repository. Set the root directory to `intellmeet/server`.
3. Set the start command to `npm start`.
4. Inject all required **Backend Environment Variables** (outlined above), pointing `CLIENT_URL` to your future Frontend URL.
5. Deploy. Render/Railway will provision an HTTPS link (e.g. `https://intellmeet-api.onrender.com`).

### Step 2: Deploy Frontend (`/client`)
1. Create a new project on [Vercel](https://vercel.com).
2. Connect your repository and configure the root directory to `intellmeet/client`.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Inject **Frontend Environment Variables**:
   * `VITE_API_URL` -> Set to your Render backend HTTPS link + `/api` (e.g. `https://intellmeet-api.onrender.com/api`).
   * `VITE_SOCKET_URL` -> Set to your Render backend HTTPS link (e.g. `https://intellmeet-api.onrender.com`).
5. Deploy. Vercel will generate an HTTPS link (e.g. `https://intellmeet-client.vercel.app`).
6. **CRITICAL FINAL STEP**: Copy this Vercel link, navigate back to your Render/Railway dashboard, and update your backend's `CLIENT_URL` to match this front-end domain perfectly to finalize CORS validation!

---

## 👥 Dev Team Collaboration & Git Workflow

All contributors pushing code to **`Shanjiv931/IntellMeet-dev-team1`** must adhere to these policies:

### 1. Dedicated Feature Branches
Never push directly to `main`. Create structured, descriptive branches:
```bash
git checkout main
git pull origin main
git checkout -b feature/webrtc-audio-controls
```

### 2. Semantic Commit Standards
Write clear, standardized commits prefixed with structural categories:
* `feat:` brand-new features (e.g. `feat(socket): add standard WebRTC ICE candidates relay`)
* `fix:` patch fixes (e.g. `fix(auth): resolve JWT expiration lifecycle mismatch`)
* `refactor:` code cleanup without functional alterations
* `docs:` updates to readme or inline code comments
* `test:` adding or refactoring test scripts

### 3. Pull Request (PR) Policy
Push your branch and open a Pull Request at [GitHub Portal](https://github.com/Shanjiv931/IntellMeet-dev-team1):
1. Tag your team members for reviews.
2. Link the corresponding active tickets.
3. Merge only after all integration checkmarks clear.
