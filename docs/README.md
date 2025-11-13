# NEXUS System Documentation

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [Development](#development)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [Security](#security)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm or yarn
- (Optional) Ollama for local AI models

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nexus-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_db

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)

Optional:
- `OPENAI_API_KEY` - OpenAI API key (for external AI fallback)
- `OLLAMA_HOST` - Ollama server endpoint (default: http://localhost:11434)
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Session secret for authentication
- `LOG_LEVEL` - Logging level (default: info)

## Architecture

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for UI components
- TanStack Query for server state
- Socket.IO for real-time updates

**Backend:**
- Node.js with Express
- TypeScript
- Drizzle ORM with PostgreSQL
- Socket.IO for WebSockets
- Pino for structured logging
- Helmet for security headers
- Express Rate Limit for API protection

**AI/ML:**
- Local AI support (Ollama, LlamaCpp)
- OpenAI SDK for external models
- Custom ensemble intelligence system

### Project Structure

```
nexus-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
│   └── index.html
├── server/                 # Express backend
│   ├── sage/              # AI/ML modules
│   ├── distributed/       # Distributed consciousness
│   ├── consciousness/     # Consciousness modules
│   ├── routes.ts          # API routes
│   ├── auth.ts            # Authentication
│   └── index.ts           # Server entry point
├── shared/                # Shared code
│   ├── schema.ts          # Zod validation schemas
│   └── db-schema.ts       # Database schemas
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                  # Documentation

## Development

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# TypeScript type checking
npm run check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Use conventional commit messages

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if using drizzle-kit migrate)
npx drizzle-kit generate:pg
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Unit tests go in `tests/unit/`
- Integration tests go in `tests/integration/`
- E2E tests go in `tests/e2e/`

Example unit test:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });
});
```

## Deployment

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure `DATABASE_URL` for production database
3. Set strong `SESSION_SECRET`
4. Enable HTTPS
5. Configure CORS for your domain

### CI/CD

GitHub Actions workflows are configured for:
- Continuous Integration (`.github/workflows/ci.yml`)
- Deployment (`.github/workflows/deploy.yml`)

## API Reference

### Authentication

All protected endpoints require session-based authentication.

**Login:**
```
POST /api/auth/verify-username
Body: { username: string }
```

**Logout:**
```
POST /api/auth/logout
```

**Get Current User:**
```
GET /api/auth/user
```

### Health Checks

**Health:**
```
GET /health
Response: { status: "ok", uptime: number, timestamp: string }
```

**Readiness:**
```
GET /ready
Response: { status: "ready", checks: {...} }
```

### Consciousness Modules

**Get All Modules:**
```
GET /api/modules
```

**Get Module by ID:**
```
GET /api/modules/:id
```

**Update Module (Protected):**
```
PATCH /api/modules/:id
Headers: Cookie (session)
Body: { status?, integrationLevel?, load?, ... }
```

### System Metrics

**Get Latest Metrics:**
```
GET /api/metrics
```

**Get Metrics History:**
```
GET /api/metrics/history?hours=24
```

For complete API documentation, see [API.md](./API.md)

## Security

### Security Features Implemented

✅ **Authentication & Authorization**
- Session-based authentication
- Protected API endpoints
- Rate limiting on auth endpoints (5 attempts per 15 minutes)

✅ **Security Headers**
- Helmet middleware with CSP
- HSTS, X-Frame-Options, etc.

✅ **Rate Limiting**
- API endpoints: 100 requests per 15 minutes per IP
- Auth endpoints: 5 attempts per 15 minutes per IP

✅ **Input Validation**
- Zod schema validation on all POST/PATCH endpoints
- Request size limits (10MB)

✅ **Logging & Monitoring**
- Structured logging with Pino
- Health check endpoints
- Error tracking

### Best Practices

1. **Never commit secrets** - Use environment variables
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Use HTTPS in production**
4. **Validate all user input**
5. **Implement proper error handling**
6. **Monitor logs for suspicious activity**

### Reporting Security Issues

If you discover a security vulnerability, please email security@example.com

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](../LICENSE) file for details
