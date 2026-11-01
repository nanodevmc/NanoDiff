export type FileCategory = 'text' | 'image' | 'archive' | 'binary';

export type FileDiffStatus = 'added' | 'deleted' | 'modified' | 'unchanged';

export interface VfsFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  category: FileCategory;
  data: Uint8Array;
  text?: string;
  archiveChain: string[];
}

export interface VfsDirectory {
  path: string;
  name: string;
  files: Map<string, VfsFile>;
  directories: Map<string, VfsDirectory>;
}

export interface DiffEntry {
  path: string;
  name: string;
  extension: string;
  status: FileDiffStatus;
  category: FileCategory;
  leftFile?: VfsFile;
  rightFile?: VfsFile;
  archiveChain: string[];
  additions: number;
  deletions: number;
}

export interface LineChange {
  type: 'insert' | 'delete' | 'normal';
  content: string;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export interface DiffChunk {
  header: string;
  lines: LineChange[];
}

export interface FileDiffResult {
  path: string;
  status: FileDiffStatus;
  category: FileCategory;
  isBinary: boolean;
  chunks: DiffChunk[];
  leftLineCount: number;
  rightLineCount: number;
  additions: number;
  deletions: number;
}
