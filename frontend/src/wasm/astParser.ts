export interface AstNode {
  id: string;
  type: string;
  label: string;
  value?: string;
  line?: number;
  column?: number;
  children?: AstNode[];
}

export interface ParseResult {
  root: AstNode;
  totalNodes: number;
  maxDepth: number;
  error?: string;
}

export interface LocalExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export class AstParserEngine {
  private static idCounter = 0;

  private static nextId(): string {
    return `ast_node_${++this.idCounter}`;
  }

  public static parse(languageId: string, sourceCode: string): ParseResult {
    this.idCounter = 0;
    const lang = (languageId || '').toLowerCase().trim();

    try {
      if (lang === 'c' || lang === 'cpp' || lang === 'c++' || lang === 'cplusplus') {
        return this.parseCStyle(sourceCode, 'C/C++');
      } else if (lang === 'python' || lang === 'py' || lang === 'python3') {
        return this.parsePython(sourceCode);
      } else if (lang === 'lisp' || lang === 'scheme' || lang === 'clojure') {
        return this.parseLisp(sourceCode);
      } else if (lang === 'brainfuck' || lang === 'bf') {
        return this.parseBrainfuck(sourceCode);
      } else {
        return this.parseGeneric(sourceCode, languageId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Syntax parse failure';
      return {
        root: {
          id: this.nextId(),
          type: 'ParseError',
          label: `Error parsing ${languageId}`,
          value: message,
        },
        totalNodes: 1,
        maxDepth: 1,
        error: message,
      };
    }
  }

  // --- C / C++ AST Parser ---
  private static parseCStyle(code: string, dialectName: string): ParseResult {
    const root: AstNode = {
      id: this.nextId(),
      type: 'TranslationUnit',
      label: `${dialectName} Program`,
      children: [],
    };

    const lines = code.split('\n');
    let currentBlock: AstNode | null = null;

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      // Preprocessor directive
      if (trimmed.startsWith('#include')) {
        root.children!.push({
          id: this.nextId(),
          type: 'IncludeDirective',
          label: 'Include Directive',
          value: trimmed.replace('#include', '').trim(),
          line: lineNum,
        });
      } else if (trimmed.startsWith('#')) {
        root.children!.push({
          id: this.nextId(),
          type: 'PreprocessorDirective',
          label: 'Preprocessor Directive',
          value: trimmed,
          line: lineNum,
        });
      }
      // Function declaration/definition e.g. int main(...) {
      else if (/^(int|void|float|double|char|auto|bool)\s+([a-zA-Z_]\w*)\s*\((.*?)\)/.test(trimmed)) {
        const match = trimmed.match(/^(int|void|float|double|char|auto|bool)\s+([a-zA-Z_]\w*)\s*\((.*?)\)/);
        if (match) {
          const funcNode: AstNode = {
            id: this.nextId(),
            type: 'FunctionDefinition',
            label: `Function: ${match[2]}()`,
            value: `Returns ${match[1]}`,
            line: lineNum,
            children: [
              {
                id: this.nextId(),
                type: 'Parameters',
                label: 'Parameters',
                value: match[3].trim() || 'void',
              },
              {
                id: this.nextId(),
                type: 'CompoundStatement',
                label: 'Function Body',
                children: [],
              },
            ],
          };
          root.children!.push(funcNode);
          currentBlock = funcNode.children![1];
        }
      }
      // Statement within function
      else if (currentBlock) {
        if (trimmed === '}' || trimmed.endsWith('}')) {
          currentBlock = null;
        } else {
          const stmtNode: AstNode = {
            id: this.nextId(),
            type: 'Statement',
            label: this.categorizeStatement(trimmed),
            value: trimmed,
            line: lineNum,
          };
          currentBlock.children!.push(stmtNode);
        }
      } else {
        root.children!.push({
          id: this.nextId(),
          type: 'GlobalStatement',
          label: this.categorizeStatement(trimmed),
          value: trimmed,
          line: lineNum,
        });
      }
    });

    return this.calculateMetrics(root);
  }

