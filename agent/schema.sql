-- Quartz Expert Agent Database Schema
-- PostgreSQL with pgvector extension

-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for RAG system
CREATE TABLE IF NOT EXISTS quartz_documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    source VARCHAR(512),
    category VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS quartz_documents_embedding_idx 
ON quartz_documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for metadata queries
CREATE INDEX IF NOT EXISTS quartz_documents_metadata_idx 
ON quartz_documents 
USING gin (metadata);

-- Index for source lookups
CREATE INDEX IF NOT EXISTS quartz_documents_source_idx 
ON quartz_documents (source);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    history JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user sessions
CREATE INDEX IF NOT EXISTS chat_sessions_user_idx 
ON chat_sessions (user_id, last_active DESC);

-- Agent metrics table for CogniCap
CREATE TABLE IF NOT EXISTS agent_metrics (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL,
    context_window_usage FLOAT,
    processing_latency FLOAT,
    error_rate FLOAT,
    semantic_consistency FLOAT,
    cognitive_load_index FLOAT,
    query TEXT,
    response_length INT,
    sources_used INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for metrics queries
CREATE INDEX IF NOT EXISTS agent_metrics_agent_id_idx 
ON agent_metrics (agent_id, timestamp DESC);

-- Index for performance analysis
CREATE INDEX IF NOT EXISTS agent_metrics_performance_idx 
ON agent_metrics (processing_latency, error_rate);

-- Certification records
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(255) NOT NULL,
    certified BOOLEAN DEFAULT FALSE,
    cognicap_score FLOAT,
    theoretical_score FLOAT,
    implementation_score FLOAT,
    overall_score FLOAT,
    test_results JSONB,
    recommendations TEXT[],
    certified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for certification lookups
CREATE INDEX IF NOT EXISTS certifications_agent_idx 
ON certifications (agent_name, certified_at DESC);

-- Knowledge base metadata
CREATE TABLE IF NOT EXISTS knowledge_metadata (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(128),
    source_path TEXT,
    document_count INT,
    chunk_count INT,
    last_ingested TIMESTAMP,
    ingestion_duration_ms INT,
    status VARCHAR(64),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query logs for analysis
CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    query TEXT NOT NULL,
    response TEXT,
    sources TEXT[],
    confidence FLOAT,
    processing_time_ms INT,
    error BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for query analysis
CREATE INDEX IF NOT EXISTS query_logs_session_idx 
ON query_logs (session_id, created_at DESC);

-- Index for error tracking
CREATE INDEX IF NOT EXISTS query_logs_error_idx 
ON query_logs (error, created_at DESC) 
WHERE error = TRUE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_quartz_documents_updated_at 
    BEFORE UPDATE ON quartz_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for recent agent performance
CREATE OR REPLACE VIEW recent_agent_performance AS
SELECT 
    agent_id,
    DATE_TRUNC('hour', to_timestamp(timestamp/1000)) as hour,
    AVG(processing_latency) as avg_latency,
    AVG(error_rate) as avg_error_rate,
    AVG(semantic_consistency) as avg_consistency,
    AVG(cognitive_load_index) as avg_cognitive_load,
    COUNT(*) as query_count
FROM agent_metrics
WHERE timestamp > EXTRACT(EPOCH FROM (NOW() - INTERVAL '24 hours')) * 1000
GROUP BY agent_id, hour
ORDER BY agent_id, hour DESC;

-- View for knowledge base stats
CREATE OR REPLACE VIEW knowledge_base_stats AS
SELECT 
    COUNT(DISTINCT source) as unique_sources,
    COUNT(*) as total_chunks,
    COUNT(DISTINCT category) as categories,
    MAX(created_at) as last_update,
    pg_size_pretty(pg_relation_size('quartz_documents')) as table_size
FROM quartz_documents;

-- Initial data
INSERT INTO knowledge_metadata (source_type, source_path, status)
VALUES ('quartz-docs', '/docs', 'pending')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;