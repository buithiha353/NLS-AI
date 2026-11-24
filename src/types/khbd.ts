export type GradeLevel = 6 | 7 | 8 | 9;

export type IntegrationScope = 'nls' | 'ai' | 'both';

export type RoomType = 'regular' | 'computer_lab';

export interface NlsIndicator {
  code: string;
  gradeGroup: '6-7' | '8-9';
  gradeLabel: string;
  level: 'TC1' | 'TC2';
  domainCode: string;
  domainName: string;
  detail: string;
}

export interface AiIndicator {
  code: string;
  grade: GradeLevel;
  domainCode: 'A' | 'B' | 'C' | 'D';
  domainName: string;
  topicCode: string;
  topicName: string;
  contentTitle: string;
  isExtended: boolean;
  detail: string;
}

export interface PpctRecord {
  id: string;
  subject: string;
  grade: GradeLevel;
  textbook: string;
  schoolYear: string;
  fileName: string;
  fileType: 'docx' | 'pdf';
  version: string;
  updatedAt: string;
  fileBlob: Blob;
  extractedText: string;
  lineCount: number;
}

export interface DocBlock {
  blockId: string;
  kind: 'paragraph' | 'table_cell';
  sectionHint: string;
  text: string;
  tableIndex?: number;
  rowIndex?: number;
  cellIndex?: number;
}

export interface ParsedKhbd {
  fileName: string;
  fileSize: number;
  fileBuffer: ArrayBuffer;
  blocks: DocBlock[];
  fullText: string;
  hasExistingAnalysisTable: boolean;
  existingAnalysisTableIndex: number | null;
  hasSignatureBlock: boolean;
  signatureBlockIndex: number | null;
  detectedHints: {
    subject: string;
    grade: GradeLevel | null;
    lessonTitle: string;
    periodNumber: string;
    textbook: string;
  };
}

export interface LessonMeta {
  scope: IntegrationScope;
  subject: string;
  grade: GradeLevel;
  lessonTitle: string;
  periodNumber: string;
  textbook: string;
}

export interface EquipmentCondition {
  roomType: RoomType;
  teacherComputerCount: number;
  hasProjectorOrTv: boolean;
  hasInternet: boolean;
  studentDevices: 'none' | 'shared_groups' | 'individual_computers' | 'student_personal';
  details: string;
}

export type PatchCategory =
  | 'objectives'
  | 'equipment'
  | 'activity'
  | 'product'
  | 'assessment';

export interface PatchOperation {
  id: string;
  category: PatchCategory;
  categoryLabel: string;
  anchorBlockId: string;
  position: 'after' | 'append_in_cell';
  indicatorCodes: string[];
  activityName: string;
  paragraphs: string[];
  enabled: boolean;
}

export interface AnalysisTableRow {
  order: number;
  activityName: string;
  studentTaskSummary: string;
  indicatorManifestation: string;
  indicatorCodes: string[];
}

export interface IntegrationPlan {
  feasible: boolean;
  stopReason: string;
  suggestedAlternative: string;
  matchedPpctPeriod: string;
  matchedPpctExcerpt: string;
  allocatedNlsCodes: string[];
  allocatedAiCodes: string[];
  rejectedCodesFromModel?: string[];
  patches: PatchOperation[];
  analysisTableRows: AnalysisTableRow[];
  includeAnalysisTable: boolean;
  summary: {
    periodsAndActivities: string;
    keyAdditions: string[];
  };
}

export interface AuditCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface AuditReport {
  checks: AuditCheckItem[];
  totalBlueRuns: number;
  allBlueExactHex: boolean;
  allTnr14: boolean;
  allTableBordersValid: boolean;
  codesConsistent: boolean;
  outputFileName: string;
}
