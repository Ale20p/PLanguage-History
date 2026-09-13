import { AstParserEngine, ParseResult, LocalExecutionResult } from './astParser';

class CompilerBridge {
  private worker: Worker | null = null;
  private isWorkerSupported = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        this.worker = new Worker(new URL('./compiler.worker.ts', import.meta.url));
        this.isWorkerSupported = true;
      } catch (e) {
        console.warn('[CompilerBridge] WebWorker instantiation failed, using main-thread fallback:', e);
        this.worker = null;
        this.isWorkerSupported = false;
      }
    }
  }

  public async parseAst(languageId: string, code: string): Promise<ParseResult> {
    const worker = this.worker;
    if (!this.isWorkerSupported || !worker) {
      return AstParserEngine.parse(languageId, code);
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'AST_SUCCESS') {
          worker.removeEventListener('message', handler);
          resolve(event.data.result);
        } else if (event.data.type === 'AST_ERROR') {
          worker.removeEventListener('message', handler);
          resolve(AstParserEngine.parse(languageId, code)); // fallback
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'PARSE_AST', languageId, code });
    });
  }

  public async executeLocal(languageId: string, code: string, input: string = ''): Promise<LocalExecutionResult | null> {
    const worker = this.worker;
    if (!this.isWorkerSupported || !worker) {
      return AstParserEngine.executeClientSide(languageId, code, input);
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'RUN_SUCCESS') {
          worker.removeEventListener('message', handler);
          resolve(event.data.result);
        } else if (event.data.type === 'RUN_ERROR') {
          worker.removeEventListener('message', handler);
          resolve(AstParserEngine.executeClientSide(languageId, code, input));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'RUN_LOCAL', languageId, code, input });
    });
  }
}

export const compilerBridge = new CompilerBridge();
