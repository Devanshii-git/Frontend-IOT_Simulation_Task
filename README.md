# IoT Simulation & Monitoring Dashboard

## 📖 Project Overview
This project is an enterprise-grade Internet of Things (IoT) Simulation platform. It is engineered to simulate connected devices, ingest high-throughput telemetry data, and provide a highly scalable, real-time web dashboard for users to monitor device health, configure thresholds, and manage hardware.

---

## 🏗️ Technical Stack & Architecture

### Frontend Architecture
The frontend is built using modern web development practices with strict type safety and optimized build workflows:
* **Core Library:** React 19.2.7 (Concurrent rendering architecture)
* **Build System & Bundler:** Vite 8.1.0 (with Rolldown for near-instantaneous compilation)
* **Language:** TypeScript 6.0.3 (Strict parameter checks)
* **Styling Engine:** Tailwind CSS v4.3.1 (Integrated natively via `@tailwindcss/vite`)
* **State Management:** Zustand 5.0.14 (Managing globally distributed slices for real-time telemetry)
* **Data Visualization:** Recharts 3.9.0 (Client-side rendering of streaming time-series metrics)
* **Routing:** React Router v7.18.0 (Declarative deep-linking)
* **Animations:** Framer Motion 12.42.0 & GSAP 3.15.0

### Backend Architecture
Built with **FastAPI** (Python), the backend is split into two primary microservices:
* **Telemetry Service:** Handles data ingestion, threshold monitoring, and JWT user authentication.
* **Device Simulator Service:** Generates and streams dummy telemetry data.
* **Databases:**
  * *PostgreSQL:* Relational database for users, JWT tokens, and configurations (managed via SQLAlchemy/Alembic).
  * *InfluxDB:* Time-series database optimized for high-speed metrics storage.
* **Observability:** Custom HTTP middleware is implemented to log all API requests, execution times, and server errors to local text files (`telemetry_requests.log` and `simulator_requests.log`).

---

## 🚀 Project Accomplishments
* **Frontend-Backend Integration:** Achieved full end-to-end integration, including a complete OTP and JWT authentication workflow.
* **Build Optimizations:** Drastically reduced the JavaScript bundle size via advanced Vite configurations.
* **Containerization:** The entire application (Frontend, Telemetry, Simulator, and Databases) was containerized using Docker.
* **Automated CI Pipelines:** Integrated Azure DevOps CI/CD pipelines that automatically build artifacts, package microservices, and run native security/dependency scans.
* **Quality Assurance (UAT):** Achieved backend unit test coverage targets using `pytest`, and successfully facilitated User Acceptance Testing.

---

## 💻 Local Environment Setup & Installation

To initialize the local workspace for staging or testing, you do not need to configure local runtimes natively. We have provided a fully orchestrated Docker environment.

**Prerequisites:** 
* Node.js version 20.x or higher (for native frontend development)
* Docker & Docker Compose (for full stack staging)

### Full Stack Staging (Docker)
1. **Clone the repository:**
```bash
git clone https://github.com/Shreyash10261/Backend_IOT-Simulation_Task.git
cd Backend_IOT-Simulation_Task
```
2. **Spin up the microservices:**
Use the provided `docker-compose.yml` to spin up the frontend, backend services, and databases simultaneously.
```bash
docker-compose up --build -d
```
3. **Access the Application:**
* Web Dashboard: `http://localhost:5173`
* Telemetry API Docs: `http://localhost:8000/docs`
* Simulator API Docs: `http://localhost:8001/docs`

### Frontend Native Development
If you are developing UI components directly:
```bash
# Clean install exact locked dependencies
npm install

# Spin up the hyper-fast development local runtime
npm run dev

# Run static codebase analysis
npm run lint

# Compile project for production
npm run build
```
*(Note: The codebase uses path aliasing `@/*` mapping to `./src/*` to ensure component relative path stability).*

---

**Team:** 
Daksh (Backend), Devanshi (Frontend Lead), Harsh (Backend), Rudraksh (QA), Shivang (Scrum Master), Shreyash (DevOps), Sreyas (UI/UX), Vansh (Frontend).
