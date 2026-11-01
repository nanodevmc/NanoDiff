import React, { useEffect, useState } from 'react';
import type { VfsFile } from '../types/index.ts';
import { Eye, Sliders, SplitSquareVertical } from 'lucide-react';

interface ImageDiffViewerProps {
  leftFile?: VfsFile;
  rightFile?: VfsFile;
}

export const ImageDiffViewer: React.FC<ImageDiffViewerProps> = ({ leftFile, rightFile }) => {
  const [mode, setMode] = useState<'side-by-side' | 'slider' | 'onion'>('slider');
  const [sliderPos, setSliderPos] = useState(50);
  const [opacity, setOpacity] = useState(0.5);

  const [leftUrl, setLeftUrl] = useState<string | null>(null);
  const [rightUrl, setRightUrl] = useState<string | null>(null);

  useEffect(() => {
    let lUrl: string | null = null;
    let rUrl: string | null = null;

    if (leftFile && leftFile.data.length > 0) {
      const blob = new Blob([leftFile.data as BlobPart]);
      lUrl = URL.createObjectURL(blob);
      setLeftUrl(lUrl);
    } else {
      setLeftUrl(null);
    }

    if (rightFile && rightFile.data.length > 0) {
      const blob = new Blob([rightFile.data as BlobPart]);
      rUrl = URL.createObjectURL(blob);
      setRightUrl(rUrl);
    } else {
      setRightUrl(null);
    }

    return () => {
      if (lUrl) URL.revokeObjectURL(lUrl);
      if (rUrl) URL.revokeObjectURL(rUrl);
    };
  }, [leftFile, rightFile]);

  return (
    <div className="flex-1 h-full flex flex-col liquid-glass-subtle select-none">
      <div className="h-10 px-4 border-b border-[#1f2721] liquid-glass flex items-center justify-between text-xs mono">
        <span className="text-[#9aa69e] font-semibold">Сравнение изображений</span>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#131814] border border-[#1f2721]">
          <button
            onClick={() => setMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              mode === 'slider'
                ? 'bg-[#9bf246] text-[#070a08] font-bold shadow-[0_0_8px_rgba(155,242,70,0.4)]'
                : 'text-[#9aa69e] hover:text-[#eaf0ea]'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            Шторка
          </button>
          <button
            onClick={() => setMode('onion')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              mode === 'onion'
                ? 'bg-[#9bf246] text-[#070a08] font-bold shadow-[0_0_8px_rgba(155,242,70,0.4)]'
                : 'text-[#9aa69e] hover:text-[#eaf0ea]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Наложение
          </button>
          <button
            onClick={() => setMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              mode === 'side-by-side'
                ? 'bg-[#9bf246] text-[#070a08] font-bold shadow-[0_0_8px_rgba(155,242,70,0.4)]'
                : 'text-[#9aa69e] hover:text-[#eaf0ea]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Рядом
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 flex flex-col items-center justify-center relative">
        {mode === 'slider' && leftUrl && rightUrl && (
          <div className="flex flex-col items-center gap-4 max-w-full max-h-full">
            <div className="relative border border-[#334139] rounded-xl overflow-hidden shadow-2xl bg-[radial-gradient(#1f2721_1px,transparent_1px)] [background-size:16px_16px]">
              <img src={leftUrl} alt="Old version" className="max-h-[60vh] max-w-[70vw] object-contain block" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img src={rightUrl} alt="New version" className="max-h-[60vh] max-w-[70vw] object-contain block" />
              </div>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#9bf246] shadow-[0_0_12px_#9bf246]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#070a08] border-2 border-[#9bf246] flex items-center justify-center text-[9px] font-bold text-[#9bf246]">
                  ||
                </div>
              </div>
            </div>

            <div className="w-64 flex items-center gap-2">
              <span className="text-[10px] mono text-[#5f6b62]">До</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="flex-1 accent-[#9bf246] cursor-ew-resize"
              />
              <span className="text-[10px] mono text-[#9bf246]">После</span>
            </div>
          </div>
        )}

        {mode === 'onion' && leftUrl && rightUrl && (
          <div className="flex flex-col items-center gap-4 max-w-full max-h-full">
            <div className="relative border border-[#334139] rounded-xl overflow-hidden shadow-2xl bg-[radial-gradient(#1f2721_1px,transparent_1px)] [background-size:16px_16px]">
              <img src={leftUrl} alt="Old" className="max-h-[60vh] max-w-[70vw] object-contain block" />
              <img
                src={rightUrl}
                alt="New"
                className="absolute inset-0 max-h-[60vh] max-w-[70vw] object-contain block transition-opacity duration-75"
                style={{ opacity }}
              />
            </div>

            <div className="w-64 flex items-center gap-2">
              <span className="text-[10px] mono text-[#5f6b62]">0%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 accent-[#9bf246]"
              />
              <span className="text-[10px] mono text-[#9bf246]">100%</span>
            </div>
          </div>
        )}

        {mode === 'side-by-side' && (
          <div className="flex items-center gap-6 max-w-full max-h-full">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-[#ff6f61] mono font-bold uppercase">Оригинал (До)</span>
              <div className="border border-[#1f2721] rounded-xl p-2 bg-[#0c100d]">
                {leftUrl ? (
                  <img src={leftUrl} alt="Old" className="max-h-[50vh] max-w-[35vw] object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-[#5f6b62] mono">
                    Отсутствует
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-[#9bf246] mono font-bold uppercase">Обновление (После)</span>
              <div className="border border-[#1f2721] rounded-xl p-2 bg-[#0c100d]">
                {rightUrl ? (
                  <img src={rightUrl} alt="New" className="max-h-[50vh] max-w-[35vw] object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-[#5f6b62] mono">
                    Отсутствует
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
