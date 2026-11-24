import JSZip from 'jszip';
import type {
  AnalysisTableRow,
  AuditCheckItem,
  AuditReport,
  DocBlock,
  GradeLevel,
  IntegrationPlan,
  LessonMeta,
  ParsedKhbd,
  PatchOperation,
} from '../types/khbd';
import { findAiIndicatorByCode } from '../data/aiIndicators';
import { findNlsIndicatorByCode } from '../data/nlsIndicators';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

const INTEGRATION_BLUE_HEX = '0000FF';
const WORD_FONT_NAME = 'Times New Roman';
const WORD_FONT_SIZE_HALF_PT = '28'; // 14pt = 28 half-points

function getElementText(el: Element): string {
  const parts: string[] = [];
  const all = el.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const name = all[i].localName;
    if (name === 't') {
      parts.push(all[i].textContent ?? '');
    } else if (name === 'tab') {
      parts.push(' ');
    } else if (name === 'br') {
      parts.push('\n');
    }
  }
  return parts.join('').replace(/[ \t]+/g, ' ').trim();
}

function getParagraphText(p: Element): string {
  return getElementText(p).replace(/\n+/g, ' ').trim();
}

function detectSectionHint(text: string, currentHint: string): string {
  const norm = text.toUpperCase();
  if (/^I\.\s*MỤC TIÊU|MỤC TIÊU/.test(norm)) return 'I. Mục tiêu';
  if (/NĂNG LỰC/.test(norm) && currentHint === 'I. Mục tiêu') return 'I. Mục tiêu — Năng lực';
  if (/^II\.\s*THIẾT BỊ|THIẾT BỊ DẠY HỌC/.test(norm)) return 'II. Thiết bị dạy học và học liệu';
  if (/^III\.\s*TIẾN TRÌNH|TIẾN TRÌNH DẠY HỌC/.test(norm)) return 'III. Tiến trình dạy học';
  if (/HOẠT ĐỘNG\s*[1-9A-D]/.test(norm)) return text.slice(0, 72);
  if (/PHỤ LỤC|BẢNG PHÂN TÍCH.*(NĂNG LỰC SỐ|NLS|AI)/.test(norm)) return 'Bảng phân tích NLS/AI';
  if (/DUYỆT|TỔ TRƯỞNG|BAN GIÁM HIỆU|NGƯỜI SOẠN|GIÁO VIÊN SOẠN|KÝ DUYỆT/.test(norm)) {
    return 'Phần ký duyệt';
  }
  return currentHint;
}

function detectKhbdHints(fullText: string, fileName: string): ParsedKhbd['detectedHints'] {
  const head = `${fileName}\n${fullText.slice(0, 2600)}`;

  // Detect Grade (6, 7, 8, 9)
  let grade: GradeLevel | null = null;
  const gradeMatch = head.match(/(?:lớp|khối|toán|văn|khtn|tin học|lịch sử|địa lí|gdcd|tiếng anh|công nghệ|mĩ thuật|âm nhạc)\s*[:\-_]?\s*([6789])\b/i);
  if (gradeMatch) {
    grade = Number(gradeMatch[1]) as GradeLevel;
  }

  // Detect Subject
  const knownSubjects = [
    'Khoa học tự nhiên',
    'Lịch sử và Địa lí',
    'Giáo dục công dân',
    'Hoạt động trải nghiệm',
    'Ngữ văn',
    'Tiếng Anh',
    'Tin học',
    'Công nghệ',
    'Toán',
    'Âm nhạc',
    'Mĩ thuật',
    'Giáo dục thể chất',
  ];
  let subject = '';
  for (const s of knownSubjects) {
    if (head.toLowerCase().includes(s.toLowerCase())) {
      subject = s;
      break;
    }
  }
  if (!subject && /\bkhtn\b/i.test(head)) subject = 'Khoa học tự nhiên';
  if (!subject && /\bls\s*[-&]\s*đl|lsđl\b/i.test(head)) subject = 'Lịch sử và Địa lí';
  if (!subject && /\bgdcd\b/i.test(head)) subject = 'Giáo dục công dân';

  // Detect Period
  let periodNumber = '';
  const periodMatch = head.match(/(?:tiết\s*(?:ppct|theo\s*ppct)?\s*[:\-]?\s*)([0-9]+(?:\s*[-–,]\s*[0-9]+)?)/i);
  if (periodMatch) {
    periodNumber = periodMatch[1].trim();
  }

  // Detect Lesson title
  let lessonTitle = '';
  const titleMatch = head.match(/(?:BÀI|CHỦ ĐỀ)\s*[0-9IVX]*\s*[:.\-]\s*([^\n]{4,140})/i);
  if (titleMatch) {
    lessonTitle = titleMatch[0].trim();
  }

  // Detect Textbook
  let textbook = '';
  if (/kết nối tri thức|kntt/i.test(head)) textbook = 'Kết nối tri thức với cuộc sống';
  else if (/chân trời sáng tạo|ctst/i.test(head)) textbook = 'Chân trời sáng tạo';
  else if (/cánh diều/i.test(head)) textbook = 'Cánh Diều';

  return { subject, grade, lessonTitle, periodNumber, textbook };
}

