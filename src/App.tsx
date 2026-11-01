import React, { useMemo, useState } from 'react';
import { VirtualFileSystem } from './services/vfs';
import { DiffEngine } from './services/diff';
import type { DiffEntry, FileDiffResult } from './types/index.ts';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileTree } from './components/FileTree';
import { DiffViewer } from './components/DiffViewer';
import { syntaxHighlighter } from './services/highlighter';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [vfsLeft] = useState(() => new VirtualFileSystem());
  const [vfsRight] = useState(() => new VirtualFileSystem());
  const [diffEngine] = useState(() => new DiffEngine());

  const [leftInfo, setLeftInfo] = useState<{ name: string; size: number; count: number } | null>(null);
  const [rightInfo, setRightInfo] = useState<{ name: string; size: number; count: number } | null>(null);

  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [showUnchanged, setShowUnchanged] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const triggerComparison = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const leftFiles = vfsLeft.getFiles();
      const rightFiles = vfsRight.getFiles();
      const entries = diffEngine.compareFileLists(leftFiles, rightFiles);
      setDiffEntries(entries);

      const firstModified = entries.find((e) => e.status !== 'unchanged') || entries[0];
      if (firstModified) {
        setSelectedPath(firstModified.path);
      }
      setIsProcessing(false);
    }, 50);
  };

  const handleLeftFile = async (file: File) => {
    setIsProcessing(true);
    const buffer = new Uint8Array(await file.arrayBuffer());
    await vfsLeft.loadFromBuffer(buffer, file.name);
    setLeftInfo({ name: file.name, size: file.size, count: vfsLeft.getFiles().size });
    setIsProcessing(false);
    if (rightInfo) triggerComparison();
  };

  const handleLeftFolder = async (files: FileList) => {
    setIsProcessing(true);
    await vfsLeft.loadFromFileList(files);
    let totalSize = 0;
    Array.from(files).forEach((f) => (totalSize += f.size));
    setLeftInfo({ name: 'Папка (Оригинал)', size: totalSize, count: vfsLeft.getFiles().size });
    setIsProcessing(false);
    if (rightInfo) triggerComparison();
  };

  const handleRightFile = async (file: File) => {
    setIsProcessing(true);
    const buffer = new Uint8Array(await file.arrayBuffer());
    await vfsRight.loadFromBuffer(buffer, file.name);
    setRightInfo({ name: file.name, size: file.size, count: vfsRight.getFiles().size });
    setIsProcessing(false);
    if (leftInfo) triggerComparison();
  };

  const handleRightFolder = async (files: FileList) => {
    setIsProcessing(true);
    await vfsRight.loadFromFileList(files);
    let totalSize = 0;
    Array.from(files).forEach((f) => (totalSize += f.size));
    setRightInfo({ name: 'Папка (Обновление)', size: totalSize, count: vfsRight.getFiles().size });
    setIsProcessing(false);
    if (leftInfo) triggerComparison();
  };

  const handleReset = () => {
    vfsLeft.clear();
    vfsRight.clear();
    setLeftInfo(null);
    setRightInfo(null);
    setDiffEntries([]);
    setSelectedPath(undefined);
  };

  const selectedDiffResult: FileDiffResult | undefined = useMemo(() => {
    if (!selectedPath) return undefined;
    const entry = diffEntries.find((e) => e.path === selectedPath);
    if (!entry) return undefined;
    return diffEngine.computeFileDiff(entry.leftFile, entry.rightFile);
  }, [selectedPath, diffEntries, diffEngine]);

  const selectedLeftFile = useMemo(() => {
    if (!selectedPath) return undefined;
    return vfsLeft.getFile(selectedPath);
  }, [selectedPath, vfsLeft]);

  const selectedRightFile = useMemo(() => {
    if (!selectedPath) return undefined;
    return vfsRight.getFile(selectedPath);
  }, [selectedPath, vfsRight]);

  const totalDiffCount = useMemo(() => {
    return diffEntries.filter((e) => e.status !== 'unchanged').length;
  }, [diffEntries]);

  const isReadyToView = leftInfo && rightInfo && diffEntries.length > 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a08] relative">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#9bf246]/5 blur-3xl pointer-events-none animate-orb-1" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#38bdf8]/5 blur-3xl pointer-events-none animate-orb-2" />

      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showUnchanged={showUnchanged}
        onToggleShowUnchanged={() => setShowUnchanged((prev) => !prev)}
        onReset={handleReset}
        hasData={Boolean(isReadyToView)}
        totalDiffs={totalDiffCount}
        languageCount={syntaxHighlighter.getLanguageCount()}
      />

      {isProcessing && (
        <div className="absolute inset-0 bg-[#070a08]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-[#9bf246] animate-spin" />
          <span className="text-sm font-semibold text-[#eaf0ea] mono tracking-wider">
            АНАЛИЗ И СРАВНЕНИЕ АРХИВОВ...
          </span>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative z-10">
        {!isReadyToView ? (
          <div className="flex-1 p-8 flex flex-col justify-center max-w-5xl mx-auto w-full gap-6">
            <div className="text-center flex flex-col items-center gap-1 mb-2">
              <h1 className="text-2xl font-black tracking-tight text-[#eaf0ea] mono">
                Сравнение двух архивов или папок
              </h1>
              <p className="text-xs text-[#9aa69e] max-w-lg">
                Рекурсивное монтирование вложенных архивов (.zip внутри .jar и т.д.) в оперативной памяти без распаковки на диск.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
              <DropZone
                label="Исходная версия (До)"
                sublabel="Оригинальный архив или папка"
                accentColor="#ff6f61"
                loadedName={leftInfo?.name}
                loadedSize={leftInfo?.size}
                itemCount={leftInfo?.count}
                onFileSelected={handleLeftFile}
                onFolderSelected={handleLeftFolder}
              />

              <DropZone
                label="Новая версия (После)"
                sublabel="Изменённый архив или папка"
                accentColor="#9bf246"
                loadedName={rightInfo?.name}
                loadedSize={rightInfo?.size}
                itemCount={rightInfo?.count}
                onFileSelected={handleRightFile}
                onFolderSelected={handleRightFolder}
              />
            </div>
          </div>
        ) : (
          <>
            <FileTree
              entries={diffEntries}
              selectedPath={selectedPath}
              onSelectPath={setSelectedPath}
              showUnchanged={showUnchanged}
            />

            <DiffViewer
              diffResult={selectedDiffResult}
              leftFile={selectedLeftFile}
              rightFile={selectedRightFile}
              viewMode={viewMode}
            />
          </>
        )}
      </main>
    </div>
  );
};
