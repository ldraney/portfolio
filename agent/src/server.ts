#!/usr/bin/env tsx
/**
 * Quartz Expert Agent Server
 * AI agent specialized in Quartz static site generator
 * Implements Universal Protocol for agent communication
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { QuartzRAGSystem } from './rag/rag-system.js';
import { CogniCapMonitor } from './monitoring/cognicap.js';
import { UniversalProtocol } from './protocol/universal.js';

config();

const app = express();
const PORT = process.env.PORT || 3095;

// Initialize systems
const ragSystem = new QuartzRAGSystem();
const cognicap = new CogniCapMonitor('quartz-expert');
const protocol = new UniversalProtocol();

app.use(cors());
app.use(express.json());

// ===========================
// Universal Protocol Endpoints
// ===========================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'quartz-expert-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Identity endpoint - describes agent capabilities
app.get('/api/identity', (req, res) => {
  res.json({
    name: 'Quartz Expert',
    type: 'knowledge-expert',
    domain: 'quartz-static-site-generator',
    version: '1.0.0',
    capabilities: [
      'quartz-configuration',
      'plugin-development',
      'theme-customization',
      'obsidian-integration',
      'deployment-guidance',
      'troubleshooting',
      'performance-optimization',
      'content-migration'
    ],
    knowledge_base: {
      source: 'Quartz v4 Documentation',
      last_updated: new Date().toISOString(),
      vector_store: 'postgresql-pgvector',
      embedding_model: 'text-embedding-3-small'
    },
    api_endpoints: [
      'GET /api/health',
      'GET /api/identity',
      'GET /api/hello',
      'POST /api/ask',
      'POST /api/chat',
      'GET /api/capabilities',
      'GET /api/metrics',
      'POST /api/validate'
    ]
  });
});

// Hello endpoint - friendly greeting
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello! I'm the Quartz Expert Agent 🌱",
    description: "I specialize in Quartz static site generator - helping you build and deploy digital gardens",
    expertise: [
      "Setting up Quartz from scratch",
      "Customizing themes and layouts",
      "Creating custom plugins",
      "Obsidian integration",
      "Deployment strategies",
      "Performance optimization"
    ],
    ready: true
  });
});

// ===========================
// Core Agent Functionality
// ===========================

// Main question-answering endpoint
app.post('/api/ask', async (req, res) => {
  const { question, context = {} } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // Track cognitive metrics
    const startTime = Date.now();
    
    // Get answer from RAG system
    const result = await ragSystem.answer(question, context);
    
    // Record metrics for CogniCap
    await cognicap.recordMetric({
      agentId: 'quartz-expert',
      timestamp: Date.now(),
      processingLatency: Date.now() - startTime,
      contextWindowUsage: result.contextUsage || 0.5,
      errorRate: 0,
      semanticConsistency: result.consistency || 0.95,
      cognitiveLoadIndex: 0
    });
    
    res.json({
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    console.error('Error processing question:', error);
    
    // Record error metric
    await cognicap.recordMetric({
      agentId: 'quartz-expert',
      timestamp: Date.now(),
      processingLatency: Date.now() - startTime,
      contextWindowUsage: 0,
      errorRate: 1,
      semanticConsistency: 0,
      cognitiveLoadIndex: 1
    });
    
    res.status(500).json({ 
      error: 'Failed to process question',
      details: error.message 
    });
  }
});

// Interactive chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, history = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await ragSystem.chat(message, history, sessionId);
    
    res.json({
      response: response.message,
      sessionId: response.sessionId,
      sources: response.sources,
      suggestions: response.suggestions
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// List agent capabilities
app.get('/api/capabilities', (req, res) => {
  res.json({
    capabilities: {
      configuration: {
        description: "Help with quartz.config.ts setup",
        examples: [
          "How do I configure a custom theme?",
          "What are the available plugin options?",
          "How to set up analytics?"
        ]
      },
      plugins: {
        description: "Plugin development and customization",
        examples: [
          "How do I create a custom transformer?",
          "How to modify the backlinks plugin?",
          "Creating a new emitter plugin"
        ]
      },
      deployment: {
        description: "Deployment and hosting guidance",
        examples: [
          "Deploy to GitHub Pages",
          "Setting up custom domain",
          "CI/CD pipeline configuration"
        ]
      },
      troubleshooting: {
        description: "Debug and fix common issues",
        examples: [
          "Build errors",
          "Plugin conflicts",
          "Performance problems"
        ]
      },
      migration: {
        description: "Content migration from other platforms",
        examples: [
          "Migrating from Obsidian",
          "Import from Notion",
          "Converting from Jekyll"
        ]
      }
    }
  });
});

// ===========================
// Monitoring & Metrics
// ===========================

// Get agent metrics (CogniCap integration)
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await cognicap.getMetrics('quartz-expert');
    const report = await cognicap.generateReport('quartz-expert');
    
    res.json({
      metrics,
      report,
      status: metrics.cognitiveLoadIndex < 0.7 ? 'optimal' : 'degraded'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Validation endpoint for agent-trainer
app.post('/api/validate', async (req, res) => {
  const { testType, testData } = req.body;
  
  try {
    let result;
    
    switch (testType) {
      case 'cognicap':
        result = await protocol.validateCogniCap(testData);
        break;
      case 'theoretical':
        result = await protocol.validateTheoretical(testData, ragSystem);
        break;
      case 'implementation':
        result = await protocol.validateImplementation(testData, ragSystem);
        break;
      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }
    
    res.json({ 
      testType,
      passed: result.passed,
      score: result.score,
      details: result.details
    });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

// ===========================
// Knowledge Base Management
// ===========================

// Refresh knowledge base from Quartz docs
app.post('/api/knowledge/refresh', async (req, res) => {
  try {
    const result = await ragSystem.refreshKnowledgeBase();
    res.json({
      success: true,
      documentsProcessed: result.count,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh knowledge base' });
  }
});

// Search knowledge base
app.post('/api/knowledge/search', async (req, res) => {
  const { query, limit = 5 } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const results = await ragSystem.search(query, limit);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║              Quartz Expert Agent                       ║
║                                                        ║
║  Specialized in Quartz Static Site Generator          ║
║  Digital Gardens & Documentation Systems              ║
║                                                        ║
║  Server:       http://localhost:${PORT}                    ║
║  Health:       http://localhost:${PORT}/api/health         ║
║  Identity:     http://localhost:${PORT}/api/identity        ║
║  Ask:          http://localhost:${PORT}/api/ask            ║
║                                                        ║
║  Universal Protocol: ✅ Enabled                        ║
║  RAG System:        ✅ Ready                          ║
║  CogniCap Monitor:  ✅ Active                         ║
║                                                        ║
║  Ready to answer questions about Quartz! 🌱           ║
╚════════════════════════════════════════════════════════╝
  `);
});