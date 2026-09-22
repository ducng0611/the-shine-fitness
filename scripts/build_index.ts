/**
 * Knowledge Base Index Builder for The Shine Fitness & Yoga
 * Parses Markdown files in data/knowledge/*.md, validates metadata,
 * splits into semantic chunks, generates vector embeddings using Gemini API,
 * and exports data/knowledge/index.json.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, chunkDocument, programRagAllowed, type DocMetadata } from '../shared/ragDocument';
export { parseFrontmatter, chunkDocument } from '../shared/ragDocument';
interface KBChunk { id:string; docId:string; text:string; embedding:number[]; metadata:DocMetadata }
interface IndexFileStructure { embeddingModel:string; builtAt:string; chunks:KBChunk[] }

async function buildIndex() {
  const startTime = Date.now();
  console.log('=== BẮT ĐẦU BUILD RAG KNOWLEDGE INDEX ===');

  const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge');
  if (!fs.existsSync(knowledgeDir)) {
    console.error(`[ERROR] Thư mục ${knowledgeDir} không tồn tại.`);
    process.exit(1);
  }

  const files = fs.readdirSync(knowledgeDir)
    .filter(f => f.endsWith('.md'))
    .sort(); // Deterministic file order

  if (files.length === 0) {
    console.error(`[ERROR] Không tìm thấy file Markdown nào trong ${knowledgeDir}`);
    process.exit(1);
  }

  if (process.argv.includes('--check')) {
    const documents = files.map(filename => {
      const parsed=parseFrontmatter(fs.readFileSync(path.join(knowledgeDir,filename),'utf-8'),filename);
      const chunks=chunkDocument(parsed.body);
      return {file:filename,category:parsed.metadata.category,chunks:chunks.length,
        minimum:Math.min(...chunks.map(c=>c.length)),maximum:Math.max(...chunks.map(c=>c.length)),
        retrievalAllowed:programRagAllowed(parsed.metadata)};
    });
    console.log(JSON.stringify({mode:'kiểm tra ngoại tuyến',databaseWrites:0,embeddingCalls:0,documents},null,2));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[ERROR] Thiếu biến môi trường GEMINI_API_KEY để gọi embedding API.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const EMBEDDING_MODEL = 'gemini-embedding-001';
  const todayStr = new Date().toISOString().split('T')[0];

  const allChunks: KBChunk[] = [];
  let filesProcessed = 0;
  let totalChunksCreated = 0;
  let skippedExpiredChunks = 0;

  for (const filename of files) {
    const filePath = path.join(knowledgeDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(content, filename);
    filesProcessed++;

    if (!programRagAllowed(metadata)) {
      console.log(`[SKIP REVIEW] ${filename}: bản tham chiếu chưa được duyệt làm tổng quan công khai.`);
      continue;
    }

    // Check expiry
    if (metadata.expiry_date <= todayStr) {
      console.log(`[SKIP EXPIRED] File ${filename} đã hết hạn (${metadata.expiry_date} < ${todayStr})`);
      const rawChunks = chunkDocument(body);
      skippedExpiredChunks += rawChunks.length;
      continue;
    }

    const docChunks = chunkDocument(body);
    console.log(`[PROCESS] File ${filename} (${metadata.category}) -> ${docChunks.length} chunks`);

    let chunkIdx = 1;
    for (const chunkText of docChunks) {
      totalChunksCreated++;
      const chunkId = `${metadata.id}-chunk-${chunkIdx++}`;

      // Call Gemini Embedding API
      try {
        const response = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: chunkText
        });

        const embeddingValues = (response as any).embeddings?.[0]?.values || (response as any).embedding?.values;
        if (!embeddingValues || embeddingValues.length === 0) {
          throw new Error('API embedding trả về mảng rỗng');
        }

        allChunks.push({
          id: chunkId,
          docId: metadata.id,
          text: chunkText,
          embedding: embeddingValues,
          metadata
        });

        // Delay 150ms between requests to respect rate limits
        await new Promise(res => setTimeout(res, 150));
      } catch (err: any) {
        console.error(`[ERROR] Lỗi khi tạo embedding cho chunk ${chunkId}:`, err?.message || err);
        process.exit(1);
      }
    }
  }

  const indexData: IndexFileStructure = {
    embeddingModel: EMBEDDING_MODEL,
    builtAt: new Date().toISOString(),
    chunks: allChunks
  };

  const outputPath = path.join(knowledgeDir, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2), 'utf-8');

  const durationMs = Date.now() - startTime;
  console.log('============================================================');
  console.log(`[SUCCESS] Build RAG Index thành công!`);
  console.log(`- Số file đã đọc: ${filesProcessed}`);
  console.log(`- Số chunk sinh ra & tạo vector: ${totalChunksCreated}`);
  console.log(`- Số chunk bị bỏ do hết hạn (${todayStr}): ${skippedExpiredChunks}`);
  console.log(`- Model Embedding sử dụng: ${EMBEDDING_MODEL}`);
  console.log(`- Tổng thời gian thực thi: ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`- File index lưu tại: ${outputPath}`);
  console.log('============================================================');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildIndex().catch(() => { console.error('[ERROR] Không hoàn tất kiểm tra/lập chỉ mục. Index cũ không được xác nhận là đã cập nhật.'); process.exitCode=1; });
}
