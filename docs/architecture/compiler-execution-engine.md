# Compiler & Sandboxed Code Execution Engine Architecture

This document provides the definitive architectural design, security isolation model, and protocol specifications for the **Built-In C++ Compiler & Sandboxed Code Execution Engine** in the **PLanguage-History** platform.

---

## 1. Executive Summary & Vision

The **PLanguage-History** platform catalogs the historical genealogy, paradigm relationships, and syntactic evolution of programming languages. To transform the platform from a static reference archive into an active exploration lab, the execution engine enables users to edit, compile, analyze, and run code samples directly within the platform.

### Core Objectives
1. **Interactive Code Execution:** Users can run, modify, and experiment with representative language snippets in real time directly from the language details modal.
2. **Dual-Engine Execution Strategy:**
   - **In-Browser WebAssembly Engine (Client-Side C++):** Delivers zero-latency execution, tokenization, and Abstract Syntax Tree (AST) visualization for lightweight and historical educational dialects (e.g., Mini-C, Lisp S-expressions, BASIC, Forth, Brainfuck).
   - **Sandboxed Remote Compiler Daemon (Headless C++ Core):** Isolated, high-throughput microservice leveraging Linux kernel security primitives (`seccomp`, `namespaces`, `cgroups v2`) to compile and execute heavy native languages (C, C++, Rust, Java, Go, Python).
3. **Compiler Pipeline Exploration:** Exposes intermediate stages of compilation—Lexing (tokens), Parsing (AST), Intermediate Representation (IR), and Assembly/Bytecode output.

---

## 2. High-Level System Architecture

```
                          [ Next.js Frontend ]
                        (Monaco Editor + Terminal)
                                 │       │
      1. Lightweight/Wasm Script │       │ 2. Remote Compilation
         (Zero-latency execution)│       │    (Heavy/Native Toolchains)
                                 ▼       ▼
                    [ WebAssembly ]   [ Spring Boot Backend ]
                    (C++ AST Engine)         │
                                             │ gRPC (Protobuf)
                                             ▼
                                  [ C++ Sandbox Engine ]
                                  (seccomp, cgroups v2,
                                   ephemeral runtimes)
                                             │
                                ┌────────────┴────────────┐
                                ▼                         ▼
                        Native Toolchains         JIT / Bytecode VM
                       (Clang, GCC, Rustc)      (Custom Historical VM)
```

### Component Flow
1. **Client Interaction:** The user views a language snippet in `LanguageModal.tsx` / `CodeBlock.tsx` and clicks **Run** or **Inspect AST**.
2. **Execution Routing:**
   - Lightweight educational or historical languages execute immediately in the browser via an Emscripten-compiled WebAssembly worker.
   - Native or system languages submit an execution request to the Spring Boot API Gateway (`/api/v1/compiler/execute` or `/api/v1/compiler/stream`).
3. **Gateway Processing:**
   - Checks SHA-256 cache of `(language_id + source_code + compiler_flags)`.
   - Enforces IP-based token-bucket rate limits.
   - Forwards request over gRPC to the C++ Sandboxed Execution Daemon.
4. **Sandboxed Execution:**
   - Spawns an ephemeral execution sandbox with strictly constrained Linux cgroups v2, namespaces, and seccomp filters.
   - Compiles and runs the code against the requested toolchain (Clang, GCC, Rustc, OpenJDK, Python).
   - Captures stdout, stderr, compile duration, and peak memory usage.
5. **Output Delivery:** Results are streamed or returned via REST/WebSocket back to the Next.js frontend terminal emulator (`xterm.js` / glassmorphic console).

---

## 3. Sandboxed Execution Daemon (`services/compiler-daemon/`)

The daemon runs as an isolated microservice written in modern C++20. It listens for incoming gRPC requests, orchestrates isolated execution sandboxes, dispatches jobs to compiler toolchains, and streams metrics back to the gateway.

### 3.1 Technical Specifications
- **Language Standard:** Modern C++20 (RAII resource management, concepts, smart pointers).
- **Networking & RPC:** `grpc++` and Protocol Buffers v3.
- **Concurrency Model:** Epoll-backed event loop with an asynchronous thread pool for process orchestration.

