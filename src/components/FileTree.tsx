import React, { useMemo, useState } from 'react';
import { Archive, File, FileCode, FileImage, Search } from 'lucide-react';
import type { DiffEntry, FileCategory, FileDiffStatus } from '../types/index.ts';

interface FileTreeProps {
  entries: DiffEntry[];
  selectedPath?: string;
  onSelectPath: (path: string) => void;
  showUnchanged: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({
  entries,
  selectedPath,
  onSelectPath,
  showUnchanged,
}) => {
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!showUnchanged && entry.status === 'unchanged') return false;
      if (!search.trim()) return true;
      return entry.path.toLowerCase().includes(search.toLowerCase());
    });
  }, [entries, showUnchanged, search]);

  const getStatusBadge = (status: FileDiffStatus, additions: number, deletions: number) => {
    switch (status) {
      case 'added':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#9bf246]/15 text-[#9bf246] border border-[#9bf246]/30 mono">
            +{additions || 1}
          </span>
        );
      case 'deleted':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ff6f61]/15 text-[#ff6f61] border border-[#ff6f61]/30 mono">
            -{deletions || 1}
          </span>
        );
      case 'modified':
        return (
          <div className="flex items-center gap-1 mono text-[10px] font-bold">
            {additions > 0 && <span className="text-[#9bf246]">+{additions}</span>}
            {deletions > 0 && <span className="text-[#ff6f61]">-{deletions}</span>}
          </div>
        );
      case 'unchanged':
        return <span className="text-[10px] text-[#5f6b62] mono">OK</span>;
    }
  };

  const getFileIcon = (category: FileCategory, extension: string) => {
    if (category === 'image') return <FileImage className="w-3.5 h-3.5 text-[#38bdf8]" />;
    if (category === 'archive') return <Archive className="w-3.5 h-3.5 text-[#ffb224]" />;
    if (['ts', 'js', 'tsx', 'jsx', 'rs', 'cpp', 'c', 'cs', 'java', 'py'].includes(extension)) {
      return <FileCode className="w-3.5 h-3.5 text-[#9bf246]" />;
    }
    return <File className="w-3.5 h-3.5 text-[#9aa69e]" />;
  };

  return (
    <aside className="w-80 h-full border-r border-[#1f2721] liquid-glass flex flex-col shrink-0 select-none">
      <div className="p-3 border-b border-[#1f2721]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6b62]" />
          <input
            type="text"
            placeholder="Поиск по файлам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#131814] border border-[#1f2721] focus:border-[#9bf246] text-xs text-[#eaf0ea] placeholder-[#5f6b62] outline-none transition-colors mono"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#5f6b62] mono">
            Нет файлов для отображения
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedPath === entry.path;
            const segments = entry.path.split(' :: ');
            const isNested = segments.length > 1;
            const displayName = segments[segments.length - 1];

            return (
              <div
                key={entry.path}
                onClick={() => onSelectPath(entry.path)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#9bf246]/15 border border-[#9bf246]/40 text-[#eaf0ea] shadow-[0_0_12px_rgba(155,242,70,0.15)]'
                    : 'hover:bg-[#131814] text-[#9aa69e] hover:text-[#eaf0ea]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {getFileIcon(entry.category, entry.extension)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate font-medium" title={entry.path}>
                      {displayName}
                    </span>
                    {isNested && (
                      <span className="text-[9px] text-[#5f6b62] truncate mono">
                        {segments[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(entry.status, entry.additions, entry.deletions)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-[#1f2721] text-[11px] text-[#5f6b62] mono flex items-center justify-between px-3">
        <span>Всего: {entries.length}</span>
        <span>Отображено: {filteredEntries.length}</span>
      </div>
    </aside>
  );
};
