# Meridian API and Dashboard

Meridian is a comprehensive intelligence platform and dashboard designed to aggregate, analyze, and track operational metrics across an organization. By integrating directly with third-party tools such as GitHub, Jira, Slack, and OpenMetadata, Meridian provides real-time, actionable insights for executives, project managers, HR, and finance departments.

## Table of Contents
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Service Integrations](#service-integrations)
- [Deployment](#deployment)

## Architecture

The system is composed of an asynchronous FastAPI backend and a minimalist Next.js dashboard, integrating with various internal AI agents and external webhooks.

\\mermaid
graph TD
    Client[Client Browser] -->|HTTP / WebSocket| Frontend[Next.js 16 UI]
    Frontend -->|REST API / WS| Backend[FastAPI Server]
    
    Backend -->|Async queries| DB[(Local SQLite Database)]
    
    Slack[Slack Workspace] <-->|Socket Mode| SlackBot[Slack Bolt Bot]
    SlackBot --> Backend
    
    GitHub[GitHub] -->|Webhooks| Webhooks[Webhook Endpoints]
    OpenMetadata[OpenMetadata] -->|Webhooks| Webhooks
    Webhooks --> Backend
    
    Backend -->|API Requests| JiraIntegration[Jira API]
    Backend -->|API Requests| GitHubIntegration[GitHub API]
    
    subgraph Intelligence Hub
        Executive[Executive Agent]
        Finance[Finance Agent]
        HR[HR Agent]
        PM[PM Agent]
        Dev[GitHub Agent]
    end
    
    Backend --> Intelligence Hub
    Intelligence Hub --> LLM[Large Language Model Engine]
\
## Key Features

1. **Multi-Agent Intelligence**: Domain-specific AI agents processing contextual data to generate briefs tailored for Executives, Finance, Human Resources, and Project Management.
2. **Real-time Incident Tracking**: Unified dashboard parsing operational webhooks and managing incident lifecycles, mapped asynchronously via WebSockets.
3. **Automated Standups & Jobs**: Scheduled jobs managing updates and synchronizing system states without manual intervention.
4. **Data Aggregation**: Ingesting organizational telemetry through GitHub code repositories, Jira projects, and OpenMetadata structures.
5. **Interactive ChatOps**: Slack bot integration running via Socket Mode for real-time querying directly from native workspaces.

## Project Structure

The workspace is divided into specific domain responsibility folders:

- \/backend/  - Core FastAPI application (\main.py\)
  - \/ai/\: Natural language querying and core LLM handlers.
  - \/database/\: Database schema definitions and aiosqlite handlers.
  - \/integrations/\: Client accessors for GitHub and Jira data fetching.
  - \/intelligence/\: Module containing specialized AI agents.
  - \/jobs/\: Scheduled processes and automated routines.
  - \/slack_bot/\: Slack application logic (commands, blocks).
  - \/webhooks/\: Receivers for OpenMetadata and GitHub event hooks.
- \/frontend/  - Next.js 16 web application utilizing React 19 and TailwindCSS 4.
  - \/src/app/\: Application routing logic and pages.
  - \/src/components/\: Reusable interface elements, such as Intelligence Panels and Event Tickers.
  - \/src/lib/\: Custom client API implementations.
- \/openmetadata/  - Orchestration configurations for spinning up a local OpenMetadata environment.
- \/scripts/  - Utility and seeding scripts for populating demo environments.

## Prerequisites

- Node.js (v20 or higher)
- Python (v3.10 or higher)
- NPM, Pip, and a Python Virtual Environment configuration
- Docker and Docker Compose (to run OpenMetadata locally)

## Installation and Setup

### 1. Backend Configuration

Navigate to the \ackend\ directory, create a clean environment, and install dependencies.

\\ash
cd backend
python -m venv venv

# On Windows
.\venv\Scripts\activate
# On Unix or Linux
source venv/bin/activate

pip install -r requirements.txt
\
Launch the FastAPI development server:

\\ash
python main.py
\
The API will be available at \http://localhost:8000\.

### 2. Frontend Configuration

Navigate to the \rontend\ directory to install Next.js dependencies.

\\ash
cd frontend
npm install
\
Launch the Next.js development server:

\\ash
npm run dev
\
The Web interface will be available at \http://localhost:3000\.

## Service Integrations

Meridian relies on environment variables to establish secure connections with integrated platforms. You will need to define a \.env\ file containing tokens such as:

- \SLACK_BOT_TOKEN- \SLACK_APP_TOKEN- \GITHUB_ACCESS_TOKEN- \JIRA_API_TOKEN- Configured LLM keys (for the internal \/ai/\ module)

Ensure these variables are loaded within your environment prior to launching the FastAPI instance.

## Deployment

The application utilizes an optimized Turbopack build protocol. Prior to deployment, verify static assets and production viability:

\\ash
# In the /frontend/ directory
npm run build
npm run start
\
For the backend, configure a production-ready ASGI server like Uvicorn or Daphne mapped to your configured organizational port requirements.
