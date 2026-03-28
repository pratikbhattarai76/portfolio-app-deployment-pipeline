# 🚀 Portfolio Application – Deployment Pipeline

A containerized, Server-Side Rendered (SSR) portfolio application that serves as the public entry point to my self-hosted private cloud infrastructure.

Implements a pull-based CI/CD pipeline using GitHub Actions, GHCR, Docker, and Bash automation on a self-hosted server.

This repository focuses on **application packaging and delivery**, including Dockerization, CI/CD, and integration with a self-hosted deployment environment.

🔗 Live Deployment: [Portfolio](https://web.pratik-labs.xyz)  
⚙️ Infrastructure: [Private Cloud Infrastructure](https://github.com/pratikbhattarai76/private-cloud-infrastructure)

---

## 🏗️ Role in the Architecture

This repository is responsible for the **application layer** of the platform:

- SSR portfolio application built with Astro and Node.js  
- Contact form API endpoint  
- Docker image build and packaging  
- GitHub Actions-based CI pipeline  

Deployment and infrastructure orchestration are handled separately in the infrastructure repository, including:

- Docker Compose orchestration  
- Reverse proxy routing (Nginx Proxy Manager)  
- Cloudflare Tunnel integration  
- Internal container networking  

---

## ⚙️ CI/CD & Deployment Flow

This project implements a **pull-based CI/CD workflow**:

1. Code is pushed to GitHub  
2. GitHub Actions builds the Docker image  
3. Image is published to GitHub Container Registry (GHCR)  
4. A scheduled Bash script running on the server periodically checks for updated images  
5. The script pulls the latest image and conditionally redeploys the service using Docker Compose  

Images are tagged using both `latest` and commit-based tags for traceability and version control.

---

## 🏗️ DevOps & Architectural Highlights

### Multi-Stage Docker Build
Uses a 3-stage Dockerfile to separate dependencies, build process, and runtime environment, resulting in smaller and more secure images.

### Server-Side Rendering (SSR)
The application runs on Node.js using SSR, enabling dynamic routes and backend API functionality (e.g., contact form).

### Health Monitoring
Includes a container-level healthcheck endpoint (`/api/health`) to ensure application availability.

### Runtime Secret Injection
Sensitive values (SMTP credentials) are injected at runtime via environment variables instead of being stored in the image.

### Infrastructure Separation
Application code and infrastructure are decoupled:
- This repo → application + image build  
- Infrastructure repo → deployment + networking  

### Cloud-Native Deployment Style
The app is packaged as a portable container and deployed into a reverse-proxied, tunnel-based private cloud environment.

---

## 🔁 Automated Deployment Script

A Bash script implements pull-based deployment on the self-hosted server.

- Runs on a schedule using cron  
- Checks for updated container images  
- Pulls the latest image from GHCR  
- Compares image versions  
- Recreates the service only when a new image is detected  
- Logs execution output for monitoring and debugging  

---

## 🛠️ Technology Stack

### Application
- Astro  
- TypeScript  
- Tailwind CSS  
- Server-Side Rendering (Node.js)  
- Astro API Routes  
- Nodemailer (SMTP)

### Delivery & Operations
- Docker  
- Docker Compose  
- GitHub Actions  
- GitHub Container Registry (GHCR)  
- Bash (automation script)  

---

## ⚙️ Local Development Setup

```bash
git clone https://github.com/pratikbhattarai76/portfolio-app-deployment-pipeline.git
cd portfolio-app
npm install
cp .env.example .env
npm run dev
```
---

## 📌 Notes
- Infrastructure and deployment environment are managed seperately
- This repository focuses on application build and delivery
- Designed as part of a self-hosted DevOps workflow
