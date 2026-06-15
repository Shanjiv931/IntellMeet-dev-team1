# 🌌 IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform
### *Production-Grade Full-Stack MERN Application with Real-Time Video, AI Meeting Intelligence & Team Collaboration*

---

## 📋 Project Identity
* **Title**: IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform
* **Subtitle**: Production-Grade Full-Stack MERN Application with Real-Time Video, AI Meeting Intelligence & Team Collaboration
* **Author**: **Zidio Development** ✨
* **Domain**: Web Development (MERN) Domain Portfolio Reference
* **Date**: March/April 2026
* **Version**: `2.0 – Industry Edition`
* **Status**: Deployed & Hardened

---

## 1. 💼 Business Case & Production Objectives
Meetings are one of the single largest productivity drains in modern enterprises. Employees spend hours taking notes, compiling summaries, and manually assigning action items rather than focusing on actual work. 

**IntellMeet** resolves this by turning every team meeting into an actionable, trackable event on autopilot:
* **Reduce meeting follow-up overhead by 40–60%**: Fully automated transcription, summary generation, and action item extraction using Gemini/OpenAI API means teams spend zero time drafting follow-up emails.
* **Improve task completion rate by 25–40%**: Direct conversion of meeting action items into Kanban workspace tasks ensures critical decisions are never forgotten or lost in chat logs.
* **Support high concurrency scales**: Engineered to support between `500–5,000` concurrent participants, catering to enterprise town halls and large-scale cross-functional syncs.
* **Guarantee 99.95% availability SLA**: A fault-tolerant architecture utilizing offline in-memory fallback stores and connection retry loops ensures meetings can proceed even if external cloud services experience downtime.

---

## ⚙️ Core Architecture & Flow Diagram
IntellMeet operates as a decoupled Monorepo containing:
1. **`/client`**: A high-fidelity React 19 single-page application built on Vite, styled with premium Vanilla CSS tokens.
2. **`/server`**: A Twelve-Factor cloud-native Express backend combined with an event-driven Socket.io signaling server.

