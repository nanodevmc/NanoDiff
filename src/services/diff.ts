import type { DiffChunk, DiffEntry, FileDiffResult, LineChange, VfsFile } from '../types/index.ts';

export class DiffEngine {
  public compareFileLists(
    leftFiles: Map<string, VfsFile>,
    rightFiles: Map<string, VfsFile>
  ): DiffEntry[] {
    const entries: DiffEntry[] = [];
    const allPaths = new Set<string>([...leftFiles.keys(), ...rightFiles.keys()]);
    const sortedPaths = Array.from(allPaths).sort((a, b) => a.localeCompare(b));

    for (const path of sortedPaths) {
      const left = leftFiles.get(path);
      const right = rightFiles.get(path);

      if (left && !right) {
        entries.push({
          path,
          name: left.name,
          extension: left.extension,
          status: 'deleted',
          category: left.category,
          leftFile: left,
          archiveChain: left.archiveChain,
          additions: 0,
          deletions: left.text ? left.text.split('\n').length : 1,
        });
      } else if (!left && right) {
        entries.push({
          path,
          name: right.name,
          extension: right.extension,
          status: 'added',
          category: right.category,
          rightFile: right,
          archiveChain: right.archiveChain,
          additions: right.text ? right.text.split('\n').length : 1,
          deletions: 0,
        });
      } else if (left && right) {
        const isModified = this.hasContentChanged(left, right);
        let additions = 0;
        let deletions = 0;

        if (isModified && left.category === 'text' && right.category === 'text') {
          const diff = this.computeTextDiff(left.text || '', right.text || '');
          additions = diff.additions;
          deletions = diff.deletions;
        }

        entries.push({
          path,
          name: right.name,
          extension: right.extension,
          status: isModified ? 'modified' : 'unchanged',
          category: right.category,
          leftFile: left,
          rightFile: right,
          archiveChain: right.archiveChain,
          additions,
          deletions,
        });
      }
    }

    return entries;
  }

  public computeFileDiff(left?: VfsFile, right?: VfsFile): FileDiffResult {
    const path = right?.path || left?.path || '';
    const category = right?.category || left?.category || 'text';
    const isBinary = category === 'binary';

    if (isBinary || category === 'image') {
      const isModified = left && right ? this.hasContentChanged(left, right) : true;
      return {
        path,
        status: !left ? 'added' : !right ? 'deleted' : isModified ? 'modified' : 'unchanged',
        category,
        isBinary: true,
        chunks: [],
        leftLineCount: 0,
        rightLineCount: 0,
        additions: right ? 1 : 0,
        deletions: left ? 1 : 0,
      };
    }

    const leftText = left?.text || '';
    const rightText = right?.text || '';
    const diff = this.computeTextDiff(leftText, rightText);

    let status: DiffEntry['status'] = 'unchanged';
    if (!left) status = 'added';
    else if (!right) status = 'deleted';
    else if (diff.additions > 0 || diff.deletions > 0) status = 'modified';

    return {
      path,
      status,
      category: 'text',
      isBinary: false,
      chunks: diff.chunks,
      leftLineCount: leftText ? leftText.split('\n').length : 0,
      rightLineCount: rightText ? rightText.split('\n').length : 0,
      additions: diff.additions,
      deletions: diff.deletions,
    };
  }

