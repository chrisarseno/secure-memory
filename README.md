# Nexus System

Full-stack AI ensemble intelligence platform with distributed consciousness monitoring, autonomous learning, and real-time collaboration.

## Features

- **Multi-model ensemble** with intelligent routing and synthesis
- **Consciousness monitoring** with real-time metrics and anomaly detection
- **Autonomous learning** with curriculum-driven education pathways
- **Distributed agent system** for scalable AI orchestration
- **Human-in-the-loop** collaboration with approval workflows
- **Local-first AI** via Ollama with optional OpenAI fallback

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Socket.IO, TanStack Query

**Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL, Pino, Helmet

**AI/ML:** Ollama (local models), OpenAI SDK, custom ensemble intelligence

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with UI |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
client/             React frontend
  src/
    components/     UI components (shadcn/ui)
    hooks/          Custom React hooks
    pages/          Page components
server/             Express backend
  sage/             AI/ML modules
  distributed/      Distributed consciousness
  consciousness/    Consciousness monitoring
  routes.ts         API routes
  auth.ts           Authentication
shared/             Shared types and schemas
  schema.ts         Zod validation
  db-schema.ts      Database schema (Drizzle)
conscious-agents/   Autonomous agent system
tests/              Unit, integration, and e2e tests
```

## Configuration

See [`.env.example`](.env.example) for all configuration options. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption secret |
| `OLLAMA_HOST` | No | Ollama server (default: localhost:11434) |
| `OPENAI_API_KEY` | No | OpenAI fallback key |
| `REDIS_URL` | No | Redis cache URL |

## Documentation

See [`docs/README.md`](docs/README.md) for full architecture documentation, API reference, security details, and deployment guide.

## License

MIT License. See [LICENSE](LICENSE) for details.
