# Shift Tracker Application

A full-stack, aesthetically pleasing web application designed to track shift handovers for 24\*7 Operations teams. Built with React, FastAPI, and PostgreSQL, all orchestrated by Docker Compose.

## Features

- **Premium UI/UX**: Dark mode, glassmorphism design, and micro-animations for a modern feel.
- **Dynamic Configuration**: Admin panel to manage Team Members and Shift Types.
- **Comprehensive Logging**: Detailed shift handover forms capturing new alerts, ongoing incidents, actions taken, and escalations.
- **Historical Dashboard**: View and filter past shift handovers.
- **Editable Records**: Update or delete past shift records and team members directly from the UI.

## Tech Stack

- **Frontend**: React (Vite), Lucide Icons, Custom CSS Variables
- **Backend**: Python, FastAPI, SQLAlchemy (Async)
- **Database**: PostgreSQL 15
- **Server**: Nginx (Static File Serving & Reverse Proxy)
- **Deployment**: Docker & Docker Compose

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/shift-tracker.git
   cd shift-tracker
   ```

2. **Run the application**:

   ```bash
   docker compose up -d --build
   ```

## Configuration & Environment Variables

The application uses environment variables for configuration. A template is provided in `.env.example`.

1. **Create an `.env` file**:
   ```bash
   cp .env.example .env
   ```
2. **Key Variables**:
   - `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`: Controls the PostgreSQL container.
   - `DATABASE_URL`: The full connection string for the backend (e.g., `postgresql+asyncpg://user:password@db:5432/shift_tracker`).
   - `SECRET_KEY`: Critical for JWT security. Change this in production.
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Credentials for the initial bootstrap admin user.

## Database Hosting Scenarios

### Scenario A: Database on Same Server (Default)
Docker Compose will automatically start and manage the PostgreSQL container.
- **`DATABASE_URL` in `.env`**: Point to `@db:5432/...`.

### Scenario B: External Database Server
If you are using a managed database or a DB on another server:
1. Update **`DATABASE_URL`** in your `.env` file to point to your external server's IP and credentials.
2. Edit `docker-compose.yml` and comment out or remove the `db` service.
3. Ensure the external database allows connections from your application server's IP on port `5432`.

## Additional Endpoints

- **API Documentation (Swagger)**: `http://localhost:8000/docs` (technical manual and interactive testing).
- **Health Check & Fail-safe**: `http://localhost:8000/api/health`
  - Confirms database connectivity.
  - Automatically seeds the admin user if missing.

## License

MIT License
