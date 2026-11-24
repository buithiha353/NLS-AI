import React, { useRef, useState } from 'react';
import { AlertTriangle, Eye, FileText, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import type { GradeLevel, PpctRecord } from '../types/khbd';
import {
  extractTextFromPpctFile,
  findDuplicatePpct,
  type StorageCapability,
} from '../services/ppctStorage';

interface PpctLibraryViewProps {
  records: PpctRecord[];
  storageCapability: StorageCapability;
  onSaveRecord: (record: PpctRecord, replaceExistingId?: string) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

const DEFAULT_SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Khoa học tự nhiên',
  'Lịch sử và Địa lí',
  'Tin học',
  'Công nghệ',
  'Giáo dục công dân',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm, hướng nghiệp',
];

const TEXTBOOKS = [
  'Kết nối tri thức với cuộc sống',
  'Chân trời sáng tạo',
  'Cánh Diều',
  'Khác / Tự biên soạn',
];

export const PpctLibraryView: React.FC<PpctLibraryViewProps> = ({
  records,
  storageCapability,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('Khoa học tự nhiên');
  const [grade, setGrade] = useState<GradeLevel>(6);
  const [textbook, setTextbook] = useState(TEXTBOOKS[0]);
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [version, setVersion] = useState('v1.0');
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Overwrite confirmation state (Rule II.2.10)
  const [pendingRecord, setPendingRecord] = useState<PpctRecord | null>(null);
  const [duplicateRecord, setDuplicateRecord] = useState<PpctRecord | null>(null);

  // Preview & delete confirmation states
  const [previewRecord, setPreviewRecord] = useState<PpctRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setReplacingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartReplace = (rec: PpctRecord) => {
    setReplacingId(rec.id);
    setSubject(rec.subject);
    setGrade(rec.grade);
    setTextbook(rec.textbook);
    setSchoolYear(rec.schoolYear);
    setVersion(rec.version || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn tệp PPCT định dạng Word (.docx) hoặc PDF (.pdf).');
      return;
    }
    if (!subject.trim() || !schoolYear.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Môn học và Năm học.');
      return;
    }

    setIsParsing(true);
    try {
      const extracted = await extractTextFromPpctFile(selectedFile);
      const newRecord: PpctRecord = {
        id: replacingId ?? `ppct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        subject: subject.trim(),
        grade,
        textbook: textbook.trim(),
        schoolYear: schoolYear.trim(),
        fileName: selectedFile.name,
        fileType: extracted.fileType,
        version: version.trim() || '1.0',
        updatedAt: new Date().toISOString(),
        fileBlob: selectedFile,
        extractedText: extracted.text,
        lineCount: extracted.lineCount,
      };

      const existingDup = replacingId
        ? records.find((r) => r.id === replacingId)
        : findDuplicatePpct(records, newRecord.subject, newRecord.grade, newRecord.schoolYear);

      if (existingDup) {
        setPendingRecord(newRecord);
        setDuplicateRecord(existingDup);
      } else {
        await onSaveRecord(newRecord);
        setSuccessMsg(
          storageCapability.supported
            ? `Đã lưu PPCT "${newRecord.fileName}" vào bộ nhớ bền vững IndexedDB của trình duyệt.`
            : `Đã nạp PPCT "${newRecord.fileName}" cho phiên làm việc hiện tại (trình duyệt không hỗ trợ lưu bền vững).`
        );
        resetForm();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đọc tệp PPCT.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingRecord || !duplicateRecord) return;
    setIsParsing(true);
    try {
      const overwritten: PpctRecord = {
        ...pendingRecord,
        id: duplicateRecord.id,
      };
      await onSaveRecord(overwritten, duplicateRecord.id);
      setSuccessMsg(`Đã cập nhật và ghi đè PPCT ${overwritten.subject} lớp ${overwritten.grade} (${overwritten.schoolYear}).`);
      setPendingRecord(null);
      setDuplicateRecord(null);
      resetForm();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi ghi đè PPCT.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!pendingRecord) return;
    setIsParsing(true);
    try {
      const freshRecord: PpctRecord = {
        ...pendingRecord,
        id: `ppct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      await onSaveRecord(freshRecord);
      setSuccessMsg(`Đã lưu thành một phiên bản PPCT riêng (${freshRecord.fileName}).`);
      setPendingRecord(null);
      setDuplicateRecord(null);
      resetForm();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu phiên bản PPCT mới.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kho Phân phối chương trình (PPCT)
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-3xl">
            Lưu trữ cục bộ trên trình duyệt bằng IndexedDB để tự động đối chiếu ở các lần biên tập tiếp theo. Tệp PPCT không bị tải lên kho lưu trữ ngoài.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
          {storageCapability.supported
            ? `IndexedDB sẵn sàng · ${records.length} tệp PPCT`
            : 'Chỉ lưu tạm phiên hiện tại'}
        </div>
      </div>

      {!storageCapability.supported && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Môi trường trình duyệt không hỗ trợ lưu trữ bền vững IndexedDB</p>
            <p className="mt-1 text-amber-800">{storageCapability.reason}</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload / Update Form */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {replacingId ? 'Cập nhật / Thay thế PPCT' : 'Thêm PPCT mới'}
            </h2>
            {replacingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                Hủy thay thế
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tệp PPCT (.docx hoặc .pdf)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelectedFile(f);
                  setErrorMsg(null);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-4 border border-dashed border-slate-300 hover:border-[#1D4ED8] rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-500 mb-1.5" />
                <span className="text-sm font-medium text-slate-800">
                  {selectedFile ? selectedFile.name : 'Chọn tệp Word (.docx) hoặc PDF (.pdf)'}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Đọc và trích xuất trực tiếp trên trình duyệt'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ppct-subject" className="block text-xs font-medium text-slate-700 mb-1">
                  Môn học
                </label>
                <input
                  id="ppct-subject"
                  list="thcs-subjects-list"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                />
                <datalist id="thcs-subjects-list">
                  {DEFAULT_SUBJECTS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="ppct-grade" className="block text-xs font-medium text-slate-700 mb-1">
                  Khối lớp
                </label>
                <select
                  id="ppct-grade"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value={6}>Lớp 6</option>
                  <option value={7}>Lớp 7</option>
                  <option value={8}>Lớp 8</option>
                  <option value={9}>Lớp 9</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ppct-textbook" className="block text-xs font-medium text-slate-700 mb-1">
                Bộ sách giáo khoa
              </label>
              <input
                id="ppct-textbook"
                list="thcs-textbooks-list"
                value={textbook}
                onChange={(e) => setTextbook(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
              <datalist id="thcs-textbooks-list">
                {TEXTBOOKS.map((tb) => (
                  <option key={tb} value={tb} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ppct-year" className="block text-xs font-medium text-slate-700 mb-1">
                  Năm học
                </label>
                <input
                  id="ppct-year"
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="2026-2027"
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8] font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ppct-version" className="block text-xs font-medium text-slate-700 mb-1">
                  Phiên bản (tùy chọn)
                </label>
                <input
                  id="ppct-version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D4ED8] font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isParsing}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {isParsing
                ? 'Đang trích xuất nội dung PPCT...'
                : replacingId
                  ? 'Lưu bản thay thế'
                  : 'Đọc và lưu PPCT'}
            </button>
          </form>
        </section>

        {/* Saved PPCT List */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Danh sách PPCT đã lưu trên trình duyệt
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Tổng cộng: {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Chưa có tệp PPCT nào được lưu trong IndexedDB
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Hãy tải lên tệp PPCT (Word .docx hoặc PDF .pdf) ở biểu mẫu bên trái hoặc trực tiếp trong Bước 2 khi tích hợp KHBD.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Môn học &amp; Lớp</th>
                    <th className="py-3 px-4">Tệp &amp; Bộ sách</th>
                    <th className="py-3 px-4">Năm học / Phiên bản</th>
                    <th className="py-3 px-4">Cập nhật</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{rec.subject}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          Lớp {rec.grade}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={rec.fileName}>
                          {rec.fileName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {rec.textbook} · {rec.fileType.toUpperCase()} · {rec.lineCount} dòng
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-700 tabular-nums">
                        <div>{rec.schoolYear}</div>
                        <div className="text-slate-500">{rec.version || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-500 tabular-nums">
                        {new Date(rec.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirmDeleteId === rec.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteRecord(rec.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                            >
                              Xác nhận xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewRecord(rec)}
                              title="Xem nội dung trích xuất"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartReplace(rec)}
                              title="Cập nhật / Thay thế tệp"
                              className="p-1.5 text-slate-500 hover:text-[#1D4ED8] hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rec.id)}
                              title="Xóa PPCT"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Overwrite Confirmation Modal (Rule II.2.10) */}
      {pendingRecord && duplicateRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận ghi đè PPCT đã tồn tại
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Trình duyệt đã lưu một PPCT cùng môn <strong>{duplicateRecord.subject}</strong>,{' '}
              <strong>Lớp {duplicateRecord.grade}</strong>, năm học{' '}
              <strong>{duplicateRecord.schoolYear}</strong> ({duplicateRecord.fileName}, cập nhật{' '}
              {new Date(duplicateRecord.updatedAt).toLocaleDateString('vi-VN')}).
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Bạn muốn ghi đè bản cũ hay lưu thành một phiên bản riêng để lựa chọn sau này?
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPendingRecord(null);
                  setDuplicateRecord(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAsNewVersion}
                className="px-4 py-2 text-sm font-medium text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Lưu thành bản riêng
              </button>
              <button
                type="button"
                onClick={handleConfirmOverwrite}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                Xác nhận ghi đè
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted PPCT Preview Modal */}
      {previewRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[82vh] flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {previewRecord.fileName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewRecord.subject} · Lớp {previewRecord.grade} · {previewRecord.textbook} ·{' '}
                  {previewRecord.schoolYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRecord(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {previewRecord.extractedText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
