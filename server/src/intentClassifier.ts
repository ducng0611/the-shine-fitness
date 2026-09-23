import { isNutritionRequest } from '../../shared/nutritionRouting';
import { normalizeSafetyText } from '../../shared/programSafety';
import { GoogleGenAI } from '@google/genai';
import { PK_SEGMENTS_LIST } from '../../src/data/pkSegmentsData';

export interface ClassificationResult {
  intent: 'PRICE' | 'SCHEDULE' | 'TRAINER' | 'FACILITY' | 'POLICY' | 'TRIAL' | 'PROGRAM' | 'GREETING' | 'OTHER' | string;
  confidence: number; // 0 đến 1
  pkSegment: 'PK01' | 'PK02' | 'PK03' | 'PK04' | null;
  slots: {
    goal: string | null;
    experience: string | null;
    schedule: string | null;
    budget: string | null;
  };
  nextQuestion: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
}

const DEFAULT_FALLBACK_RESULT: ClassificationResult = {
  intent: 'OTHER',
  confidence: 0,
  pkSegment: null,
  slots: {
    goal: null,
    experience: null,
    schedule: null,
    budget: null,
  },
  nextQuestion: null,
};

const MODEL_CLASSIFIER = 'gemini-3.5-flash-lite';

export function fallbackKeywordClassifier(message: string): ClassificationResult {
  const lower = (message || '').toLowerCase();
  const normalized = normalizeSafetyText(message || '');
  
  if (/\b(gia|bao nhieu tien|chi phi|hoc phi|uu dai|khuyen mai|tien|bang gia|combo|goi)\b/.test(normalized)) {
    return {
      intent: 'PRICE',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (isNutritionRequest(message)) {
    return { intent: 'NUTRITION', confidence: 0.85, pkSegment: null,
      slots: {goal: null, experience: null, schedule: null, budget: null}, nextQuestion: null };
  }
  // "giáo án" không phải từ "giá"; ưu tiên PRICE chỉ khi có từ giá/gói thực sự.
  if (/\b(the luc|linh hoat|deo dai|suc ben|lo trinh|giao an|bai tap|tap nhu the nao|tap bao lau|tang can|tang co|nguoi gay|kho tang can|lean bulk|fitness|flexibility|tang chieu cao|cai thien tu the|gu lung|tu the|plyometrics?|treo xa|height|posture|giam mo|giam can|giam beo|dot mo|fat loss|weight loss|chinh sua tu the|co rua|rut vai|vai tron|ngoi nhieu|van dong van phong|postural correction|desk worker mobility|upper crossed|lower crossed)\b/.test(normalized)) {
    const fitness = /\b(the luc|linh hoat|deo dai|suc ben|fitness|flexibility)\b/.test(normalized);
    const weight = /\b(tang can|kho tang can|nguoi gay|lean bulk)\b/.test(normalized);
    const fat = /\b(giam mo|giam can|giam beo|dot mo|fat loss|weight loss)\b/.test(normalized);
    const muscle = /\btang co\b/.test(normalized);
    const height = /\b(tang chieu cao|height|grow taller)\b/.test(normalized);
    const posture = /\b(cai thien tu the|chinh sua tu the|gu lung|tu the|posture|co rua|rut vai|vai tron|ngoi nhieu|van dong van phong|postural correction|desk worker mobility|upper crossed|lower crossed)\b/.test(normalized);
    // Từ khóa xác định chủ đề; không ép nhiều mục tiêu hoặc câu phủ định thành một mục tiêu đã xác nhận.
    const negated = /\b(khong|chua)\s+(?:muon\s+)?(?:tang can|tang co|tang chieu cao|cai thien tu the|chinh sua tu the|giam mo|giam can|giam beo|dot mo)\b/.test(normalized);
    const topics = [fat, weight, muscle, height, posture, fitness].filter(Boolean).length;
    const goal = negated || topics > 1 ? null :
      fat ? 'Giảm mỡ' : height ? 'Chiều cao và tư thế, cần đánh giá chuyên môn' :
      posture ? 'Tư thế và tính vận động, cần đánh giá trực tiếp' :
      weight ? 'Tăng cân' : muscle ? 'Tăng cơ' : fitness ? 'Tăng thể lực và linh hoạt' : null;
    return { intent:'PROGRAM', confidence:0.85, pkSegment:null,
      slots:{goal, experience:null, schedule:null, budget:null}, nextQuestion:'Q1' };
  }
  if (/giờ|lịch|mở cửa|đóng cửa|mấy giờ|thời gian|hoạt động|ca tập/.test(lower)) {
    return {
      intent: 'SCHEDULE',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (/pt|huấn luyện viên|hlv|thầy|cô|kèm|dạy|trainer/.test(lower)) {
    return {
      intent: 'TRAINER',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (/địa chỉ|ở đâu|vị trí|phòng tắm|sauna|xông hơi|locker|tủ đồ|máy|thiết bị|xe|gửi xe|cơ sở|chi nhánh/.test(lower)) {
    return {
      intent: 'FACILITY',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (/bảo lưu|chuyển nhượng|hợp đồng|hoàn tiền|chính sách|quy định|nội quy/.test(lower)) {
    return {
      intent: 'POLICY',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (/tập thử|trải nghiệm|thử|0đ|0 đồng|voucher|vé tập/.test(lower)) {
    return {
      intent: 'TRIAL',
      confidence: 0.85,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }
  if (/chào|hi|hello|alo|hey|tư vấn|bạn ơi|admin/.test(lower)) {
    return {
      intent: 'GREETING',
      confidence: 0.9,
      pkSegment: null,
      slots: { goal: null, experience: null, schedule: null, budget: null },
      nextQuestion: 'Q1'
    };
  }

  return { ...DEFAULT_FALLBACK_RESULT };
}

/**
 * Builds concise classifier prompt
 */
function buildClassifierPrompt(
  message: string,
  history: Array<{ role: string; text: string }>
): string {
  const segmentSummaries = PK_SEGMENTS_LIST.map(
    (s) => `- ${s.code}: ${s.personaName} - ${s.primarySignal}`
  ).join('\n');

  const historyExcerpt = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'Khách' : 'Bot'}: ${h.text}`)
    .join('\n');

  return `Bạn là bộ phân loại ý định (Intent Classifier) & phân khúc khách hàng cho The Shine Fitness & Yoga.

DANH SÁCH INTENT HỢP LỆ (CHỈ CHỌN 1):
- PRICE: Báo giá, học phí, chi phí, ưu đãi, voucher, khuyến mãi
- SCHEDULE: Giờ mở cửa, lịch học Yoga/Boxing, thời gian tập
- TRAINER: Huấn luyện viên cá nhân, PT kèm 1-1, thầy dạy
- FACILITY: Cơ sở vật chất, địa chỉ, vị trí, phòng tắm, locker, máy tập, gửi xe
- POLICY: Chính sách bảo lưu, chuyển nhượng, đóng tiền, hợp đồng
- TRIAL: Đăng ký tập thử, trải nghiệm 0đ, vé tập thử
- PROGRAM: Lộ trình, giáo án, bài tập, tăng cân, tăng cơ, thể lực, linh hoạt, chiều cao/tư thế và giảm mỡ; từ khóa không xác nhận bệnh lý
- NUTRITION: Nhu cầu bữa ăn và dinh dưỡng; cần kiểm tra dữ liệu đã duyệt, không tự kê thực đơn từ mẫu
- GREETING: Chào hỏi, cảm ơn, xã giao
- OTHER: Khác hoặc ngoài phạm vi

4 PHÂN KHÚC KHÁCH HÀNG (PK SEGMENT):
${segmentSummaries}
(Nếu chưa đủ thông tin nhận diện phân khúc, trả về null)

THÔNG TIN LỊCH SỬ HỘI THOẠI:
${historyExcerpt || '(Chưa có hội thoại trước)'}

TIN NHẮN MỚI CỦA KHÁCH:
"${message}"

Nhiệm vụ:
1. Xác định intent chính và độ tự tin (confidence từ 0.0 đến 1.0).
2. Tích lũy các slot thông tin (goal, experience, schedule, budget) từ lịch sử + tin nhắn mới.
   - goal: Mục tiêu tập luyện (giảm cân, tăng cơ, cải thiện thể trạng, tập Yoga...)
   - experience: Kinh nghiệm/trình độ (mới tập, từng tập, chưa bao giờ tập, gymmer lâu năm...)
   - schedule: Khung giờ/tần suất (buổi tối, 18h, 3 buổi/tuần, cuối tuần...)
   - budget: Ngân sách/gói tập mong muốn (gói tiết kiệm, gói tháng, gói PT kèm riêng, gói VIP...)
   Lưu ý: Giữ lại slot đã biết từ trước, trừ khi khách thay đổi hoặc đính chính thông tin.
3. Nhận diện pkSegment (PK01, PK02, PK03, PK04 hoặc null) dựa trên tín hiệu tổng hợp.`;
}

/**
 * Classifies user message in a single Gemini call with strict JSON responseSchema
 */
export async function classify(
  message: string,
  history: Array<{ role: string; text: string }> = [],
  ai: GoogleGenAI
): Promise<ClassificationResult> {
  if (!message || !message.trim()) {
    return { ...DEFAULT_FALLBACK_RESULT };
  }

  const keyword = fallbackKeywordClassifier(message);
  if (keyword.intent === 'PRICE' || keyword.intent === 'PROGRAM' || keyword.intent === 'NUTRITION') return keyword;

  const promptText = buildClassifierPrompt(message, history);

  const classifierSchema = {
    type: 'OBJECT',
    properties: {
      intent: {
        type: 'STRING',
        enum: [
          'PRICE',
          'SCHEDULE',
          'TRAINER',
          'FACILITY',
          'POLICY',
          'TRIAL',
          'PROGRAM',
          'NUTRITION',
          'GREETING',
          'OTHER',
        ],
      },
      confidence: { type: 'NUMBER' },
      pkSegment: {
        type: 'STRING',
        enum: ['PK01', 'PK02', 'PK03', 'PK04', 'NONE'],
      },
      slots: {
        type: 'OBJECT',
        properties: {
          goal: { type: 'STRING' },
          experience: { type: 'STRING' },
          schedule: { type: 'STRING' },
          budget: { type: 'STRING' },
        },
      },
    },
    required: ['intent', 'confidence', 'pkSegment', 'slots'],
  };

  const classifyTask = async (): Promise<ClassificationResult> => {
    const response = await ai.models.generateContent({
      model: MODEL_CLASSIFIER,
      contents: promptText,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: classifierSchema as any,
      },
    });

    const rawJson = response.text || '{}';
    const parsed = JSON.parse(rawJson);

    const validIntents = [
      'PRICE',
      'SCHEDULE',
      'TRAINER',
      'FACILITY',
      'POLICY',
      'TRIAL',
      'PROGRAM',
      'NUTRITION',
      'GREETING',
      'OTHER',
    ];

    const intent = validIntents.includes(parsed.intent) ? parsed.intent : 'OTHER';
    const confidence = typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0;

    let pkSegment: 'PK01' | 'PK02' | 'PK03' | 'PK04' | null = null;
    if (['PK01', 'PK02', 'PK03', 'PK04'].includes(parsed.pkSegment)) {
      pkSegment = parsed.pkSegment;
    }

    const rawSlots = parsed.slots || {};
    const slots = {
      goal: rawSlots.goal && rawSlots.goal !== 'NONE' && rawSlots.goal !== 'null' ? rawSlots.goal.trim() : null,
      experience: rawSlots.experience && rawSlots.experience !== 'NONE' && rawSlots.experience !== 'null' ? rawSlots.experience.trim() : null,
      schedule: rawSlots.schedule && rawSlots.schedule !== 'NONE' && rawSlots.schedule !== 'null' ? rawSlots.schedule.trim() : null,
      budget: rawSlots.budget && rawSlots.budget !== 'NONE' && rawSlots.budget !== 'null' ? rawSlots.budget.trim() : null,
    };

    // Determine nextQuestion
    // Q1: goal, Q2: experience, Q3: schedule, Q4: budget
    // Dodge detection: check if last model message asked a question that was not answered
    const lastModelMsg = history && history.length > 0
      ? [...history].reverse().find((h) => h.role === 'model')?.text || ''
      : '';

    const lowerLastModelMsg = lastModelMsg.toLowerCase();
    let dodgedQ: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null = null;

    if (
      (lowerLastModelMsg.includes('mục tiêu') || lowerLastModelMsg.includes('tập luyện để')) &&
      !slots.goal
    ) {
      dodgedQ = 'Q1';
    } else if (
      (lowerLastModelMsg.includes('từng tập') || lowerLastModelMsg.includes('chưa tập') || lowerLastModelMsg.includes('kinh nghiệm')) &&
      !slots.experience
    ) {
      dodgedQ = 'Q2';
    } else if (
      (lowerLastModelMsg.includes('khung giờ') || lowerLastModelMsg.includes('mấy buổi một tuần') || lowerLastModelMsg.includes('tần suất')) &&
      !slots.schedule
    ) {
      dodgedQ = 'Q3';
    } else if (
      (lowerLastModelMsg.includes('ngân sách') || lowerLastModelMsg.includes('gói tiết kiệm') || lowerLastModelMsg.includes('gói đầy đủ')) &&
      !slots.budget
    ) {
      dodgedQ = 'Q4';
    }

    let nextQuestion: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null = null;

    if (!slots.goal && dodgedQ !== 'Q1') {
      nextQuestion = 'Q1';
    } else if (!slots.experience && dodgedQ !== 'Q2') {
      nextQuestion = 'Q2';
    } else if (!slots.schedule && dodgedQ !== 'Q3') {
      nextQuestion = 'Q3';
    } else if (!slots.budget && dodgedQ !== 'Q4') {
      nextQuestion = 'Q4';
    }

    return {
      intent,
      confidence,
      pkSegment,
      slots,
      nextQuestion,
    };
  };

  // Timeout wrapper (6000ms max)
  const timeoutPromise = new Promise<ClassificationResult>((resolve) => {
    setTimeout(() => {
      resolve(fallbackKeywordClassifier(message));
    }, 6000);
  });

  try {
    return await Promise.race([classifyTask(), timeoutPromise]);
  } catch (err) {
    console.warn('Classification error caught cleanly, using keyword fallback:', err);
    return fallbackKeywordClassifier(message);
  }
}
