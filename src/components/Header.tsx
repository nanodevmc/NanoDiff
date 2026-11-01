import React from 'react';
import { Columns, FileCode, Layers, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  viewMode: 'split' | 'unified';
  onViewModeChange: (mode: 'split' | 'unified') => void;
  showUnchanged: boolean;
  onToggleShowUnchanged: () => void;
  onReset: () => void;
  hasData: boolean;
  totalDiffs: number;
  languageCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  showUnchanged,
  onToggleShowUnchanged,
  onReset,
  hasData,
  totalDiffs,
  languageCount,
}) => {
  return (
    <header className="h-14 border-b border-[#1f2721] liquid-glass flex items-center justify-between px-5 select-none z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#9bf246]/10 border border-[#9bf246]/30 flex items-center justify-center text-[#9bf246] shadow-[0_0_12px_rgba(155,242,70,0.25)]">
          <Layers className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-sm text-[#eaf0ea] mono">
              ɴᴀɴᴏᴅɪꜰꜰ
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#9bf246]/10 text-[#9bf246] border border-[#9bf246]/30 mono font-semibold">
              v1.0.0
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 mono font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {languageCount} ЯЗЫКОВ
            </span>
          </div>
          <span className="text-[10px] text-[#5f6b62] mono -mt-0.5">
            Deep Archive & Code Inspector · 0% Telemetry
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasData && (
          <>
            <div className="flex items-center p-0.5 rounded-lg bg-[#131814] border border-[#1f2721] mr-2">
              <button
                onClick={() => onViewModeChange('split')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                  viewMode === 'split'
                    ? 'bg-[#9bf246] text-[#070a08] shadow-[0_0_10px_rgba(155,242,70,0.4)]'
                    : 'text-[#9aa69e] hover:text-[#eaf0ea]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Сплит
              </button>
              <button
                onClick={() => onViewModeChange('unified')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                  viewMode === 'unified'
                    ? 'bg-[#9bf246] text-[#070a08] shadow-[0_0_10px_rgba(155,242,70,0.4)]'
                    : 'text-[#9aa69e] hover:text-[#eaf0ea]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Юнифайд
              </button>
            </div>

            <button
              onClick={onToggleShowUnchanged}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                showUnchanged
                  ? 'bg-[#9bf246]/10 border-[#9bf246]/30 text-[#9bf246]'
                  : 'bg-[#131814] border-[#1f2721] text-[#9aa69e] hover:text-[#eaf0ea]'
              }`}
            >
              Одинаковые файлы
            </button>

            <span className="text-xs text-[#5f6b62] mono mx-2">
              Изменений: <strong className="text-[#9bf246]">{totalDiffs}</strong>
            </span>

            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff6f61]/10 border border-[#ff6f61]/30 text-[#ff6f61] text-xs font-medium hover:bg-[#ff6f61]/20 transition-all duration-150"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сброс
            </button>
          </>
        )}
      </div>
    </header>
  );
};