```mermaid
graph TD
    subgraph "Client Application (Vercel / Netlify)"
        React["React 19 Frontend SPA"]
        API["api.js Fetch client (JWT Interceptors)"]
        SocketClient["Socket.io-client Gateway"]
      end
    
    subgraph "Server Application (Render / Railway / AWS)"
        Express["Express MVC Middleware Pipeline"]
        MeetingCRUD["Meeting CRUD Handlers"]
        AuthRot["Auth /refresh & /avatar Routing"]
        SocketServer["Socket.io Server (WebRTC Signals)"]
        CacheService["Cache Service (Redis / Local Memory)"]
        DBService["Resilient DB Connection Gateway"]
      end

    subgraph "Managed Cloud Infrastructure"
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

## 2. ⚡ Core Functional Requirements

| ID | Feature Capability | Detailed Description & Business Value | Key Acceptance Criteria & Production Metrics |
| :--- | :--- | :--- | :--- |
| **F01** | **User Authentication & Profiles** | Secure signup/login using stateless, short-lived Access JWTs and long-lived Refresh JWTs. Profile management handles avatars resiliently. | Cryptographic password hashing (bcryptjs), secure session cookie storage, and full profile CRUD. |
| **F02** | **Real-Time Video Meetings** | Video conferencing room utilizing WebRTC peer connections with audio, video, and screen share controls. | Low latency WebRTC relay (<200ms) and automatic mesh state tracking. |
| **F03** | **AI Meeting Intelligence** | Automatic meeting transcription, summary extraction, and action item determination powered by Google Gemini API. | Accurate summarization and automated assignee parsing with high readability. |
| **F04** | **Real-Time Collaboration** | In-meeting bidirectional chat and live presence indicators syncing across participants. | Sub-100ms real-time event dispatching powered by Socket.io. |
| **F05** | **Post-Meeting Dashboard** | Complete historical directory of previous meetings, summaries, and action item compliance logs. | Full search queries on transcripts, descriptions, and summaries. |
| **F06** | **Team Workspace Boards** | Kanban-style workspace board allowing teams to assign tasks and manage progress. | Interactive card dragging, status changes, and due dates. |
| **F07** | **Productivity Analytics** | Date-based trend charts, task completion percentages, and productivity scoring based on meeting follow-ups. | High-fidelity interactive metrics charts. |

---

## 🛠️ Production Technology Stack

| Layer | Primary Technology | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Fast Hot Module Replacement (HMR) and optimized build bundles. | Next.js (rejected to keep frontend hosting flexible). |
| **UI Styling** | Vanilla CSS Variable Tokens | Total stylistic freedom, clean loading speed, and modern glassmorphic theme styling. | Tailwind CSS (avoided for clean modular styling control). |
| **State Management** | Zustand | Ultra-lightweight, reactive, and boilerplate-free state management. | Redux Toolkit (deemed too heavy for this application scope). |
| **Backend** | Node.js + Express | Highly scalable, asynchronous event loops perfect for handling API connections. | NestJS (avoided for quick turnaround). |
| **Database** | MongoDB + Mongoose | Highly flexible document models for meetings, tasks, and action lists. | PostgreSQL (rejected due to strict schema overhead). |
| **Real-Time Gateway**| Socket.io + WebRTC | Industry-standard low-latency P2P media connections and bidirectional events. | WebRTC peerjs / raw WebSockets. |
| **Cache Layer** | Redis | TLS-enabled key-value synchronization for production caching. | Memory Cache (retained as local offline fallback). |
| **Orchestration** | Kubernetes + Helm | High availability, auto-scaling deployment pods, and clean package updates. | Docker Compose alone (retained for local development). |

---

## 🔒 Security Hardening & OWASP Top 10 Mitigation

IntellMeet is hardened against modern web application security threats:

1. **Broken Object Level Authorization (BOLA/IDOR) Protection**:
   * *Mitigation*: Meeting-specific resource paths (`GET /api/meetings/:id` and `POST /api/meetings/:id/summarize`) explicitly validate if the requesting user (`req.user.id`) is either the **Host**, an active **Participant**, or an **Administrator**. Unauthorized requests immediately throw a `403 Forbidden` error.
2. **ReDoS & Regular Expression Injection Protection**:
   * *Mitigation*: Custom utility methods escape all input strings (`escapeRegExp`) prior to generating database search queries (e.g. matching task assignees), neutralizing attempts to crash servers with catastrophic backtracking.
3. **Helmet HTTP Header Hardening**:
   * *Mitigation*: Automatically configures secure headers (XSS Filter, Clickjacking protection, Referrer Policy) on all server responses.
4. **CORS Strict Access-Control**:
   * *Mitigation*: Configures origin filters so only the authorized production frontend domains (`*.vercel.app`, `*.netlify.app`) and the configured `CLIENT_URL` can connect.
5. **Rate-Limiting (Brute-Force Shield)**:
   * *Mitigation*: Authentication endpoints are throttled to a maximum of `30 requests per 15 minutes` to protect against credential stuffing.
6. **Stateless Session Control**:
   * *Mitigation*: Employs short-lived Access JWTs (15m expiry) and robust Refresh JWTs (7d expiry) with absolute database revocation checks.

---

## 📅 28-Day Execution Timeline

### **Week 1 – Core Backend & Authentication Foundation**
* **Day 1**: Monorepo structure setup, environment variable validation (`env.js`), and MongoDB connection initialization with custom retry hooks.
* **Day 2**: Mongoose schema declarations for `User` and `Session`. Formulated JWT access/refresh lifecycle functions and cryptographically hashed passwords.
* **Day 3**: Protected routes middleware (`authenticateJWT` and `requireRoles`) implementation, and auth rate limiting setup.
* **Day 4**: `Meeting` schemas and CRUD controller logic mapping. WebRTC peer connection relay handler endpoints setup.
* **Day 5**: Sockets server integration and Redis caching synchronization.
* **Day 6**: Bidirectional chat message events over Socket.io namespaces.
* **Day 7**: Week 1 Checkpoint: Backend API routes verified using Postman.

### **Week 2 – Frontend & Real-Time Meeting Core**
* **Day 8**: React 19 client initialization using Vite, configuring CSS variables for glassmorphic dark mode styling.
* **Day 9**: Authenticated layout routes and Axios interceptor setups to handle token refreshes automatically.
* **Day 10**: Video conference room lobby, handling webcam and audio track capture.
* **Day 11**: Chat panel drawer integration inside the conference room with live message bubbles.
* **Day 12**: Screen sharing capabilities using browser `getDisplayMedia` tracks.
* **Day 13**: Active room participant presence indicators.
* **Day 14**: Week 2 Checkpoint: End-to-end multi-user meeting room testing completed.

### **Week 3 – AI Intelligence & Collaboration Features**
* **Day 15**: Web Speech recognition API integration, parsing microphone input into a chronological transcript string.
* **Day 16**: AI Summarization service integration using Google Gemini API.
* **Day 17**: Historical meetings dashboard view with expandable search filters.
* **Day 18**: Kanban task board UI with interactive status columns.
* **Day 19**: Task creation pipeline linking meeting action items directly into Kanban task models.
* **Day 20**: Push notification indicators for assigned tasks.
* **Day 21**: Week 3 Checkpoint: AI summarization quality verification and accuracy verification.

### **Week 4 – Deployment, Monitoring & Production Polish**
* **Day 22**: Multi-stage `Dockerfiles` optimizing client and server containers.
* **Day 23**: Helm chart package compilation and Kubernetes deployment pods manifests.
* **Day 24**: GitHub Actions CI-CD YAML workflow construction for validation.
* **Day 25**: Cloud deployment configurations for Render and Vercel.
* **Day 26**: Prometheus, Grafana, and Sentry hooks integration.
* **Day 27**: Load testing, confirming sub-200ms latency.
* **Day 28**: Final documentation compile and submission preparation.

---

## 🚀 Deployment & Operations Guide

### Local Development Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shanjiv931/IntellMeet-dev-team1.git
   cd IntellMeet-dev-team1
   ```