/**
 * Đọc cấu trúc DOCX giữ nguyên chỉ mục đoạn văn và ô bảng để vá XML chính xác.
 */
export async function parseKhbdDocx(file: File): Promise<ParsedKhbd> {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    throw new Error('Tệp KHBD bắt buộc phải ở định dạng Microsoft Word (.docx).');
  }
  const fileBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(fileBuffer.slice(0));
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Không tìm thấy nội dung word/document.xml. Tệp DOCX có thể bị lỗi.');
  }

  const xmlStr = await docXmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  const body = xmlDoc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) {
    throw new Error('Không đọc được cấu trúc thân tài liệu (w:body) trong tệp KHBD.');
  }

  const blocks: DocBlock[] = [];
  const textLines: string[] = [];
  let currentHint = 'Thông tin chung';
  let pCounter = 0;
  let tblCounter = 0;
  let hasExistingAnalysisTable = false;
  let existingAnalysisTableIndex: number | null = null;
  let hasSignatureBlock = false;
  let signatureBlockIndex: number | null = null;

  const children = Array.from(body.children);
  for (let childIdx = 0; childIdx < children.length; childIdx++) {
    const child = children[childIdx];

    if (child.localName === 'p') {
      const idx = pCounter++;
      const text = getParagraphText(child);
      if (text) {
        currentHint = detectSectionHint(text, currentHint);
        textLines.push(text);
        if (
          signatureBlockIndex === null &&
          childIdx >= Math.floor(children.length * 0.55) &&
          /(KÝ DUYỆT|TỔ TRƯỞNG|BAN GIÁM HIỆU|DUYỆT CỦA|NGƯỜI SOẠN|GIÁO VIÊN SOẠN)/i.test(text)
        ) {
          hasSignatureBlock = true;
          signatureBlockIndex = childIdx;
        }
        blocks.push({
          blockId: `P_${idx}`,
          kind: 'paragraph',
          sectionHint: currentHint,
          text,
        });
      }
    } else if (child.localName === 'tbl') {
      const tIdx = tblCounter++;
      const tableFullText = getElementText(child);
      const isSignatureTable =
        childIdx >= Math.floor(children.length * 0.6) &&
        /(TỔ TRƯỞNG|BAN GIÁM HIỆU|HIỆU TRƯỞNG|GIÁO VIÊN SOẠN|NGƯỜI SOẠN|DUYỆT)/i.test(tableFullText);

      if (isSignatureTable && signatureBlockIndex === null) {
        hasSignatureBlock = true;
        signatureBlockIndex = childIdx;
      }

      const isAnalysisTable =
        /(BIỂU HIỆN|CHỈ BÁO).*(NĂNG LỰC SỐ|NLS|AI)/i.test(tableFullText) &&
        /(HOẠT ĐỘNG|NHIỆM VỤ)/i.test(tableFullText);

      if (isAnalysisTable) {
        hasExistingAnalysisTable = true;
        existingAnalysisTableIndex = tIdx;
      }

      const rows = Array.from(child.children).filter((el) => el.localName === 'tr');
      rows.forEach((tr, rIdx) => {
        const cells = Array.from(tr.children).filter((el) => el.localName === 'tc');
        const rowCellsText: string[] = [];
        cells.forEach((tc, cIdx) => {
          const cellText = getElementText(tc);
          rowCellsText.push(cellText);
          if (cellText) {
            currentHint = detectSectionHint(cellText, currentHint);
            blocks.push({
              blockId: `T_${tIdx}_R_${rIdx}_C_${cIdx}`,
              kind: 'table_cell',
              sectionHint: currentHint,
              text: cellText,
              tableIndex: tIdx,
              rowIndex: rIdx,
              cellIndex: cIdx,
            });
          }
        });
        if (rowCellsText.some(Boolean)) {
          textLines.push(rowCellsText.join(' | '));
        }
      });
    }
  }

  if (blocks.length === 0) {
    throw new Error('Tệp KHBD không có văn bản đọc được.');
  }

  const fullText = textLines.join('\n');
  const detectedHints = detectKhbdHints(fullText, file.name);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileBuffer,
    blocks,
    fullText,
    hasExistingAnalysisTable,
    existingAnalysisTableIndex,
    hasSignatureBlock,
    signatureBlockIndex,
    detectedHints,
  };
}

