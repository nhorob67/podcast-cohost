import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export class VectorRAGAdapter {
  constructor(supabaseUrl, supabaseKey, openaiKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.sessionCache = new Map();
    this.inMemoryCache = new Map();
  }

  async connect() {
    console.log('RAG adapter initialized (in-memory caching)');
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async fetchRelevantContext(query, sessionId, topK = 5) {
    try {
      const cacheKey = `rag:${sessionId}:${query.substring(0, 50)}`;

      if (this.inMemoryCache.has(cacheKey)) {
        const { data, timestamp } = this.inMemoryCache.get(cacheKey);
        if (Date.now() - timestamp < 300000) {
          console.log('Cache hit for RAG query');
          return data;
        } else {
          this.inMemoryCache.delete(cacheKey);
        }
      }

      const embedding = await this.generateEmbedding(query);

      const { data: chunks, error } = await this.supabase.rpc('match_document_chunks', {
        query_embedding: embedding,
        match_count: topK,
        match_threshold: 0.7,
      });

      if (error) {
        console.error('Vector search error:', error);
        return [];
      }

      const context = chunks.map((chunk) => ({
        company: chunk.company,
        section: chunk.section,
        abstract: chunk.abstract,
        fast_facts: chunk.fast_facts?.slice(0, 3) || [],
        quote: chunk.quote,
      }));

      this.inMemoryCache.set(cacheKey, {
        data: context,
        timestamp: Date.now()
      });

      if (this.inMemoryCache.size > 100) {
        const firstKey = this.inMemoryCache.keys().next().value;
        this.inMemoryCache.delete(firstKey);
      }

      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, []);
      }
      const sessionChunks = this.sessionCache.get(sessionId);
      sessionChunks.push(...chunks.map((c) => c.id));
      if (sessionChunks.length > 50) {
        sessionChunks.splice(0, sessionChunks.length - 50);
      }

      return context;
    } catch (error) {
      console.error('RAG fetch error:', error);
      return [];
    }
  }

  formatContextForPrompt(contextItems) {
    if (!contextItems || contextItems.length === 0) {
      return '';
    }

    const parts = ['\n--- Relevant Context ---'];

    contextItems.forEach((item, idx) => {
      parts.push(`\nSource ${idx + 1}: ${item.company || 'Unknown'} - ${item.section || 'General'}`);
      if (item.abstract) {
        parts.push(`Summary: ${item.abstract}`);
      }
      if (item.fast_facts && item.fast_facts.length > 0) {
        parts.push(`Key Facts:`);
        item.fast_facts.forEach((fact) => parts.push(`  - ${fact}`));
      }
      if (item.quote) {
        parts.push(`Quote: "${item.quote}"`);
      }
    });

    parts.push('--- End of Context ---\n');

    return parts.join('\n');
  }

  clearSessionCache(sessionId) {
    this.sessionCache.delete(sessionId);
  }

  async disconnect() {
    this.inMemoryCache.clear();
    console.log('RAG adapter disconnected');
  }
}
