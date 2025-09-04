# NEXUS System Setup Requirements

## System Requirements

### Runtime Environment
- **Node.js >= 18.0.0** - JavaScript runtime for the application
- **PostgreSQL >= 13.0** - Primary database for data persistence

### Optional Local AI Integration
- **Ollama** - For local language model hosting
- **Jan AI** - For local model management and execution

### Development Dependencies
- npm or yarn package manager
- Git (for version control)

## Installation Guide

### 1. Node.js Installation
```bash
# Verify current version
node --version

# Should be version 18 or higher
# If not installed, download from: https://nodejs.org/
```

### 2. PostgreSQL Installation
```bash
# Install PostgreSQL (varies by OS)
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: Download from postgresql.org

# Create database
createdb nexus_db

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/nexus_db"
```

### 3. Project Setup
```bash
# Clone or download the project
git clone <repository-url>
cd nexus-project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env file with your database URL and any API keys

# Start development server
npm run dev
```

### 4. Local AI Models (Optional)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install some models
ollama pull llama2
ollama pull codellama

# Install Jan (download from jan.ai)
# Models will be automatically detected when running locally
```

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_db
OLLAMA_HOST=http://localhost:11434  # Optional: Custom Ollama endpoint
OPENAI_API_KEY=your_key_here        # Optional: For OpenAI integration
```

## Verification

After setup, verify everything works:
```bash
# Check Node.js
node --version

# Check PostgreSQL
psql --version

# Check Ollama (if installed)
ollama list

# Start the application
npm run dev
```

The application will run at `http://localhost:5000` with full local model detection capabilities.