# Event Management System - Project Documentation

## 1. Project Summary
This project is a backend microservices system for event management.  
It is structured as multiple Node.js services behind an Nginx API Gateway, with each service managing its own MongoDB-backed domain.

Primary domains in the current repository:
- User and role management
- Event lifecycle management
- Ticket inventory and booking
- Payment processing (Stripe checkout)
- Notifications (email, SMS, in-app via Socket.IO)
- Reporting (service scaffold present)

---

## 2. High-Level Architecture

### 2.1 Architectural Style
- **Microservices architecture**
- **API Gateway pattern** using Nginx
- **Database-per-service** model using MongoDB

### 2.2 Runtime Topology
- All services run as containers in a shared Docker bridge network (`ems-network`)
- Gateway receives client traffic on `:8080` and proxies to internal services on `:3000`
- Services expose health and DB checks for operational visibility

### 2.3 Service Ports (Host -> Container)
- User Service: `3001 -> 3000`
- Event Service: `3002 -> 3000`
- Ticket Service: `3003 -> 3000`
- Payment Service: `3004 -> 3000`
- Notification Service: `3005 -> 3000`
- API Gateway: `8080 -> 80`

Note: Reporting Service exists in source but is not currently wired in `docker-compose.yml`.

---

## 3. API Gateway Design
Gateway config is defined in:
- `api-gateway/nginx.conf` (full stack)
- `api-gateway/nginx.core.conf` (core subset)

### 3.1 Route Prefixes
- `/api/users/*` -> User Service
- `/api/events/*` -> Event Service
- `/api/tickets/*` -> Ticket Service
- `/api/payments/*` -> Payment Service
- `/api/notifications/*` -> Notification Service

### 3.2 Operational Endpoints Through Gateway
- Health checks: `/api/health/{service}`
- DB checks: `/api/db-check/{service}`
- Swagger docs (proxied): `/api/docs/{service}`

---

## 4. Microservices and Responsibilities

### 4.1 User Service (`services/user-service`)
**Purpose**
- User registration/login (JWT auth)
- User profile and account management
- Role and permission management

**Main routes**
- `/api/auth/*`
- `/api/users/*`
- `/api/roles/*`
- `/api/docs` (Swagger UI)

**Notable behavior**
- Seeds default roles at startup via `ensureDefaultRoles`
- Uses permission-based guards (`requirePermissions`)
- Sends onboarding emails through Notification Service client

---

### 4.2 Event Service (`services/event-service`)
**Purpose**
- Create, publish, cancel, update, and search events
- Exposes organizer- and status-oriented event views
- Validates event availability for booking flows

**Main routes**
- Mounted at `/api` in app
- Effective endpoints include `/api/events/*`

**Notable behavior**
- Role-protected event modification (`event_manager`, `admin`)
- Includes search endpoints and organizer filtering

---

### 4.3 Ticket Service (`services/ticket-service`)
**Purpose**
- Manage ticket types/inventory
- Manage bookings and booking lifecycle
- Ticket availability and booking confirmation support

**Main routes**
- `/api/tickets/*`
- `/api/bookings/*`

**Notable behavior**
- Calculates totals and booking references
- Validates users using User Service
- Contains helper integrations for Event Service checks

---

### 4.4 Payment Service (`services/payment-service`)
**Purpose**
- Create Stripe checkout sessions
- Persist payment records and status
- Confirm checkout session status and update payment state

**Main routes**
- `/api/payments/checkout`
- `/api/payments/confirm`
- `/api/payments/:id`

**Notable behavior**
- Uses Stripe metadata to map checkout sessions to internal payment records
- Uses `FRONTEND_URL` for success/cancel redirect callbacks

---

### 4.5 Notification Service (`services/notification-service`)
**Purpose**
- Send notifications via:
  - Email (Nodemailer)
  - SMS (provider abstraction)
  - In-app realtime events (Socket.IO)

**Main routes**
- `/api/notify/sms`
- `/api/notify/email`
- `/api/notify/in-app`
- `/api/docs` (Swagger UI)

**Notable behavior**
- Creates an HTTP server and binds Socket.IO for realtime notifications
- Supports room-based targeting by `userId`

---

### 4.6 Reporting Service (`services/reporting-service`)
**Purpose**
- Base service scaffold for reporting

**Current state**
- Basic Express + MongoDB bootstrap
- Health and DB-check endpoints only
- No domain routes implemented yet
- Not included in current compose stack

---

## 5. Service-to-Service Communication
Current integration style is synchronous HTTP (Axios) between services.

Known patterns in code:
- Ticket Service -> User Service for user validation
- Ticket Service -> Event Service for event verification helper
- User Service -> Notification Service for new-user email notifications

No message broker/event bus is currently configured in this repository.

---

## 6. Data Layer
- **MongoDB Atlas** as persistence layer
- **Mongoose** ODM in all services
- Intended database-per-service separation:
  - `user_service_db`
  - `event_service_db`
  - `ticket_service_db`
  - `payment_service_db`
  - `notification_service_db`
  - `reporting_service_db`

---

## 7. Technologies Used

### 7.1 Core Platform
- Node.js (CommonJS modules)
- Express.js
- Docker + Docker Compose
- Nginx (API Gateway)
- MongoDB Atlas + Mongoose

### 7.2 Cross-Cutting Libraries
- `cors` (cross-origin handling)
- `helmet` (security headers)
- `morgan` (HTTP request logging)
- `dotenv` (environment configuration)

### 7.3 Security/Auth
- `jsonwebtoken` (JWT auth, user/event services)
- `bcrypt` (password hashing, user service)

### 7.4 API Documentation
- `swagger-jsdoc`
- `swagger-ui-express`

### 7.5 Payments and Notifications
- `stripe` (payment service)
- `nodemailer` (notification email delivery)
- `socket.io` (in-app realtime notifications)
- `axios` (inter-service HTTP calls)

### 7.6 Developer Tooling
- `nodemon` in selected services for local development

---

## 8. Deployment and Execution

### 8.1 Full Stack
```bash
docker compose up --build
```

### 8.2 Core Stack
Core compose file includes:
- user-service
- notification-service
- api-gateway

Run with:
```bash
docker compose -f docker-compose.core.yml up --build
```

---

## 9. Environment Configuration (Per Service)
Typical variables:
- `PORT`
- `SERVICE_NAME`
- `MONGO_URI`

Service-specific examples:
- Payment Service: `STRIPE_SECRET_KEY`, `FRONTEND_URL`
- Ticket Service: `USER_SERVICE_URL`, `EVENT_SERVICE_URL`
- User Service: `JWT_SECRET`, `NOTIFICATION_SERVICE_URL`
- Notification Service: SMTP and SMS provider credentials

Important: keep `.env` values out of version control and rotate any exposed credentials.

---

## 10. Current Architecture Notes
- Gateway route conventions and individual service route prefixes are not fully uniform.
- Swagger path conventions differ by service (for example `api-docs` vs `api/docs`).
- Reporting Service is present but not yet integrated into gateway or compose full stack.
- Frontend is referenced in high-level docs but not included in this repository snapshot.

These are normal for an active coursework project and can be standardized in a hardening pass.

---

## 11. Recommended Next Improvements
1. Standardize all route prefixes (`/api/{domain}`) and Swagger path conventions.
2. Add centralized configuration validation for required environment variables.
3. Introduce shared auth middleware/package for consistent JWT/role checks.
4. Add automated tests (unit + integration) and a CI workflow.
5. Add request tracing/correlation IDs across gateway and services.
6. Complete Reporting Service domain endpoints and wire into gateway/compose.

