# Meridian Platform

Meridian is a comprehensive intelligence and data observability platform. It aggregates, analyzes, and tracks operational metrics across an organization through various third-party integrations (GitHub, Jira, Slack, and OpenMetadata). The platform leverages Large Language Models (LLMs) to generate predictive insights and real-time summaries tailored for Executives, Project Managers, Human Resources, and Finance departments.

## Table of Contents

- [Core Architecture](#core-architecture)
- [Project Structure](#project-structure)
- [Primary Capabilities](#primary-capabilities)
- [Requirements](#prerequisites)
- [Installation Guide](#installation-guide)
  - [1. Backend Setup (FastAPI)](#1-backend-setup-fastapi)
  - [2. Frontend Setup (Next.js)](#2-frontend-setup-nextjs)
- [Configuration and Secrets](#configuration-and-secrets)
- [Deployment Protocol](#deployment-protocol)

## Core Architecture

The architecture relies on a loosely coupled client-server design. A high-performance FastAPI asynchronous backend handles data processing, background jobs, and natural language requests, while a Next.js (Turbopack) frontend provides a sleek, real-time dashboard layout using React 19 and Tailwind CSS v4.

### Architecture Flow Diagram

![Meridian Architecture Diagram](https://mermaid.ink/img/eyJjb2RlIjogImdyYXBoIFREXG4gICAgQ2xpZW50W0NsaWVudCBCcm93c2VyXSA8LS0-fEhUVFAgLyBXZWJTb2NrZXR8IFVJW05leHQuanMgMTYgRnJvbnRlbmRdXG4gICAgVUkgPC0tPnxSRVNUIEFQSSAvIEFzeW5jIFdTfCBBUElbRmFzdEFQSSBCYWNrZW5kIFNlcnZlcl1cbiAgICBBUEkgLS0-IERCWyhTUUxpdGUgRGF0YWJhc2UpXVxuICAgIEFQSSAtLT4gV1NbV2ViU29ja2V0IE1hbmFnZXJdXG4gICAgQVBJIC0tPiBBZ2VudHNbSW50ZWxsaWdlbmNlIEh1Yl1cbiAgICBBZ2VudHMgLS0-fERvbWFpbiBDb250ZXh0fCBFeGVjW0V4ZWN1dGl2ZSBBZ2VudF1cbiAgICBBZ2VudHMgLS0-fERvbWFpbiBDb250ZXh0fCBGaW5bRmluYW5jZSBBZ2VudF1cbiAgICBBZ2VudHMgLS0-fERvbWFpbiBDb250ZXh0fCBIUltIUiBBZ2VudF1cbiAgICBBZ2VudHMgLS0-fERvbWFpbiBDb250ZXh0fCBQTVtQTSBBZ2VudF1cbiAgICBBZ2VudHMgLS0-IExMTVtMTE0gRW5naW5lXVxuICAgIEFQSSAtLT4gSm9ic1tBc3luYyBTY2hlZHVsZXJzXVxuICAgIEdpdEh1YltHaXRIdWJdIC0tPnxXZWJob29rc3wgV2ViaG9va0hhbmRsZXJbV2ViaG9vayBSZWNlaXZlcnNdXG4gICAgT3Blbk1ldGFkYXRhW09wZW5NZXRhZGF0YV0gLS0-fFdlYmhvb2tzfCBXZWJob29rSGFuZGxlclxuICAgIFdlYmhvb2tIYW5kbGVyIC0tPiBBUElcbiAgICBBUEkgLS0-fEFQSSBDbGllbnR8IEppcmFbSmlyYSBTeXN0ZW1zXVxuICAgIEFQSSAtLT58QVBJIENsaWVudHwgR0hDbGllbnRbR2l0SHViIFN5c3RlbXNdXG4gICAgU2xhY2tbU2xhY2sgV29ya3NwYWNlXSA8LS0-fFNvY2tldCBNb2RlfCBTbGFja0JvdFtTbGFjayBCb3RdXG4gICAgU2xhY2tCb3QgLS0-IEFQSVxuIiwgIm1lcm1haWQiOiB7InRoZW1lIjogImRlZmF1bHQifX0=)

### Data Flow Table

| Source / Component | Integration Type | Receiver / Destination | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Client Browser** | HTTP REST & WebSockets | **Next.js Frontend** | Broadcasts UI updates; sends and receives live asynchronous payload events via socket bindings. |
| **Next.js Frontend** | HTTP REST & WebSockets | **FastAPI Backend** | Forwards analytical queries and dashboard actions securely to the core processing server. |
| **FastAPI Backend** | Internal Subroutines | **SQLite Database** | Stores incident mappings, event logs, analytical markers, and state histories. |
| **FastAPI Backend** | Object Instantiation | **Intelligence Hub** | Loads and orchestrates domain-specific contextual agents (HR, Exec, Fin, PM) based on parsed intent. |
| **Intelligence Hub** | Direct API Post | **LLM Engine** | Processes aggregated telemetry logic into natural language briefs or parsed metric evaluations. |
| **GitHub / OpenMetadata** | External Webhook | **Webhook Receivers** | Monitors and receives active deployment logs, repository commits, and schema alterations. |
| **Webhook Receivers** | Internal Subroutines | **FastAPI Backend** | Dispatches standard organizational mutations cleanly into centralized tracking databases for live alerts. |
| **FastAPI Backend** | External Client Query | **Jira / GitHub** | Fetches pull requests and asynchronous ticketing pipelines passively or during scheduled standups. |
| **Slack Workspace** | Real-Time Socket Mode | **Slack Bot Layer** | Listens for native team commands across operational channels. |
| **Slack Bot Layer** | Internal Subroutines | **FastAPI Backend** | Executes actionable queries to the hub without exposing public webhook HTTP footprint. |

## Project Structure

The codebase is strictly organized into distinct operational domains:

- /backend/: Core Python FastAPI services.
  - main.py: API entry point and application registry.
  - /ai/: Large Language Model integration and natural language querying logic.
  - /database/: Local database initialization and iosqlite schema models.
  - /integrations/: Access clients bridging Jira and GitHub systems securely.
  - /intelligence/: Agentic workflows dividing parsing logic among domain-specific intelligence agents.
  - /jobs/: Standup runners and automated batch data processors.
  - /slack_bot/: Slack Socket Mode bot routines responding to organizational commands natively.
  - /webhooks/: Designated payload receivers for OpenMetadata mutations and GitHub events.
- /frontend/: Next.js Web Interface.
  - src/app/: Next.js App Router definitions.
  - src/components/: Reusable UI modules, intelligence panels, and mapping visualizations.
  - src/lib/: State wrappers and frontend data fetching interfaces.
- /openmetadata/: Contains localized Docker-Compose configurations for running an OpenMetadata instance locally alongside the application.
- /scripts/: Seed scripts to populate demonstration environments securely.

## Primary Capabilities

1. Multi-Agent Intelligence: Specialized algorithmic agents providing parsed contextual intelligence for distinct corporate roles (Exec, Finance, PM, HR).
2. Live WebSockets: True real-time incident streaming to Next.js clients reflecting instantaneous webhook payload events.
3. ChatOps Automation: Fully integrated Slack application executing operational tasks remotely via Socket Mode.
4. Deep Event Telemetry: Syncs state directly from GitHub commits, OpenMetadata schemas, and Jira tickets.

## Prerequisites

Ensure the following tools are globally accessible within your environment before beginning:
- Node.js (v20.x or higher)
- NPM (v10.x or higher)
- Python (v3.10 to v3.12 series recommended)
- Git version control
- Docker / Docker Compose (strictly for OpenMetadata services)

## Installation Guide

### 1. Services Setup (Docker)

Start the OpenMetadata container services locally:

```bash
docker compose -f openmetadata-docker-compose.yml up -d
```

### 1. External Services Setup (Docker)

Start the OpenMetadata container services for live intelligence mapping:

```bash
docker compose -f openmetadata-docker-compose.yml up -d
```

Ensure OpenMetadata is fully running before using the backend services.

### 2. Backend Setup (FastAPI)

Navigate to the backend module to construct a sandbox virtual environment and deploy the API logic.

````bash
cd backend
python -m venv venv

# On Microsoft Windows environments:
.\venv\Scripts\activate

# On POSIX / Unix environments:
source venv/bin/activate

# Install strictly bound dependencies
pip install -r requirements.txt
```

Boot the FastAPI application:

````bash
uvicorn main:app --reload --port 8000
```

The server instances will map to http://localhost:8000.

### 3. Frontend Setup (Next.js)

Open a separate terminal, navigate to the frontend directory, and resolve Javascript node modules.

````bash
cd frontend
# Execute a clean install logic if node_modules are invalid
npm install
```

Initialize the Turbopack accelerated development runtime:

````bash
npm run dev
```

The standard Next.js broadcast will be reachable at http://localhost:3000.

## Configuration and Secrets

Meridian requires a `.env` initialization file located inside the `backend/` directory to integrate third-party environments securely. 

Create a `.env` file containing the following required connection variables:

```env
# OpenMetadata Core
OPENMETADATA_HOST=http://localhost:8585
OPENMETADATA_JWT_TOKEN=your_jwt_token

# AI/LLM Secrets
OPENAI_API_KEY=your_openai_api_key

# CI/CD and Tracking Integrations
GITHUB_TOKEN=your_github_token
GITHUB_REPO=aditisingh02/meridian
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your_email@domain.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=MER

# ChatOps (Slack)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# Error Observability (Sentry)
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
```

Failure to resolve these keys will temporarily disable affected external integration paths (such as the Slack Listener), though the internal core application and mocked seeding will continue to function on local.

## Deployment Protocol

The frontend enforces strict build compiling checks. Proceed with compilation tests before containerizing or hosting statically.

````bash
cd frontend
npm run build
npm run start
```

For backend staging environments, run the application utilizing Uvicorn explicitly bound to proxy gateways or application hosting configurations.