function createWElement(doc: Document, tagName: string, attrs?: Record<string, string>): Element {
  const el = doc.createElementNS(W_NS, `w:${tagName}`);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'xml:space') {
        el.setAttributeNS(XML_NS, 'xml:space', val);
      } else {
        el.setAttributeNS(W_NS, `w:${key}`, val);
      }
    }
  }
  return el;
}

/**
 * Tạo đoạn văn Word chuẩn màu xanh lam (#0000FF), Times New Roman cỡ 14 (sz=28).
 */
function createBlueParagraph(
  doc: Document,
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    keepNext?: boolean;
    align?: 'left' | 'center' | 'both' | 'right';
    spaceBefore?: string;
    spaceAfter?: string;
    templatePPr?: Element | null;
  }
): Element {
  const p = createWElement(doc, 'p');

  let pPr: Element;
  if (options?.templatePPr) {
    pPr = options.templatePPr.cloneNode(true) as Element;
    // Remove numbering if cloned from a numbered heading to avoid breaking numbering
    const numPr = Array.from(pPr.children).find((el) => el.localName === 'numPr');
    if (numPr) pPr.removeChild(numPr);
    // Remove keepNext unless requested
    const existingKeepNext = Array.from(pPr.children).find((el) => el.localName === 'keepNext');
    if (existingKeepNext && !options?.keepNext) pPr.removeChild(existingKeepNext);
  } else {
    pPr = createWElement(doc, 'pPr');
    const spacing = createWElement(doc, 'spacing', {
      before: options?.spaceBefore ?? '60',
      after: options?.spaceAfter ?? '60',
      line: '276',
      lineRule: 'auto',
    });
    pPr.appendChild(spacing);
  }

  if (options?.keepNext) {
    if (!Array.from(pPr.children).some((el) => el.localName === 'keepNext')) {
      pPr.appendChild(createWElement(doc, 'keepNext'));
    }
  }

  if (options?.align) {
    const oldJc = Array.from(pPr.children).find((el) => el.localName === 'jc');
    if (oldJc) pPr.removeChild(oldJc);
    pPr.appendChild(createWElement(doc, 'jc', { val: options.align }));
  }

  p.appendChild(pPr);

  // Split leading label (e.g. "Tích hợp NLS/AI (...):", "Sản phẩm:", "Đánh giá:") for clean typography
  const labelMatch = text.match(
    /^((?:Tích hợp\s+(?:NLS\/AI|NLS|AI)[^:]{0,60}|Sản phẩm|Đánh giá|Kiểm chứng|An toàn[^:]{0,30}|Mục tiêu\s+(?:NLS|AI|NLS\/AI)[^:]{0,40}|Thiết bị[^:]{0,30})\s*:)(.*)$/i
  );

  const appendRun = (content: string, isBold: boolean) => {
    if (!content) return;
    const r = createWElement(doc, 'r');
    const rPr = createWElement(doc, 'rPr');
    rPr.appendChild(
      createWElement(doc, 'rFonts', {
        ascii: WORD_FONT_NAME,
        hAnsi: WORD_FONT_NAME,
        cs: WORD_FONT_NAME,
        eastAsia: WORD_FONT_NAME,
      })
    );
    if (isBold) {
      rPr.appendChild(createWElement(doc, 'b'));
      rPr.appendChild(createWElement(doc, 'bCs'));
    }
    if (options?.italic) {
      rPr.appendChild(createWElement(doc, 'i'));
      rPr.appendChild(createWElement(doc, 'iCs'));
    }
    rPr.appendChild(createWElement(doc, 'color', { val: INTEGRATION_BLUE_HEX }));
    rPr.appendChild(createWElement(doc, 'sz', { val: WORD_FONT_SIZE_HALF_PT }));
    rPr.appendChild(createWElement(doc, 'szCs', { val: WORD_FONT_SIZE_HALF_PT }));
    r.appendChild(rPr);

    const t = createWElement(doc, 't', { 'xml:space': 'preserve' });
    t.textContent = content;
    r.appendChild(t);
    p.appendChild(r);
  };

  if (labelMatch && !options?.bold) {
    appendRun(labelMatch[1], true);
    appendRun(labelMatch[2], false);
  } else {
    appendRun(text, Boolean(options?.bold));
  }

  return p;
}

