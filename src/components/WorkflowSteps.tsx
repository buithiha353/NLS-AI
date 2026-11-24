import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Laptop,
  Loader2,
  Monitor,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  EquipmentCondition,
  GradeLevel,
  IntegrationScope,
  LessonMeta,
  ParsedKhbd,
  PpctRecord,
} from '../types/khbd';
import {
  extractTextFromPpctFile,
  findDuplicatePpct,
  findMatchingPpcts,
  type StorageCapability,
} from '../services/ppctStorage';

interface WorkflowStepsProps {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  parsedKhbd: ParsedKhbd | null;
  onUploadKhbd: (file: File) => Promise<void>;
  khbdError: string | null;
  isParsingKhbd: boolean;
  lessonMeta: LessonMeta;
  onChangeLessonMeta: (meta: LessonMeta) => void;
  ppctRecords: PpctRecord[];
  storageCapability: StorageCapability;
  selectedPpctId: string | null;
  onSelectPpct: (id: string | null) => void;
  onSaveNewPpct: (record: PpctRecord, replaceExistingId?: string) => Promise<void>;
  equipment: EquipmentCondition;
  equipmentConfirmed: boolean;
  onChangeEquipment: (eq: EquipmentCondition) => void;
  onConfirmEquipmentChange: (confirmed: boolean) => void;
  onRunAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  analysisError: string | null;
}

