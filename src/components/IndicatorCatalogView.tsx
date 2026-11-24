import React, { useMemo, useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import { NLS_INDICATORS } from '../data/nlsIndicators';
import { AI_INDICATORS } from '../data/aiIndicators';
import type { GradeLevel } from '../types/khbd';

type FrameworkFilter = 'nls' | 'ai';
type AiTierFilter = 'all' | 'core' | 'extended';

export const IndicatorCatalogView: React.FC = () => {
  const [framework, setFramework] = useState<FrameworkFilter>('nls');
  const [grade, setGrade] = useState<GradeLevel | 'all'>('all');
  const [aiTier, setAiTier] = useState<AiTierFilter>('all');
  const [query, setQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredNls = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NLS_INDICATORS.filter((item) => {
      if (grade !== 'all') {
        const expectedGroup = grade <= 7 ? '6-7' : '8-9';
        if (item.gradeGroup !== expectedGroup) return false;
      }
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.domainName.toLowerCase().includes(q)
      );
    });
  }, [grade, query]);

  const filteredAi = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AI_INDICATORS.filter((item) => {
      if (grade !== 'all' && item.grade !== grade) return false;
      if (aiTier === 'core' && item.isExtended) return false;
      if (aiTier === 'extended' && !item.isExtended) return false;
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.domainName.toLowerCase().includes(q) ||
        item.topicName.toLowerCase().includes(q) ||
        item.contentTitle.toLowerCase().includes(q)
      );
    });
  }, [grade, aiTier, query]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 1600);
    } catch {
      // Clipboard blocked in restricted iframe context — fail gracefully
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kho chỉ báo chuẩn đã tích hợp sẵn
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-3xl">
            Dữ liệu nguyên văn từ Bảng chỉ báo Năng lực số THCS (TC1–TC2) và Khung nội dung giáo dục Trí tuệ nhân tạo (Quyết định 2422/QĐ-BGDĐT). Hệ thống dùng trực tiếp hai bảng này khi đối chiếu PPCT, không cần tải lại.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
          <span>NLS: {NLS_INDICATORS.length} mã</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>AI (QĐ 2422): {AI_INDICATORS.length} mã</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Framework Segmented Control */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFramework('nls')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                framework === 'nls'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng chỉ báo NLS ({NLS_INDICATORS.length})
            </button>
            <button
              type="button"
              onClick={() => setFramework('ai')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                framework === 'ai'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khung AI QĐ 2422 ({AI_INDICATORS.length})
            </button>
          </div>

          {/* Grade Filter */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            {(['all', 6, 7, 8, 9] as const).map((g) => (
              <button
                key={String(g)}
                type="button"
                onClick={() => setGrade(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  grade === g
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'Tất cả lớp' : `Lớp ${g}`}
              </button>
            ))}
          </div>

          {/* AI Core vs MR Filter */}
          {framework === 'ai' && (
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
              {(
                [
                  { id: 'all', label: 'Cốt lõi & MR' },
                  { id: 'core', label: 'Chỉ cốt lõi' },
                  { id: 'extended', label: 'Chỉ mở rộng (MR)' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAiTier(t.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    aiTier === t.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã (1.1.TC1a, 7.A1.MR1) hoặc nội dung..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {framework === 'nls' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-28">Khối lớp</th>
                  <th className="py-3 px-4 w-36">Mã chỉ báo NLS</th>
                  <th className="py-3 px-4 w-56">Miền năng lực</th>
                  <th className="py-3 px-4">Chi tiết chỉ báo (Nguyên văn)</th>
                  <th className="py-3 px-4 w-20 text-right">Sao chép</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredNls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Không tìm thấy chỉ báo NLS khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredNls.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-xs tabular-nums">
                        {item.gradeLabel} · {item.level}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#1D4ED8] whitespace-nowrap tabular-nums">
                        {item.code}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        {item.domainCode}. {item.domainName}
                      </td>
                      <td className="py-3 px-4 text-slate-800 leading-relaxed">
                        {item.detail}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.code)}
                          title={`Sao chép mã ${item.code}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-24">Lớp</th>
                  <th className="py-3 px-4 w-36">Mã YCCĐ</th>
                  <th className="py-3 px-4 w-60">Chủ đề &amp; Nội dung</th>
                  <th className="py-3 px-4">Yêu cầu cần đạt (Nguyên văn QĐ 2422)</th>
                  <th className="py-3 px-4 w-20 text-right">Sao chép</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Không tìm thấy chỉ báo AI khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredAi.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-xs tabular-nums">
                        Lớp {item.grade}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#1D4ED8] tabular-nums">
                          {item.code}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.isExtended ? 'Mở rộng (MR)' : 'Cốt lõi'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 align-top">
                        <div className="font-medium text-slate-900">
                          {item.topicCode}. {item.topicName}
                        </div>
                        <div className="text-slate-500 mt-0.5">{item.contentTitle}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 leading-relaxed">
                        {item.detail}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.code)}
                          title={`Sao chép mã ${item.code}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
