# 🌿 Green Estoque API

> REST API for inventory management of a solar panel store — built with NestJS, Prisma and PostgreSQL.

---

## 📋 Overview

**Green Estoque API** is the back-end service powering the Green Estoque inventory management system, purpose-built for solar panel retail businesses.

### Core Features

- **Product Management** — Full CRUD for products, including categories, pricing and stock levels.
- **Inventory Control** — Track stock entries and exits with movement history and real-time quantity updates.
- **Reports** — Generate inventory snapshots and movement summaries for better business decisions.
- **User Management** — Role-based user administration (admin / operator).
- **Authentication** — Secure login and session control via JWT tokens.
- **API Documentation** — Interactive Swagger UI available at `/api/docs`.

---

## 🛠️ Stack

### Code
| Layer | Technology |
|---|---|
| Runtime | [Node.js](https://nodejs.org/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Framework | [NestJS v11](https://nestjs.com/) |
| Validation | [Zod](https://zod.dev/) + [nestjs-zod](https://github.com/risenforces/nestjs-zod) + [class-validator](https://github.com/typestack/class-validator) |
| API Docs | [Swagger / OpenAPI](https://swagger.io/) (`@nestjs/swagger`) |

### Tests
| Tool | Purpose |
|---|---|
| [Vitest](https://vitest.dev/) | Unit & integration test runner |
| [Supertest](https://github.com/ladjs/supertest) | HTTP end-to-end testing |
| `@nestjs/testing` | NestJS module test utilities |
| `@vitest/coverage-v8` | Code coverage reports |

> 🤖 **Agile Vibe Coding with Antigravity** — Development was accelerated with AI-assisted pair programming using [Antigravity](https://deepmind.google), enabling rapid iteration on features, tests and architecture decisions.

### Database
| Tool | Details |
|---|---|
| [PostgreSQL 16](https://www.postgresql.org/) | Primary relational database |
| [Prisma ORM](https://www.prisma.io/) | Schema management, migrations and query builder |

### Infrastructure
| Tool | Details |
|---|---|
| [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) | Local development database containers |
| [Vercel](https://vercel.com/) | Serverless API deployment |
| GitHub Actions | CI pipeline (lint, test, build) |

---

## 🔒 Security

Authentication is handled via **JWT (JSON Web Tokens)** in combination with **Passport.js**:

- **`POST /auth/login`** — Validates credentials using `passport-local` and returns a signed JWT.
- **Protected routes** — Secured with a JWT guard (`passport-jwt`) that validates the `Authorization: Bearer <token>` header on every request.
- **Password hashing** — User passwords are hashed with `bcryptjs` before being stored.
- **Role-based access** — Route-level guards enforce role permissions (e.g., admin-only endpoints).

---

## 🚀 How to Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [npm](https://www.npmjs.com/)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-org/green-estoque-api.git
cd green-estoque-api
```

**2. Set up environment variables**
```bash
cp .env.example .env
# Edit .env and fill in the required values
```

**3. Start the database containers**
```bash
docker-compose up -d
```

**4. Install dependencies**
```bash
npm install
```

**5. Run database migrations**
```bash
npm run db:migrate
```

**6. (Optional) Seed the database**
```bash
npm run db:seed
```

**7. Start the development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`.  
Swagger documentation: `http://localhost:3001/api/docs`.

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## 🌐 Production

The production API is deployed on **Vercel** and publicly accessible at:

```
https://green-estoque-api.vercel.app
```

Swagger documentation (production):
```
https://green-estoque-api.vercel.app/api/docs
```

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, copy, modify, merge, publish, distribute, sublicense and/or sell copies of this software, provided that the original copyright notice and this permission notice are included in all copies or substantial portions of the software.

See the [LICENSE](./LICENSE) file for full details.