### 3.2 Linux Sandboxing Architecture
Every execution runs in strict isolation utilizing four core layers:

1. **Linux Namespaces (`unshare`):**
   - **PID Namespace:** Sandboxed process cannot view or signal any daemon or host processes.
   - **Mount Namespace:** Custom pivot root; host directories are completely invisible.
   - **Network Namespace:** Disabled loopback, zero virtual interfaces, completely blocking outbound network connections.
   - **IPC Namespace:** Prevents shared memory exploits across process boundaries.
2. **cgroups v2 Resource Throttling:**
   - `memory.max = 128M`: Hard ceiling to thwart memory exhaustion and allocation bombs.
   - `cpu.max = "50000 100000"`: Caps CPU usage to at most 50% of a single physical core.
   - `pids.max = 32`: Completely neutralizes fork bombs (`:(){ :|:& };:`).
3. **seccomp-bpf Syscall Whitelist:**
   - Filters system calls using BPF filters.
   - Only fundamental I/O and process lifecycle syscalls are permitted (`read`, `write`, `exit_group`, `futex`, `fstat`, `brk`, `mmap`).
   - Sockets (`socket`, `connect`, `bind`), filesystem mutation (`unlink`, `rename`, `chmod`), and privilege escalation are blocked with `SECCOMP_RET_KILL`.
4. **Ephemeral Storage (`tmpfs`):**
   - Mounts an in-memory `tmpfs` under `/tmp/sandbox_<uuid>` limited to 10MB.
   - Unmounted and cryptographically wiped immediately upon job termination.

### 3.3 Daemon Directory Structure
```
services/compiler-daemon/
├── CMakeLists.txt
├── Dockerfile
├── proto/
│   └── compiler.proto
├── src/
│   ├── main.cpp
│   ├── server/
│   │   ├── CompilerServiceImpl.hpp
│   │   └── CompilerServiceImpl.cpp
│   ├── sandbox/
│   │   ├── SandboxEnvironment.hpp
│   │   ├── LinuxNamespace.cpp
│   │   ├── CGroupManager.cpp
│   │   └── SeccompFilter.cpp
│   ├── runners/
│   │   ├── ToolchainRunner.hpp
│   │   ├── ClangRunner.cpp
│   │   ├── RustRunner.cpp
│   │   └── InterpretedRunner.cpp
│   └── vm/
│       ├── BytecodeVM.hpp
│       └── HistoricalDialectInterpreter.cpp
```

---

## 4. In-Browser WebAssembly Engine (`frontend/src/wasm/`)

For instant feedback without network latency, a lightweight C++ parser and bytecode evaluator is compiled to WebAssembly via Emscripten.

### 4.1 Responsibilities
- **Tokenizing & AST Generation:** Lexes and parses source code, returning a hierarchical JSON representation of the AST for visual rendering.
- **Historical Dialect Interpretation:** Implements an interactive interpreter for historic or micro-dialects (e.g., Lisp S-expressions, Pascal P-Code, Forth word stacks).
- **Syntax Validation:** Performs instant client-side syntax checks before dispatching heavier payloads to the backend.

### 4.2 Build Configuration
- **Compilation Flags:** `-O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s ALLOW_MEMORY_GROWTH=1 --bind`
- **Worker Isolation:** Packaged as an asynchronous Web Worker (`compiler.worker.ts`) to guarantee that evaluation loops never block the React rendering thread.

---

## 5. Protobuf Protocol Contract (`compiler.proto`)

Communication between the Spring Boot API Gateway and the C++ Compiler Daemon is governed by gRPC:

