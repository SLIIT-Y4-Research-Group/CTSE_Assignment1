📌 Event Management System – Microservices Architecture

This project is a cloud-based Event Management System built using Microservices Architecture, Docker, and MongoDB Atlas.

It consists of 6 backend microservices, an API Gateway (Nginx), and a React frontend.

🏗️ Architecture Overview
Microservices:

User Service

Event Service

Ticket Service

Payment Service

Notification Service

Reporting Service

Other Components:

API Gateway (Nginx)

MongoDB Atlas (Cloud Database)

React Frontend

📂 Project Structure
event-management-system/
├── api-gateway/
│   ├── nginx.conf
│   └── Dockerfile
├── frontend/
├── services/
│   ├── user-service/
│   ├── event-service/
│   ├── ticket-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── reporting-service/
├── docker-compose.yml
└── README.md
⚙️ Prerequisites

Make sure the following are installed:

🔹 Required Software

Node.js (v18+ recommended)

npm or yarn

Docker Desktop

Git

🔹 Accounts

MongoDB Atlas account (Free tier)

📦 Dependencies (Backend)

Each microservice uses:

npm install express cors helmet morgan dotenv mongoose
🌐 MongoDB Atlas Setup

Create a free cluster at:
https://www.mongodb.com/atlas

Create a database user

Allow IP access:

0.0.0.0/0

Get connection string:

mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
🔐 Environment Variables

Each service must have a .env file.

Example: user-service/.env
PORT=3000
SERVICE_NAME=user-service
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/user_service_db?retryWrites=true&w=majority
Database Names
Service	Database
User	user_service_db
Event	event_service_db
Ticket	ticket_service_db
Payment	payment_service_db
Notification	notification_service_db
Reporting	reporting_service_db
🐳 Running the Application
Step 1: Clone the repository
git clone <your-repo-url>
cd event-management-system
Step 2: Run Docker
docker compose up --build
🚀 Services Ports
Service	Port
User	3001
Event	3002
Ticket	3003
Payment	3004
Notification	3005
Reporting	3006
API Gateway	8080
🧪 API Testing Endpoints
🔹 Direct Service Tests
http://localhost:3001/
http://localhost:3002/
http://localhost:3003/
http://localhost:3004/
http://localhost:3005/
http://localhost:3006/
🔹 Health Checks
http://localhost:3001/health
http://localhost:3002/health
http://localhost:3003/health
http://localhost:3004/health
http://localhost:3005/health
http://localhost:3006/health
🔹 Database Check Endpoints
http://localhost:3001/db-check
http://localhost:3002/db-check
http://localhost:3003/db-check
http://localhost:3004/db-check
http://localhost:3005/db-check
http://localhost:3006/db-check
🌍 API Gateway Endpoints
🔹 Main Routes
http://localhost:8080/api/users/
http://localhost:8080/api/events/
http://localhost:8080/api/tickets/
http://localhost:8080/api/payments/
http://localhost:8080/api/notifications/
http://localhost:8080/api/reports/
🔹 Health via Gateway
http://localhost:8080/api/health/user
http://localhost:8080/api/health/event
http://localhost:8080/api/health/ticket
http://localhost:8080/api/health/payment
http://localhost:8080/api/health/notification
http://localhost:8080/api/health/reporting
🔹 DB Check via Gateway (Recommended)
http://localhost:8080/api/users/db-check
http://localhost:8080/api/events/db-check
http://localhost:8080/api/tickets/db-check
http://localhost:8080/api/payments/db-check
http://localhost:8080/api/notifications/db-check
http://localhost:8080/api/reports/db-check
💻 Frontend Setup (React)
cd frontend
npm install
npm run dev
.env
VITE_API_BASE_URL=http://localhost:8080/api
🔐 Security Practices

Environment variables for secrets

Helmet for HTTP headers

CORS enabled

MongoDB Atlas authentication

🔄 DevOps Practices

Docker containerization

Docker Compose orchestration

API Gateway (Nginx)

Modular microservices

Cloud database integration

⚠️ Troubleshooting
❌ MongoDB connection error

Check Atlas credentials

Ensure IP whitelist (0.0.0.0/0)

❌ Nginx 404 error

Rebuild containers:

docker compose down
docker compose up --build
❌ Service not starting

Check package.json has:

"start": "node src/app.js"
✅ Final Notes

Each microservice runs independently

All services communicate via API Gateway

MongoDB Atlas used as shared cloud DB with separate databases