import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import type { GradeLevel, PpctRecord } from '../types/khbd';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const DB_NAME = 'khbd_so_thcs_ppct_db';
const DB_VERSION = 1;
const STORE_NAME = 'ppct_records';

export interface StorageCapability {
  supported: boolean;
  reason?: string;
}

export async function checkIndexedDbSupport(): Promise<StorageCapability> {
  if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
    return {
      supported: false,
      reason:
        'Trình duyệt hiện tại không hỗ trợ IndexedDB. Tệp PPCT không thể lưu bền vững và sẽ cần cung cấp lại ở phiên làm việc sau.',
    };
  }
  try {
    const db = await openDb();
    db.close();
    return { supported: true };
  } catch (err) {
    return {
      supported: false,
      reason:
        err instanceof Error
          ? `Không thể mở bộ nhớ IndexedDB trên trình duyệt (${err.message}). Tệp PPCT chỉ dùng trong phiên hiện tại và cần cung cấp lại ở lần làm việc sau.`
          : 'Không thể truy cập IndexedDB trên trình duyệt (có thể đang ở chế độ ẩn danh hoặc bị chặn lưu trữ).',
    };
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('subject_grade', ['subject', 'grade'], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function getAllPpctRecords(): Promise<PpctRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const records = (req.result as PpctRecord[]).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      db.close();
      resolve(records);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('Không thể đọc danh sách PPCT từ IndexedDB.'));
    };
  });
}

export async function savePpctRecord(record: PpctRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Không thể lưu tệp PPCT vào IndexedDB.'));
    };
  });
}

export async function deletePpctRecord(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Không thể xóa PPCT khỏi IndexedDB.'));
    };
  });
}

export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findMatchingPpcts(
  records: PpctRecord[],
  subject: string,
  grade: GradeLevel
): PpctRecord[] {
  const normTarget = normalizeVietnamese(subject);
  if (!normTarget) {
    return records.filter((r) => r.grade === grade);
  }
  return records.filter((r) => {
    if (r.grade !== grade) return false;
    const normRec = normalizeVietnamese(r.subject);
    return (
      normRec === normTarget ||
      normRec.includes(normTarget) ||
      normTarget.includes(normRec)
    );
  });
}

export function findDuplicatePpct(
  records: PpctRecord[],
  subject: string,
  grade: GradeLevel,
  schoolYear: string,
  excludeId?: string
): PpctRecord | undefined {
  const normSubj = normalizeVietnamese(subject);
  const normYear = schoolYear.trim().toLowerCase();
  return records.find(
    (r) =>
      r.id !== excludeId &&
      r.grade === grade &&
      normalizeVietnamese(r.subject) === normSubj &&
      r.schoolYear.trim().toLowerCase() === normYear
  );
}

/**
 * Trích xuất văn bản có giữ cấu trúc hàng/cột bảng từ tệp PPCT Word (.docx)
 */
export async function extractTextFromDocxFile(file: File | Blob): Promise<{
  text: string;
  lineCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Tệp DOCX không hợp lệ hoặc bị hỏng (thiếu word/document.xml).');
  }
  const xmlStr = await docXmlFile.async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'application/xml');
  const body = doc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) {
    throw new Error('Không đọc được nội dung văn bản trong tệp DOCX.');
  }

  const lines: string[] = [];

  const getParagraphText = (p: Element): string => {
    const texts: string[] = [];
    const nodes = p.getElementsByTagName('*');
    for (let i = 0; i < nodes.length; i++) {
      const local = nodes[i].localName;
      if (local === 't') {
        texts.push(nodes[i].textContent ?? '');
      } else if (local === 'tab') {
        texts.push('\t');
      } else if (local === 'br') {
        texts.push(' ');
      }
    }
    return texts.join('').replace(/\s+/g, ' ').trim();
  };

  for (let i = 0; i < body.children.length; i++) {
    const child = body.children[i];
    if (child.localName === 'p') {
      const t = getParagraphText(child);
      if (t) lines.push(t);
    } else if (child.localName === 'tbl') {
      const rows = Array.from(child.children).filter((el) => el.localName === 'tr');
      for (const tr of rows) {
        const cells = Array.from(tr.children).filter((el) => el.localName === 'tc');
        const cellTexts = cells.map((tc) => {
          const ps = Array.from(tc.getElementsByTagName('*')).filter((el) => el.localName === 'p');
          return ps
            .map(getParagraphText)
            .filter(Boolean)
            .join(' ; ');
        });
        const rowLine = cellTexts.join(' | ').trim();
        if (rowLine.replace(/\|/g, '').trim()) {
          lines.push(rowLine);
        }
      }
    }
  }

  if (lines.length === 0) {
    throw new Error('Tệp PPCT Word không có nội dung văn bản đọc được.');
  }

  return {
    text: lines.join('\n'),
    lineCount: lines.length,
  };
}

/**
 * Trích xuất văn bản từng trang từ tệp PPCT PDF (.pdf) ngay trên trình duyệt
 */
export async function extractTextFromPdfFile(file: File | Blob): Promise<{
  text: string;
  lineCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pageLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const rowBuckets = new Map<number, { x: number; text: string }[]>();

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const transform = item.transform as number[];
      const x = transform[4] ?? 0;
      const y = Math.round((transform[5] ?? 0) / 4) * 4;
      const bucket = rowBuckets.get(y) ?? [];
      bucket.push({ x, text: item.str });
      rowBuckets.set(y, bucket);
    }

    const sortedYs = Array.from(rowBuckets.keys()).sort((a, b) => b - a);
    pageLines.push(`--- Trang ${pageNum} ---`);
    for (const y of sortedYs) {
      const items = (rowBuckets.get(y) ?? []).sort((a, b) => a.x - b.x);
      const line = items.map((it) => it.text).join(' ').replace(/\s+/g, ' ').trim();
      if (line) pageLines.push(line);
    }
  }

  const meaningful = pageLines.filter((l) => !l.startsWith('--- Trang'));
  if (meaningful.length === 0) {
    throw new Error(
      'Không trích xuất được chữ từ tệp PDF (có thể là tệp PDF quét dạng ảnh). Vui lòng dùng tệp PDF có lớp văn bản hoặc bản Word (.docx).'
    );
  }

  return {
    text: pageLines.join('\n'),
    lineCount: meaningful.length,
  };
}

export async function extractTextFromPpctFile(file: File): Promise<{
  fileType: 'docx' | 'pdf';
  text: string;
  lineCount: number;
}> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.docx')) {
    const res = await extractTextFromDocxFile(file);
    return { fileType: 'docx', ...res };
  }
  if (lower.endsWith('.pdf')) {
    const res = await extractTextFromPdfFile(file);
    return { fileType: 'pdf', ...res };
  }
  throw new Error('Chỉ hỗ trợ tệp PPCT định dạng Word (.docx) hoặc PDF (.pdf).');
}
