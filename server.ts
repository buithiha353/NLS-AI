import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { getNlsIndicatorsForGrade, findNlsIndicatorByCode } from './src/data/nlsIndicators.ts';
import { getAiIndicatorsForGrade, findAiIndicatorByCode } from './src/data/aiIndicators.ts';
import type {
  DocBlock,
  EquipmentCondition,
  GradeLevel,
  IntegrationPlan,
  LessonMeta,
  PatchCategory,
} from './src/types/khbd.ts';

const __dirname = process.cwd();

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.use((req, _res, next) => {
    // The hosting proxy can forward the public mount prefix to Node.js.
    const mount = '/nls-ai';
    if (req.path === mount || req.path.startsWith(`${mount}/`)) {
      const suffix = req.url.slice(mount.length);
      req.url = suffix.startsWith('/') ? suffix : `/${suffix}`;
    }
    next();
  });
}
app.use(express.json({ limit: '25mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Chưa tìm thấy GEMINI_API_KEY trong môi trường máy chủ. Vui lòng kiểm tra cấu hình khóa API trong mục Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AnalyzeRequestBody {
  lessonMeta: LessonMeta;
  equipmentCondition: EquipmentCondition;
  ppctText: string;
  ppctName: string;
  khbdBlocks: DocBlock[];
  hasExistingAnalysisTable: boolean;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    feasible: {
      type: Type.BOOLEAN,
      description:
        'True nếu PPCT có phân bổ chỉ báo phù hợp cho đúng tiết/bài học và khả thi với điều kiện thiết bị. False nếu PPCT không phân bổ chỉ báo cho tiết này, không tìm thấy tiết trong PPCT, hoặc không thể tích hợp hợp lí.',
    },
    stopReason: {
      type: Type.STRING,
      description:
        'Nếu feasible=false, giải thích rõ lí do dừng (ví dụ: PPCT không phân bổ chỉ báo cho tiết này, hoặc chỉ báo vượt quá điều kiện thiết bị/nội dung bài). Nếu feasible=true thì để chuỗi rỗng.',
    },
    suggestedAlternative: {
      type: Type.STRING,
      description:
        'Nếu feasible=false, đề nghị cụ thể giáo viên lựa chọn bài hoặc tiết khác phù hợp. Nếu feasible=true để chuỗi rỗng.',
    },
    matchedPpctPeriod: {
      type: Type.STRING,
      description: 'Tên tiết và tên bài đã đối chiếu chính xác trong PPCT.',
    },
    matchedPpctExcerpt: {
      type: Type.STRING,
      description: 'Trích đoạn ngắn đúng dòng/ô tương ứng trong PPCT làm căn cứ đối chiếu.',
    },
    allocatedNlsCodes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Danh sách mã chỉ báo NLS đúng nguyên văn trong Bảng chỉ báo NLS chuẩn được PPCT phân bổ cho tiết này.',
    },
    allocatedAiCodes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Danh sách mã chỉ báo AI đúng nguyên văn trong Khung AI QĐ 2422 (gồm cả cốt lõi và MR) được PPCT phân bổ cho tiết này.',
    },
    patches: {
      type: Type.ARRAY,
      description:
        'Danh sách các khối nội dung cần bổ sung (sẽ được định dạng màu xanh lam #0000FF, Times New Roman 14) gắn vào đúng blockId của KHBD gốc.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'Một trong: objectives, equipment, activity, product, assessment',
          },
          categoryLabel: {
            type: Type.STRING,
            description: 'Nhãn tiếng Việt ngắn gọn vị trí chèn (ví dụ: Mục tiêu năng lực, Thiết bị & Học liệu, Hoạt động 2 - Hình thành kiến thức).',
          },
          anchorBlockId: {
            type: Type.STRING,
            description: 'Mã blockId chính xác từ danh sách KHBD đầu vào để chèn ngay sau đoạn đó hoặc nối vào cuối ô bảng đó.',
          },
          position: {
            type: Type.STRING,
            description: 'after (chèn đoạn mới ngay sau anchorBlockId) hoặc append_in_cell (nối đoạn vào cuối ô bảng nếu anchorBlockId bắt đầu bằng T_).',
          },
          indicatorCodes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          activityName: {
            type: Type.STRING,
            description: 'Tên mục hoặc hoạt động được tích hợp.',
          },
          paragraphs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Các đoạn văn cụ thể cần chèn (không dùng markdown, không dùng ký tự ** hay #).',
          },
        },
        required: [
          'id',
          'category',
          'categoryLabel',
          'anchorBlockId',
          'position',
          'indicatorCodes',
          'activityName',
          'paragraphs',
        ],
      },
    },
    analysisTableRows: {
      type: Type.ARRAY,
      description:
        'Các dòng của Bảng phân tích phát triển NLS/AI 4 cột ở cuối KHBD, thống nhất 100% với mục tiêu và tiến trình dạy học.',
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          activityName: { type: Type.STRING },
          studentTaskSummary: { type: Type.STRING },
          indicatorManifestation: {
            type: Type.STRING,
            description: 'Ghi rõ mã chỉ báo và biểu hiện phát triển NLS hoặc AI tương ứng.',
          },
          indicatorCodes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'order',
          'activityName',
          'studentTaskSummary',
          'indicatorManifestation',
          'indicatorCodes',
        ],
      },
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        periodsAndActivities: {
          type: Type.STRING,
          description: 'Tóm tắt ngắn tiết học và các hoạt động được tích hợp.',
        },
        keyAdditions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 đến 5 gạch đầu dòng ngắn gọn về những nội dung chính đã bổ sung.',
        },
      },
      required: ['periodsAndActivities', 'keyAdditions'],
    },
  },
  required: [
    'feasible',
    'stopReason',
    'suggestedAlternative',
    'matchedPpctPeriod',
    'matchedPpctExcerpt',
    'allocatedNlsCodes',
    'allocatedAiCodes',
    'patches',
    'analysisTableRows',
    'summary',
  ],
};