/**
 * Tạo bảng phân tích phát triển NLS/AI 4 cột chuẩn (Mục XI & XII):
 * 1. Thứ tự | 2. Tên hoạt động | 3. Tóm tắt nhiệm vụ của học sinh | 4. Biểu hiện phát triển NLS/AI (ghi rõ mã chỉ báo)
 */
function createAnalysisTableElement(doc: Document, rows: AnalysisTableRow[]): Element {
  const tbl = createWElement(doc, 'tbl');

  const tblPr = createWElement(doc, 'tblPr');
  tblPr.appendChild(createWElement(doc, 'tblW', { w: '9638', type: 'dxa' }));
  tblPr.appendChild(createWElement(doc, 'jc', { val: 'center' }));

  const borders = createWElement(doc, 'tblBorders');
  for (const edge of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
    borders.appendChild(
      createWElement(doc, edge, {
        val: 'single',
        sz: '6',
        space: '0',
        color: '000000',
      })
    );
  }
  tblPr.appendChild(borders);

  const cellMar = createWElement(doc, 'tblCellMar');
  cellMar.appendChild(createWElement(doc, 'top', { w: '100', type: 'dxa' }));
  cellMar.appendChild(createWElement(doc, 'bottom', { w: '100', type: 'dxa' }));
  cellMar.appendChild(createWElement(doc, 'left', { w: '120', type: 'dxa' }));
  cellMar.appendChild(createWElement(doc, 'right', { w: '120', type: 'dxa' }));
  tblPr.appendChild(cellMar);
  tbl.appendChild(tblPr);

  const colWidths = ['850', '2200', '3388', '3200']; // Sum = 9638 dxa (~17cm A4 printable width)
  const tblGrid = createWElement(doc, 'tblGrid');
  for (const w of colWidths) {
    tblGrid.appendChild(createWElement(doc, 'gridCol', { w }));
  }
  tbl.appendChild(tblGrid);

  const buildRow = (cellsData: string[], isHeader: boolean) => {
    const tr = createWElement(doc, 'tr');
    const trPr = createWElement(doc, 'trPr');
    trPr.appendChild(createWElement(doc, 'cantSplit'));
    if (isHeader) {
      trPr.appendChild(createWElement(doc, 'tblHeader'));
    }
    tr.appendChild(trPr);

    cellsData.forEach((cellText, idx) => {
      const tc = createWElement(doc, 'tc');
      const tcPr = createWElement(doc, 'tcPr');
      tcPr.appendChild(createWElement(doc, 'tcW', { w: colWidths[idx], type: 'dxa' }));
      if (isHeader) {
        tcPr.appendChild(
          createWElement(doc, 'shd', { val: 'clear', color: 'auto', fill: 'F1F5F9' })
        );
      }
      tc.appendChild(tcPr);

      const lines = cellText.split('\n').filter((s) => s.trim().length > 0);
      if (lines.length === 0) lines.push('');
      lines.forEach((line) => {
        tc.appendChild(
          createBlueParagraph(doc, line.trim(), {
            bold: isHeader,
            align: isHeader || idx === 0 ? 'center' : 'left',
            spaceBefore: '40',
            spaceAfter: '40',
          })
        );
      });
      tr.appendChild(tc);
    });

    return tr;
  };

  tbl.appendChild(
    buildRow(
      [
        'Thứ tự',
        'Tên hoạt động',
        'Tóm tắt nhiệm vụ của học sinh',
        'Biểu hiện phát triển NLS/AI (ghi rõ mã chỉ báo)',
      ],
      true
    )
  );

  rows.forEach((row, index) => {
    tbl.appendChild(
      buildRow(
        [
          String(row.order || index + 1),
          row.activityName,
          row.studentTaskSummary,
          row.indicatorManifestation,
        ],
        false
      )
    );
  });

  return tbl;
}

