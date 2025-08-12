#!/usr/bin/env tsx
/**
 * Ingest Quartz Documentation into Vector Database
 * Processes markdown files and creates embeddings for RAG
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { QuartzRAGSystem } from '../rag/rag-system.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ingestDocumentation() {
  console.log('📚 Starting Quartz documentation ingestion...\n');
  
  const ragSystem = new QuartzRAGSystem();
  
  // Wait a moment for vector store initialization
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Path to Quartz documentation
  const quartzDocsPath = path.join(__dirname, '../../../docs');
  
  console.log(`📁 Documentation path: ${quartzDocsPath}`);
  
  try {
    // Ingest all documentation
    const result = await ragSystem.ingestQuartzDocs(quartzDocsPath);
    
    console.log('\n✅ Ingestion complete!');
    console.log(`📊 Total chunks processed: ${result.count}`);
    
    // Test the ingestion with a sample query
    console.log('\n🧪 Testing retrieval with sample query...');
    const testQuery = 'How do I create a custom plugin in Quartz?';
    const answer = await ragSystem.answer(testQuery);
    
    console.log('\nTest Query:', testQuery);
    console.log('Answer:', answer.answer.substring(0, 200) + '...');
    console.log('Sources:', answer.sources);
    console.log('Confidence:', (answer.confidence * 100).toFixed(1) + '%');
    
    await ragSystem.close();
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    throw error;
  }
}

// Run ingestion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDocumentation()
    .then(() => {
      console.log('\n🎉 Documentation ready for queries!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { ingestDocumentation };