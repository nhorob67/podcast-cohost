/*
  # Add vector search function for RAG

  ## Overview
  Creates a PostgreSQL function to perform similarity search on document chunks
  using cosine distance with pgvector.

  ## New Components
  
  1. Function: match_document_chunks
    - Performs vector similarity search on document_chunks table
    - Parameters: query_embedding (vector), match_count (int), match_threshold (float)
    - Returns: Matching chunks ordered by similarity
    - Uses cosine distance for similarity calculation
*/

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  report_id uuid,
  company text,
  section text,
  chunk_text text,
  abstract text,
  fast_facts text[],
  quote text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.report_id,
    document_chunks.company,
    document_chunks.section,
    document_chunks.chunk_text,
    document_chunks.abstract,
    document_chunks.fast_facts,
    document_chunks.quote,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;