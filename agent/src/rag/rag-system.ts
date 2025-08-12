/**
 * RAG (Retrieval-Augmented Generation) System for Quartz Expert
 * Handles document ingestion, vector storage, and intelligent retrieval
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface RAGConfig {
  postgresConnectionString?: string;
  embeddingModel?: string;
  llmModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface AnswerResult {
  answer: string;
  sources: string[];
  confidence: number;
  contextUsage?: number;
  consistency?: number;
}

export interface ChatResult {
  message: string;
  sessionId: string;
  sources: string[];
  suggestions?: string[];
}

export class QuartzRAGSystem {
  private vectorStore: PGVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;
  private textSplitter: RecursiveCharacterTextSplitter;
  private pool: Pool;
  private config: RAGConfig;

  constructor(config: RAGConfig = {}) {
    this.config = {
      postgresConnectionString: config.postgresConnectionString || process.env.DATABASE_URL || 
        'postgresql://localhost:5432/quartz_expert',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      llmModel: config.llmModel || 'gpt-4-turbo-preview',
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200
    };

    // Initialize OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      modelName: this.config.embeddingModel,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    // Initialize LLM
    this.llm = new ChatOpenAI({
      modelName: this.config.llmModel,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    // Initialize text splitter for chunking documents
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      separators: ['\n\n', '\n', ' ', '']
    });

    // Initialize PostgreSQL connection pool
    this.pool = new Pool({
      connectionString: this.config.postgresConnectionString
    });

    this.initializeVectorStore();
  }

  private async initializeVectorStore() {
    try {
      // Ensure pgvector extension is installed
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Initialize vector store
      this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
        postgresConnectionString: this.config.postgresConnectionString,
        tableName: 'quartz_documents',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'embedding',
          contentColumnName: 'content',
          metadataColumnName: 'metadata'
        }
      });

      console.log('✅ Vector store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  /**
   * Ingest Quartz documentation into the vector store
   */
  async ingestQuartzDocs(docsPath: string): Promise<{ count: number }> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const documents: Document[] = [];
    
    // Read all markdown files from Quartz docs
    const files = await this.getMarkdownFiles(docsPath);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(docsPath, file);
      
      // Parse frontmatter and content
      const { metadata, cleanContent } = this.parseMarkdown(content);
      
      // Create document with metadata
      const doc = new Document({
        pageContent: cleanContent,
        metadata: {
          source: relativePath,
          title: metadata.title || this.extractTitle(cleanContent),
          tags: metadata.tags || [],
          category: this.categorizeDocument(relativePath),
          ...metadata
        }
      });
      
      documents.push(doc);
    }

    // Split documents into chunks
    const chunks = await this.textSplitter.splitDocuments(documents);
    
    // Add chunks to vector store
    await this.vectorStore.addDocuments(chunks);
    
    console.log(`✅ Ingested ${chunks.length} chunks from ${files.length} documents`);
    
    return { count: chunks.length };
  }

  /**
   * Answer a question using RAG
   */
  async answer(question: string, context: any = {}): Promise<AnswerResult> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    // Retrieve relevant documents
    const relevantDocs = await this.vectorStore.similaritySearchWithScore(
      question,
      5 // top 5 most relevant chunks
    );

    if (relevantDocs.length === 0) {
      return {
        answer: "I don't have enough information to answer that question about Quartz.",
        sources: [],
        confidence: 0.1,
        contextUsage: 0,
        consistency: 1
      };
    }

    // Extract sources and content
    const sources = [...new Set(relevantDocs.map(([doc]) => doc.metadata.source))];
    const contextText = relevantDocs
      .map(([doc]) => doc.pageContent)
      .join('\n\n---\n\n');

    // Create prompt
    const prompt = PromptTemplate.fromTemplate(`
You are the Quartz Expert Agent, specialized in the Quartz static site generator.
Use the following context to answer the user's question accurately and helpfully.

Context from Quartz documentation:
{context}

User Question: {question}

Instructions:
1. Answer based on the provided context
2. Be specific and include code examples when relevant
3. Reference specific Quartz features, plugins, or configurations
4. If the context doesn't contain enough information, acknowledge this

Answer:
    `);

    // Generate answer
    const formattedPrompt = await prompt.format({
      context: contextText,
      question: question
    });

    const response = await this.llm.invoke(formattedPrompt);
    
    // Calculate confidence based on relevance scores
    const avgScore = relevantDocs.reduce((sum, [, score]) => sum + score, 0) / relevantDocs.length;
    const confidence = Math.min(avgScore, 1);

    // Estimate context usage
    const contextUsage = Math.min(contextText.length / 8000, 1); // Assuming 8k context window

    return {
      answer: response.content as string,
      sources,
      confidence,
      contextUsage,
      consistency: 0.95 // High consistency for knowledge-based responses
    };
  }

  /**
   * Interactive chat with session management
   */
  async chat(message: string, history: any[] = [], sessionId?: string): Promise<ChatResult> {
    // Build conversation context
    const conversationContext = history
      .map(h => `${h.role}: ${h.content}`)
      .join('\n');

    // Get answer with conversation context
    const result = await this.answer(message, { 
      conversationHistory: conversationContext 
    });

    // Generate follow-up suggestions
    const suggestions = await this.generateSuggestions(message, result.answer);

    return {
      message: result.answer,
      sessionId: sessionId || this.generateSessionId(),
      sources: result.sources,
      suggestions
    };
  }

  /**
   * Search the knowledge base
   */
  async search(query: string, limit: number = 5): Promise<any[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const results = await this.vectorStore.similaritySearchWithScore(query, limit);
    
    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      relevanceScore: score
    }));
  }

  /**
   * Refresh knowledge base by re-ingesting documentation
   */
  async refreshKnowledgeBase(): Promise<{ count: number }> {
    const quartzDocsPath = path.join(__dirname, '../../../docs');
    return await this.ingestQuartzDocs(quartzDocsPath);
  }

  // Helper methods
  
  private async getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files.push(...await this.getMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
    
    return files;
  }

  private parseMarkdown(content: string): { metadata: any; cleanContent: string } {
    // Simple frontmatter parser
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const frontmatter = match[1];
      const metadata: any = {};
      
      // Parse YAML-like frontmatter
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      });
      
      return {
        metadata,
        cleanContent: content.replace(frontmatterRegex, '').trim()
      };
    }
    
    return {
      metadata: {},
      cleanContent: content
    };
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled';
  }

  private categorizeDocument(filepath: string): string {
    if (filepath.includes('plugins')) return 'plugins';
    if (filepath.includes('features')) return 'features';
    if (filepath.includes('configuration')) return 'configuration';
    if (filepath.includes('advanced')) return 'advanced';
    if (filepath.includes('hosting') || filepath.includes('deploy')) return 'deployment';
    return 'general';
  }

  private async generateSuggestions(question: string, answer: string): Promise<string[]> {
    // Generate contextual follow-up suggestions
    const prompt = `Based on this Q&A about Quartz, suggest 3 follow-up questions:
    
Question: ${question}
Answer: ${answer.substring(0, 500)}...

Generate 3 concise follow-up questions:`;

    try {
      const response = await this.llm.invoke(prompt);
      const suggestions = (response.content as string)
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);
      
      return suggestions;
    } catch {
      return [
        "How do I customize the theme?",
        "What plugins are available?",
        "How do I deploy to GitHub Pages?"
      ];
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close() {
    await this.pool.end();
  }
}