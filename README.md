# Shift Tracker Application

A full-stack, aesthetically pleasing web application designed to track shift handovers for 24*7 Operations teams. Built with React, FastAPI, and PostgreSQL, all orchestrated by Docker Compose.

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

3. **Access the Application**:
   - Open your browser and navigate to `http://localhost`.
   - The backend API swagger documentation is available at `http://localhost/api/docs`.

## Initial Setup

On your first run, the database will be empty. 
1. Navigate to the **Admin Config** panel via the sidebar.
2. Add your **Team Members** (e.g. "bjohnson").
3. Add your **Shift Types** (e.g. "Morning", "06:00-14:00").
4. Navigate to **New Handover** to log your first shift!

## Development

The `docker-compose.yml` mounts the `./backend` folder into the FastAPI container, meaning Python code changes will live-reload. The frontend is built using a multi-stage Dockerfile to ensure a clean, isolated build environment on any host machine.

### Project Structure
- `/frontend`: React application code
- `/backend`: FastAPI application and database models
- `/nginx`: Nginx reverse proxy configuration

## License

MIT License
