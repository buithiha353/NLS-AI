import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  RefreshCw,
  ShieldCheck,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  AnalysisTableRow,
  AuditReport,
  EquipmentCondition,
  IntegrationPlan,
  LessonMeta,
  PatchOperation,
  PpctRecord,
} from '../types/khbd';
import { findNlsIndicatorByCode } from '../data/nlsIndicators';
import { findAiIndicatorByCode } from '../data/aiIndicators';

interface DocxReviewWorkspaceProps {
  plan: IntegrationPlan;
  patchedBlob: Blob | null;
  auditReport: AuditReport | null;
  lessonMeta: LessonMeta;
  equipment: EquipmentCondition;
  activePpct: PpctRecord | null;
  onUpdatePlanAndRebuild: (updatedPlan: IntegrationPlan) => Promise<void>;
  onBackToStep: (step: 1 | 2 | 3) => void;
  isRebuilding: boolean;
}

type InspectorTab = 'edit' | 'audit' | 'export';

export const DocxReviewWorkspace: React.FC<DocxReviewWorkspaceProps> = ({
  plan,
  patchedBlob,
  auditReport,
  lessonMeta,
  equipment,
  activePpct,
  onUpdatePlanAndRebuild,
  onBackToStep,
  isRebuilding,
}) => {
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('edit');

  // Paginated preview controls
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.85);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);

  // Local editable draft of blue patches & 4-column table
  const [draftPatches, setDraftPatches] = useState<PatchOperation[]>(plan.patches);
  const [draftRows, setDraftRows] = useState<AnalysisTableRow[]>(plan.analysisTableRows);
  const [draftIncludeTable, setDraftIncludeTable] = useState<boolean>(plan.includeAnalysisTable);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  // Mandatory visual review confirmation (Section XIII)
  const [visualReviewConfirmed, setVisualReviewConfirmed] = useState(false);
  const [downloadedNotice, setDownloadedNotice] = useState(false);

  useEffect(() => {
    setDraftPatches(plan.patches);
    setDraftRows(plan.analysisTableRows);
    setDraftIncludeTable(plan.includeAnalysisTable);
    setHasUnsavedEdits(false);
  }, [plan]);

  // Render DOCX into paginated A4 pages whenever patchedBlob changes
  useEffect(() => {
    let cancelled = false;
    if (!patchedBlob || !previewContainerRef.current) return;

    const container = previewContainerRef.current;
    container.innerHTML = '';
    setIsRenderingDocx(true);
    setRenderError(null);

    renderAsync(patchedBlob, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
    })
      .then(() => {
        if (cancelled) return;
        const sections = container.querySelectorAll('section.docx');
        setPageCount(sections.length || 1);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        setRenderError(
          err instanceof Error
            ? `Lỗi kết xuất trang xem trước: ${err.message}`
            : 'Không thể kết xuất xem trước DOCX.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsRenderingDocx(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patchedBlob]);

  const scrollToPage = (targetPage: number) => {
    if (!previewContainerRef.current || pageCount === 0) return;
    const clamped = Math.max(1, Math.min(pageCount, targetPage));
    setCurrentPage(clamped);
    const sections = previewContainerRef.current.querySelectorAll('section.docx');
    const el = sections[clamped - 1];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe Stop-Gate screen when PPCT has no allocated indicator or integration is infeasible (Rule VIII)
  if (!plan.feasible) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-amber-300 rounded-xl p-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              Dừng biên tập — Không tích hợp gượng ép
            </h2>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              {plan.stopReason ||
                'PPCT không phân bổ chỉ báo phù hợp cho tiết học này hoặc điều kiện thiết bị không bảo đảm tổ chức hoạt động khả thi.'}
            </p>

            {plan.matchedPpctExcerpt && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  Căn cứ đối chiếu trong PPCT ({activePpct?.fileName}):
                </div>
                <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {plan.matchedPpctExcerpt}
                </p>
              </div>
            )}

            {plan.suggestedAlternative && (
              <div className="mt-4 p-4 bg-[#1D4ED8]/[0.04] border border-[#1D4ED8]/15 rounded-lg text-sm text-slate-800">
                <span className="font-semibold text-[#1D4ED8]">Đề nghị: </span>
                {plan.suggestedAlternative}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onBackToStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Chọn bài hoặc tiết khác</span>
              </button>
              <button
                type="button"
                onClick={() => onBackToStep(2)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Kiểm tra lại PPCT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePatchTextChange = (patchId: string, newText: string) => {
    const paragraphs = newText.split('\n').map((l) => l.trim()).filter(Boolean);
    setDraftPatches((prev) =>
      prev.map((p) => (p.id === patchId ? { ...p, paragraphs } : p))
    );
    setHasUnsavedEdits(true);
    setVisualReviewConfirmed(false);
  };

  const handleTogglePatch = (patchId: string) => {
    setDraftPatches((prev) =>
      prev.map((p) => (p.id === patchId ? { ...p, enabled: !p.enabled } : p))
    );
    setHasUnsavedEdits(true);
    setVisualReviewConfirmed(false);
  };

  const handleRowFieldChange = (
    idx: number,
    field: 'activityName' | 'studentTaskSummary' | 'indicatorManifestation',
    val: string
  ) => {
    setDraftRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
    setHasUnsavedEdits(true);
    setVisualReviewConfirmed(false);
  };

  const handleApplyQuickEdits = async () => {
    await onUpdatePlanAndRebuild({
      ...plan,
      patches: draftPatches,
      analysisTableRows: draftRows,
      includeAnalysisTable: draftIncludeTable,
    });
    setHasUnsavedEdits(false);
  };

  const handleDownloadDocx = () => {
    if (!patchedBlob || !auditReport) return;
    const url = URL.createObjectURL(patchedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = auditReport.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedNotice(true);
  };

  const allAllocatedCodes = [...plan.allocatedNlsCodes, ...plan.allocatedAiCodes];
  const allChecksPassed = auditReport ? auditReport.checks.every((c) => c.passed) : false;

  const equipmentSummaryLine = [
    equipment.roomType === 'computer_lab' ? 'Phòng máy tính' : 'Phòng học thường',
    `${equipment.teacherComputerCount} máy tính GV`,
    equipment.hasProjectorOrTv ? 'có máy chiếu/TV' : 'không máy chiếu',
    equipment.hasInternet ? 'có Internet' : 'không Internet',
    equipment.studentDevices === 'none'
      ? 'HS không dùng thiết bị cá nhân'
      : equipment.studentDevices === 'individual_computers'
        ? 'HS thực hành trên máy tính phòng máy'
        : equipment.studentDevices === 'shared_groups'
          ? 'HS dùng thiết bị theo nhóm'
          : 'HS có thiết bị cá nhân theo hướng dẫn',
  ].join(', ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ==================== LEFT ZONE (62% / 7 cols): PAGINATED WORD A4 STAGE ==================== */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        {/* Stage Toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Xem trực quan từng trang Word</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono text-[#0000FF] font-medium">
              Màu #0000FF = Phần tích hợp mới
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Navigator */}
            <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1">
              <button
                type="button"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Trang trước"
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-35 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-slate-700 whitespace-nowrap">
                Trang {pageCount > 0 ? currentPage : 0} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                aria-label="Trang sau"
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-35 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom */}
            <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
                aria-label="Thu nhỏ"
                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-xs font-mono tabular-nums text-slate-700 w-11 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
                aria-label="Phóng to"
                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Viewport */}
        <div className="relative bg-slate-100/90 h-[76vh] min-h-[600px] overflow-auto docx-preview-stage">
          {(isRenderingDocx || isRebuilding) && (
            <div className="sticky top-3 z-10 mx-auto w-fit px-4 py-2 bg-slate-900 text-white text-xs rounded-lg shadow flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang kết xuất bản xem trước từng trang DOCX...</span>
            </div>
          )}

          {renderError && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {renderError}
            </div>
          )}

          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: `${100 / zoom}%`,
            }}
          >
            <div ref={previewContainerRef} />
          </div>
        </div>
      </section>

      {/* ==================== RIGHT ZONE (38% / 5 cols): QUICK EDIT, AUDIT & EXPORT ==================== */}
      <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[calc(76vh+54px)] min-h-[654px]">
        {/* Inspector Segmented Tabs */}
        <div className="px-4 pt-3 pb-3 border-b border-slate-200 bg-slate-50/60">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/60 rounded-lg">
            <button
              type="button"
              onClick={() => setInspectorTab('edit')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                inspectorTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa nhanh ({draftPatches.filter((p) => p.enabled).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('audit')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                inspectorTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kiểm tra Mục XIII</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('export')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                inspectorTab === 'export'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải DOCX</span>
            </button>
          </div>
        </div>

        {/* Scrollable Inspector Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* -------------------- TAB 1: QUICK INLINE EDIT (#0000FF BLOCKS) -------------------- */}
          {inspectorTab === 'edit' && (
            <>
              <div className="pb-3 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-700">
                  Mã chỉ báo được PPCT phân bổ ({allAllocatedCodes.length} mã):
                </div>
                <div className="mt-2 space-y-1.5">
                  {allAllocatedCodes.map((code) => {
                    const nls = findNlsIndicatorByCode(code);
                    const ai = findAiIndicatorByCode(code);
                    const detail = nls?.detail ?? ai?.detail ?? '';
                    return (
                      <div key={code} className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-mono font-semibold text-[#0000FF]">{code}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span>{detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasUnsavedEdits && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                  <span className="text-xs text-amber-900 font-medium">
                    Có chỉnh sửa chưa áp dụng lên bản DOCX.
                  </span>
                  <button
                    type="button"
                    disabled={isRebuilding}
                    onClick={handleApplyQuickEdits}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isRebuilding ? 'Đang kết xuất...' : 'Áp dụng & Kết xuất lại'}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {draftPatches.map((patch, idx) => (
                  <div
                    key={patch.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      patch.enabled
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200/70 bg-slate-50 opacity-65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {idx + 1}. {patch.categoryLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {patch.indicatorCodes.join(', ') || 'Đồng bộ chung'} · Vị trí {patch.anchorBlockId}
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={patch.enabled}
                          onChange={() => handleTogglePatch(patch.id)}
                          className="accent-[#1D4ED8]"
                        />
                        <span>Chèn</span>
                      </label>
                    </div>

                    <textarea
                      rows={Math.max(3, Math.min(8, patch.paragraphs.join('\n').length / 55 + 1))}
                      disabled={!patch.enabled}
                      value={patch.paragraphs.join('\n')}
                      onChange={(e) => handlePatchTextChange(patch.id, e.target.value)}
                      className="mt-2.5 w-full px-3 py-2 text-xs leading-relaxed text-[#0000FF] bg-slate-50/70 border border-slate-200 rounded-md focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
                      style={{ fontFamily: 'var(--font-word)', fontSize: '13.5px' }}
                    />
                  </div>
                ))}
              </div>

              {/* 4-column Analysis Table Editor */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    Bảng phân tích phát triển NLS/AI (4 cột)
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftIncludeTable}
                      onChange={(e) => {
                        setDraftIncludeTable(e.target.checked);
                        setHasUnsavedEdits(true);
                      }}
                      className="accent-[#1D4ED8]"
                    />
                    <span>Chèn cuối bài</span>
                  </label>
                </div>

                {draftIncludeTable &&
                  draftRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2"
                    >
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        Dòng {idx + 1} · {row.indicatorCodes.join(', ')}
                      </div>
                      <input
                        type="text"
                        value={row.activityName}
                        onChange={(e) => handleRowFieldChange(idx, 'activityName', e.target.value)}
                        placeholder="Tên hoạt động"
                        className="w-full px-2.5 py-1.5 text-xs text-[#0000FF] bg-white border border-slate-200 rounded"
                      />
                      <textarea
                        rows={2}
                        value={row.studentTaskSummary}
                        onChange={(e) =>
                          handleRowFieldChange(idx, 'studentTaskSummary', e.target.value)
                        }
                        placeholder="Tóm tắt nhiệm vụ của học sinh"
                        className="w-full px-2.5 py-1.5 text-xs text-[#0000FF] bg-white border border-slate-200 rounded"
                      />
                      <textarea
                        rows={2}
                        value={row.indicatorManifestation}
                        onChange={(e) =>
                          handleRowFieldChange(idx, 'indicatorManifestation', e.target.value)
                        }
                        placeholder="Biểu hiện phát triển NLS/AI (ghi rõ mã chỉ báo)"
                        className="w-full px-2.5 py-1.5 text-xs text-[#0000FF] bg-white border border-slate-200 rounded"
                      />
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* -------------------- TAB 2: PRE-DELIVERY QUALITY AUDIT (SECTION XIII) -------------------- */}
          {inspectorTab === 'audit' && auditReport && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 leading-relaxed">
                Hệ thống tự động kiểm tra định dạng XML của bản sao DOCX và yêu cầu giáo viên xác nhận đã xem trực quan từng trang trước khi xuất tệp.
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {auditReport.checks.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white flex items-start gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-slate-600 mt-0.5 leading-relaxed">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={visualReviewConfirmed}
                  onChange={(e) => setVisualReviewConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#1D4ED8]"
                />
                <span className="text-xs text-slate-800 leading-relaxed">
                  <strong>Xác nhận kiểm tra trực quan ({pageCount} trang Word):</strong> Đã kiểm tra không có lỗi tràn chữ, mất chữ, chồng chữ, vỡ bảng, lệch hình; phần tích hợp hiển thị màu xanh lam (#0000FF) phông Times New Roman cỡ 14.
                </span>
              </label>

              <button
                type="button"
                onClick={() => setInspectorTab('export')}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg cursor-pointer"
              >
                Sang bước Tải tệp DOCX &amp; Bản tóm tắt
              </button>
            </div>
          )}

          {/* -------------------- TAB 3: FINAL EXPORT & 6-POINT SUMMARY (SECTION XIV) -------------------- */}
          {inspectorTab === 'export' && auditReport && (
            <div className="space-y-5">
              {hasUnsavedEdits && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                  <p className="font-semibold">Bạn có chỉnh sửa ở mục Sửa nhanh chưa áp dụng.</p>
                  <button
                    type="button"
                    onClick={handleApplyQuickEdits}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded cursor-pointer"
                  >
                    Áp dụng thay đổi ngay
                  </button>
                </div>
              )}

              {!visualReviewConfirmed && (
                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visualReviewConfirmed}
                    onChange={(e) => setVisualReviewConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#1D4ED8]"
                  />
                  <span className="text-xs text-slate-800 leading-relaxed">
                    Xác nhận đã xem trực quan toàn bộ {pageCount} trang kết xuất ở khung bên trái trước khi tải tệp DOCX.
                  </span>
                </label>
              )}

              <div className="p-4 bg-[#1D4ED8]/[0.04] border border-[#1D4ED8]/20 rounded-xl space-y-3">
                <div className="text-xs font-medium text-slate-600">Tên tệp đầu ra chuẩn:</div>
                <div className="text-xs font-mono font-semibold text-slate-900 break-all bg-white border border-slate-200 rounded-md px-3 py-2">
                  {auditReport.outputFileName}
                </div>
                <button
                  type="button"
                  disabled={!patchedBlob || hasUnsavedEdits || !visualReviewConfirmed}
                  onClick={handleDownloadDocx}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-45 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải xuống tệp DOCX hoàn chỉnh</span>
                </button>
                {downloadedNotice && (
                  <p className="text-xs text-emerald-700 font-medium text-center">
                    Đã tải tệp DOCX xuống thiết bị của bạn.
                  </p>
                )}
              </div>

              {/* Concise 6-point summary strictly per Section XIV */}
              <div className="border-t border-slate-200 pt-4 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900">Bản tóm tắt kết quả tích hợp</h3>

                <div>
                  <span className="font-semibold text-slate-700">1. Tên PPCT đã sử dụng: </span>
                  <span className="text-slate-900">
                    {activePpct ? `${activePpct.fileName} (${activePpct.schoolYear})` : '—'}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">2. Tiết và hoạt động được tích hợp: </span>
                  <span className="text-slate-900">
                    {plan.summary.periodsAndActivities || plan.matchedPpctPeriod}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">3. Các mã chỉ báo đã sử dụng: </span>
                  <span className="font-mono font-semibold text-[#0000FF]">
                    {allAllocatedCodes.join(', ')}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">4. Điều kiện thiết bị được áp dụng: </span>
                  <span className="text-slate-900">{equipmentSummaryLine}.</span>
                </div>

                <div>
                  <div className="font-semibold text-slate-700">5. Những nội dung chính đã bổ sung:</div>
                  <ul className="mt-1 space-y-1 list-disc pl-5 text-slate-800 leading-relaxed">
                    {plan.summary.keyAdditions.length > 0 ? (
                      plan.summary.keyAdditions.map((line, i) => <li key={i}>{line}</li>)
                    ) : (
                      <li>
                        Bổ sung mục tiêu, thiết bị/học liệu, hoạt động tích hợp (màu xanh lam #0000FF, Times New Roman 14) và bảng phân tích 4 cột cuối bài.
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">6. Xác nhận kiểm tra toàn bộ trang Word: </span>
                  <span className={visualReviewConfirmed && allChecksPassed ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                    {visualReviewConfirmed && allChecksPassed
                      ? `Đã kiểm tra trực quan toàn bộ ${pageCount} trang Word và đạt đủ 6/6 tiêu chí định dạng Mục XIII.`
                      : `Đang chờ xác nhận kiểm tra trực quan ${pageCount} trang Word.`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Bar for Inspector */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onBackToStep(3)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sửa điều kiện thiết bị</span>
          </button>

          {inspectorTab === 'edit' && (
            <button
              type="button"
              disabled={isRebuilding || !hasUnsavedEdits}
              onClick={handleApplyQuickEdits}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-40 rounded-md transition-colors cursor-pointer"
            >
              {isRebuilding ? 'Đang kết xuất...' : 'Áp dụng & Kết xuất lại'}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