function describeEquipment(eq: EquipmentCondition): string {
  const room = eq.roomType === 'computer_lab' ? 'Phòng máy tính' : 'Phòng học thường';
  const studentMap: Record<EquipmentCondition['studentDevices'], string> = {
    none: 'Học sinh không có máy tính/điện thoại cá nhân trong lớp',
    shared_groups: 'Học sinh dùng thiết bị chung theo nhóm',
    individual_computers: 'Học sinh có máy tính thực hành cá nhân/cặp đôi tại phòng máy',
    student_personal: 'Học sinh có thiết bị cá nhân được phép sử dụng theo hướng dẫn của giáo viên',
  };
  return [
    `Phòng học: ${room}.`,
    `Máy tính giáo viên: ${eq.teacherComputerCount} máy.`,
    `Máy chiếu / Tivi trình chiếu: ${eq.hasProjectorOrTv ? 'Có' : 'Không'}.`,
    `Kết nối Internet: ${eq.hasInternet ? 'Có kết nối Internet' : 'Không có Internet'}.`,
    `Thiết bị của học sinh: ${studentMap[eq.studentDevices]}.`,
    eq.details.trim() ? `Chi tiết bổ sung từ giáo viên: ${eq.details.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildSystemInstruction(): string {
  return `Bạn là chuyên gia xây dựng Kế hoạch bài dạy (KHBD) cấp THCS theo Chương trình GDPT 2018, am hiểu sâu sắc Khung năng lực số (Thông tư 02/2025/TT-BGDĐT) và Khung nội dung giáo dục Trí tuệ nhân tạo (Quyết định 2422/QĐ-BGDĐT).

QUY TẮC BẮT BUỘC TUYỆT ĐỐI:
1. ĐỐI CHIẾU PPCT CHÍNH XÁC:
   - Chỉ sử dụng các mã chỉ báo NLS và/hoặc AI thực sự được phân bổ trong PPCT cho ĐÚNG bài học và ĐÚNG tiết học người dùng nêu.
   - Không suy đoán chỉ báo dựa vào tên bài. Không mượn chỉ báo của tiết khác.
   - Nếu bài kéo dài nhiều tiết, xác định rõ chỉ báo thuộc tiết nào.
   - Nếu PPCT KHÔNG phân bổ chỉ báo phù hợp với phạm vi người dùng yêu cầu cho tiết này, hoặc không tìm thấy tiết trong PPCT, BẮT BUỘC đặt feasible = false, ghi rõ stopReason và suggestedAlternative, KHÔNG tự ý tích hợp.
   - Nếu chỉ báo có trong PPCT nhưng KHÔNG THỂ tích hợp hợp lí với nội dung bài hoặc điều kiện thiết bị thực tế, BẮT BUỘC đặt feasible = false, dừng chỉnh sửa và đề nghị chọn bài/tiết khác.

2. CHỈ BÁO CHUẨN — CẤM BỊA MÃ:
   - Chỉ được dùng đúng mã và giữ nguyên nội dung trong 2 bảng chuẩn được cung cấp trong prompt (gồm cả chỉ báo AI cốt lõi và mở rộng MR nếu PPCT phân bổ).
   - Tuyệt đối không tự đặt mã mới, không sửa tên hay làm sai lệch ý nghĩa chỉ báo.
   - Chú ý phạm vi người dùng chọn:
     + "nls": Chỉ tích hợp chỉ báo NLS (allocatedAiCodes phải rỗng).
     + "ai": Chỉ tích hợp chỉ báo AI (allocatedNlsCodes phải rỗng).
     + "both": Tích hợp cả NLS và AI theo đúng phân bổ PPCT.

3. YÊU CẦU SƯ PHẠM KHI THIẾT KẾ HOẠT ĐỘNG TÍCH HỢP:
   - Ưu tiên tích hợp vào hoạt động Hình thành kiến thức, Luyện tập hoặc Vận dụng phù hợp; không nhồi nhét vào tất cả hoạt động; không làm tăng tổng thời lượng tiết học.
   - Mỗi hoạt động tích hợp phải thể hiện rõ đủ: (1) Mã và nội dung chỉ báo; (2) Nhiệm vụ cụ thể của học sinh; (3) Cách tổ chức của giáo viên; (4) Công cụ số hoặc công cụ AI cụ thể; (5) Sản phẩm học tập cụ thể; (6) Cách kiểm tra, đánh giá sản phẩm; (7) Cách kiểm chứng kết quả; (8) Yêu cầu an toàn, đạo đức, bảo mật (không nhập dữ liệu cá nhân/nhạy cảm, khai báo việc sử dụng AI khi phù hợp).
   - Năng lực số: Không đồng nhất với việc GV chiếu PowerPoint. HS phải có nhiệm vụ nhận thức cụ thể (xác định nhu cầu thông tin, đề xuất từ khóa, lựa chọn nguồn, nhập/xử lí dữ liệu, tạo sản phẩm số, đọc và đối chiếu kết quả).
   - Năng lực AI: Phân biệt công cụ AI với công cụ số thường. Không coi việc GV dùng AI soạn bài là năng lực AI của HS. Không cho HS tin/chép nguyên kết quả AI — bắt buộc có bước kiểm chứng bằng SGK/kiến thức môn học/nguồn tin cậy, nhắc không nhập thông tin cá nhân/hình ảnh riêng tư, và hướng dẫn ghi nhận phần AI hỗ trợ khi phù hợp.
   - ĐIỀU KIỆN THIẾT BỊ THỰC TẾ: Nếu lớp chỉ có 1 máy tính của GV kết nối Internet và máy chiếu (HS không có thiết bị): KHÔNG ĐƯỢC viết "học sinh tự sử dụng phần mềm/máy tính/điện thoại". Thay vào đó: HS thảo luận nhóm đề xuất từ khóa/câu lệnh/quy trình -> GV hoặc 1-2 đại diện nhóm thao tác trên máy tính chung -> các nhóm còn lại quan sát, ghi lại quy trình, dự đoán, đối chiếu SGK, chỉ ra điểm đúng/chưa chính xác và đề xuất cải tiến.

4. NGUYÊN TẮC BIÊN TẬP TỐI THIỂU & DIỄN ĐẠT:
   - Chỉ bổ sung các đoạn văn tối thiểu tại đúng vị trí (anchorBlockId) trong KHBD gốc: Mục tiêu năng lực, Thiết bị & học liệu, Tiến trình hoạt động (nội dung/tổ chức/sản phẩm/đánh giá). Không viết lại toàn bộ KHBD.
   - Không viết câu chung chung kiểu "góp phần phát triển năng lực số/AI" mà thiếu nhiệm vụ và sản phẩm cụ thể.
   - Vận dụng tự nhiên (không rập khuôn máy móc) cấu trúc:
     "Tích hợp NLS/AI ([mã chỉ báo]): Giáo viên ... Học sinh ... Đại diện nhóm ... Các nhóm còn lại ..."
     "Sản phẩm: ..."
     "Đánh giá: ..."
   - KHÔNG dùng ký tự định dạng Markdown (như **, *, #, backtick) trong các đoạn văn xuất ra vì đây là văn bản thuần đưa trực tiếp vào tệp Microsoft Word.

5. BẢNG PHÂN TÍCH 4 CỘT CUỐI KHBD:
   - Thống nhất 100% với mục tiêu và tiến trình dạy học; không ghi nhiệm vụ không có trong tiến trình.
   - Cột 4 (indicatorManifestation) phải ghi rõ mã chỉ báo và biểu hiện cụ thể.`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/analyze-lesson', async (req, res) => {
  try {
    const body = req.body as AnalyzeRequestBody;
    if (!body?.lessonMeta || !body?.equipmentCondition || !body?.ppctText || !Array.isArray(body?.khbdBlocks)) {
      return res.status(400).json({
        error: 'Thiếu dữ liệu đầu vào (KHBD, PPCT hoặc điều kiện thiết bị).',
      });
    }

    const { lessonMeta, equipmentCondition, ppctText, ppctName, khbdBlocks, hasExistingAnalysisTable } = body;
    const grade = lessonMeta.grade as GradeLevel;
    const nlsList = getNlsIndicatorsForGrade(grade);
    const aiList = getAiIndicatorsForGrade(grade);

    const nlsRefText = nlsList
      .map((item) => `- ${item.code} (${item.gradeLabel}, ${item.domainName}): ${item.detail}`)
      .join('\n');

    const aiRefText = aiList
      .map(
        (item) =>
          `- ${item.code} [${item.isExtended ? 'Mở rộng MR' : 'Cốt lõi'} | ${item.domainCode}. ${item.domainName} - ${item.topicCode}]: ${item.detail}`
      )
      .join('\n');

    // Keep KHBD structured blocks concise yet complete enough to preserve every section & anchorBlockId
    const validBlockIds = new Set<string>();
    const khbdStructuredLines: string[] = [];
    let charBudget = 0;
    const MAX_KHBD_CHARS = 48000;

    for (const blk of khbdBlocks) {
      validBlockIds.add(blk.blockId);
      const line = `[${blk.blockId} | ${blk.kind} | ${blk.sectionHint}] ${blk.text}`;
      if (charBudget + line.length <= MAX_KHBD_CHARS) {
        khbdStructuredLines.push(line);
        charBudget += line.length;
      }
    }

    const trimmedPpct = ppctText.length > 55000 ? ppctText.slice(0, 55000) : ppctText;
    const scopeLabel =
      lessonMeta.scope === 'nls'
        ? 'CHỈ TÍCH HỢP NĂNG LỰC SỐ (NLS)'
        : lessonMeta.scope === 'ai'
          ? 'CHỈ TÍCH HỢP NĂNG LỰC AI'
          : 'TÍCH HỢP CẢ NĂNG LỰC SỐ (NLS) VÀ NĂNG LỰC AI';

    const userPrompt = `THÔNG TIN YÊU CẦU TÍCH HỢP:
- Phạm vi tích hợp: ${scopeLabel}
- Môn học: ${lessonMeta.subject}
- Khối lớp: Lớp ${lessonMeta.grade}
- Bài hoặc chủ đề: ${lessonMeta.lessonTitle}
- Tiết PPCT: ${lessonMeta.periodNumber || '(Chưa ghi rõ số tiết — hãy tra đúng tên bài trong PPCT)'}
- Sách giáo khoa: ${lessonMeta.textbook || '(Theo KHBD/PPCT)'}
- Điều kiện tổ chức & thiết bị thực tế: ${describeEquipment(equipmentCondition)}
- Tên tệp PPCT đang sử dụng: ${ppctName}
- KHBD gốc đã có sẵn bảng phân tích NLS/AI chưa: ${hasExistingAnalysisTable ? 'Có (sẽ cập nhật lại bảng 4 cột)' : 'Chưa có (bổ sung bảng 4 cột ở cuối KHBD trước phần ký duyệt)'}

==================================================
BẢNG CHỈ BÁO NĂNG LỰC SỐ CHUẨN CHO LỚP ${lessonMeta.grade} (NGUYÊN VĂN):
${nlsRefText}

==================================================
BẢNG CHỈ BÁO KHUNG GIÁO DỤC AI QĐ 2422/QĐ-BGDĐT CHO LỚP ${lessonMeta.grade} (NGUYÊN VĂN — GỒM CỐT LÕI & MR):
${aiRefText}

==================================================
NỘI DUNG PHÂN PHỐI CHƯƠNG TRÌNH (PPCT):
${trimmedPpct}

==================================================
CẤU TRÚC TỆP KHBD GỐC (ĐÃ ĐÁNH CHỈ MỤC blockId):
${khbdStructuredLines.join('\n')}

HÃY THỰC HIỆN ĐỐI CHIẾU PPCT, KIỂM TRA TÍNH KHẢ THI VÀ TRẢ VỀ JSON ĐÚNG LƯỢC ĐỒ.
Lưu ý quan trọng:
- Với mọi patch gắn vào ô bảng (anchorBlockId dạng T_...), đặt position = "append_in_cell". Với đoạn văn thường (P_...), đặt position = "after".
- Chọn đúng anchorBlockId có trong danh sách KHBD ở trên (Mục tiêu năng lực, Thiết bị dạy học, và đúng 1–2 hoạt động phù hợp nhất trong Tiến trình dạy học).
- Giữ nguyên mã chỉ báo đúng chính tả từng ký tự theo 2 bảng chuẩn ở trên.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction: buildSystemInstruction(),
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return res.status(502).json({
        error: 'Mô hình AI không trả về dữ liệu phân tích. Vui lòng thử lại.',
      });
    }

    const parsed = JSON.parse(rawText) as Omit<IntegrationPlan, 'includeAnalysisTable'>;

    // Deterministic server-side verification against official verbatim tables (Zero hallucination guard)
    const allowedNlsSet = new Set(nlsList.map((i) => i.code.toUpperCase()));
    const allowedAiSet = new Set(aiList.map((i) => i.code.toUpperCase()));
    const rejectedCodes: string[] = [];

    const canonicalizeNls = (codes: string[] = []): string[] => {
      if (lessonMeta.scope === 'ai') return [];
      const out: string[] = [];
      for (const raw of codes) {
        const up = raw.trim().toUpperCase();
        if (allowedNlsSet.has(up)) {
          const official = findNlsIndicatorByCode(up);
          if (official && !out.includes(official.code)) {
            out.push(official.code);
          }
        } else if (raw.trim()) {
          rejectedCodes.push(raw.trim());
        }
      }
      return out;
    };

    const canonicalizeAi = (codes: string[] = []): string[] => {
      if (lessonMeta.scope === 'nls') return [];
      const out: string[] = [];
      for (const raw of codes) {
        const up = raw.trim().toUpperCase();
        if (allowedAiSet.has(up)) {
          const official = findAiIndicatorByCode(up);
          if (official && !out.includes(official.code)) {
            out.push(official.code);
          }
        } else if (raw.trim()) {
          rejectedCodes.push(raw.trim());
        }
      }
      return out;
    };

    const verifiedNls = canonicalizeNls(parsed.allocatedNlsCodes);
    const verifiedAi = canonicalizeAi(parsed.allocatedAiCodes);
    const allValidAllocated = new Set([...verifiedNls, ...verifiedAi].map((c) => c.toUpperCase()));

    const filterValidCodes = (codes: string[] = []): string[] => {
      const result: string[] = [];
      for (const c of codes) {
        const up = c.trim().toUpperCase();
        if (allValidAllocated.has(up)) {
          const official = findNlsIndicatorByCode(up)?.code ?? findAiIndicatorByCode(up)?.code ?? c.trim();
          if (!result.includes(official)) result.push(official);
        }
      }
      return result;
    };

    const validCategories: PatchCategory[] = ['objectives', 'equipment', 'activity', 'product', 'assessment'];
    const fallbackAnchor = khbdBlocks[khbdBlocks.length - 1]?.blockId ?? 'P_0';

    const sanitizedPatches = (parsed.patches ?? [])
      .filter((p) => Array.isArray(p.paragraphs) && p.paragraphs.some((s) => s.trim().length > 0))
      .map((p, idx) => {
        const safeAnchor = validBlockIds.has(p.anchorBlockId) ? p.anchorBlockId : fallbackAnchor;
        const safeCategory = validCategories.includes(p.category as PatchCategory)
          ? (p.category as PatchCategory)
          : 'activity';
        const safePos: 'after' | 'append_in_cell' = safeAnchor.startsWith('T_')
          ? 'append_in_cell'
          : 'after';
        return {
          id: p.id || `patch_${idx + 1}`,
          category: safeCategory,
          categoryLabel: p.categoryLabel || 'Nội dung tích hợp',
          anchorBlockId: safeAnchor,
          position: safePos,
          indicatorCodes: filterValidCodes(p.indicatorCodes),
          activityName: p.activityName || p.categoryLabel || `Mục tích hợp ${idx + 1}`,
          paragraphs: p.paragraphs.map((line) => line.replace(/\*\*/g, '').trim()).filter(Boolean),
          enabled: true,
        };
      });

    const sanitizedRows = (parsed.analysisTableRows ?? []).map((row, idx) => ({
      order: row.order || idx + 1,
      activityName: row.activityName || `Hoạt động ${idx + 1}`,
      studentTaskSummary: row.studentTaskSummary || '',
      indicatorManifestation: row.indicatorManifestation || '',
      indicatorCodes: filterValidCodes(row.indicatorCodes),
    }));

    let finalFeasible = Boolean(parsed.feasible);
    let finalStopReason = parsed.stopReason || '';
    let finalSuggestedAlt = parsed.suggestedAlternative || '';

    if (finalFeasible && allValidAllocated.size === 0) {
      finalFeasible = false;
      finalStopReason =
        'Không tìm thấy mã chỉ báo hợp lệ thuộc 2 bảng chỉ báo chuẩn (NLS THCS / Khung AI QĐ 2422) cho khối lớp và tiết học này trong PPCT đã cung cấp. Hệ thống dừng tích hợp để tránh tự suy đoán chỉ báo.';
      finalSuggestedAlt =
        'Vui lòng kiểm tra lại số tiết/tên bài trong PPCT hoặc lựa chọn một tiết học khác có phân bổ chỉ báo rõ ràng.';
    }

    const plan: IntegrationPlan = {
      feasible: finalFeasible,
      stopReason: finalStopReason,
      suggestedAlternative: finalSuggestedAlt,
      matchedPpctPeriod: parsed.matchedPpctPeriod || lessonMeta.periodNumber || lessonMeta.lessonTitle,
      matchedPpctExcerpt: parsed.matchedPpctExcerpt || '',
      allocatedNlsCodes: verifiedNls,
      allocatedAiCodes: verifiedAi,
      rejectedCodesFromModel: rejectedCodes.length > 0 ? Array.from(new Set(rejectedCodes)) : undefined,
      patches: finalFeasible ? sanitizedPatches : [],
      analysisTableRows: finalFeasible ? sanitizedRows : [],
      includeAnalysisTable: finalFeasible && sanitizedRows.length > 0,
      summary: {
        periodsAndActivities: parsed.summary?.periodsAndActivities || parsed.matchedPpctPeriod || '',
        keyAdditions: Array.isArray(parsed.summary?.keyAdditions) ? parsed.summary.keyAdditions : [],
      },
    };

    return res.json({ plan });
  } catch (err) {
    console.error('Error in /api/analyze-lesson:', err);
    const message = err instanceof Error ? err.message : 'Lỗi không xác định khi phân tích KHBD.';
    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED') || message.includes('403')) {
      return res.status(403).json({
        error:
          'Khóa API Gemini không hợp lệ hoặc chưa đủ quyền. Vui lòng kiểm tra lại trong bảng Settings > Secrets.',
      });
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      return res.status(429).json({
        error:
          'Đã chạm giới hạn hạn mức gọi API Gemini. Vui lòng đợi một lát rồi thử lại hoặc kiểm tra gói khóa API trong Settings > Secrets.',
      });
    }
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KHBD Số THCS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