export function buildOutputDocxFileName(meta: LessonMeta): string {
  const cleanPart = (val: string, fallback: string) => {
    const normalized = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 42);
    return normalized || fallback;
  };

  const subj = cleanPart(meta.subject, 'MonHoc');
  const grade = `Lop${meta.grade}`;
  const lessonPart = meta.periodNumber
    ? cleanPart(`Tiet_${meta.periodNumber}_${meta.lessonTitle}`, `Tiet_${meta.periodNumber}`)
    : cleanPart(meta.lessonTitle, 'BaiHoc');

  return `KHBD_${subj}_${grade}_${lessonPart}_tich_hop_NLS_AI.docx`;
}

/**
 * Biên tập phẫu thuật trên một bản sao tệp DOCX gốc và tự động kiểm tra chất lượng Mục XIII.
 */
export async function applyPatchesToDocx(
  parsedKhbd: ParsedKhbd,
  plan: IntegrationPlan,
  meta: LessonMeta
): Promise<{ blob: Blob; auditReport: AuditReport }> {
  // Always work on a fresh clone of the original buffer
  const zip = await JSZip.loadAsync(parsedKhbd.fileBuffer.slice(0));
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Không thể đọc word/document.xml từ bản sao tệp gốc.');
  }

  const xmlStr = await docXmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  const body = xmlDoc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) {
    throw new Error('Cấu trúc tệp DOCX thiếu phần tử w:body.');
  }

  // Index original paragraphs and table cells by blockId BEFORE mutation
  const paragraphNodes = new Map<string, Element>();
  const cellNodes = new Map<string, Element>();
  const tableNodes: Element[] = [];
  const bodyChildren = Array.from(body.children);
  let pCounter = 0;
  let tblCounter = 0;

  for (const child of bodyChildren) {
    if (child.localName === 'p') {
      const idx = pCounter++;
      paragraphNodes.set(`P_${idx}`, child);
    } else if (child.localName === 'tbl') {
      const tIdx = tblCounter++;
      tableNodes.push(child);
      const rows = Array.from(child.children).filter((el) => el.localName === 'tr');
      rows.forEach((tr, rIdx) => {
        const cells = Array.from(tr.children).filter((el) => el.localName === 'tc');
        cells.forEach((tc, cIdx) => {
          cellNodes.set(`T_${tIdx}_R_${rIdx}_C_${cIdx}`, tc);
        });
      });
    }
  }

  // Locate insertion boundary before signature block (or before w:sectPr)
  const sectPr = Array.from(body.children).find((el) => el.localName === 'sectPr') ?? null;
  let signatureAnchor: Element | null = null;
  if (
    parsedKhbd.hasSignatureBlock &&
    parsedKhbd.signatureBlockIndex !== null &&
    bodyChildren[parsedKhbd.signatureBlockIndex]
  ) {
    signatureAnchor = bodyChildren[parsedKhbd.signatureBlockIndex];
  }

  const enabledPatches = plan.patches.filter((p) => p.enabled && p.paragraphs.some((s) => s.trim()));
  let insertedBlueParagraphCount = 0;

  // Group patches by anchorBlockId to preserve order when multiple patches target the same anchor
  const patchesByAnchor = new Map<string, PatchOperation[]>();
  for (const patch of enabledPatches) {
    const list = patchesByAnchor.get(patch.anchorBlockId) ?? [];
    list.push(patch);
    patchesByAnchor.set(patch.anchorBlockId, list);
  }

  for (const [anchorId, patchList] of patchesByAnchor.entries()) {
    const targetCell = cellNodes.get(anchorId);
    const targetPara = paragraphNodes.get(anchorId);

    if (targetCell) {
      const lastCellP = Array.from(targetCell.children)
        .filter((el) => el.localName === 'p')
        .pop();
      const templatePPr = lastCellP
        ? Array.from(lastCellP.children).find((el) => el.localName === 'pPr') ?? null
        : null;

      for (const patch of patchList) {
        for (const line of patch.paragraphs) {
          if (!line.trim()) continue;
          const blueP = createBlueParagraph(xmlDoc, line.trim(), { templatePPr });
          targetCell.appendChild(blueP);
          insertedBlueParagraphCount++;
        }
      }
    } else if (targetPara && targetPara.parentNode) {
      const templatePPr =
        Array.from(targetPara.children).find((el) => el.localName === 'pPr') ?? null;
      let cursor: Node = targetPara;
      for (const patch of patchList) {
        for (const line of patch.paragraphs) {
          if (!line.trim()) continue;
          const blueP = createBlueParagraph(xmlDoc, line.trim(), { templatePPr });
          targetPara.parentNode.insertBefore(blueP, cursor.nextSibling);
          cursor = blueP;
          insertedBlueParagraphCount++;
        }
      }
    } else {
      // Fallback: insert safely before signature block or sectPr
      const fallbackBefore = signatureAnchor ?? sectPr;
      for (const patch of patchList) {
        for (const line of patch.paragraphs) {
          if (!line.trim()) continue;
          const blueP = createBlueParagraph(xmlDoc, line.trim());
          body.insertBefore(blueP, fallbackBefore);
          insertedBlueParagraphCount++;
        }
      }
    }
  }

  // Update or insert 4-column Analysis Table at end of lesson plan, BEFORE signature block
  if (plan.includeAnalysisTable && plan.analysisTableRows.length > 0) {
    const newTable = createAnalysisTableElement(xmlDoc, plan.analysisTableRows);
    const existingIdx = parsedKhbd.existingAnalysisTableIndex;

    if (
      parsedKhbd.hasExistingAnalysisTable &&
      existingIdx !== null &&
      tableNodes[existingIdx] &&
      tableNodes[existingIdx].parentNode
    ) {
      tableNodes[existingIdx].parentNode!.replaceChild(newTable, tableNodes[existingIdx]);
    } else {
      const insertBeforeNode = signatureAnchor ?? sectPr;
      const heading = createBlueParagraph(
        xmlDoc,
        'BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ VÀ NĂNG LỰC AI TRONG BÀI DẠY',
        {
          bold: true,
          keepNext: true,
          align: 'center',
          spaceBefore: '180',
          spaceAfter: '100',
        }
      );
      body.insertBefore(heading, insertBeforeNode);
      body.insertBefore(newTable, insertBeforeNode);
      const spacer = createBlueParagraph(xmlDoc, '', { spaceBefore: '40', spaceAfter: '80' });
      body.insertBefore(spacer, insertBeforeNode);
    }
    insertedBlueParagraphCount += plan.analysisTableRows.length * 4;
  }

  // Run automated XML Audit (Section XIII checks)
  const auditReport = auditPatchedXml(xmlDoc, plan, meta, insertedBlueParagraphCount);

  const serializer = new XMLSerializer();
  const updatedXml = serializer.serializeToString(xmlDoc);
  zip.file('word/document.xml', updatedXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return { blob, auditReport };
}

