import type { FileCategory, VfsFile } from '../types/index.ts';

const ARCHIVE_EXTENSIONS = new Set(['zip', 'jar', 'apk', 'war', 'ear', 'tar', 'gz', 'tgz', 'rar', '7z']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']);

export class VirtualFileSystem {
  private files = new Map<string, VfsFile>();
  private textDecoder = new TextDecoder('utf-8', { fatal: false });

  public clear(): void {
    this.files.clear();
  }

  public getFiles(): Map<string, VfsFile> {
    return this.files;
  }

  public getFile(path: string): VfsFile | undefined {
    return this.files.get(path);
  }

  public async loadFromBuffer(buffer: Uint8Array, rootName: string): Promise<void> {
    this.clear();
    await this.processArchiveRecursively(buffer, rootName, []);
  }

  public async loadFromFileList(fileList: FileList | File[]): Promise<void> {
    this.clear();
    const list = Array.from(fileList);
    for (const file of list) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const ext = this.extractExtension(file.name);
      if (ARCHIVE_EXTENSIONS.has(ext)) {
        await this.processArchiveRecursively(buffer, file.name, []);
      } else {
        const virtualPath = file.webkitRelativePath || file.name;
        this.registerFile(virtualPath, buffer, []);
      }
    }
  }

  private async processArchiveRecursively(
    archiveData: Uint8Array,
    archiveName: string,
    ancestorChain: string[]
  ): Promise<void> {
    const currentChain = [...ancestorChain, archiveName];
    const entries = await this.parseZipEntries(archiveData);

    if (entries.size === 0) {
      this.registerFile(archiveName, archiveData, ancestorChain);
      return;
    }

    for (const [relativePath, data] of entries.entries()) {
      if (relativePath.endsWith('/')) {
        continue;
      }

      const ext = this.extractExtension(relativePath);
      if (ARCHIVE_EXTENSIONS.has(ext) && data.length > 0) {
        await this.processArchiveRecursively(data, relativePath, currentChain);
      } else {
        const virtualPath = currentChain.length > 1
          ? `${currentChain.slice(1).join(' :: ')} :: ${relativePath}`
          : relativePath;
        this.registerFile(virtualPath, data, currentChain);
      }
    }
  }

  private async parseZipEntries(buffer: Uint8Array): Promise<Map<string, Uint8Array>> {
    const results = new Map<string, Uint8Array>();
    if (buffer.length < 22) return results;

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    let eocdOffset = -1;

    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) return results;

    const centralDirCount = view.getUint16(eocdOffset + 10, true);
    const centralDirOffset = view.getUint32(eocdOffset + 16, true);
    let cursor = centralDirOffset;

    for (let i = 0; i < centralDirCount && cursor < eocdOffset; i++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) break;

      const compressionMethod = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const uncompressedSize = view.getUint32(cursor + 24, true);
      const filenameLength = view.getUint16(cursor + 28, true);
      const extraFieldLength = view.getUint16(cursor + 30, true);
      const fileCommentLength = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);

      const filenameBytes = buffer.subarray(cursor + 46, cursor + 46 + filenameLength);
      const filename = this.textDecoder.decode(filenameBytes);

      cursor += 46 + filenameLength + extraFieldLength + fileCommentLength;

      if (filename.endsWith('/')) continue;

      const localSig = view.getUint32(localHeaderOffset, true);
      if (localSig !== 0x04034b50) continue;

      const localFilenameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localFilenameLen + localExtraLen;
      const compressedSlice = buffer.subarray(dataStart, dataStart + compressedSize);

      try {
        let decompressedData: Uint8Array;
        if (compressionMethod === 0) {
          decompressedData = compressedSlice;
        } else if (compressionMethod === 8) {
          decompressedData = await this.decompressRawDeflate(compressedSlice, uncompressedSize);
        } else {
          continue;
        }
        results.set(filename, decompressedData);
      } catch {
        continue;
      }
    }

    return results;
  }

  private async decompressRawDeflate(data: Uint8Array, expectedSize: number): Promise<Uint8Array> {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(data);
            controller.close();
          }
        }).pipeThrough(new DecompressionStream('deflate-raw'));

        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            total += value.length;
          }
        }

        const combined = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        return combined;
      } catch {
        return this.fallbackDecompress(data, expectedSize);
      }
    }
    return this.fallbackDecompress(data, expectedSize);
  }

  private fallbackDecompress(data: Uint8Array, size: number): Uint8Array {
    const target = new Uint8Array(size);
    target.set(data.subarray(0, Math.min(data.length, size)));
    return target;
  }

  private registerFile(path: string, data: Uint8Array, archiveChain: string[]): void {
    const name = path.split('/').pop()?.split(' :: ').pop() || path;
    const extension = this.extractExtension(name);
    const category = this.detectCategory(extension, data);

    const file: VfsFile = {
      path,
      name,
      extension,
      size: data.byteLength,
      category,
      data,
      archiveChain,
      text: category === 'text' ? this.textDecoder.decode(data) : undefined,
    };

    this.files.set(path, file);
  }

  private extractExtension(filename: string): string {
    const clean = filename.split('?')[0].split('#')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private detectCategory(extension: string, data: Uint8Array): FileCategory {
    if (ARCHIVE_EXTENSIONS.has(extension)) return 'archive';
    if (IMAGE_EXTENSIONS.has(extension)) return 'image';

    const checkLength = Math.min(data.length, 2048);
    let nullByteCount = 0;
    for (let i = 0; i < checkLength; i++) {
      if (data[i] === 0) {
        nullByteCount++;
        if (nullByteCount > 1) return 'binary';
      }
    }
    return 'text';
  }
}