  // --- Python AST Parser ---
  private static parsePython(code: string): ParseResult {
    const root: AstNode = {
      id: this.nextId(),
      type: 'Module',
      label: 'Python Module',
      children: [],
    };

    const lines = code.split('\n');
    let currentFunc: AstNode | null = null;

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        root.children!.push({
          id: this.nextId(),
          type: 'ImportStatement',
          label: 'Import',
          value: trimmed,
          line: lineNum,
        });
      } else if (trimmed.startsWith('def ')) {
        const match = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\):/);
        const funcNode: AstNode = {
          id: this.nextId(),
          type: 'FunctionDef',
          label: `def ${match ? match[1] : 'function'}()`,
          value: match ? `args: (${match[2]})` : '',
          line: lineNum,
          children: [],
        };
        root.children!.push(funcNode);
        currentFunc = funcNode;
      } else if (currentFunc && (lineText.startsWith('    ') || lineText.startsWith('\t'))) {
        currentFunc.children!.push({
          id: this.nextId(),
          type: 'Statement',
          label: this.categorizeStatement(trimmed),
          value: trimmed,
          line: lineNum,
        });
      } else {
        currentFunc = null;
        root.children!.push({
          id: this.nextId(),
          type: 'Statement',
          label: this.categorizeStatement(trimmed),
          value: trimmed,
          line: lineNum,
        });
      }
    });

    return this.calculateMetrics(root);
  }

  // --- Lisp S-Expression AST Parser ---
  private static parseLisp(code: string): ParseResult {
    const root: AstNode = {
      id: this.nextId(),
      type: 'Program',
      label: 'Lisp S-Expressions',
      children: [],
    };

    const tokens = code.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/);
    const stack: AstNode[] = [root];

    for (const token of tokens) {
      if (!token) continue;
      if (token === '(') {
        const listNode: AstNode = {
          id: this.nextId(),
          type: 'ListExpression',
          label: '( ... )',
          children: [],
        };
        stack[stack.length - 1].children!.push(listNode);
        stack.push(listNode);
      } else if (token === ')') {
        if (stack.length > 1) {
          const completed = stack.pop()!;
          if (completed.children && completed.children.length > 0) {
            completed.label = `(${completed.children[0].value || completed.children[0].label} ...)`;
          }
        }
      } else {
        const atomNode: AstNode = {
          id: this.nextId(),
          type: /^-?\d+(\.\d+)?$/.test(token) ? 'NumberLiteral' : 'Atom',
          label: token,
          value: token,
        };
        stack[stack.length - 1].children!.push(atomNode);
      }
    }

    return this.calculateMetrics(root);
  }

  // --- Brainfuck AST Parser ---
  private static parseBrainfuck(code: string): ParseResult {
    const root: AstNode = {
      id: this.nextId(),
      type: 'Program',
      label: 'Brainfuck AST',
      children: [],
    };

    const stack: AstNode[] = [root];
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char === '[') {
        const loopNode: AstNode = {
          id: this.nextId(),
          type: 'Loop',
          label: 'Loop [ ... ]',
          children: [],
        };
        stack[stack.length - 1].children!.push(loopNode);
        stack.push(loopNode);
      } else if (char === ']') {
        if (stack.length > 1) stack.pop();
      } else if (['+', '-', '<', '>', '.', ','].includes(char)) {
        const opNames: Record<string, string> = {
          '+': 'Increment Cell (+)',
          '-': 'Decrement Cell (-)',
          '>': 'Pointer Next (>)',
          '<': 'Pointer Prev (<)',
          '.': 'Output Char (.)',
          ',': 'Input Char (,)',
        };
        stack[stack.length - 1].children!.push({
          id: this.nextId(),
          type: 'Instruction',
          label: opNames[char] || char,
          value: char,
        });
      }
    }

    return this.calculateMetrics(root);
  }

  // --- Generic Fallback Parser ---
  private static parseGeneric(code: string, lang: string): ParseResult {
    const root: AstNode = {
      id: this.nextId(),
      type: 'SourceFile',
      label: `${lang || 'Generic'} Source`,
      children: [],
    };

    const lines = code.split('\n');
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (!trimmed) return;
      root.children!.push({
        id: this.nextId(),
        type: 'Line',
        label: this.categorizeStatement(trimmed),
        value: trimmed,
        line: idx + 1,
      });
    });

    return this.calculateMetrics(root);
  }

  private static categorizeStatement(line: string): string {
    if (line.startsWith('return ')) return 'ReturnStatement';
    if (line.startsWith('if ') || line.startsWith('if(')) return 'IfCondition';
    if (line.startsWith('for ') || line.startsWith('for(')) return 'ForLoop';
    if (line.startsWith('while ') || line.startsWith('while(')) return 'WhileLoop';
    if (line.includes('print') || line.includes('cout') || line.includes('printf')) return 'OutputCall';
    if (line.includes('=')) return 'Assignment';
    return 'Expression';
  }

  private static calculateMetrics(root: AstNode): ParseResult {
    let totalNodes = 0;
    let maxDepth = 0;

    const traverse = (node: AstNode, depth: number) => {
      totalNodes++;
      if (depth > maxDepth) maxDepth = depth;
      if (node.children) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    };

    traverse(root, 1);
    return { root, totalNodes, maxDepth };
  }

  // --- Built-In Lightweight Client-Side Execution (Brainfuck / Micro-dialect) ---
  public static executeClientSide(languageId: string, code: string, input: string = ''): LocalExecutionResult | null {
    const lang = (languageId || '').toLowerCase().trim();
    if (lang !== 'brainfuck' && lang !== 'bf') {
      return null; // Delegate heavy languages to remote backend daemon
    }

    const start = performance.now();
    const memory = new Uint8Array(30000);
    let ptr = 0;
    let pc = 0;
    let inputIdx = 0;
    let stdout = '';
    let steps = 0;
    const maxSteps = 1_000_000; // Watchdog

    const brackets: Record<number, number> = {};
    const stack: number[] = [];
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '[') stack.push(i);
      else if (code[i] === ']') {
        if (stack.length === 0) {
          return { stdout: '', stderr: 'Unmatched closing bracket', exitCode: 1, executionTimeMs: 0 };
        }
        const startIdx = stack.pop()!;
        brackets[startIdx] = i;
        brackets[i] = startIdx;
      }
    }

    while (pc < code.length) {
      if (++steps > maxSteps) {
        return {
          stdout,
          stderr: 'Client execution aborted: exceeded 1,000,000 instruction steps',
          exitCode: 137,
          executionTimeMs: Math.round(performance.now() - start),
        };
      }

      const op = code[pc];
      switch (op) {
        case '>': ptr = (ptr + 1) % 30000; break;
        case '<': ptr = (ptr - 1 + 30000) % 30000; break;
        case '+': memory[ptr]++; break;
        case '-': memory[ptr]--; break;
        case '.': stdout += String.fromCharCode(memory[ptr]); break;
        case ',': memory[ptr] = inputIdx < input.length ? input.charCodeAt(inputIdx++) : 0; break;
        case '[':
          if (memory[ptr] === 0) pc = brackets[pc];
          break;
        case ']':
          if (memory[ptr] !== 0) pc = brackets[pc];
          break;
      }
      pc++;
    }

    const elapsed = Math.round(performance.now() - start);
    return { stdout, stderr: '', exitCode: 0, executionTimeMs: elapsed };
  }
}
