import { AstParserEngine } from './astParser';

addEventListener('message', (event: MessageEvent) => {
  const { type, languageId, code, input } = event.data;

  if (type === 'PARSE_AST') {
    try {
      const result = AstParserEngine.parse(languageId, code);
      postMessage({ type: 'AST_SUCCESS', result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AST parsing failure';
      postMessage({ type: 'AST_ERROR', error: message });
    }
  } else if (type === 'RUN_LOCAL') {
    try {
      const result = AstParserEngine.executeClientSide(languageId, code, input);
      postMessage({ type: 'RUN_SUCCESS', result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Local execution error';
      postMessage({ type: 'RUN_ERROR', error: message });
    }
  }
});