```protobuf
syntax = "proto3";

package com.planguage.history.compiler;

option java_multiple_files = true;
option java_package = "com.planguage.history.compiler.grpc";

service ExecutionService {
  rpc ExecuteCode (ExecutionRequest) returns (ExecutionResponse);
  rpc StreamExecution (ExecutionRequest) returns (stream ExecutionChunk);
}

message ExecutionRequest {
  string language_id = 1;
  string source_code = 2;
  repeated string compiler_flags = 3;
  string stdin_input = 4;
  int32 timeout_ms = 5;
}

message ExecutionResponse {
  int32 exit_code = 1;
  string stdout = 2;
  string stderr = 3;
  int64 compile_time_ms = 4;
  int64 execution_time_ms = 5;
  int64 peak_memory_bytes = 6;
  bool timed_out = 7;
}

message ExecutionChunk {
  enum OutputType {
    STDOUT = 0;
    STDERR = 1;
    STATUS = 2;
  }
  OutputType type = 1;
  bytes data = 2;
}
```

---

## 6. Spring Boot Gateway Integration

The Spring Boot backend acts as the secure API gateway and orchestrator:

1. **gRPC Channel Pooling:** Configured with managed channels to maintain persistent, low-overhead HTTP/2 connections to the daemon.
2. **Deterministic Result Caching:**
   - Computes SHA-256 hash of `(language_id + source_code + compiler_flags)`.
   - Checks Caffeine / Redis cache. If an identical immutable snippet was already compiled and executed successfully, returns the cached result in `< 5ms`.
3. **Rate Limiting & Abuse Prevention:**
   - Token-bucket rate limiting per client IP (e.g., maximum 10 executions per minute for unauthenticated requests).
   - Source code payload length capped at 64 KB.
   - Execution timeout capped at 5,000 ms.

---

## 7. Frontend User Experience (`frontend/`)

1. **Language Exploration:** User clicks a language node in `ForceGraph.tsx` or navigates via `GraphExplorer.tsx`.
2. **Interactive Modal:** `LanguageModal.tsx` presents the history and code snippets.
3. **Active Workspace:**
   - Clicking **"Run Code"** transforms the static `CodeBlock.tsx` into an interactive Monaco Editor.
   - User edits code and clicks **"Execute"**.
   - A glassmorphic terminal panel (`CompilerTerminal.tsx`) slides out displaying build lifecycle steps (`Compiling... -> Linking... -> Running`), followed by standard output, exit codes, and execution metrics (e.g., `Memory: 4.2 MB | Time: 18ms`).
4. **AST Visualizer Tab:** Displays the interactive AST tree produced by the Wasm engine, showing how syntax constructs map to grammatical node trees.

---

## 8. Security & Threat Mitigation Matrix

| Attack Vector | Mechanism | Defense Implementation |
|---|---|---|
| **Fork Bomb** | Recursive process spawning (`:(){ :|:& };:`) | `pids.max = 32` via cgroups v2; `RLIMIT_NPROC` set to 32. |
| **Memory Exhaustion** | Huge dynamic allocations (`malloc(10GB)`) | `memory.max = 128M` hard ceiling; `RLIMIT_AS` capped; kernel OOM killer triggers kill signal. |
| **Filesystem Tampering** | Attempts to read `/etc/passwd` or overwrite `/bin` | Read-only root filesystem (`pivot_root`); isolated in-memory `tmpfs` only. |
| **Network Attack** | Botnet traffic, scraping internal APIs, port scanning | Network namespace isolated with no virtual interfaces; zero internet egress. |
| **Infinite Loops** | `while(true) {}` starving CPU cores | Hard watchdog timer terminates runner after 5,000 ms with `SIGKILL`. |
| **Kernel Exploits** | Exploiting unprivileged kernel syscalls | Strict seccomp-bpf filter rejecting raw sockets, ptrace, and module loading. |

---

## 9. Verification & Acceptance Criteria

1. **Compilation Latency:** End-to-end round trip for native C++ snippet compilation under 1.2 seconds; sub-50ms for in-browser Wasm execution.
2. **Isolation Guarantee:** Automated test suite successfully catches and neutralizes fork bombs, disk fill attempts, and socket opening attempts without affecting the daemon.
3. **Graceful Fallback:** Seamless fallback from Remote Daemon to WebAssembly when operating in offline mode or during high backend load.
4. **Code Quality:** Modern C++20 guidelines (zero raw pointer ownership, RAII resource tracking, concept constraints).
