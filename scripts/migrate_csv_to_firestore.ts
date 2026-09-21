import fs from 'fs';
import path from 'path';
import { adminDb } from '../server/src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sanitizePii } from '../server/src/chatLogStorage';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function runMigration() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');

  console.log('====================================================');
  console.log('  CÔNG CỤ CHUYỂN ĐỔI DỮ LIỆU CSV SANG FIRESTORE');
  console.log('====================================================');

  if (!isApply) {
    console.log('⚠️  Chế độ [DRY-RUN]: Chỉ kiểm tra và in thông tin thử nghiệm, KHÔNG ghi vào Firestore.');
    console.log('👉 Để ghi thật vào Firestore, hãy chạy: npm run migrate:storage -- --apply\n');
  } else {
    console.log('🔥 Chế độ [APPLY]: Đang tiến hành ghi dữ liệu thật vào Firestore...\n');
  }

  const dataDir = path.join(process.cwd(), 'data');
  const chatLogsCsv = path.join(dataDir, 'chat_logs.csv');
  const handoverCsv = path.join(dataDir, 'handover_queue.csv');

  // 1. MIGRATION CHAT LOGS
  let chatRead = 0;
  let chatWritten = 0;
  let chatSkipped = 0;
  let chatErrors = 0;
  const sampleChatDocs: Record<string, unknown>[] = [];

  if (fs.existsSync(chatLogsCsv)) {
    const content = fs.readFileSync(chatLogsCsv, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCsvLine(lines[i]);
        if (fields.length < 13) continue;
        chatRead++;

        const [
          id,
          sessionId,
          timestamp,
          lang,
          isMember,
          userMessage,
          botResponse,
          latencyMs,
          usedFallback,
          handoverTag,
          intent,
          pkSegment,
          responseChars,
          retrievedChunkIds,
          topSimilarity,
          groundedAnswer
        ] = fields;

        const tsDate = new Date(timestamp || Date.now());
        const validTs = isNaN(tsDate.getTime()) ? new Date() : tsDate;

        const docData = {
          id,
          sessionId: sessionId || '',
          timestamp: Timestamp.fromDate(validTs),
          lang: lang || 'vi',
          isMember: isMember === 'true',
          userMessage: sanitizePii(userMessage || ''),
          botResponse: sanitizePii(botResponse || ''),
          latencyMs: parseInt(latencyMs, 10) || 0,
          usedFallback: usedFallback === 'true',
          handoverTag: handoverTag || '',
          intent: intent || '',
          pkSegment: pkSegment || '',
          responseChars: parseInt(responseChars, 10) || 0,
          retrievedChunkIds: retrievedChunkIds || '',
          topSimilarity: parseFloat(topSimilarity) || 0,
          groundedAnswer: groundedAnswer === 'true'
        };

        if (sampleChatDocs.length < 3) {
          sampleChatDocs.push({
            ...docData,
            timestamp: validTs.toISOString() + ' (Firestore Timestamp)'
          });
        }

        if (isApply) {
          try {
            const docRef = adminDb.collection('chat_logs').doc(id);
            const snap = await docRef.get();
            if (snap.exists) {
              chatSkipped++;
            } else {
              await docRef.set(docData);
              chatWritten++;
            }
          } catch (err) {
            console.error(`Lỗi khi ghi chat_logs doc ${id}:`, err);
            chatErrors++;
          }
        }
      }
    }
  }

  // 2. MIGRATION HANDOVER QUEUE
  let hoRead = 0;
  let hoWritten = 0;
  let hoSkipped = 0;
  let hoErrors = 0;
  const sampleHoDocs: Record<string, unknown>[] = [];

  if (fs.existsSync(handoverCsv)) {
    const content = fs.readFileSync(handoverCsv, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCsvLine(lines[i]);
        if (fields.length < 6) continue;
        hoRead++;

        const [id, createdAt, sessionId, tag, summary, status] = fields;
        const assignee = fields[6] || '';
        const contactedAt = fields[7] || '';
        const resolvedAt = fields[8] || '';
        const resolution = fields[9] || '';
        const historyStr = fields[10] || '[]';

        let rawHistory: unknown[] = [];
        try {
          rawHistory = JSON.parse(historyStr);
        } catch {
          rawHistory = [];
        }

        const createdDate = new Date(createdAt || Date.now());
        const validCreatedDate = isNaN(createdDate.getTime()) ? new Date() : createdDate;

        const formattedHistory = Array.isArray(rawHistory)
          ? rawHistory.map((item: unknown) => {
              const obj = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
              const itemTs = typeof obj.timestamp === 'string' ? new Date(obj.timestamp) : validCreatedDate;
              const validItemTs = isNaN(itemTs.getTime()) ? validCreatedDate : itemTs;
              return {
                status: typeof obj.status === 'string' ? obj.status : '',
                actor: typeof obj.actor === 'string' ? obj.actor : '',
                timestamp: Timestamp.fromDate(validItemTs),
                note: typeof obj.note === 'string' ? obj.note : ''
              };
            })
          : [];

        const docData = {
          id,
          createdAt: Timestamp.fromDate(validCreatedDate),
          sessionId: sessionId || '',
          tag: tag || 'REQUEST_HUMAN',
          summary: sanitizePii(summary || ''),
          status: status || 'CHO_TIEP_NHAN',
          assignee: assignee || '',
          contactedAt: contactedAt ? Timestamp.fromDate(new Date(contactedAt)) : null,
          resolvedAt: resolvedAt ? Timestamp.fromDate(new Date(resolvedAt)) : null,
          resolution: resolution || '',
          history: formattedHistory
        };

        if (sampleHoDocs.length < 3) {
          sampleHoDocs.push({
            ...docData,
            createdAt: validCreatedDate.toISOString() + ' (Firestore Timestamp)'
          });
        }

        if (isApply) {
          try {
            const docRef = adminDb.collection('handover_queue').doc(id);
            const snap = await docRef.get();
            if (snap.exists) {
              hoSkipped++;
            } else {
              await docRef.set(docData);
              hoWritten++;
            }
          } catch (err) {
            console.error(`Lỗi khi ghi handover_queue doc ${id}:`, err);
            hoErrors++;
          }
        }
      }
    }
  }

  // PRINT RESULTS
  console.log('--- MẪU BẢN GHI DỮ LIỆU ĐÃ CHUYỂN ĐỔI KIỂU ---');
  console.log('1. Chat Logs (3 mẫu):');
  console.log(JSON.stringify(sampleChatDocs, null, 2));
  console.log('\n2. Handover Queue (3 mẫu):');
  console.log(JSON.stringify(sampleHoDocs, null, 2));

  console.log('\n================ TỔNG KẾT MIGRATION ================');
  console.log(`📊 CHAT_LOGS:`);
  console.log(`   - Tổng bản ghi đọc từ CSV: ${chatRead}`);
  if (isApply) {
    console.log(`   - Số bản ghi mới đã ghi vào Firestore: ${chatWritten}`);
    console.log(`   - Số bản ghi bỏ qua (đã tồn tại): ${chatSkipped}`);
    console.log(`   - Số bản ghi bị lỗi: ${chatErrors}`);
  } else {
    console.log(`   - [Dry-Run] Số bản ghi sẵn sàng để chuyển sang Firestore: ${chatRead}`);
  }

  console.log(`\n📊 HANDOVER_QUEUE:`);
  console.log(`   - Tổng bản ghi đọc từ CSV: ${hoRead}`);
  if (isApply) {
    console.log(`   - Số bản ghi mới đã ghi vào Firestore: ${hoWritten}`);
    console.log(`   - Số bản ghi bỏ qua (đã tồn tại): ${hoSkipped}`);
    console.log(`   - Số bản ghi bị lỗi: ${hoErrors}`);
  } else {
    console.log(`   - [Dry-Run] Số bản ghi sẵn sàng để chuyển sang Firestore: ${hoRead}`);
  }

  console.log('====================================================');
}

runMigration().catch((err: unknown) => {
  console.error('Migration script error:', err);
  process.exit(1);
});
