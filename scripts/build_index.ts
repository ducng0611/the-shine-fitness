/**
 * Knowledge Base Index Builder for The Shine Fitness & Yoga
 * Parses Markdown files in data/knowledge/*.md, validates metadata,
 * splits into semantic chunks, generates vector embeddings using Gemini API,
 * and exports data/knowledge/index.json.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

interface DocMetadata {
  id: string;
  title: string;
  source: string;
  version: string;
  effective_date: string;
  expiry_date: string;
  owner: string;
  category: string;
}

interface KBChunk {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
  metadata: DocMetadata;
}

interface IndexFileStructure {
  embeddingModel: string;
  builtAt: string;
  chunks: KBChunk[];
}

const REQUIRED_METADATA_KEYS: (keyof DocMetadata)[] = [
  'id',
  'title',
  'source',
  'version',
  'effective_date',
  'expiry_date',
  'owner',
  'category'
];

const VALID_CATEGORIES = ['PRICE', 'SCHEDULE', 'TRAINER', 'FACILITY', 'POLICY', 'TRIAL'];

function parseFrontmatter(fileContent: string, filePath: string): { metadata: DocMetadata; body: string } {
  const parts = fileContent.split(/^---$/m);
  if (parts.length < 3) {
    console.error(`[ERROR] File ${filePath} không đúng định dạng YAML frontmatter (thiếu dải '---').`);
    process.exit(1);
  }

  const rawYaml = parts[1];
  const body = parts.slice(2).join('---').trim();

  const metadataDict: Record<string, string> = {};
  const lines = rawYaml.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.substring(0, colonIdx).trim();
    let val = trimmed.substring(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    metadataDict[key] = val;
  }

  // Validate missing fields
  for (const reqKey of REQUIRED_METADATA_KEYS) {
    if (!metadataDict[reqKey]) {
      console.error(`[ERROR] File ${filePath} thiếu trường metadata bắt buộc: '${reqKey}'`);
      process.exit(1);
    }
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(metadataDict.category)) {
    console.error(`[ERROR] File ${filePath} có category '${metadataDict.category}' không hợp lệ. Phải thuộc: ${VALID_CATEGORIES.join(', ')}`);
    process.exit(1);
  }

  return {
    metadata: metadataDict as unknown as DocMetadata,
    body
  };
}

/**
 * Splits document body into semantic chunks (300-500 tokens / 800-1500 chars)
 * respecting Markdown heading and paragraph boundaries.
 */
function chunkDocument(body: string): string[] {
  const sections = body.split(/(?=\n#{1,3}\s)/);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // If section is reasonable size, add as chunk
    if (trimmed.length <= 1500) {
      chunks.push(trimmed);
    } else {
      // Split large section by double linebreaks
      const paragraphs = trimmed.split(/\n\s*\n/);
      let currentChunk = '';

      for (const para of paragraphs) {
        if ((currentChunk + '\n\n' + para).length > 1500 && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = para;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }

  return chunks;
}

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

    // Check expiry
    if (metadata.expiry_date < todayStr) {
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

buildIndex();
