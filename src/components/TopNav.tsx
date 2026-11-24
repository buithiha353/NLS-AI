import React from 'react';

export type ActiveTab = 'workflow' | 'ppct' | 'indicators';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewSession: () => void;
  ppctCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onNewSession,
  ppctCount,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'workflow', label: 'Tích hợp KHBD' },
    { id: 'ppct', label: `Kho PPCT (${ppctCount})` },
    { id: 'indicators', label: 'Tra cứu Chỉ báo' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('workflow')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          KHBD Số THCS
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Điều hướng chính" className="flex items-center gap-7 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                  isActive
                    ? 'text-[#1D4ED8]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1D4ED8]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onNewSession}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            Phiên biên tập mới
          </button>
        </div>
      </div>
    </header>
  );
};