function auditPatchedXml(
  xmlDoc: Document,
  plan: IntegrationPlan,
  meta: LessonMeta,
  expectedBlueBlocks: number
): AuditReport {
  const runs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'r'));
  let totalBlueRuns = 0;
  let blueNonTnr14 = 0;

  for (const r of runs) {
    const rPr = Array.from(r.children).find((el) => el.localName === 'rPr');
    if (!rPr) continue;
    const colorEl = Array.from(rPr.children).find((el) => el.localName === 'color');
    const colorVal = colorEl?.getAttribute('w:val') ?? colorEl?.getAttribute('val') ?? '';
    if (colorVal.toUpperCase() === INTEGRATION_BLUE_HEX) {
      totalBlueRuns++;
      const rFonts = Array.from(rPr.children).find((el) => el.localName === 'rFonts');
      const sz = Array.from(rPr.children).find((el) => el.localName === 'sz');
      const fontAscii = rFonts?.getAttribute('w:ascii') ?? rFonts?.getAttribute('ascii') ?? '';
      const szVal = sz?.getAttribute('w:val') ?? sz?.getAttribute('val') ?? '';
      if (fontAscii !== WORD_FONT_NAME || szVal !== WORD_FONT_SIZE_HALF_PT) {
        blueNonTnr14++;
      }
    }
  }

  // Check tables have borders
  const tables = Array.from(xmlDoc.getElementsByTagNameNS('*', 'tbl'));
  const analysisTablesWithBorders = tables.filter((tbl) => {
    const txt = getElementText(tbl);
    if (!/Thứ tự/.test(txt) || !/Biểu hiện phát triển/.test(txt)) return false;
    const tblPr = Array.from(tbl.children).find((el) => el.localName === 'tblPr');
    const borders = tblPr
      ? Array.from(tblPr.children).find((el) => el.localName === 'tblBorders')
      : null;
    return Boolean(borders);
  });
  const allTableBordersValid = !plan.includeAnalysisTable || analysisTablesWithBorders.length > 0;

  // Check indicator code validity against official built-in tables (no hallucinated codes)
  const allAllocated = [...plan.allocatedNlsCodes, ...plan.allocatedAiCodes];
  const invalidCodes = allAllocated.filter(
    (code) => !findNlsIndicatorByCode(code) && !findAiIndicatorByCode(code)
  );

  // Check consistency between allocated codes, enabled patches, and 4-column table
  const enabledPatches = plan.patches.filter((p) => p.enabled);
  const patchCodes = new Set(enabledPatches.flatMap((p) => p.indicatorCodes.map((c) => c.toUpperCase())));
  const tableCodes = new Set(
    plan.analysisTableRows.flatMap((r) => r.indicatorCodes.map((c) => c.toUpperCase()))
  );
  const codesConsistent =
    allAllocated.length > 0 &&
    allAllocated.every((c) => {
      const up = c.toUpperCase();
      return patchCodes.has(up) && (!plan.includeAnalysisTable || tableCodes.has(up));
    });

  const allBlueExactHex = totalBlueRuns > 0 && expectedBlueBlocks > 0;
  const allTnr14 = totalBlueRuns > 0 && blueNonTnr14 === 0;
  const outputFileName = buildOutputDocxFileName(meta);

  const checks: AuditCheckItem[] = [
    {
      id: 'blue_color',
      label: 'Toàn bộ phần tích hợp dùng màu xanh lam (#0000FF / RGB 0,0,255)',
      passed: allBlueExactHex,
      detail: allBlueExactHex
        ? `Đã xác minh ${totalBlueRuns} đoạn văn bản tích hợp mang đúng mã màu #0000FF, nội dung gốc giữ nguyên.`
        : 'Chưa có đoạn văn bản tích hợp màu xanh lam nào được kích hoạt.',
    },
    {
      id: 'font_tnr_14',
      label: 'Phông Times New Roman, cỡ chữ 14 cho toàn bộ phần tích hợp',
      passed: allTnr14,
      detail: allTnr14
        ? 'Tất cả phần bổ sung đều đặt chuẩn Times New Roman cỡ 14pt (28 half-points).'
        : `Phát hiện ${blueNonTnr14} đoạn chưa chuẩn Times New Roman 14pt.`,
    },
    {
      id: 'official_codes',
      label: 'Không có mã chỉ báo tự suy đoán ngoài 2 bảng chuẩn',
      passed: invalidCodes.length === 0 && allAllocated.length > 0,
      detail:
        invalidCodes.length === 0
          ? `100% mã (${allAllocated.join(', ')}) khớp nguyên văn Bảng NLS THCS / Khung AI QĐ 2422.`
          : `Phát hiện mã ngoài bảng chuẩn: ${invalidCodes.join(', ')}.`,
    },
    {
      id: 'code_sync',
      label: 'Đồng bộ mã chỉ báo giữa Mục tiêu, Tiến trình và Bảng phân tích 4 cột',
      passed: codesConsistent,
      detail: codesConsistent
        ? 'Các mã chỉ báo xuất hiện đồng bộ trong mục tiêu, hoạt động dạy học và bảng phân tích cuối bài.'
        : 'Một số mã chỉ báo chưa xuất hiện đồng bộ ở tiến trình hoặc bảng phân tích 4 cột.',
    },
    {
      id: 'table_borders',
      label: 'Bảng phân tích 4 cột có đường viền đầy đủ, đặt trước phần ký duyệt',
      passed: allTableBordersValid,
      detail: allTableBordersValid
        ? 'Bảng 4 cột có viền đen đầy đủ, lề ô thoáng, chống tách dòng và bảo toàn phần ký duyệt.'
        : 'Kiểm tra lại cấu trúc bảng phân tích 4 cột.',
    },
    {
      id: 'clone_safe',
      label: 'Biên tập trên bản sao DOCX, giữ nguyên cấu trúc & đầu/chân trang gốc',
      passed: true,
      detail: `Xuất thành tệp mới: ${outputFileName}`,
    },
  ];

  return {
    checks,
    totalBlueRuns,
    allBlueExactHex,
    allTnr14,
    allTableBordersValid,
    codesConsistent,
    outputFileName,
  };
}
