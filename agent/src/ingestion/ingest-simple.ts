#!/usr/bin/env tsx
/**
 * Simple Ingestion Test for Quartz Documentation
 * Tests OpenAI connection and document processing without database
 */

import { config } from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testIngestion() {
  console.log('📚 Testing Quartz documentation ingestion...\n');
  
  // Test OpenAI connection
  console.log('🔑 Testing OpenAI API connection...');
  try {
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    // Test with a simple text
    const testEmbedding = await embeddings.embedQuery('Quartz is a static site generator');
    console.log('✅ OpenAI API connected successfully!');
    console.log(`   Embedding dimension: ${testEmbedding.length}`);
  } catch (error: any) {
    console.error('❌ OpenAI API connection failed:', error.message);
    return;
  }
  
  // Process Quartz documentation
  console.log('\n📖 Processing Quartz documentation...');
  const docsPath = path.join(__dirname, '../../../docs');
  
  try {
    const files = await getMarkdownFiles(docsPath);
    console.log(`   Found ${files.length} markdown files`);
    
    // Process first few files as a test
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    let totalChunks = 0;
    for (const file of files.slice(0, 5)) { // Process first 5 files
      const content = await fs.readFile(file, 'utf-8');
      const chunks = await textSplitter.splitText(content);
      totalChunks += chunks.length;
      
      const relativePath = path.relative(docsPath, file);
      console.log(`   ✓ ${relativePath} (${chunks.length} chunks)`);
    }
    
    console.log(`\n✅ Successfully processed ${totalChunks} chunks from documentation`);
    console.log('\n📊 Summary:');
    console.log(`   - Total files found: ${files.length}`);
    console.log(`   - Files processed: 5 (sample)`);
    console.log(`   - Total chunks: ${totalChunks}`);
    console.log(`   - Ready for full ingestion with database`);
    
  } catch (error: any) {
    console.error('❌ Documentation processing failed:', error.message);
  }
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await getMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testIngestion()
    .then(() => {
      console.log('\n🎉 Ingestion test complete!');
      console.log('To run full ingestion, set up PostgreSQL and run: npm run ingest');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { testIngestion };