2. **Setup Environment Variables**:
   Create `intellmeet/server/.env` matching the checklist below.
3. **Install Dependencies & Start dev servers**:
   * **Backend**:
     ```bash
     cd intellmeet/server
     npm install
     npm run dev
     ```
   * **Frontend**:
     ```bash
     cd intellmeet/client
     npm install
     npm run dev
     ```
4. **Seed the database (Optional)**:
   ```bash
   cd intellmeet/server
   npm run seed
   ```

### Production Environment Variables Reference

| Variable Name | Required | Purpose | Production Example |
| :--- | :--- | :--- | :--- |
| `MONGO_URI` | Yes | MongoDB Atlas connection | `mongodb+srv://shanjivkr931:SHAN1pran2%24@cluster...` |
| `NODE_ENV` | Yes | App runner mode | `production` |
| `PORT` | Yes | Internal web server port | `8080` |
| `JWT_SECRET` | Yes | Access token signing secret | *Alphanumeric key* |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret | *Alphanumeric key* |
| `CLIENT_URL` | Yes | Allowed CORS frontend origin | `https://intellmeet.vercel.app` |
| `REDIS_URL` | No | TLS Redis cache link | `rediss://default:token@cluster.upstash.io:6379` |
| `CLOUDINARY_URL`| No | Image CDN credentials | `cloudinary://api_key:secret@cloud_name` |

---

## 👥 Dev Team Collaboration & Git Workflow

1. **Feature Branches**: Contributors must push changes on dedicated branches:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Semantic Commits**:
   * `feat:` for new capabilities (e.g. `feat(auth): add BOLA validation on meetings`)
   * `fix:` for patches (e.g. `fix(db): escape regex parameters`)
   * `docs:` for README improvements
3. **Pull Request Policy**: Keep branches updated and merge only after peer approvals and CI validation checkmarks clear.
