import { useCallback, useEffect, useState } from 'react';
import { TopNav, type ActiveTab } from './components/TopNav';
import { WorkflowSteps } from './components/WorkflowSteps';
import { DocxReviewWorkspace } from './components/DocxReviewWorkspace';
import { PpctLibraryView } from './components/PpctLibraryView';
import { IndicatorCatalogView } from './components/IndicatorCatalogView';
import {
  checkIndexedDbSupport,
  deletePpctRecord,
  getAllPpctRecords,
  savePpctRecord,
  type StorageCapability,
} from './services/ppctStorage';
import { applyPatchesToDocx, parseKhbdDocx } from './services/docxEngine';
import type {
  AuditReport,
  EquipmentCondition,
  IntegrationPlan,
  LessonMeta,
  ParsedKhbd,
  PpctRecord,
} from './types/khbd';

const INITIAL_META: LessonMeta = {
  scope: 'both',
  subject: '',
  grade: 6,
  lessonTitle: '',
  periodNumber: '',
  textbook: '',
};

const INITIAL_EQUIPMENT: EquipmentCondition = {
  roomType: 'regular',
  teacherComputerCount: 1,
  hasProjectorOrTv: true,
  hasInternet: true,
  studentDevices: 'none',
  details: '',
};

const STEP_LABELS: { num: 1 | 2 | 3 | 4; label: string }[] = [
  { num: 1, label: '01. Tải KHBD' },
  { num: 2, label: '02. Đối chiếu PPCT' },
  { num: 3, label: '03. Thiết bị & Lớp học' },
  { num: 4, label: '04. Kiểm duyệt & Xuất DOCX' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workflow');

  // Persistent PPCT state (IndexedDB)
  const [storageCapability, setStorageCapability] = useState<StorageCapability>({ supported: true });
  const [ppctRecords, setPpctRecords] = useState<PpctRecord[]>([]);

  // Active lesson workflow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [parsedKhbd, setParsedKhbd] = useState<ParsedKhbd | null>(null);
  const [isParsingKhbd, setIsParsingKhbd] = useState(false);
  const [khbdError, setKhbdError] = useState<string | null>(null);

  const [lessonMeta, setLessonMeta] = useState<LessonMeta>(INITIAL_META);
  const [selectedPpctId, setSelectedPpctId] = useState<string | null>(null);

  const [equipment, setEquipment] = useState<EquipmentCondition>(INITIAL_EQUIPMENT);
  const [equipmentConfirmed, setEquipmentConfirmed] = useState(false);

  // Analysis & DOCX patch state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [integrationPlan, setIntegrationPlan] = useState<IntegrationPlan | null>(null);
  const [patchedBlob, setPatchedBlob] = useState<Blob | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Initialize IndexedDB & load stored PPCTs on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cap = await checkIndexedDbSupport();
      if (!mounted) return;
      setStorageCapability(cap);
      if (cap.supported) {
        try {
          const recs = await getAllPpctRecords();
          if (mounted) setPpctRecords(recs);
        } catch (err) {
          if (mounted) {
            setStorageCapability({
              supported: false,
              reason:
                err instanceof Error
                  ? `Không thể đọc kho PPCT trong IndexedDB (${err.message}).`
                  : 'Không thể đọc kho PPCT từ bộ nhớ trình duyệt.',
            });
          }
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSavePpctRecord = useCallback(
    async (record: PpctRecord, replaceExistingId?: string) => {
      if (storageCapability.supported) {
        await savePpctRecord(record);
        const refreshed = await getAllPpctRecords();
        setPpctRecords(refreshed);
      } else {
        setPpctRecords((prev) => {
          const filtered = replaceExistingId
            ? prev.filter((r) => r.id !== replaceExistingId)
            : prev.filter((r) => r.id !== record.id);
          return [record, ...filtered];
        });
      }
    },
    [storageCapability.supported]
  );

  const handleDeletePpctRecord = useCallback(
    async (id: string) => {
      if (storageCapability.supported) {
        await deletePpctRecord(id);
        const refreshed = await getAllPpctRecords();
        setPpctRecords(refreshed);
      } else {
        setPpctRecords((prev) => prev.filter((r) => r.id !== id));
      }
      if (selectedPpctId === id) {
        setSelectedPpctId(null);
      }
    },
    [storageCapability.supported, selectedPpctId]
  );

  const handleUploadKhbd = async (file: File) => {
    setKhbdError(null);
    setIsParsingKhbd(true);
    // Always discard previous KHBD & previous integration outputs when a new file is uploaded (Rule II.1)
    setIntegrationPlan(null);
    setPatchedBlob(null);
    setAuditReport(null);
    setAnalysisError(null);

    try {
      const parsed = await parseKhbdDocx(file);
      setParsedKhbd(parsed);
      setLessonMeta((prev) => ({
        scope: prev.scope,
        subject: parsed.detectedHints.subject || prev.subject,
        grade: parsed.detectedHints.grade ?? prev.grade,
        lessonTitle: parsed.detectedHints.lessonTitle || '',
        periodNumber: parsed.detectedHints.periodNumber || '',
        textbook: parsed.detectedHints.textbook || prev.textbook,
      }));
    } catch (err) {
      setParsedKhbd(null);
      setKhbdError(err instanceof Error ? err.message : 'Không thể đọc tệp KHBD (.docx).');
    } finally {
      setIsParsingKhbd(false);
    }
  };

  const handleNewSession = () => {
    setActiveTab('workflow');
    setStep(1);
    setParsedKhbd(null);
    setKhbdError(null);
    setLessonMeta(INITIAL_META);
    setSelectedPpctId(null);
    setEquipment(INITIAL_EQUIPMENT);
    setEquipmentConfirmed(false);
    setIntegrationPlan(null);
    setPatchedBlob(null);
    setAuditReport(null);
    setAnalysisError(null);
  };

  const handleRunAnalysis = async () => {
    if (!parsedKhbd) return;
    const activePpct = ppctRecords.find((r) => r.id === selectedPpctId);
    if (!activePpct) {
      setAnalysisError('Chưa chọn tệp PPCT phù hợp để đối chiếu.');
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);
    try {
      const resp = await fetch('/api/analyze-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonMeta,
          equipmentCondition: equipment,
          ppctText: activePpct.extractedText,
          ppctName: activePpct.fileName,
          khbdBlocks: parsedKhbd.blocks,
          hasExistingAnalysisTable: parsedKhbd.hasExistingAnalysisTable,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || `Máy chủ trả về lỗi (${resp.status}).`);
      }

      const plan = data.plan as IntegrationPlan;
      setIntegrationPlan(plan);

      if (plan.feasible) {
        const { blob, auditReport: report } = await applyPatchesToDocx(parsedKhbd, plan, lessonMeta);
        setPatchedBlob(blob);
        setAuditReport(report);
      } else {
        setPatchedBlob(null);
        setAuditReport(null);
      }

      setStep(4);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích và biên tập KHBD.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdatePlanAndRebuild = async (updatedPlan: IntegrationPlan) => {
    if (!parsedKhbd) return;
    setIsRebuilding(true);
    try {
      setIntegrationPlan(updatedPlan);
      const { blob, auditReport: report } = await applyPatchesToDocx(
        parsedKhbd,
        updatedPlan,
        lessonMeta
      );
      setPatchedBlob(blob);
      setAuditReport(report);
    } finally {
      setIsRebuilding(false);
    }
  };

  const activePpct = ppctRecords.find((r) => r.id === selectedPpctId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewSession={handleNewSession}
        ppctCount={ppctRecords.length}
      />

      <main className="flex-1">
        {activeTab === 'workflow' && (
          <div className="max-w-[1440px] mx-auto px-6 py-7">
            {/* Step Progress Rail */}
            <div className="mb-7 pb-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Biên tập Kế hoạch bài dạy tích hợp NLS &amp; AI
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Chương trình GDPT 2018 · Bảng chỉ báo NLS (TC1–TC2) · Khung giáo dục AI (QĐ 2422/QĐ-BGDĐT)
                </p>
              </div>

              <ol className="flex flex-wrap items-center gap-2">
                {STEP_LABELS.map((item) => {
                  const isCurrent = step === item.num;
                  const isCompleted = step > item.num;
                  const clickable =
                    item.num < step || (item.num === 4 && Boolean(integrationPlan));
                  return (
                    <li key={item.num}>
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => clickable && setStep(item.num)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          isCurrent
                            ? 'bg-[#1D4ED8] text-white'
                            : isCompleted
                              ? 'bg-slate-200/80 text-slate-800 hover:bg-slate-200 cursor-pointer'
                              : 'bg-white border border-slate-200 text-slate-400 cursor-default'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {step !== 4 ? (
              <WorkflowSteps
                step={step}
                onStepChange={setStep}
                parsedKhbd={parsedKhbd}
                onUploadKhbd={handleUploadKhbd}
                khbdError={khbdError}
                isParsingKhbd={isParsingKhbd}
                lessonMeta={lessonMeta}
                onChangeLessonMeta={setLessonMeta}
                ppctRecords={ppctRecords}
                storageCapability={storageCapability}
                selectedPpctId={selectedPpctId}
                onSelectPpct={setSelectedPpctId}
                onSaveNewPpct={handleSavePpctRecord}
                equipment={equipment}
                equipmentConfirmed={equipmentConfirmed}
                onChangeEquipment={setEquipment}
                onConfirmEquipmentChange={setEquipmentConfirmed}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
                analysisError={analysisError}
              />
            ) : (
              integrationPlan && (
                <DocxReviewWorkspace
                  plan={integrationPlan}
                  patchedBlob={patchedBlob}
                  auditReport={auditReport}
                  lessonMeta={lessonMeta}
                  equipment={equipment}
                  activePpct={activePpct}
                  onUpdatePlanAndRebuild={handleUpdatePlanAndRebuild}
                  onBackToStep={(target) => setStep(target)}
                  isRebuilding={isRebuilding}
                />
              )
            )}
          </div>
        )}

        {activeTab === 'ppct' && (
          <PpctLibraryView
            records={ppctRecords}
            storageCapability={storageCapability}
            onSaveRecord={handleSavePpctRecord}
            onDeleteRecord={handleDeletePpctRecord}
          />
        )}

        {activeTab === 'indicators' && <IndicatorCatalogView />}
      </main>
    </div>
  );
}