  private hasContentChanged(left: VfsFile, right: VfsFile): boolean {
    if (left.size !== right.size) return true;
    const a = left.data;
    const b = right.data;
    const len = a.length;
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return true;
    }
    return false;
  }

  public computeTextDiff(
    leftText: string,
    rightText: string
  ): { chunks: DiffChunk[]; additions: number; deletions: number } {
    const leftLines = leftText ? leftText.split(/\r?\n/) : [];
    const rightLines = rightText ? rightText.split(/\r?\n/) : [];

    const stringToId = new Map<string, number>();
    const getLineId = (line: string): number => {
      let id = stringToId.get(line);
      if (id === undefined) {
        id = stringToId.size;
        stringToId.set(line, id);
      }
      return id;
    };

    const a = leftLines.map(getLineId);
    const b = rightLines.map(getLineId);

    const n = a.length;
    const m = b.length;
    const max = n + m;
    const vOffset = max;
    const v = new Int32Array(2 * max + 1);
    const trace: Int32Array[] = [];

    v[vOffset + 1] = 0;

    let foundD = -1;
    for (let d = 0; d <= max; d++) {
      const vCopy = new Int32Array(v);
      trace.push(vCopy);

      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[vOffset + k - 1] < v[vOffset + k + 1])) {
          x = v[vOffset + k + 1];
        } else {
          x = v[vOffset + k - 1] + 1;
        }

        let y = x - k;
        while (x < n && y < m && a[x] === b[y]) {
          x++;
          y++;
        }

        v[vOffset + k] = x;
        if (x >= n && y >= m) {
          foundD = d;
          break;
        }
      }
      if (foundD !== -1) break;
    }

    const script: LineChange[] = [];
    let x = n;
    let y = m;

    for (let d = trace.length - 1; d > 0; d--) {
      const vPrev = trace[d - 1];
      const k = x - y;
      let prevK: number;

      if (k === -d || (k !== d && vPrev[vOffset + k - 1] < vPrev[vOffset + k + 1])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = vPrev[vOffset + prevK];
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        x--;
        y--;
        script.unshift({
          type: 'normal',
          content: leftLines[x],
          leftLineNumber: x + 1,
          rightLineNumber: y + 1,
        });
      }

      if (d > 0) {
        if (x === prevX) {
          y--;
          script.unshift({
            type: 'insert',
            content: rightLines[y],
            rightLineNumber: y + 1,
          });
        } else if (y === prevY) {
          x--;
          script.unshift({
            type: 'delete',
            content: leftLines[x],
            leftLineNumber: x + 1,
          });
        }
      }
    }

    while (x > 0 && y > 0) {
      x--;
      y--;
      script.unshift({
        type: 'normal',
        content: leftLines[x],
        leftLineNumber: x + 1,
        rightLineNumber: y + 1,
      });
    }

    let additions = 0;
    let deletions = 0;
    for (const change of script) {
      if (change.type === 'insert') additions++;
      if (change.type === 'delete') deletions++;
    }

    const chunks = this.clusterHunks(script, 3);
    return { chunks, additions, deletions };
  }

  private clusterHunks(changes: LineChange[], contextRadius: number): DiffChunk[] {
    if (changes.length === 0) return [];

    const hasDiff = changes.some(c => c.type !== 'normal');
    if (!hasDiff) {
      return [{
        header: `@@ -1,${changes.length} +1,${changes.length} @@`,
        lines: changes,
      }];
    }

    const chunks: DiffChunk[] = [];
    let currentLines: LineChange[] = [];
    let lastModifiedIdx = -1;

    for (let i = 0; i < changes.length; i++) {
      const c = changes[i];
      if (c.type !== 'normal') {
        if (currentLines.length === 0) {
          const start = Math.max(0, i - contextRadius);
          for (let k = start; k < i; k++) {
            currentLines.push(changes[k]);
          }
        }
        currentLines.push(c);
        lastModifiedIdx = i;
      } else {
        if (currentLines.length > 0) {
          if (i - lastModifiedIdx <= contextRadius) {
            currentLines.push(c);
          } else {
            const firstLeft = currentLines.find(l => l.leftLineNumber)?.leftLineNumber || 1;
            const firstRight = currentLines.find(l => l.rightLineNumber)?.rightLineNumber || 1;
            chunks.push({
              header: `@@ -${firstLeft} +${firstRight} @@`,
              lines: currentLines,
            });
            currentLines = [];
          }
        }
      }
    }

    if (currentLines.length > 0) {
      const firstLeft = currentLines.find(l => l.leftLineNumber)?.leftLineNumber || 1;
      const firstRight = currentLines.find(l => l.rightLineNumber)?.rightLineNumber || 1;
      chunks.push({
        header: `@@ -${firstLeft} +${firstRight} @@`,
        lines: currentLines,
      });
    }

    return chunks;
  }
}
