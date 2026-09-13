# API Endpoints Reference

This document provides a comprehensive reference of all REST and streaming endpoints exposed by the **PLanguage-History** backend (`/api/v1`).

---

## 1. Graph Visualization APIs

### Fetch Complete Lineage Graph
Retrieves the nodes and typed directed links for the entire programming language evolutionary graph.

- **Method:** `GET`
- **Path:** `/api/v1/graph`
- **Access:** Public
- **Response Format:** `application/json`
- **Response Status:** `200 OK`

```json
{
  "nodes": [
    {
      "id": "c",
      "name": "C",
      "group": "Procedural",
      "year": 1972
    },
    {
      "id": "cpp",
      "name": "C++",
      "group": "Multi-Paradigm",
      "year": 1985
    }
  ],
  "links": [
    {
      "source": "c",
      "target": "cpp",
      "type": "Influenced By"
    }
  ]
}
```

---

## 2. Language Exploration APIs

### Get Language Details
Fetches full biographical, paradigm, and code snippet metadata for a specific language.

- **Method:** `GET`
- **Path:** `/api/v1/languages/{id}`
- **Access:** Public
- **Path Parameters:**
  - `id` (string, required): The URL slug identifier of the language (e.g. `python`, `rust`, `c`).
- **Response Status:**
  - `200 OK`: Returns the language metadata object.
  - `404 Not Found`: Language ID was not found.

```json
{
  "id": "python",
  "name": "Python",
  "releaseDate": "1991-02-20",
  "paradigm": ["Object-Oriented", "Imperative", "Functional"],
  "creators": ["Guido van Rossum"],
  "description": "Python is a high-level, general-purpose programming language...",
  "codeSnippet": "def greet(name):\n    print(f'Hello, {name}!')\n\ngreet('World')",
  "influences": ["C", "ABC", "Modula-3"],
  "influenced": ["Ruby", "Swift", "Go", "Julia"]
}
```

### Search & Filter Languages
Query languages by search terms, paradigm classifications, or chronological eras.

- **Method:** `GET`
- **Path:** `/api/v1/languages/search`
- **Access:** Public
- **Query Parameters:**
  - `q` (string, optional): Full-text search term matching language names, descriptions, or creators.
  - `paradigm` (string, optional): Paradigm filter (e.g., `functional`, `object-oriented`, `imperative`).
  - `era` (string, optional): Decade filter (e.g., `1970s`, `1980s`, `1990s`, `2000s`).
- **Response Status:** `200 OK`

```json
[
  {
    "id": "haskell",
    "name": "Haskell",
    "releaseDate": "1990-01-01",
    "paradigm": ["Functional", "Purely Functional"],
    "creators": ["Lennart Augustsson", "Dave Barton", "Warren Burton", "Simon Peyton Jones"]
  }
]
```

---

## 3. Code Execution & Compilation APIs

> For full architectural details of the sandbox daemon, gRPC contracts, and security mitigations, see [Compiler & Execution Engine Architecture](file:///c:/Users/alexp/WORKSPACES/InProProjects/PLanguage-History/docs/architecture/compiler-execution-engine.md).

### Synchronous Code Execution
Submits a snippet of code for sandboxed compilation and execution.

- **Method:** `POST`
- **Path:** `/api/v1/compiler/execute`
- **Access:** Public (subject to IP rate-limits)
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "languageId": "cpp",
    "sourceCode": "#include <iostream>\nint main() {\n    std::cout << \"Hello from C++20!\" << std::endl;\n    return 0;\n}",
    "compilerFlags": ["-O2", "-std=c++20"],
    "stdinInput": "",
    "timeoutMs": 3000
  }
  ```
- **Response Status:**
  - `200 OK`: Code compiled and executed (or compilation failed with diagnostic errors).
  - `400 Bad Request`: Payload validation failure (e.g. source code > 64 KB, invalid language ID).
  - `429 Too Many Requests`: Client exceeded rate-limiting quota (max 10 executions/min).
  - `504 Gateway Timeout`: Process watchdog terminated execution after timeout limit.
  - `500 Internal Server Error`: Sandboxed daemon communication error.

```json
{
  "exitCode": 0,
  "stdout": "Hello from C++20!\n",
  "stderr": "",
  "compileTimeMs": 241,
  "executionTimeMs": 12,
  "peakMemoryBytes": 4194304,
  "timedOut": false
}
```

### Real-Time Execution Streaming
Opens an interactive streaming channel to receive live compiler logs, linking status, and standard output chunks as they occur.

- **Method:** `GET` / `WebSocket`
- **Path:** `/api/v1/compiler/stream`
- **Access:** Public
- **Protocol:** Server-Sent Events (SSE) or WebSocket
- **Chunk Types:**
  - `STATUS`: Engine lifecycle events (e.g., `Queued`, `Compiling`, `Sandboxing`, `Finished`).
  - `STDOUT`: Real-time chunks of standard output.
  - `STDERR`: Real-time chunks of standard error / compiler warnings.

---

## 4. GitOps & Ingestion APIs

### Synchronize Repository Data
Internal administrative endpoint utilized by GitHub Actions to sync parsed JSON/Markdown files to the production PostgreSQL database.

- **Method:** `POST`
- **Path:** `/api/v1/internal/sync`
- **Access:** Restricted (Requires API Key)
- **Headers:** `X-API-Key: <ADMIN_SECRET_KEY>`
- **Response Status:**
  - `200 OK`: Database synchronized successfully.
  - `401 Unauthorized`: Missing or invalid API key.
  - `422 Unprocessable Entity`: Validation failure in submitted language schemas.
