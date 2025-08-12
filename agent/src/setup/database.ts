#!/usr/bin/env tsx
/**
 * Database Setup for Quartz Expert Agent
 * Creates PostgreSQL database with pgvector extension
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

config();

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';
  
  console.log('🔧 Setting up Quartz Expert database...\n');
  
  const pool = new Pool({ connectionString });
  
  try {
    // Create database if it doesn't exist
    console.log('Creating database...');
    await pool.query(`
      SELECT 'CREATE DATABASE quartz_expert'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'quartz_expert')
    `);
    
    // Connect to the new database
    const dbPool = new Pool({
      connectionString: connectionString.replace(/\/[^/]*$/, '/quartz_expert')
    });
    
    // Install pgvector extension
    console.log('Installing pgvector extension...');
    await dbPool.query('CREATE EXTENSION IF NOT EXISTS vector');
    
    // Create documents table for vector storage
    console.log('Creating documents table...');
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quartz_documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for vector similarity search
    console.log('Creating vector index...');
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS quartz_documents_embedding_idx 
      ON quartz_documents 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);
    
    // Create sessions table for chat history
    console.log('Creating sessions table...');
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        history JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create metrics table for CogniCap
    console.log('Creating metrics table...');
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS agent_metrics (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255),
        timestamp BIGINT,
        context_window_usage FLOAT,
        processing_latency FLOAT,
        error_rate FLOAT,
        semantic_consistency FLOAT,
        cognitive_load_index FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for metrics queries
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS agent_metrics_agent_id_idx 
      ON agent_metrics (agent_id, timestamp DESC)
    `);
    
    console.log('\n✅ Database setup complete!');
    console.log('\nDatabase Details:');
    console.log('- Name: quartz_expert');
    console.log('- Vector Extension: pgvector');
    console.log('- Tables: quartz_documents, chat_sessions, agent_metrics');
    console.log('- Ready for document ingestion');
    
    await dbPool.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { setupDatabase };