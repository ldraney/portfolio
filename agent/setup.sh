#!/bin/bash

# Quartz Expert Agent Setup Script
# Automates database setup, dependency installation, and initial configuration

set -e

echo "🚀 Quartz Expert Agent Setup"
echo "============================"
echo ""

# Check for required tools
echo "📋 Checking requirements..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js v18+ and try again"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "Please install npm and try again"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed"
    echo "You'll need to set up PostgreSQL manually or install Docker"
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

echo "✅ Requirements checked"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo ""
else
    echo "✅ .env file exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Start PostgreSQL with Docker if available
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Starting PostgreSQL with Docker..."
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Check if PostgreSQL is running
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running"
    else
        echo "❌ PostgreSQL failed to start"
        echo "Check Docker logs: docker-compose logs postgres"
        exit 1
    fi
else
    echo "⚠️  Please ensure PostgreSQL is running on port 5432"
    echo "   Database: quartz_expert"
    echo "   Extension: pgvector"
    echo ""
    read -p "Press Enter when PostgreSQL is ready..."
fi

# Setup database schema
echo ""
echo "🗄️  Setting up database..."
npm run setup:db
echo "✅ Database configured"
echo ""

# Ingest Quartz documentation
echo "📚 Ingesting Quartz documentation..."
echo "This may take a few minutes..."
npm run ingest
echo "✅ Documentation ingested"
echo ""

# Run validation tests
echo "🧪 Running validation tests..."
npm run validate
echo ""

# Display success message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Setup Complete!"
echo ""
echo "To start the Quartz Expert Agent:"
echo "  npm start"
echo ""
echo "To use the CLI:"
echo "  npm run cli"
echo ""
echo "Agent will be available at:"
echo "  http://localhost:3095"
echo ""
echo "API Endpoints:"
echo "  GET  /api/health    - Health check"
echo "  GET  /api/identity  - Agent info"
echo "  POST /api/ask       - Ask questions"
echo "  POST /api/chat      - Interactive chat"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"