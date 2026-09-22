import { programRagAllowed, VALID_CATEGORIES } from '../../shared/ragDocument';
/**
 * RAG Engine for The Shine Fitness & Yoga
 * Loads vector index, embeds queries, calculates cosine similarity,
 * filters by category & expiry date, and builds grounded prompt context.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface DocMetadata {
  id: string;
  title: string;
  source: string;
  version: string;
  effective_date: string;
  expiry_date: string;
  owner: string;
  category: string;
  review_status?: string;
  content_scope?: string;
}

export interface KBChunk {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
  metadata: DocMetadata;
}

export interface IndexData {
  embeddingModel: string;
  builtAt: string;
  chunks: KBChunk[];
}

export interface RetrievedChunk {
  chunk: KBChunk;
  similarity: number;
}

const EMBEDDING_MODEL = 'gemini-embedding-001';
const MIN_SIMILARITY_THRESHOLD = 0.55;


let cachedIndex: IndexData | null = null;
let isRagAvailable = false;

/**
 * Loads data/knowledge/index.json into memory ONCE at startup.
 * Never throws or crashes the server if missing/corrupted.
 */
export function loadIndex(): { available: boolean; builtAt?: string; chunkCount?: number } {
  try {
    const indexPath = path.join(process.cwd(), 'data', 'knowledge', 'index.json');
    if (!fs.existsSync(indexPath)) {
      console.warn('[RAG WARNING] File index.json không tồn tại tại data/knowledge/index.json. RAG engine bị vô hiệu hóa.');
      cachedIndex = null;
      isRagAvailable = false;
      return { available: false };
    }

    const raw = fs.readFileSync(indexPath, 'utf-8');
    const parsed: IndexData = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.chunks)) {
      console.warn('[RAG WARNING] File index.json bị lỏng lẻo/hỏng định dạng. RAG engine bị vô hiệu hóa.');
      cachedIndex = null;
      isRagAvailable = false;
      return { available: false };
    }

    cachedIndex = parsed;
    isRagAvailable = true;
    console.log(`[RAG ENGINE] Tải thành công index.json (${parsed.chunks.length} chunks, builtAt: ${parsed.builtAt}, model: ${parsed.embeddingModel})`);

    return {
      available: true,
      builtAt: parsed.builtAt,
      chunkCount: parsed.chunks.length
    };
  } catch (err: any) {
    console.warn('[RAG WARNING] Lỗi khi nạp index.json:', err?.message || err);
    cachedIndex = null;
    isRagAvailable = false;
    return { available: false };
  }
}

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getIndexBuiltAt(): string | undefined {
  return cachedIndex?.builtAt;
}

export function getIsRagAvailable(): boolean {
  return isRagAvailable && cachedIndex !== null;
}

/**
 * Retrieves Top-K relevant knowledge chunks for a query
 */
export async function retrieve(
  query: string,
  ai: GoogleGenAI,
  opts?: { intent?: string; topK?: number }
): Promise<RetrievedChunk[]> {
  if (!cachedIndex || !isRagAvailable || !cachedIndex.chunks || cachedIndex.chunks.length === 0) {
    return [];
  }

  const topK = opts?.topK || 4;
  const targetCategory = opts?.intent && (VALID_CATEGORIES as readonly string[]).includes(opts.intent.toUpperCase())
    ? opts.intent.toUpperCase()
    : null;

  if (cachedIndex.embeddingModel && cachedIndex.embeddingModel !== EMBEDDING_MODEL) {
    console.warn(`[RAG WARNING] Model index (${cachedIndex.embeddingModel}) khác model cấu hình (${EMBEDDING_MODEL}). Kết quả cosine similarity có thể sai lệch.`);
  }

  // Embed query
  let queryEmbedding: number[];
  try {
    const res = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: query
    });
    queryEmbedding = (res as any).embeddings?.[0]?.values || (res as any).embedding?.values;
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('[RAG WARNING] Lấy query embedding rỗng từ Gemini API.');
      return [];
    }
  } catch (err: any) {
    console.warn('[RAG WARNING] Lỗi khi tạo query embedding:', err?.message || err);
    return [];
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper score function
  const calculateScores = (filterByCategory: boolean): RetrievedChunk[] => {
    const results: RetrievedChunk[] = [];

    for (const chunk of cachedIndex!.chunks) {
      if (!programRagAllowed(chunk.metadata)) continue;
      // 1. Expiry check
      if (chunk.metadata.expiry_date && chunk.metadata.expiry_date <= todayStr) {
        continue;
      }

      // 2. Category filter
      if (filterByCategory && targetCategory && chunk.metadata.category !== targetCategory) {
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= MIN_SIMILARITY_THRESHOLD) {
        results.push({ chunk, similarity: score });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  };

  // Try retrieving with category filter first if intent specified
  let matches = targetCategory ? calculateScores(true) : calculateScores(false);

  // If filtered search returned 0 matches, fallback ONCE to searching without category filter
  if (matches.length === 0 && targetCategory) {
    console.log(`[RAG INFO] Lọc theo intent '${targetCategory}' không ra kết quả >= ${MIN_SIMILARITY_THRESHOLD}. Thử lại không lọc category...`);
    matches = calculateScores(false);
  }

  return matches.slice(0, topK);
}

/**
 * Formats retrieved chunks into a clean context block for Gemini System Instruction
 */
export function buildContextBlock(retrieved: RetrievedChunk[]): string {
  if (!retrieved || retrieved.length === 0) return '';

  const blocks = retrieved.filter(item => programRagAllowed(item.chunk.metadata)).map((item, idx) => {
    const { metadata, text } = item.chunk;
    return `---
[TÀI LIỆU THAM CHIẾU #${idx + 1}]
- Tên tài liệu: ${metadata.title}
- Nguồn dữ liệu: ${metadata.source}
- Danh mục: ${metadata.category}
- Thời hạn hiệu lực: ${metadata.effective_date} đến ${metadata.expiry_date}
- Độ tương đồng RAG: ${(item.similarity * 100).toFixed(1)}%

NỘI DUNG TÀI LIỆU:
${text}`;
  });

  if (!blocks.length) return '';
  return `============================================================
[KHỐI DỮ LIỆU THAM CHIẾU DÀNH CHO BÀI TOÁN RAG - GROUNDED KNOWLEDGE]
============================================================
${blocks.join('\n\n')}
============================================================`;
}