const SCOPE_OPTIONS: { id: IntegrationScope; title: string; desc: string }[] = [
  {
    id: 'nls',
    title: 'Chỉ năng lực số (NLS)',
    desc: 'Đối chiếu Bảng chỉ báo NLS THCS (TC1/TC2).',
  },
  {
    id: 'ai',
    title: 'Chỉ năng lực AI',
    desc: 'Đối chiếu Khung nội dung AI QĐ 2422 (Cốt lõi & MR).',
  },
  {
    id: 'both',
    title: 'Cả năng lực số và năng lực AI',
    desc: 'Tích hợp đồng bộ cả 2 khung theo đúng phân bổ PPCT.',
  },
];

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  step,
  onStepChange,
  parsedKhbd,
  onUploadKhbd,
  khbdError,
  isParsingKhbd,
  lessonMeta,
  onChangeLessonMeta,
  ppctRecords,
  storageCapability,
  selectedPpctId,
  onSelectPpct,
  onSaveNewPpct,
  equipment,
  equipmentConfirmed,
  onChangeEquipment,
  onConfirmEquipmentChange,
  onRunAnalysis,
  isAnalyzing,
  analysisError,
}) => {
  const khbdInputRef = useRef<HTMLInputElement | null>(null);
  const ppctFileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline PPCT upload state in Step 2
  const [showInlinePpctUpload, setShowInlinePpctUpload] = useState(false);
  const [ppctFile, setPpctFile] = useState<File | null>(null);
  const [ppctSchoolYear, setPpctSchoolYear] = useState('2026-2027');
  const [ppctVersion, setPpctVersion] = useState('v1.0');
  const [ppctTextbook, setPpctTextbook] = useState(lessonMeta.textbook || 'Kết nối tri thức với cuộc sống');
  const [isParsingPpct, setIsParsingPpct] = useState(false);
  const [ppctUploadError, setPpctUploadError] = useState<string | null>(null);
  const [pendingPpct, setPendingPpct] = useState<PpctRecord | null>(null);
  const [duplicatePpct, setDuplicatePpct] = useState<PpctRecord | null>(null);

  const matchingPpcts = findMatchingPpcts(ppctRecords, lessonMeta.subject, lessonMeta.grade);
  const selectedPpct = ppctRecords.find((r) => r.id === selectedPpctId) ?? null;

  // Step 2 auto-check behavior (Rule II.2.6, II.2.8, III.1):
  // - If exactly 1 matching PPCT exists and none is selected, select it automatically.
  // - If >1 matching PPCTs exist, DO NOT auto-select; let user choose explicitly.
  useEffect(() => {
    if (step !== 2) return;
    if (lessonMeta.textbook) setPpctTextbook(lessonMeta.textbook);

    if (matchingPpcts.length === 1) {
      if (!selectedPpctId || !matchingPpcts.some((r) => r.id === selectedPpctId)) {
        onSelectPpct(matchingPpcts[0].id);
      }
      setShowInlinePpctUpload(false);
    } else if (matchingPpcts.length > 1) {
      if (selectedPpctId && !matchingPpcts.some((r) => r.id === selectedPpctId)) {
        onSelectPpct(null);
      }
    } else {
      if (selectedPpctId && !ppctRecords.some((r) => r.id === selectedPpctId)) {
        onSelectPpct(null);
      }
      setShowInlinePpctUpload(true);
    }
  }, [step, lessonMeta.subject, lessonMeta.grade, matchingPpcts.length]);

  const handleKhbdDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await onUploadKhbd(f);
  };

  const handleInlinePpctSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPpctUploadError(null);
    if (!ppctFile) {
      setPpctUploadError('Vui lòng chọn tệp PPCT (.docx hoặc .pdf).');
      return;
    }

    setIsParsingPpct(true);
    try {
      const extracted = await extractTextFromPpctFile(ppctFile);
      const record: PpctRecord = {
        id: `ppct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        subject: lessonMeta.subject.trim() || 'Môn học THCS',
        grade: lessonMeta.grade,
        textbook: ppctTextbook.trim() || lessonMeta.textbook || 'GDPT 2018',
        schoolYear: ppctSchoolYear.trim() || '2026-2027',
        fileName: ppctFile.name,
        fileType: extracted.fileType,
        version: ppctVersion.trim() || 'v1.0',
        updatedAt: new Date().toISOString(),
        fileBlob: ppctFile,
        extractedText: extracted.text,
        lineCount: extracted.lineCount,
      };

      const dup = findDuplicatePpct(ppctRecords, record.subject, record.grade, record.schoolYear);
      if (dup) {
        setPendingPpct(record);
        setDuplicatePpct(dup);
      } else {
        await onSaveNewPpct(record);
        onSelectPpct(record.id);
        setPpctFile(null);
        setShowInlinePpctUpload(false);
        if (ppctFileInputRef.current) ppctFileInputRef.current.value = '';
      }
    } catch (err) {
      setPpctUploadError(err instanceof Error ? err.message : 'Không thể đọc tệp PPCT.');
    } finally {
      setIsParsingPpct(false);
    }
  };

  const applyEquipmentPreset = (preset: 'teacher_only' | 'lab' | 'no_internet') => {
    if (preset === 'teacher_only') {
      onChangeEquipment({
        roomType: 'regular',
        teacherComputerCount: 1,
        hasProjectorOrTv: true,
        hasInternet: true,
        studentDevices: 'none',
        details:
          'Lớp học thường có 1 máy tính của giáo viên kết nối Internet và máy chiếu/tivi lớn. Học sinh không sử dụng điện thoại hay máy tính cá nhân.',
      });
    } else if (preset === 'lab') {
      onChangeEquipment({
        roomType: 'computer_lab',
        teacherComputerCount: 1,
        hasProjectorOrTv: true,
        hasInternet: true,
        studentDevices: 'individual_computers',
        details:
          'Phòng máy tính có máy tính cho học sinh (cá nhân hoặc 2 HS/máy), kết nối Internet và máy chiếu của giáo viên.',
      });
    } else {
      onChangeEquipment({
        roomType: 'regular',
        teacherComputerCount: 1,
        hasProjectorOrTv: true,
        hasInternet: false,
        studentDevices: 'none',
        details:
          'Phòng học thường có 1 máy tính giáo viên và máy chiếu, không có kết nối Internet trực tiếp trên lớp (chỉ dùng học liệu/mô phỏng ngoại tuyến hoặc phiếu học tập).',
      });
    }
    onConfirmEquipmentChange(true);
  };

  const canProceedStep1 =
    Boolean(parsedKhbd) &&
    lessonMeta.subject.trim().length > 0 &&
    lessonMeta.lessonTitle.trim().length > 0;

  const canProceedStep2 = Boolean(selectedPpct);

  return (
    <div className="max-w-5xl mx-auto">
      {/* ==================== STEP 1: UPLOAD KHBD & METADATA ==================== */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">
              01. Tải tệp Kế hoạch bài dạy (DOCX) &amp; Thông tin bài dạy
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Hệ thống luôn thao tác trên một bản sao mới của tệp KHBD bạn cung cấp, giữ nguyên bố cục, hình ảnh, công thức và phần ký duyệt gốc.
            </p>
          </div>

          {/* Dropzone */}
          <div className="mt-6">
            <input
              ref={khbdInputRef}
              type="file"
              accept=".docx"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onUploadKhbd(f);
              }}
              className="hidden"
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleKhbdDrop}
              onClick={() => khbdInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-7 text-center transition-colors cursor-pointer ${
                parsedKhbd
                  ? 'border-[#1D4ED8]/50 bg-[#1D4ED8]/[0.02]'
                  : 'border-slate-300 hover:border-[#1D4ED8] bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              {isParsingKhbd ? (
                <div className="flex flex-col items-center py-2">
                  <Loader2 className="w-7 h-7 text-[#1D4ED8] animate-spin" />
                  <p className="mt-2.5 text-sm font-medium text-slate-800">
                    Đang đọc cấu trúc XML của tệp KHBD...
                  </p>
                </div>
              ) : parsedKhbd ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {parsedKhbd.fileName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {(parsedKhbd.fileSize / 1024).toFixed(1)} KB · {parsedKhbd.blocks.length} đoạn/ô nội dung
                        {parsedKhbd.hasSignatureBlock ? ' · Đã nhận diện phần ký duyệt' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-2 text-xs font-medium text-[#1D4ED8] bg-white border border-slate-200 rounded-lg whitespace-nowrap shrink-0">
                    Đổi tệp KHBD khác
                  </span>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="mt-2.5 text-sm font-semibold text-slate-800">
                    Kéo thả hoặc nhấn để chọn tệp KHBD (.docx)
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Chỉ hỗ trợ định dạng Microsoft Word (.docx). Tệp mới sẽ thay thế hoàn toàn KHBD trước đó.
                  </p>
                </div>
              )}
            </div>

            {khbdError && (
              <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{khbdError}</span>
              </div>
            )}
          </div>

          {/* Scope selector */}
          <div className="mt-7">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Phạm vi tích hợp
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SCOPE_OPTIONS.map((opt) => {
                const active = lessonMeta.scope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeLessonMeta({ ...lessonMeta, scope: opt.id })}
                    className={`p-4 text-left rounded-lg border transition-all cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{opt.title}</div>
                    <div className="mt-1 text-xs text-slate-600 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson metadata fields */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="meta-subject" className="block text-xs font-medium text-slate-700 mb-1.5">
                Môn học <span className="text-red-600">*</span>
              </label>
              <input
                id="meta-subject"
                type="text"
                value={lessonMeta.subject}
                onChange={(e) => onChangeLessonMeta({ ...lessonMeta, subject: e.target.value })}
                placeholder="Ví dụ: Khoa học tự nhiên, Toán, Tin học..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div>
              <label htmlFor="meta-grade" className="block text-xs font-medium text-slate-700 mb-1.5">
                Khối lớp <span className="text-red-600">*</span>
              </label>
              <select
                id="meta-grade"
                value={lessonMeta.grade}
                onChange={(e) =>
                  onChangeLessonMeta({ ...lessonMeta, grade: Number(e.target.value) as GradeLevel })
                }
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value={6}>Lớp 6 (NLS TC1 · AI Lớp 6)</option>
                <option value={7}>Lớp 7 (NLS TC1 · AI Lớp 7)</option>
                <option value={8}>Lớp 8 (NLS TC2 · AI Lớp 8)</option>
                <option value={9}>Lớp 9 (NLS TC2 · AI Lớp 9)</option>
              </select>
            </div>

            <div>
              <label htmlFor="meta-period" className="block text-xs font-medium text-slate-700 mb-1.5">
                Tiết PPCT
              </label>
              <input
                id="meta-period"
                type="text"
                value={lessonMeta.periodNumber}
                onChange={(e) => onChangeLessonMeta({ ...lessonMeta, periodNumber: e.target.value })}
                placeholder="Ví dụ: Tiết 14 hoặc Tiết 14, 15"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8] font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meta-lesson" className="block text-xs font-medium text-slate-700 mb-1.5">
                Tên bài hoặc chủ đề <span className="text-red-600">*</span>
              </label>
              <input
                id="meta-lesson"
                type="text"
                value={lessonMeta.lessonTitle}
                onChange={(e) => onChangeLessonMeta({ ...lessonMeta, lessonTitle: e.target.value })}
                placeholder="Ví dụ: Bài 12: Tế bào - Đơn vị cơ sở của sự sống"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div>
              <label htmlFor="meta-textbook" className="block text-xs font-medium text-slate-700 mb-1.5">
                Bộ sách giáo khoa
              </label>
              <input
                id="meta-textbook"
                type="text"
                value={lessonMeta.textbook}
                onChange={(e) => onChangeLessonMeta({ ...lessonMeta, textbook: e.target.value })}
                placeholder="Kết nối tri thức / Chân trời sáng tạo..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {canProceedStep1
                ? 'Đã sẵn sàng đối chiếu Phân phối chương trình trong bộ nhớ trình duyệt.'
                : 'Vui lòng tải tệp KHBD (.docx), nhập Môn học và Tên bài để tiếp tục.'}
            </span>
            <button
              type="button"
              disabled={!canProceedStep1}
              onClick={() => onStepChange(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Kiểm tra PPCT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: CHECK & SELECT PPCT ==================== */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                02. Kiểm tra &amp; Đối chiếu Phân phối chương trình (PPCT)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Đang tìm PPCT phù hợp cho{' '}
                <strong className="text-slate-900">
                  {lessonMeta.subject} · Lớp {lessonMeta.grade}
                </strong>{' '}
                trong IndexedDB của trình duyệt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInlinePpctUpload((v) => !v)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showInlinePpctUpload ? 'Ẩn khung tải PPCT mới' : 'Tải lên phiên bản PPCT mới'}
            </button>
          </div>

          {!storageCapability.supported && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Trình duyệt không hỗ trợ lưu PPCT bền vững</p>
                <p className="mt-0.5 text-xs text-amber-800">{storageCapability.reason}</p>
              </div>
            </div>
          )}

          {/* Auto-match status */}
          <div className="mt-6">
            {matchingPpcts.length === 1 && selectedPpct && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-950">
                    Đang sử dụng PPCT đã lưu: {selectedPpct.fileName}
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 font-mono tabular-nums">
                    {selectedPpct.subject} · Lớp {selectedPpct.grade} · {selectedPpct.textbook} · Năm học{' '}
                    {selectedPpct.schoolYear} · Cập nhật{' '}
                    {new Date(selectedPpct.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            )}

            {matchingPpcts.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  Tìm thấy {matchingPpcts.length} tệp PPCT phù hợp cho {lessonMeta.subject} lớp{' '}
                  {lessonMeta.grade}. Vui lòng chọn đúng bản muốn đối chiếu:
                </p>
                <div className="space-y-2.5">
                  {matchingPpcts.map((rec) => {
                    const checked = selectedPpctId === rec.id;
                    return (
                      <label
                        key={rec.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="matching-ppct"
                          checked={checked}
                          onChange={() => onSelectPpct(rec.id)}
                          className="mt-1 accent-[#1D4ED8]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">{rec.fileName}</div>
                          <div className="text-xs text-slate-600 mt-0.5 font-mono tabular-nums">
                            {rec.textbook} · Năm học {rec.schoolYear} · Phiên bản {rec.version || '—'} · Cập nhật{' '}
                            {new Date(rec.updatedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {matchingPpcts.length === 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  Chưa có PPCT phù hợp cho {lessonMeta.subject} lớp {lessonMeta.grade} trong trình duyệt
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Vui lòng tải lên tệp PPCT (Word .docx hoặc PDF .pdf) bên dưới. Hệ thống sẽ đọc đầy đủ và lưu vào IndexedDB để tự động dùng lại cho các tiết sau.
                </p>
              </div>
            )}
          </div>

          {/* Inline PPCT Upload Form */}
          {showInlinePpctUpload && (
            <form
              onSubmit={handleInlinePpctSubmit}
              className="mt-6 p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4"
            >
              <div className="text-sm font-semibold text-slate-900">
                Tải lên tệp PPCT cho {lessonMeta.subject} · Lớp {lessonMeta.grade}
              </div>

              <div>
                <input
                  ref={ppctFileInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  onChange={(e) => {
                    setPpctFile(e.target.files?.[0] ?? null);
                    setPpctUploadError(null);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ppctFileInputRef.current?.click()}
                  className="w-full py-4 px-4 border border-dashed border-slate-300 hover:border-[#1D4ED8] bg-white rounded-lg flex items-center justify-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">
                    {ppctFile ? ppctFile.name : 'Chọn tệp PPCT (.docx hoặc .pdf)'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bộ sách</label>
                  <input
                    type="text"
                    value={ppctTextbook}
                    onChange={(e) => setPpctTextbook(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={ppctSchoolYear}
                    onChange={(e) => setPpctSchoolYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phiên bản</label>
                  <input
                    type="text"
                    value={ppctVersion}
                    onChange={(e) => setPpctVersion(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              {ppctUploadError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {ppctUploadError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isParsingPpct}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {isParsingPpct ? 'Đang đọc tệp PPCT...' : 'Đọc và lưu PPCT vào trình duyệt'}
                </button>
              </div>
            </form>
          )}

          {/* Fallback option to pick from other stored PPCTs if subject naming differs slightly */}
          {matchingPpcts.length === 0 && ppctRecords.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Hoặc chọn từ các PPCT khác đã lưu trên trình duyệt:
              </label>
              <select
                value={selectedPpctId ?? ''}
                onChange={(e) => onSelectPpct(e.target.value || null)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="">-- Chọn một tệp PPCT đã lưu --</option>
                {ppctRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.subject} · Lớp {r.grade} · {r.fileName} ({r.schoolYear})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onStepChange(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 1</span>
            </button>
            <button
              type="button"
              disabled={!canProceedStep2}
              onClick={() => onStepChange(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Xác định điều kiện thiết bị</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: CLASSROOM & EQUIPMENT GATE ==================== */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">
              03. Điều kiện tổ chức &amp; Thiết bị dạy học
            </h2>
            <p className="mt-2 text-sm font-medium text-[#1D4ED8] bg-[#1D4ED8]/[0.05] border border-[#1D4ED8]/15 rounded-lg px-4 py-3">
              “Các tiết học được tổ chức tại phòng học thường hay phòng máy? Giáo viên và học sinh có những thiết bị nào, có kết nối Internet không?”
            </p>
          </div>

          {/* Quick real-world classroom presets */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-600 mb-2.5">
              Chọn nhanh tình huống lớp học thực tế:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => applyEquipmentPreset('teacher_only')}
                className="p-3.5 text-left rounded-lg border border-slate-200 hover:border-[#1D4ED8] bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Monitor className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Phòng thường · 1 máy GV</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  1 máy tính GV + máy chiếu + Internet; HS thảo luận nhóm, không dùng thiết bị cá nhân.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyEquipmentPreset('lab')}
                className="p-3.5 text-left rounded-lg border border-slate-200 hover:border-[#1D4ED8] bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Laptop className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Phòng máy tính có Internet</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  HS thực hành trực tiếp trên máy tính (cá nhân hoặc cặp đôi) có mạng và máy chiếu GV.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyEquipmentPreset('no_internet')}
                className="p-3.5 text-left rounded-lg border border-slate-200 hover:border-[#1D4ED8] bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <WifiOff className="w-4 h-4 text-slate-600" />
                  <span>Phòng thường · Không Internet</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  1 máy tính GV + máy chiếu ngoại tuyến, không kết nối mạng tại lớp.
                </p>
              </button>
            </div>
          </div>

          {/* Detailed Controls */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Không gian tổ chức dạy học
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangeEquipment({ ...equipment, roomType: 'regular' });
                    onConfirmEquipmentChange(true);
                  }}
                  className={`py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    equipment.roomType === 'regular'
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.06] text-[#1D4ED8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Phòng học thường
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeEquipment({ ...equipment, roomType: 'computer_lab' });
                    onConfirmEquipmentChange(true);
                  }}
                  className={`py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    equipment.roomType === 'computer_lab'
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.06] text-[#1D4ED8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Phòng máy tính
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Kết nối Internet tại lớp học
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangeEquipment({ ...equipment, hasInternet: true });
                    onConfirmEquipmentChange(true);
                  }}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    equipment.hasInternet
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.06] text-[#1D4ED8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <span>Có Internet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeEquipment({ ...equipment, hasInternet: false });
                    onConfirmEquipmentChange(true);
                  }}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    !equipment.hasInternet
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.06] text-[#1D4ED8]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <WifiOff className="w-4 h-4" />
                  <span>Không Internet</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="student-devices" className="block text-xs font-medium text-slate-700 mb-1.5">
                Thiết bị của học sinh
              </label>
              <select
                id="student-devices"
                value={equipment.studentDevices}
                onChange={(e) => {
                  onChangeEquipment({
                    ...equipment,
                    studentDevices: e.target.value as EquipmentCondition['studentDevices'],
                  });
                  onConfirmEquipmentChange(true);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="none">Không có thiết bị cá nhân (chỉ dùng máy tính GV &amp; máy chiếu)</option>
                <option value="shared_groups">Thiết bị dùng chung theo nhóm (máy tính bảng / laptop nhóm)</option>
                <option value="individual_computers">Máy tính thực hành tại phòng máy (1–2 HS/máy)</option>
                <option value="student_personal">Học sinh có thiết bị cá nhân theo quy định lớp</option>
              </select>
            </div>

            <div className="flex items-end gap-4">
              <div className="w-32">
                <label htmlFor="teacher-pc" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Số máy tính GV
                </label>
                <input
                  id="teacher-pc"
                  type="number"
                  min={0}
                  max={5}
                  value={equipment.teacherComputerCount}
                  onChange={(e) => {
                    onChangeEquipment({
                      ...equipment,
                      teacherComputerCount: Math.max(0, Number(e.target.value)),
                    });
                    onConfirmEquipmentChange(true);
                  }}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <label className="flex items-center gap-2.5 pb-2.5 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={equipment.hasProjectorOrTv}
                  onChange={(e) => {
                    onChangeEquipment({ ...equipment, hasProjectorOrTv: e.target.checked });
                    onConfirmEquipmentChange(true);
                  }}
                  className="w-4 h-4 accent-[#1D4ED8] rounded"
                />
                <span>Có máy chiếu / Tivi trình chiếu</span>
              </label>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="eq-details" className="block text-xs font-medium text-slate-700 mb-1.5">
              Mô tả cụ thể điều kiện thiết bị thực tế của lớp
            </label>
            <textarea
              id="eq-details"
              rows={3}
              value={equipment.details}
              onChange={(e) => {
                onChangeEquipment({ ...equipment, details: e.target.value });
                onConfirmEquipmentChange(true);
              }}
              placeholder="Ví dụ: Phòng học thường, có 1 máy tính giáo viên nối mạng Wi-Fi trường và tivi 65 inch; 40 học sinh chia 6 nhóm, không mang điện thoại..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={equipmentConfirmed}
              onChange={(e) => onConfirmEquipmentChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1D4ED8] rounded"
            />
            <span>
              Xác nhận điều kiện phòng học và thiết bị thực tế trên (hệ thống chỉ bắt đầu phân tích và biên tập KHBD sau khi xác nhận điều kiện thiết bị).
            </span>
          </label>

          {analysisError && (
            <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể hoàn tất phân tích KHBD</p>
                <p className="mt-0.5">{analysisError}</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => onStepChange(2)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 2</span>
            </button>

            <button
              type="button"
              disabled={!equipmentConfirmed || isAnalyzing}
              onClick={onRunAnalysis}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-45 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đối chiếu PPCT &amp; biên tập bản sao DOCX...</span>
                </>
              ) : (
                <>
                  <span>Đối chiếu PPCT &amp; Biên tập KHBD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal in Step 2 (Rule II.2.10) */}
      {pendingPpct && duplicatePpct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận ghi đè PPCT cùng môn, lớp và năm học
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Đã tồn tại PPCT môn <strong>{duplicatePpct.subject}</strong>,{' '}
              <strong>Lớp {duplicatePpct.grade}</strong>, năm học{' '}
              <strong>{duplicatePpct.schoolYear}</strong> ({duplicatePpct.fileName}). Bạn muốn ghi đè bản cũ hay giữ cả hai?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingPpct(null);
                  setDuplicatePpct(null);
                }}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const rec = { ...pendingPpct };
                  await onSaveNewPpct(rec);
                  onSelectPpct(rec.id);
                  setPendingPpct(null);
                  setDuplicatePpct(null);
                  setPpctFile(null);
                  setShowInlinePpctUpload(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Lưu thành bản riêng
              </button>
              <button
                type="button"
                onClick={async () => {
                  const rec = { ...pendingPpct, id: duplicatePpct.id };
                  await onSaveNewPpct(rec, duplicatePpct.id);
                  onSelectPpct(rec.id);
                  setPendingPpct(null);
                  setDuplicatePpct(null);
                  setPpctFile(null);
                  setShowInlinePpctUpload(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                Xác nhận ghi đè
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
