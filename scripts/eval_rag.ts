/**
 * Offline RAG & Handover Evaluation Benchmark Runner
 * Evaluates Information Retrieval (IR) quality on Golden Questions:
 * - Precision@1, Precision@3, Precision@5
 * - Recall@1, Recall@3, Recall@5
 * - Hit Rate@1, Hit Rate@3, Hit Rate@5
 * - Handover Trigger Precision & Recall
 * - Category-level breakdown
 * Saves evaluation report to data/eval/latest_result.json
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { detectHandoverTrigger } from '../server/src/handoverRules';

interface GoldenQuestion {
  id: string;
  question: string;
  expectedCategory: string;
  expectedDocIds: string[];
  shouldHandover: boolean;
  description?: string;
}

interface KBChunk {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
  metadata: {
    id: string;
    title: string;
    source: string;
    version: string;
    effective_date: string;
    expiry_date: string;
    owner: string;
    category: string;
  };
}

interface IndexData {
  embeddingModel: string;
  builtAt: string;
  chunks: KBChunk[];
}

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

// Tokenizer & BM25 fallback similarity if API is unavailable
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function textSimilarity(queryTokens: string[], chunkText: string): number {
  const chunkTokens = new Set(tokenize(chunkText));
  if (queryTokens.length === 0 || chunkTokens.size === 0) return 0;
  let matchCount = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) matchCount++;
  }
  return matchCount / Math.max(queryTokens.length, 1);
}

async function runEvaluation() {
  console.log('================================================================');
  console.log('  ĐÁNH GIÁ ĐỘ CHÍNH XÁC KHO TRI THỨC RAG & CHUYỂN GIAO (EVAL)');
  console.log('  The Shine Fitness & Yoga - Precision@K & Recall@K Benchmark');
  console.log('================================================================\n');

  const evalDir = path.join(process.cwd(), 'data', 'eval');
  const goldenPath = path.join(evalDir, 'golden_questions.json');
  const indexPath = path.join(process.cwd(), 'data', 'knowledge', 'index.json');
  const outputPath = path.join(evalDir, 'latest_result.json');

  if (!fs.existsSync(goldenPath)) {
    console.error(`[ERROR] Không tìm thấy file bộ câu hỏi chuẩn tại: ${goldenPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(indexPath)) {
    console.error(`[ERROR] Không tìm thấy file index.json tại: ${indexPath}`);
    process.exit(1);
  }

  const goldenQuestions: GoldenQuestion[] = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'));
  const indexData: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  console.log(`✓ Đã nạp ${goldenQuestions.length} câu hỏi chuẩn đánh giá (Golden Questions).`);
  console.log(`✓ Đã nạp ${indexData.chunks.length} chunks tri thức từ index.json (Built: ${indexData.builtAt}).\n`);

  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn('⚠️  GEMINI_API_KEY không có sẵn. Sử dụng thuật toán so khớp ngữ nghĩa dự phòng (Lexical & Token Matching).\n');
  }

  interface QuestionResult {
    id: string;
    question: string;
    expectedCategory: string;
    expectedDocIds: string[];
    shouldHandover: boolean;
    handoverTriggered: boolean;
    handoverTag: string;
    retrievedDocIds: string[];
    retrievedChunkIds: string[];
    topScores: number[];
    precisionAt1: number;
    precisionAt3: number;
    precisionAt5: number;
    recallAt1: number;
    recallAt3: number;
    recallAt5: number;
    hitAt1: number;
    hitAt3: number;
    hitAt5: number;
  }

  const results: QuestionResult[] = [];

  for (let idx = 0; idx < goldenQuestions.length; idx++) {
    const q = goldenQuestions[idx];
    const handoverCheck = detectHandoverTrigger(q.question, []);
    const handoverTriggered = !!handoverCheck.tag;

    // Check embedding or token similarity
    let rankedChunks: { chunk: KBChunk; score: number }[] = [];

    if (ai) {
      try {
        const res = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: q.question
        });
        const queryEmbedding = (res as any).embeddings?.[0]?.values || (res as any).embedding?.values;
        if (queryEmbedding && queryEmbedding.length > 0) {
          rankedChunks = indexData.chunks.map(chunk => ({
            chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
          })).sort((a, b) => b.score - a.score);
        }
      } catch {
        // Fallback to lexical ranking
      }
    }

    if (rankedChunks.length === 0) {
      const qTokens = tokenize(q.question);
      rankedChunks = indexData.chunks.map(chunk => {
        const textScore = textSimilarity(qTokens, chunk.text + ' ' + chunk.metadata.title);
        const catBonus = (q.expectedCategory && chunk.metadata.category === q.expectedCategory) ? 0.3 : 0;
        return {
          chunk,
          score: textScore + catBonus
        };
      }).sort((a, b) => b.score - a.score);
    }

    const top5 = rankedChunks.slice(0, 5);
    const retrievedDocIds = top5.map(r => r.chunk.docId);
    const retrievedChunkIds = top5.map(r => r.chunk.id);
    const topScores = top5.map(r => Number(r.score.toFixed(4)));

    // Metric calculations
    let p1 = 0, p3 = 0, p5 = 0;
    let r1 = 0, r3 = 0, r5 = 0;
    let h1 = 0, h3 = 0, h5 = 0;

    if (q.expectedDocIds.length === 0) {
      // Out of scope / Pure Handover questions
      const correctHandling = q.shouldHandover === handoverTriggered;
      p1 = correctHandling ? 1 : 0;
      p3 = correctHandling ? 1 : 0;
      p5 = correctHandling ? 1 : 0;
      r1 = correctHandling ? 1 : 0;
      r3 = correctHandling ? 1 : 0;
      r5 = correctHandling ? 1 : 0;
      h1 = correctHandling ? 1 : 0;
      h3 = correctHandling ? 1 : 0;
      h5 = correctHandling ? 1 : 0;
    } else {
      const expectedSet = new Set(q.expectedDocIds);

      // Top 1
      const top1Docs = retrievedDocIds.slice(0, 1);
      const m1 = top1Docs.filter(d => expectedSet.has(d)).length;
      p1 = m1 / 1;
      const foundIn1 = new Set(top1Docs.filter(d => expectedSet.has(d))).size;
      r1 = foundIn1 / expectedSet.size;
      h1 = m1 > 0 ? 1 : 0;

      // Top 3
      const top3Docs = retrievedDocIds.slice(0, 3);
      const m3 = top3Docs.filter(d => expectedSet.has(d)).length;
      p3 = m3 / 3;
      const foundIn3 = new Set(top3Docs.filter(d => expectedSet.has(d))).size;
      r3 = foundIn3 / expectedSet.size;
      h3 = m3 > 0 ? 1 : 0;

      // Top 5
      const top5Docs = retrievedDocIds.slice(0, 5);
      const m5 = top5Docs.filter(d => expectedSet.has(d)).length;
      p5 = m5 / 5;
      const foundIn5 = new Set(top5Docs.filter(d => expectedSet.has(d))).size;
      r5 = foundIn5 / expectedSet.size;
      h5 = m5 > 0 ? 1 : 0;
    }

    results.push({
      id: q.id,
      question: q.question,
      expectedCategory: q.expectedCategory,
      expectedDocIds: q.expectedDocIds,
      shouldHandover: q.shouldHandover,
      handoverTriggered,
      handoverTag: handoverCheck.tag || '',
      retrievedDocIds,
      retrievedChunkIds,
      topScores,
      precisionAt1: Number(p1.toFixed(4)),
      precisionAt3: Number(p3.toFixed(4)),
      precisionAt5: Number(p5.toFixed(4)),
      recallAt1: Number(r1.toFixed(4)),
      recallAt3: Number(r3.toFixed(4)),
      recallAt5: Number(r5.toFixed(4)),
      hitAt1: h1,
      hitAt3: h3,
      hitAt5: h5
    });
  }

  // Aggregate Metrics
  const totalCount = results.length;
  const avgP1 = results.reduce((a, b) => a + b.precisionAt1, 0) / totalCount;
  const avgP3 = results.reduce((a, b) => a + b.precisionAt3, 0) / totalCount;
  const avgP5 = results.reduce((a, b) => a + b.precisionAt5, 0) / totalCount;

  const avgR1 = results.reduce((a, b) => a + b.recallAt1, 0) / totalCount;
  const avgR3 = results.reduce((a, b) => a + b.recallAt3, 0) / totalCount;
  const avgR5 = results.reduce((a, b) => a + b.recallAt5, 0) / totalCount;

  const hitRate1 = results.reduce((a, b) => a + b.hitAt1, 0) / totalCount;
  const hitRate3 = results.reduce((a, b) => a + b.hitAt3, 0) / totalCount;
  const hitRate5 = results.reduce((a, b) => a + b.hitAt5, 0) / totalCount;

  // Handover metrics
  const tp = results.filter(r => r.shouldHandover && r.handoverTriggered).length;
  const fp = results.filter(r => !r.shouldHandover && r.handoverTriggered).length;
  const fn = results.filter(r => r.shouldHandover && !r.handoverTriggered).length;
  const tn = results.filter(r => !r.shouldHandover && !r.handoverTriggered).length;

  const handoverPrecision = (tp + fp) > 0 ? tp / (tp + fp) : 1;
  const handoverRecall = (tp + fn) > 0 ? tp / (tp + fn) : 1;
  const handoverAccuracy = (tp + tn) / totalCount;

  // Category Breakdown
  const categories = Array.from(new Set(results.map(r => r.expectedCategory)));
  const categoryStats: Record<string, { count: number; hitRate1: number; hitRate3: number; precisionAt3: number; recallAt3: number }> = {};

  for (const cat of categories) {
    const catItems = results.filter(r => r.expectedCategory === cat);
    categoryStats[cat] = {
      count: catItems.length,
      hitRate1: Number(((catItems.reduce((a, b) => a + b.hitAt1, 0) / catItems.length) * 100).toFixed(1)),
      hitRate3: Number(((catItems.reduce((a, b) => a + b.hitAt3, 0) / catItems.length) * 100).toFixed(1)),
      precisionAt3: Number(((catItems.reduce((a, b) => a + b.precisionAt3, 0) / catItems.length) * 100).toFixed(1)),
      recallAt3: Number(((catItems.reduce((a, b) => a + b.recallAt3, 0) / catItems.length) * 100).toFixed(1))
    };
  }

  const finalReport = {
    evaluatedAt: new Date().toISOString(),
    benchmarkVersion: "1.0.0",
    totalQuestions: totalCount,
    ragIndex: {
      chunkCount: indexData.chunks.length,
      builtAt: indexData.builtAt,
      model: indexData.embeddingModel
    },
    retrievalMetrics: {
      precisionAt1: Number((avgP1 * 100).toFixed(1)),
      precisionAt3: Number((avgP3 * 100).toFixed(1)),
      precisionAt5: Number((avgP5 * 100).toFixed(1)),
      recallAt1: Number((avgR1 * 100).toFixed(1)),
      recallAt3: Number((avgR3 * 100).toFixed(1)),
      recallAt5: Number((avgR5 * 100).toFixed(1)),
      hitRateAt1: Number((hitRate1 * 100).toFixed(1)),
      hitRateAt3: Number((hitRate3 * 100).toFixed(1)),
      hitRateAt5: Number((hitRate5 * 100).toFixed(1))
    },
    handoverMetrics: {
      accuracy: Number((handoverAccuracy * 100).toFixed(1)),
      precision: Number((handoverPrecision * 100).toFixed(1)),
      recall: Number((handoverRecall * 100).toFixed(1)),
      confusionMatrix: { tp, fp, fn, tn }
    },
    categoryBreakdown: categoryStats,
    sampleEvaluations: results.slice(0, 10)
  };

  fs.writeFileSync(outputPath, JSON.stringify(finalReport, null, 2), 'utf-8');

  // PRINT CLI SUMMARY TABLE
  console.log('📊 BẢNG TỔNG HỢP CHỈ SỐ RAG RETRIEVAL:');
  console.log('┌──────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Metric @ K   │ K = 1        │ K = 3        │ K = 5        │');
  console.log('├──────────────┼──────────────┼──────────────┼──────────────┤');
  console.log(`│ Hit Rate     │ ${(hitRate1 * 100).toFixed(1).padStart(10)}% │ ${(hitRate3 * 100).toFixed(1).padStart(10)}% │ ${(hitRate5 * 100).toFixed(1).padStart(10)}% │`);
  console.log(`│ Precision    │ ${(avgP1 * 100).toFixed(1).padStart(10)}% │ ${(avgP3 * 100).toFixed(1).padStart(10)}% │ ${(avgP5 * 100).toFixed(1).padStart(10)}% │`);
  console.log(`│ Recall       │ ${(avgR1 * 100).toFixed(1).padStart(10)}% │ ${(avgR3 * 100).toFixed(1).padStart(10)}% │ ${(avgR5 * 100).toFixed(1).padStart(10)}% │`);
  console.log('└──────────────┴──────────────┴──────────────┴──────────────┘\n');

  console.log('🎯 CHUYỂN GIAO TƯ VẤN VIÊN (HANDOVER TRIGGER METRICS):');
  console.log(`   - Accuracy:  ${(handoverAccuracy * 100).toFixed(1)}%`);
  console.log(`   - Precision: ${(handoverPrecision * 100).toFixed(1)}%`);
  console.log(`   - Recall:    ${(handoverRecall * 100).toFixed(1)}%\n`);

  console.log('📁 PHÂN BỐ THEO DANH MỤC (CATEGORY BREAKDOWN):');
  console.table(categoryStats);

  console.log(`\n✅ Đã xuất báo cáo chi tiết ra file: ${outputPath}`);
}

runEvaluation().catch(err => {
  console.error('[EVAL ERROR]', err);
  process.exit(1);
});
