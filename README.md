<div align="center">

<br/>

```
████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║
   ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║
   ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
```

### Full-Stack Serverless Task Manager · Built on AWS

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=aws-lambda&logoColor=white)](https://aws.amazon.com/lambda)
[![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white)](https://aws.amazon.com/dynamodb)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://terraform.io)

<br/>

[![CI/CD](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/taskflow/deploy.yml?label=CI%2FCD&style=flat-square&logo=github-actions)](https://github.com/YOUR_USERNAME/taskflow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-6366f1?style=flat-square)](CONTRIBUTING.md)

<br/>

**[Live Demo](https://YOUR_CLOUDFRONT_URL)** · **[API Docs](#api-reference)** · **[Setup Guide](#getting-started)**

<br/>

> *A production-ready, cloud-native task manager demonstrating real-world AWS serverless patterns,*
> *type-safe full-stack development, and automated infrastructure deployment.*

</div>

---

<br/>

## About This Project

**TaskFlow** is a full-stack application I built to demonstrate practical cloud development skills in a real product context. Instead of simple CRUD tutorials, this project focuses on patterns that appear in production systems:

- **Stateless JWT authentication** with secure password hashing (PBKDF2 + salt)
- **Serverless REST API** with Lambda functions isolated by domain (auth, tasks, users)
- **Single-table DynamoDB design** with Global Secondary Indexes for efficient querying
- **Global CDN delivery** via CloudFront with proper cache invalidation strategies
- **Infrastructure as Code** — the entire AWS stack can be reproduced with `terraform apply`
- **CI/CD pipeline** that runs type checks, builds, deploys to S3, and updates Lambdas automatically

This is my approach to showing I can build things that *actually work in the cloud* — not just locally.

<br/>

---

## Features

| Feature | Details |
|---|---|
| 🔐 **Auth** | JWT-based login & registration with PBKDF2 password hashing |
| 📋 **Task Management** | Full CRUD with status transitions (Todo → In Progress → Done) |
| 🏷️ **Priorities & Labels** | Filter by HIGH / MEDIUM / LOW · Custom color-coded labels |
| 🔍 **Search & Filter** | Client-side search + server-side query params on the API |
| ☁️ **Serverless** | Zero servers to manage · Auto-scales · Pay-per-request billing |
| 🌐 **Global CDN** | CloudFront edge delivery from 400+ locations worldwide |
| 🏗️ **IaC** | Complete Terraform config · Reproducible in under 10 minutes |
| 🔄 **CI/CD** | Auto-deploy to AWS on every push to `main` via GitHub Actions |

<br/>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            USER (Browser)                                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    AWS CloudFront  (CDN · Global Edge)                   │
│                                                                          │
│   ┌──────────────────────────────────┐    ┌─────────────────────────┐   │
│   │   AWS S3  (Static Hosting)       │    │  Origin: API Gateway    │   │
│   │   Next.js static export          │    │  /api/* → proxy pass    │   │
│   │   HTML · CSS · JS · Assets       │    └────────────┬────────────┘   │
│   └──────────────────────────────────┘                 │                │
└────────────────────────────────────────────────────────┼────────────────┘
                                                         │ REST
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    AWS API Gateway  (REST API)                           │
│                                                                          │
│   POST /auth/register  ──►  Lambda: taskflow-auth                       │
│   POST /auth/login     ──►  Lambda: taskflow-auth                       │
│   GET  /tasks          ──►  Lambda: taskflow-tasks   (JWT required)     │
│   POST /tasks          ──►  Lambda: taskflow-tasks   (JWT required)     │
│   PUT  /tasks/{id}     ──►  Lambda: taskflow-tasks   (JWT required)     │
│   DELETE /tasks/{id}   ──►  Lambda: taskflow-tasks   (JWT required)     │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
     ┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
     │   DynamoDB      │  │  IAM Roles  │  │   CloudWatch     │
     │  taskflow-tasks │  │  Least priv │  │  Logs & Metrics  │
     │  taskflow-users │  │  per Lambda │  │  Error alerts    │
     └─────────────────┘  └─────────────┘  └──────────────────┘
```

### Why This Architecture?

| Decision | Reasoning |
|---|---|
| **Lambda over EC2** | No idle server costs · Scales to 0 · Each function has one responsibility |
| **DynamoDB over RDS** | Serverless-native · No VPC needed · Pay-per-request = $0 at low traffic |
| **S3 + CloudFront** | Eliminates server-rendered hosting costs · Global latency < 50ms |
| **Terraform** | Entire infra is version-controlled · Team can reproduce it in minutes |
| **JWT over sessions** | Stateless = Lambda-compatible · No shared session store needed |

<br/>

---

## Tech Stack

**Frontend**
- **Next.js 14** — App Router, static export
- **TypeScript 5** — Strict mode, full type coverage
- **Tailwind CSS** — Utility-first styling
- **TanStack Query** — Server state management
- **jose** — JWT decode / token management
- **js-cookie** — Secure cookie storage

**Backend & Cloud**
- **AWS Lambda** — Node.js 20 runtime
- **AWS API Gateway** — REST API + CORS
- **AWS DynamoDB** — NoSQL, on-demand billing
- **AWS S3** — Static asset hosting
- **AWS CloudFront** — Global CDN
- **AWS IAM** — Least-privilege roles
- **Terraform** — Infrastructure as Code
- **GitHub Actions** — CI/CD pipeline

<br/>

---

## Project Structure

```
taskflow/
│
├── frontend/                       # Next.js 14 Application
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx      # Login with JWT
│   │   │   └── register/page.tsx   # User registration
│   │   ├── dashboard/page.tsx      # Main Kanban board
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                     # Button, Input, Badge, Modal
│   │   ├── layout/                 # Header, Sidebar
│   │   └── tasks/                  # TaskCard, TaskForm, FilterBar
│   ├── lib/
│   │   ├── api.ts                  # Typed API client → API Gateway
│   │   └── auth.ts                 # Token helpers
│   ├── types/index.ts              # All TypeScript interfaces
│   ├── next.config.js
│   └── package.json
│
├── backend/                        # AWS Lambda Functions
│   ├── lambdas/
│   │   ├── auth/handler.ts         # POST /auth/login + /register
│   │   └── tasks/handler.ts        # CRUD /tasks + /tasks/:id
│   ├── shared/
│   │   ├── db.ts                   # DynamoDB client singleton
│   │   ├── jwt.ts                  # JWT sign/verify helpers
│   │   └── response.ts             # HTTP response builders
│   ├── tsconfig.json
│   └── package.json
│
├── infrastructure/                 # Terraform IaC
│   ├── main.tf                     # All AWS resources
│   ├── variables.tf
│   ├── outputs.tf
│   └── environments/dev/           # Dev environment values
│
├── .github/
│   └── workflows/deploy.yml        # Full CI/CD pipeline
│
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

<br/>

---

## Getting Started

### Prerequisites

```bash
node --version    # >= 18.0.0
terraform version # >= 1.5.0
aws --version     # >= 2.0 (configured with credentials)
```

> **AWS Free Tier:** Designed to run within Free Tier limits.
> DynamoDB (25GB), Lambda (1M req/mo), S3 (5GB), CloudFront (1TB/mo) are all free.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Install dependencies

```bash
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Fill in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_APP_NAME=TaskFlow
```

Fill in `backend/.env` (for local dev):
```env
JWT_SECRET=your-secret-must-be-at-least-32-characters-long
AWS_REGION=us-east-1
TASKS_TABLE=taskflow-tasks-dev
USERS_TABLE=taskflow-users-dev
```

### 4. Deploy AWS Infrastructure

```bash
cd infrastructure
terraform init
terraform plan -var="jwt_secret=your-secret-here"
terraform apply -var="jwt_secret=your-secret-here"

# Note the outputs — set these as GitHub Secrets:
# api_gateway_url · s3_bucket_name · cloudfront_distribution_id
```

### 5. Run locally

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev   # → http://localhost:3000

# Terminal 2 — Backend
cd backend && npm run dev    # → http://localhost:3001
```

<br/>

---

## CI/CD Pipeline

Every push to `main` triggers automatic deployment:

```
git push origin main
        │
        ▼
[1] Lint & TypeScript check
        │
   ┌────┴────┐
   ▼         ▼
[2] Deploy   [3] Deploy
 Frontend     Backend
 Next.js      Lambdas
 → S3         → Lambda
 → CloudFront   update
 invalidation
   └────┬────┘
        ▼
[4] Summary in GitHub UI
```

### Required GitHub Secrets

Go to **Settings → Secrets → Actions**:

| Secret | How to get it |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `API_GATEWAY_URL` | `terraform output api_gateway_url` |
| `S3_BUCKET_NAME` | `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` |
| `JWT_SECRET` | `openssl rand -hex 32` |

<br/>

---

## API Reference

All task endpoints require: `Authorization: Bearer <token>`

### Auth

```http
POST /auth/register
{ "name": "Jane", "email": "jane@test.com", "password": "secret123" }
→ 201 { "token": "eyJ...", "user": { "id", "email", "name" } }

POST /auth/login
{ "email": "jane@test.com", "password": "secret123" }
→ 200 { "token": "eyJ...", "user": { ... } }
```

### Tasks

```http
GET    /tasks?priority=HIGH&status=TODO  → 200 { "data": [...] }
POST   /tasks                            → 201 { "data": { task } }
PUT    /tasks/{id}  { "status": "DONE" } → 200 { "data": { task } }
DELETE /tasks/{id}                       → 200 { "message": "deleted" }
```

<br/>

---

## Database Design

DynamoDB single-table with GSI access patterns:

```
Table: taskflow-tasks
PK: id (UUID)

GSI: userId-createdAt-index
  hash_key:  userId     → get all tasks for a user
  range_key: createdAt  → sorted newest-first

Table: taskflow-users
PK: id (UUID)

GSI: email-index
  hash_key: email       → lookup user by email on login
```

<br/>

---

## Security

- Passwords hashed with **PBKDF2** (10,000 iterations + random 256-bit salt per user)
- **JWT tokens** expire in 7 days, signed with HS256
- **IAM roles** — least-privilege: each Lambda only accesses its own DynamoDB tables
- **HTTPS everywhere** — CloudFront enforces redirect from HTTP
- **User isolation** — every DynamoDB query includes `userId` condition
- **No secrets in code** — all sensitive values via environment variables

<br/>

---

## What I Learned

This project took me from knowing AWS basics to deploying a real serverless application.

**AWS & Cloud:**
- Designing IAM policies with least-privilege (not `AdministratorAccess`)
- DynamoDB access patterns and why GSIs matter for query efficiency
- CloudFront cache behaviors and invalidation strategies
- API Gateway + Lambda proxy integration

**Full-Stack:**
- TypeScript strict mode across frontend and backend with shared types
- JWT authentication without a dedicated auth service
- Next.js static export and its limitations

**DevOps:**
- Terraform that others can actually run, not just works-on-my-machine
- GitHub Actions multi-job pipelines with job dependencies
- Making CI fail fast: lint → type-check → build → deploy

<br/>

---

## Roadmap

- [ ] Unit tests with Jest (Lambda handlers)
- [ ] E2E tests with Playwright
- [ ] Real-time updates via WebSockets (API Gateway + Lambda)
- [ ] Task due dates with email reminders (AWS SES)
- [ ] Multi-workspace support

<br/>

---

## License

MIT © [Your Name](https://github.com/YOUR_USERNAME)

---

<div align="center">

**Built with ☁️ and ⚡ by a junior developer who wanted to go beyond tutorials**

*Recruiter? Let's connect!*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/YOUR_PROFILE)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-6366f1?style=for-the-badge&logo=vercel)](https://YOUR_PORTFOLIO)

</div>
