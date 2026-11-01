export interface SyntaxToken {
  type: 'keyword' | 'type' | 'string' | 'number' | 'comment' | 'operator' | 'punctuation' | 'plain';
  value: string;
}

interface LanguageDef {
  id: string;
  name: string;
  extensions: string[];
  keywords: Set<string>;
  types: Set<string>;
  lineComment?: string;
  blockCommentStart?: string;
  blockCommentEnd?: string;
}

export class SyntaxHighlighter {
  private languages = new Map<string, LanguageDef>();
  private extToLang = new Map<string, string>();

  constructor() {
    this.registerAllLanguages();
  }

  public getSupportedLanguages(): string[] {
    return Array.from(this.languages.values()).map(l => l.name);
  }

  public getLanguageCount(): number {
    return this.languages.size;
  }

  public detectLanguage(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower === 'dockerfile') return 'dockerfile';
    if (lower === 'makefile' || lower.endsWith('.mk')) return 'makefile';
    if (lower === 'cmakelists.txt' || lower.endsWith('.cmake')) return 'cmake';

    const parts = lower.split('.');
    const ext = parts.length > 1 ? parts.pop()! : '';
    return this.extToLang.get(ext) || 'plaintext';
  }

  public tokenizeLine(line: string, languageId: string): SyntaxToken[] {
    const lang = this.languages.get(languageId);
    if (!lang || languageId === 'plaintext') {
      return [{ type: 'plain', value: line }];
    }

    const tokens: SyntaxToken[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
      if (lang.lineComment && line.startsWith(lang.lineComment, i)) {
        tokens.push({ type: 'comment', value: line.slice(i) });
        break;
      }

      const char = line[i];

      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        let strEnd = i + 1;
        while (strEnd < len) {
          if (line[strEnd] === '\\') {
            strEnd += 2;
            continue;
          }
          if (line[strEnd] === quote) {
            strEnd++;
            break;
          }
          strEnd++;
        }
        tokens.push({ type: 'string', value: line.slice(i, strEnd) });
        i = strEnd;
        continue;
      }

      if (/\d/.test(char) || (char === '.' && i + 1 < len && /\d/.test(line[i + 1]))) {
        let numEnd = i;
        while (numEnd < len && /[\d.xXabcdefABCDEF_eE+-]/.test(line[numEnd])) {
          numEnd++;
        }
        tokens.push({ type: 'number', value: line.slice(i, numEnd) });
        i = numEnd;
        continue;
      }

      if (/[a-zA-Z_$#@]/.test(char)) {
        let wordEnd = i;
        while (wordEnd < len && /[a-zA-Z0-9_$-]/.test(line[wordEnd])) {
          wordEnd++;
        }
        const word = line.slice(i, wordEnd);
        if (lang.keywords.has(word)) {
          tokens.push({ type: 'keyword', value: word });
        } else if (lang.types.has(word)) {
          tokens.push({ type: 'type', value: word });
        } else {
          tokens.push({ type: 'plain', value: word });
        }
        i = wordEnd;
        continue;
      }

      if (/[=+\-*/%&|^!<>?:~]/.test(char)) {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }

      if (/[{}()[\];,.]/.test(char)) {
        tokens.push({ type: 'punctuation', value: char });
        i++;
        continue;
      }

      tokens.push({ type: 'plain', value: char });
      i++;
    }

    return tokens;
  }

  private register(def: LanguageDef): void {
    this.languages.set(def.id, def);
    for (const ext of def.extensions) {
      this.extToLang.set(ext.toLowerCase(), def.id);
    }
  }

  private registerAllLanguages(): void {
    const cKeywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'sizeof', 'typedef', 'struct', 'union', 'enum', 'static', 'extern', 'const', 'volatile', 'register', 'auto', 'inline'];
    const cTypes = ['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', 'size_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'bool'];

    this.register({
      id: 'javascript',
      name: 'JavaScript',
      extensions: ['js', 'mjs', 'cjs'],
      keywords: new Set(['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'null', 'undefined', 'true', 'false']),
      types: new Set(['Object', 'Function', 'Boolean', 'Symbol', 'Number', 'BigInt', 'Math', 'Date', 'String', 'RegExp', 'Array', 'Map', 'Set', 'Promise']),
      lineComment: '//',
    });

    this.register({
      id: 'typescript',
      name: 'TypeScript',
      extensions: ['ts', 'mts', 'cts'],
      keywords: new Set(['type', 'interface', 'namespace', 'declare', 'abstract', 'as', 'implements', 'readonly', 'keyof', 'is', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'while', 'let', 'static', 'null', 'undefined', 'true', 'false']),
      types: new Set(['any', 'unknown', 'never', 'void', 'string', 'number', 'boolean', 'symbol', 'bigint', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit']),
      lineComment: '//',
    });

    this.register({
      id: 'jsx',
      name: 'React JSX/TSX',
      extensions: ['jsx', 'tsx'],
      keywords: new Set(['type', 'interface', 'import', 'export', 'from', 'as', 'const', 'let', 'function', 'return', 'default', 'class', 'extends', 'props', 'state']),
      types: new Set(['React', 'FC', 'ReactNode', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef']),
      lineComment: '//',
    });

    this.register({
      id: 'python',
      name: 'Python',
      extensions: ['py', 'pyw', 'pyi'],
      keywords: new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None']),
      types: new Set(['int', 'float', 'str', 'list', 'dict', 'set', 'tuple', 'bool', 'bytes', 'object']),
      lineComment: '#',
    });

    this.register({
      id: 'java',
      name: 'Java',
      extensions: ['java'],
      keywords: new Set(['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'sealed', 'permits', 'yield', 'var', 'null', 'true', 'false']),
      types: new Set(['String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'List', 'Map', 'Set', 'Optional', 'Class', 'Object']),
      lineComment: '//',
    });

    this.register({
      id: 'c',
      name: 'C',
      extensions: ['c', 'h'],
      keywords: new Set(cKeywords),
      types: new Set(cTypes),
      lineComment: '//',
    });

    this.register({
      id: 'cpp',
      name: 'C++',
      extensions: ['cpp', 'cxx', 'cc', 'hpp', 'hxx', 'h++'],
      keywords: new Set([...cKeywords, 'class', 'public', 'protected', 'private', 'template', 'typename', 'this', 'friend', 'virtual', 'override', 'final', 'noexcept', 'constexpr', 'consteval', 'decltype', 'concept', 'requires', 'co_await', 'co_return', 'co_yield', 'namespace', 'using', 'try', 'catch', 'throw', 'new', 'delete', 'nullptr', 'true', 'false']),
      types: new Set([...cTypes, 'std', 'string', 'vector', 'map', 'unordered_map', 'unique_ptr', 'shared_ptr', 'array', 'pair', 'tuple']),
      lineComment: '//',
    });

    this.register({
      id: 'csharp',
      name: 'C#',
      extensions: ['cs'],
      keywords: new Set(['abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while', 'record', 'init', 'var', 'async', 'await', 'yield']),
      types: new Set(['Task', 'ValueTask', 'Action', 'Func', 'List', 'Dictionary', 'IEnumerable', 'Span', 'ReadOnlySpan']),
      lineComment: '//',
    });

    this.register({
      id: 'rust',
      name: 'Rust',
      extensions: ['rs'],
      keywords: new Set(['as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while']),
      types: new Set(['i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc']),
      lineComment: '//',
    });

    this.register({
      id: 'go',
      name: 'Go',
      extensions: ['go'],
      keywords: new Set(['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var', 'nil', 'true', 'false', 'iota']),
      types: new Set(['bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr']),
      lineComment: '//',
    });

    this.register({
      id: 'kotlin',
      name: 'Kotlin',
      extensions: ['kt', 'kts'],
      keywords: new Set(['package', 'import', 'class', 'interface', 'fun', 'val', 'var', 'is', 'in', 'this', 'super', 'when', 'try', 'catch', 'finally', 'for', 'do', 'while', 'throw', 'return', 'continue', 'break', 'object', 'companion', 'data', 'sealed', 'override', 'open', 'private', 'protected', 'public', 'internal']),
      types: new Set(['Int', 'Long', 'Float', 'Double', 'Boolean', 'String', 'Char', 'Any', 'Unit', 'Nothing', 'List', 'Map', 'Set']),
      lineComment: '//',
    });

    this.register({
      id: 'swift',
      name: 'Swift',
      extensions: ['swift'],
      keywords: new Set(['import', 'let', 'var', 'func', 'class', 'struct', 'enum', 'protocol', 'extension', 'init', 'deinit', 'subscript', 'typealias', 'if', 'else', 'switch', 'case', 'default', 'for', 'in', 'while', 'repeat', 'return', 'guard', 'defer', 'throw', 'try', 'catch', 'break', 'continue']),
      types: new Set(['Int', 'Double', 'Float', 'Bool', 'String', 'Character', 'Array', 'Dictionary', 'Set', 'Optional']),
      lineComment: '//',
    });

    this.register({
      id: 'php',
      name: 'PHP',
      extensions: ['php', 'phtml'],
      keywords: new Set(['function', 'class', 'interface', 'trait', 'extends', 'implements', 'public', 'protected', 'private', 'static', 'final', 'abstract', 'echo', 'print', 'return', 'if', 'else', 'elseif', 'while', 'do', 'for', 'foreach', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'namespace', 'use']),
      types: new Set(['int', 'float', 'string', 'bool', 'array', 'object', 'callable', 'iterable', 'void', 'mixed', 'null']),
      lineComment: '//',
    });

    this.register({
      id: 'ruby',
      name: 'Ruby',
      extensions: ['rb', 'rake', 'gemspec'],
      keywords: new Set(['def', 'end', 'class', 'module', 'if', 'else', 'elsif', 'unless', 'while', 'until', 'for', 'in', 'do', 'begin', 'rescue', 'ensure', 'raise', 'return', 'yield', 'self', 'super', 'true', 'false', 'nil']),
      types: new Set(['Integer', 'Float', 'String', 'Array', 'Hash', 'Symbol']),
      lineComment: '#',
    });

    this.register({
      id: 'html',
      name: 'HTML',
      extensions: ['html', 'htm'],
      keywords: new Set(['doctype', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta', 'title', 'button', 'input', 'form', 'table', 'tr', 'td', 'th', 'ul', 'ol', 'li']),
      types: new Set(['class', 'id', 'src', 'href', 'style', 'rel', 'type', 'name', 'value']),
      lineComment: '<!--',
    });

    this.register({
      id: 'css',
      name: 'CSS',
      extensions: ['css'],
      keywords: new Set(['import', 'media', 'keyframes', 'root', 'hover', 'active', 'focus', 'before', 'after']),
      types: new Set(['display', 'position', 'color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'font-size', 'flex', 'grid']),
      lineComment: '/*',
    });

    this.register({
      id: 'scss',
      name: 'SCSS / SASS',
      extensions: ['scss', 'sass'],
      keywords: new Set(['import', 'use', 'forward', 'mixin', 'include', 'function', 'return', 'extend', 'if', 'else', 'each', 'for', 'while']),
      types: new Set(['color', 'background', 'display', 'position']),
      lineComment: '//',
    });

    this.register({
      id: 'less',
      name: 'LESS',
      extensions: ['less'],
      keywords: new Set(['import', 'plugin', 'extend', 'when']),
      types: new Set(['color', 'margin', 'padding']),
      lineComment: '//',
    });

    this.register({
      id: 'json',
      name: 'JSON / JSONC',
      extensions: ['json', 'jsonc', 'json5'],
      keywords: new Set(['true', 'false', 'null']),
      types: new Set([]),
      lineComment: '//',
    });

    this.register({
      id: 'yaml',
      name: 'YAML',
      extensions: ['yaml', 'yml'],
      keywords: new Set(['true', 'false', 'yes', 'no', 'null', '~']),
      types: new Set(['name', 'version', 'description', 'dependencies', 'author', 'main']),
      lineComment: '#',
    });

    this.register({
      id: 'toml',
      name: 'TOML',
      extensions: ['toml'],
      keywords: new Set(['true', 'false']),
      types: new Set(['package', 'dependencies', 'build', 'workspace']),
      lineComment: '#',
    });

    this.register({
      id: 'xml',
      name: 'XML / SVG',
      extensions: ['xml', 'svg', 'pom', 'fxml'],
      keywords: new Set(['xml', 'version', 'encoding', 'xmlns', 'svg', 'path', 'project', 'modelVersion', 'groupId', 'artifactId', 'dependencies']),
      types: new Set(['id', 'name', 'value', 'type']),
      lineComment: '<!--',
    });

    this.register({
      id: 'sql',
      name: 'SQL',
      extensions: ['sql'],
      keywords: new Set(['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES']),
      types: new Set(['INT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TIMESTAMP', 'DATETIME', 'FLOAT', 'DOUBLE', 'BIGINT', 'BLOB']),
      lineComment: '--',
    });

    this.register({
      id: 'bash',
      name: 'Bash / Shell',
      extensions: ['sh', 'bash', 'zsh'],
      keywords: new Set(['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'export', 'source', 'local']),
      types: new Set(['grep', 'sed', 'awk', 'find', 'curl', 'wget', 'cat', 'rm', 'mkdir', 'cp', 'mv']),
      lineComment: '#',
    });

    this.register({
      id: 'powershell',
      name: 'PowerShell',
      extensions: ['ps1', 'psm1', 'psd1'],
      keywords: new Set(['function', 'param', 'if', 'else', 'elseif', 'switch', 'foreach', 'for', 'while', 'do', 'until', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw']),
      types: new Set(['string', 'int', 'bool', 'array', 'hashtable']),
      lineComment: '#',
    });

    this.register({
      id: 'batch',
      name: 'Batch / CMD',
      extensions: ['bat', 'cmd'],
      keywords: new Set(['echo', 'set', 'if', 'else', 'goto', 'call', 'exit', 'pause', 'rem', 'for', 'in', 'do', 'shift', 'cd', 'cls', 'copy', 'move', 'del', 'mkdir']),
      types: new Set(['nul', 'con', 'prn']),
      lineComment: '::',
    });

    this.register({
      id: 'markdown',
      name: 'Markdown',
      extensions: ['md', 'markdown', 'mdx'],
      keywords: new Set(['title', 'author', 'date', 'summary']),
      types: new Set([]),
      lineComment: '<!--',
    });

    this.register({
      id: 'lua',
      name: 'Lua',
      extensions: ['lua'],
      keywords: new Set(['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while']),
      types: new Set(['print', 'type', 'tostring', 'tonumber', 'table', 'string', 'math']),
      lineComment: '--',
    });

    this.register({
      id: 'dart',
      name: 'Dart',
      extensions: ['dart'],
      keywords: new Set(['import', 'library', 'class', 'extends', 'with', 'implements', 'abstract', 'void', 'var', 'final', 'const', 'late', 'dynamic', 'if', 'else', 'for', 'while', 'return', 'async', 'await']),
      types: new Set(['String', 'int', 'double', 'bool', 'List', 'Map', 'Set', 'Future', 'Stream']),
      lineComment: '//',
    });

    this.register({
      id: 'scala',
      name: 'Scala',
      extensions: ['scala', 'sc'],
      keywords: new Set(['package', 'import', 'class', 'trait', 'object', 'case', 'val', 'var', 'def', 'type', 'implicit', 'extends', 'with', 'if', 'else', 'match', 'for', 'yield', 'return']),
      types: new Set(['Int', 'Long', 'Float', 'Double', 'Boolean', 'String', 'List', 'Option', 'Map']),
      lineComment: '//',
    });

    this.register({
      id: 'haskell',
      name: 'Haskell',
      extensions: ['hs', 'lhs'],
      keywords: new Set(['module', 'where', 'import', 'data', 'type', 'newtype', 'class', 'instance', 'deriving', 'do', 'let', 'in', 'if', 'then', 'else', 'case', 'of']),
      types: new Set(['Int', 'Integer', 'Float', 'Double', 'Bool', 'Char', 'String', 'Maybe', 'Either', 'IO']),
      lineComment: '--',
    });

    this.register({
      id: 'perl',
      name: 'Perl',
      extensions: ['pl', 'pm'],
      keywords: new Set(['my', 'our', 'local', 'sub', 'package', 'use', 'require', 'if', 'unless', 'else', 'elsif', 'while', 'until', 'for', 'foreach', 'return', 'print']),
      types: new Set([]),
      lineComment: '#',
    });

    this.register({
      id: 'r',
      name: 'R Language',
      extensions: ['r', 'rmd'],
      keywords: new Set(['if', 'else', 'repeat', 'while', 'function', 'for', 'in', 'next', 'break', 'TRUE', 'FALSE', 'NULL', 'NA']),
      types: new Set(['vector', 'matrix', 'data.frame', 'list', 'c']),
      lineComment: '#',
    });

    this.register({
      id: 'clojure',
      name: 'Clojure',
      extensions: ['clj', 'cljs', 'cljc', 'edn'],
      keywords: new Set(['def', 'defn', 'defmacro', 'let', 'if', 'when', 'cond', 'case', 'fn', 'loop', 'recur', 'ns']),
      types: new Set(['nil', 'true', 'false']),
      lineComment: ';',
    });

    this.register({
      id: 'elixir',
      name: 'Elixir',
      extensions: ['ex', 'exs'],
      keywords: new Set(['def', 'defp', 'defmodule', 'defmacro', 'import', 'alias', 'require', 'use', 'if', 'unless', 'case', 'cond', 'with', 'for', 'do', 'end', 'true', 'false', 'nil']),
      types: new Set(['Enum', 'String', 'Integer', 'Map', 'List']),
      lineComment: '#',
    });

    this.register({
      id: 'erlang',
      name: 'Erlang',
      extensions: ['erl', 'hrl'],
      keywords: new Set(['module', 'export', 'import', 'case', 'of', 'if', 'end', 'fun', 'receive', 'after', 'when']),
      types: new Set(['atom', 'binary', 'tuple', 'list']),
      lineComment: '%',
    });

    this.register({
      id: 'zig',
      name: 'Zig',
      extensions: ['zig'],
      keywords: new Set(['const', 'var', 'fn', 'pub', 'export', 'extern', 'struct', 'enum', 'union', 'test', 'if', 'else', 'while', 'for', 'switch', 'return', 'defer', 'errdefer', 'try', 'catch', 'unreachable']),
      types: new Set(['i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'f32', 'f64', 'bool', 'void', 'usize', 'isize']),
      lineComment: '//',
    });

    this.register({
      id: 'nim',
      name: 'Nim',
      extensions: ['nim', 'nims'],
      keywords: new Set(['proc', 'func', 'type', 'var', 'let', 'const', 'if', 'elif', 'else', 'while', 'for', 'return', 'yield', 'import', 'export', 'template', 'macro']),
      types: new Set(['int', 'int32', 'int64', 'float', 'string', 'char', 'bool', 'seq']),
      lineComment: '#',
    });

    this.register({
      id: 'ocaml',
      name: 'OCaml',
      extensions: ['ml', 'mli'],
      keywords: new Set(['let', 'rec', 'in', 'type', 'val', 'module', 'open', 'match', 'with', 'if', 'then', 'else', 'function', 'fun', 'begin', 'end']),
      types: new Set(['int', 'float', 'string', 'char', 'bool', 'list', 'option']),
      lineComment: '(*',
    });

    this.register({
      id: 'fsharp',
      name: 'F#',
      extensions: ['fs', 'fsi', 'fsx'],
      keywords: new Set(['let', 'rec', 'type', 'module', 'open', 'match', 'with', 'if', 'then', 'else', 'for', 'in', 'do', 'while', 'yield', 'return', 'async']),
      types: new Set(['int', 'float', 'string', 'bool', 'list', 'option', 'seq', 'unit']),
      lineComment: '//',
    });

    this.register({
      id: 'assembly',
      name: 'Assembly (x86/ARM)',
      extensions: ['asm', 's'],
      keywords: new Set(['mov', 'push', 'pop', 'call', 'ret', 'jmp', 'je', 'jne', 'jz', 'jnz', 'add', 'sub', 'mul', 'div', 'xor', 'and', 'or', 'cmp', 'test', 'lea', 'nop']),
      types: new Set(['eax', 'ebx', 'ecx', 'edx', 'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rsp', 'rbp', 'byte', 'word', 'dword', 'qword']),
      lineComment: ';',
    });

    this.register({
      id: 'cmake',
      name: 'CMake',
      extensions: ['cmake'],
      keywords: new Set(['cmake_minimum_required', 'project', 'add_executable', 'add_library', 'target_link_libraries', 'target_include_directories', 'set', 'if', 'endif', 'foreach', 'endforeach', 'find_package', 'message']),
      types: new Set(['REQUIRED', 'PUBLIC', 'PRIVATE', 'INTERFACE']),
      lineComment: '#',
    });

    this.register({
      id: 'dockerfile',
      name: 'Dockerfile',
      extensions: ['dockerfile'],
      keywords: new Set(['FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL']),
      types: new Set(['AS']),
      lineComment: '#',
    });

    this.register({
      id: 'ini',
      name: 'INI / Config',
      extensions: ['ini', 'conf', 'cfg', 'properties', 'env'],
      keywords: new Set(['true', 'false', 'yes', 'no', 'on', 'off']),
      types: new Set([]),
      lineComment: '#',
    });

    this.register({
      id: 'graphql',
      name: 'GraphQL',
      extensions: ['graphql', 'gql'],
      keywords: new Set(['query', 'mutation', 'subscription', 'type', 'input', 'interface', 'union', 'enum', 'scalar', 'schema', 'implements', 'directive']),
      types: new Set(['String', 'Int', 'Float', 'Boolean', 'ID']),
      lineComment: '#',
    });

    this.register({
      id: 'protobuf',
      name: 'Protocol Buffers',
      extensions: ['proto'],
      keywords: new Set(['syntax', 'package', 'import', 'message', 'enum', 'service', 'rpc', 'returns', 'optional', 'required', 'repeated', 'reserved']),
      types: new Set(['int32', 'int64', 'uint32', 'uint64', 'float', 'double', 'bool', 'string', 'bytes']),
      lineComment: '//',
    });

    this.register({
      id: 'glsl',
      name: 'GLSL / Shaders',
      extensions: ['glsl', 'vert', 'frag', 'comp', 'wgsl', 'hlsl'],
      keywords: new Set(['attribute', 'uniform', 'varying', 'layout', 'in', 'out', 'inout', 'discard', 'return', 'if', 'else', 'for', 'while']),
      types: new Set(['void', 'bool', 'int', 'uint', 'float', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube']),
      lineComment: '//',
    });

    this.register({
      id: 'nginx',
      name: 'Nginx Config',
      extensions: ['nginx', 'conf'],
      keywords: new Set(['server', 'location', 'http', 'events', 'listen', 'server_name', 'proxy_pass', 'root', 'index', 'try_files', 'ssl_certificate', 'ssl_certificate_key', 'gzip']),
      types: new Set(['on', 'off']),
      lineComment: '#',
    });

    this.register({
      id: 'solidity',
      name: 'Solidity',
      extensions: ['sol'],
      keywords: new Set(['pragma', 'solidity', 'contract', 'library', 'interface', 'is', 'function', 'modifier', 'event', 'constructor', 'public', 'private', 'internal', 'external', 'view', 'pure', 'payable', 'returns', 'require', 'assert', 'revert']),
      types: new Set(['address', 'uint', 'uint256', 'int', 'bool', 'string', 'bytes', 'mapping']),
      lineComment: '//',
    });

    this.register({
      id: 'vue',
      name: 'Vue SFC',
      extensions: ['vue'],
      keywords: new Set(['template', 'script', 'style', 'setup', 'scoped', 'lang', 'export', 'default', 'import', 'const', 'ref', 'reactive', 'computed']),
      types: new Set(['v-if', 'v-for', 'v-model', 'v-bind', 'v-on']),
      lineComment: '//',
    });

    this.register({
      id: 'svelte',
      name: 'Svelte',
      extensions: ['svelte'],
      keywords: new Set(['script', 'style', 'let', 'export', 'import', 'const', 'function', 'onMount']),
      types: new Set(['bind:', 'on:']),
      lineComment: '//',
    });

    this.register({
      id: 'makefile',
      name: 'Makefile',
      extensions: ['mk'],
      keywords: new Set(['all', 'clean', 'install', 'PHONY', 'include', 'export', 'override']),
      types: new Set(['CC', 'CFLAGS', 'CXX', 'CXXFLAGS', 'LDFLAGS']),
      lineComment: '#',
    });

    this.register({
      id: 'vlang',
      name: 'V (Vlang)',
      extensions: ['v'],
      keywords: new Set(['fn', 'pub', 'mut', 'const', 'struct', 'enum', 'interface', 'type', 'import', 'module', 'return', 'if', 'else', 'for', 'in', 'match', 'go']),
      types: new Set(['int', 'i64', 'f32', 'f64', 'string', 'bool', 'byte', 'void']),
      lineComment: '//',
    });

    this.register({
      id: 'groovy',
      name: 'Groovy / Gradle',
      extensions: ['groovy', 'gradle'],
      keywords: new Set(['def', 'class', 'interface', 'trait', 'package', 'import', 'plugins', 'repositories', 'dependencies', 'tasks', 'register', 'apply', 'from', 'if', 'else', 'return']),
      types: new Set(['String', 'Integer', 'Boolean', 'List', 'Map']),
      lineComment: '//',
    });
  }
}

export const syntaxHighlighter = new SyntaxHighlighter();
