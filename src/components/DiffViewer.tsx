import React, { useMemo } from 'react';
import type { DiffChunk, FileDiffResult, VfsFile } from '../types/index.ts';
import { syntaxHighlighter } from '../services/highlighter';
import { ImageDiffViewer } from './ImageDiffViewer';
import { AlertCircle, FileCode } from 'lucide-react';

interface DiffViewerProps {
  diffResult?: FileDiffResult;
  leftFile?: VfsFile;
  rightFile?: VfsFile;
  viewMode: 'split' | 'unified';
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffResult,
  leftFile,
  rightFile,
  viewMode,
}) => {
  if (!diffResult) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 liquid-glass-subtle select-none">
        <FileCode className="w-12 h-12 text-[#5f6b62] mb-3 animate-pulse" />
        <span className="text-sm font-medium text-[#9aa69e]">
          Выберите файл из списка слева для просмотра изменений
        </span>
        <span className="text-xs text-[#5f6b62] mono mt-1">
          Поддержка сплита, юнифайда и 54 языков подсветки
        </span>
      </div>
    );
  }

  if (diffResult.category === 'image') {
    return <ImageDiffViewer leftFile={leftFile} rightFile={rightFile} />;
  }

  if (diffResult.isBinary) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 liquid-glass-subtle select-none">
        <AlertCircle className="w-12 h-12 text-[#ffb224] mb-3" />
        <span className="text-sm font-semibold text-[#eaf0ea]">
          Бинарный файл ({diffResult.path.split('.').pop()?.toUpperCase()})
        </span>
        <span className="text-xs text-[#9aa69e] mono mt-2">
          Размер до: {leftFile?.size ?? 'отсутствует'} байт · Размер после: {rightFile?.size ?? 'отсутствует'} байт
        </span>
        <span className="text-xs text-[#5f6b62] mt-1">
          {diffResult.status === 'modified' ? 'Содержимое бинарного файла было изменено' : `Файл ${diffResult.status}`}
        </span>
      </div>
    );
  }

  const detectedLanguage = useMemo(() => {
    return syntaxHighlighter.detectLanguage(diffResult.path);
  }, [diffResult.path]);

  const renderTokenized = (text: string) => {
    const tokens = syntaxHighlighter.tokenizeLine(text, detectedLanguage);
    return tokens.map((token, idx) => (
      <span key={idx} className={`token-${token.type}`}>
        {token.value}
      </span>
    ));
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#070a08]">
      <div className="h-9 px-4 border-b border-[#1f2721] liquid-glass flex items-center justify-between text-xs mono shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[#9aa69e] font-medium truncate">
            {diffResult.path}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#334139] text-[#9bf246]">
            {detectedLanguage}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#9bf246] font-semibold">+{diffResult.additions}</span>
          <span className="text-[#ff6f61] font-semibold">-{diffResult.deletions}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto mono text-xs leading-5">
        {viewMode === 'unified' ? (
          <UnifiedView chunks={diffResult.chunks} renderTokenized={renderTokenized} />
        ) : (
          <SplitView chunks={diffResult.chunks} renderTokenized={renderTokenized} />
        )}
      </div>
    </div>
  );
};

interface UnifiedViewProps {
  chunks: DiffChunk[];
  renderTokenized: (text: string) => React.ReactNode;
}

const UnifiedView: React.FC<UnifiedViewProps> = ({ chunks, renderTokenized }) => {
  return (
    <div className="w-full">
      {chunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx}>
          <div className="px-4 py-1 bg-[#131814] text-[#38bdf8] text-[11px] font-semibold border-y border-[#1f2721] sticky top-0 z-10">
            {chunk.header}
          </div>
          {chunk.lines.map((line, lineIdx) => {
            const isInsert = line.type === 'insert';
            const isDelete = line.type === 'delete';

            return (
              <div
                key={lineIdx}
                className={`flex hover:bg-[#131814]/60 ${
                  isInsert
                    ? 'bg-[#9bf246]/10 text-[#eaf0ea]'
                    : isDelete
                    ? 'bg-[#ff6f61]/10 text-[#eaf0ea]'
                    : 'text-[#9aa69e]'
                }`}
              >
                <div className="w-12 px-2 py-0.5 text-right text-[#5f6b62] border-r border-[#1f2721] select-none shrink-0">
                  {line.leftLineNumber ?? ''}
                </div>
                <div className="w-12 px-2 py-0.5 text-right text-[#5f6b62] border-r border-[#1f2721] select-none shrink-0">
                  {line.rightLineNumber ?? ''}
                </div>
                <div className="w-6 text-center select-none shrink-0 font-bold">
                  {isInsert ? '+' : isDelete ? '-' : ' '}
                </div>
                <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-visible">
                  {renderTokenized(line.content)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

interface SplitViewProps {
  chunks: DiffChunk[];
  renderTokenized: (text: string) => React.ReactNode;
}

const SplitView: React.FC<SplitViewProps> = ({ chunks, renderTokenized }) => {
  return (
    <div className="w-full min-w-[800px]">
      {chunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx}>
          <div className="px-4 py-1 bg-[#131814] text-[#38bdf8] text-[11px] font-semibold border-y border-[#1f2721] sticky top-0 z-10">
            {chunk.header}
          </div>
          {chunk.lines.map((line, lineIdx) => {
            const isInsert = line.type === 'insert';
            const isDelete = line.type === 'delete';

            return (
              <div key={lineIdx} className="flex border-b border-[#1f2721]/30">
                <div
                  className={`flex-1 flex border-r border-[#1f2721] ${
                    isDelete ? 'bg-[#ff6f61]/10' : ''
                  }`}
                >
                  <div className="w-12 px-2 py-0.5 text-right text-[#5f6b62] border-r border-[#1f2721] select-none shrink-0">
                    {line.leftLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-hidden">
                    {isInsert ? '' : renderTokenized(line.content)}
                  </div>
                </div>

                <div
                  className={`flex-1 flex ${
                    isInsert ? 'bg-[#9bf246]/10' : ''
                  }`}
                >
                  <div className="w-12 px-2 py-0.5 text-right text-[#5f6b62] border-r border-[#1f2721] select-none shrink-0">
                    {line.rightLineNumber ?? ''}
                  </div>
                  <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-hidden">
                    {isDelete ? '' : renderTokenized(line.content)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
