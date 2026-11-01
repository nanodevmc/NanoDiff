import React, { useRef, useState } from 'react';
import { Archive, CheckCircle2, FolderArchive, UploadCloud } from 'lucide-react';

interface DropZoneProps {
  label: string;
  sublabel: string;
  accentColor: string;
  loadedName?: string;
  loadedSize?: number;
  itemCount?: number;
  onFileSelected: (file: File) => void;
  onFolderSelected: (files: FileList) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  label,
  sublabel,
  accentColor,
  loadedName,
  loadedSize,
  itemCount,
  onFileSelected,
  onFolderSelected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let val = bytes;
    let unitIdx = 0;
    while (val >= 1024 && unitIdx < units.length - 1) {
      val /= 1024;
      unitIdx++;
    }
    return `${val.toFixed(1)} ${units[unitIdx]}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length === 1 && !e.dataTransfer.files[0].name.endsWith('/')) {
        onFileSelected(e.dataTransfer.files[0]);
      } else {
        onFolderSelected(e.dataTransfer.files);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 md3-card liquid-glass p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 border ${
        isDragging
          ? 'border-[#9bf246] bg-[#9bf246]/10 shadow-[0_0_30px_rgba(155,242,70,0.25)] scale-[1.01]'
          : loadedName
          ? 'border-[#334139] bg-[#0c100d]/90'
          : 'border-[#1f2721] hover:border-[#334139]'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="radar-vivid animate-radar opacity-20" />
        <div className="scanline-glow-bar animate-scanline opacity-30" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />

      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory="true"
        directory="true"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFolderSelected(e.target.files);
          }
        }}
      />

      {loadedName ? (
        <div className="flex flex-col items-center gap-3 z-10 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#9bf246]/10 border border-[#9bf246]/30 flex items-center justify-center text-[#9bf246] shadow-[0_0_20px_rgba(155,242,70,0.3)]">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-[#9bf246] tracking-wider mono uppercase">
              {label}
            </span>
            <span className="text-base font-bold text-[#eaf0ea] mt-1 max-w-[280px] truncate" title={loadedName}>
              {loadedName}
            </span>
            <span className="text-xs text-[#9aa69e] mono mt-1">
              {formatSize(loadedSize)} · {itemCount} файлов
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#131814] hover:bg-[#1b221d] border border-[#1f2721] text-xs text-[#eaf0ea] transition-all duration-150"
            >
              Заменить файл
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#131814] hover:bg-[#1b221d] border border-[#1f2721] text-xs text-[#eaf0ea] transition-all duration-150"
            >
              Папка
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}40`,
              color: accentColor,
              boxShadow: `0 0 24px ${accentColor}25`,
            }}
          >
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold tracking-widest uppercase mono" style={{ color: accentColor }}>
              {label}
            </span>
            <span className="text-sm text-[#eaf0ea] font-medium mt-1">
              Перетащите .zip, .jar, .tar, .apk или папку
            </span>
            <span className="text-xs text-[#5f6b62] mt-0.5 mono">
              {sublabel}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131814] hover:bg-[#1b221d] border border-[#1f2721] hover:border-[#334139] text-xs font-medium text-[#eaf0ea] shadow-md transition-all duration-150"
            >
              <Archive className="w-4 h-4 text-[#9bf246]" />
              Выбрать архив
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131814] hover:bg-[#1b221d] border border-[#1f2721] hover:border-[#334139] text-xs font-medium text-[#eaf0ea] shadow-md transition-all duration-150"
            >
              <FolderArchive className="w-4 h-4 text-[#38bdf8]" />
              Выбрать папку
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
