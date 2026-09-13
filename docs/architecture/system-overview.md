# System Overview: Programming Language Genealogy

This document provides a high-level technical overview of the **Programming Language Genealogy & Evolution** platform. The system is designed to be a high-performance, interactive "digital museum" that visualizes the historical connections between programming languages.

## 1. High-Level Architecture

The platform follows a modern four-tier hybrid architecture with an isolated execution microservice and a decoupled GitOps data pipeline:

- **Client Tier:** A responsive Next.js application featuring interactive graph visualization, an in-browser WebAssembly AST parser/evaluator, an embedded Monaco Editor, and a glassmorphic terminal console.
- **API Gateway Tier:** A robust Spring Boot backend serving RESTful graph endpoints, enforcing token-bucket rate limits, performing deterministic SHA-256 result caching, and dispatching execution workloads via gRPC.
- **Execution Sandbox Tier:** A high-throughput, headless C++20 compiler daemon that executes untrusted code within isolated Linux sandboxes constrained by `seccomp-bpf`, `cgroups v2`, and custom namespaces.
- **Data Tier:** A relational PostgreSQL database optimized for many-to-many relationship queries.
- **Pipeline:** A Python-based ingestion engine triggered by GitHub Actions for community-driven data updates.

> For the comprehensive specification of the execution subsystem, see [Compiler & Execution Engine Architecture](file:///c:/Users/alexp/WORKSPACES/InProProjects/PLanguage-History/docs/architecture/compiler-execution-engine.md).

---

## 2. Frontend Stack (The "Liquid Glass" UI)

The frontend is built for visual impact and smooth performance, adhering to a "Liquid Glass" design philosophy.

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Visualization:** [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) - Utilizes HTML5 Canvas for rendering thousands of nodes and edges smoothly.
- **Code Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Embedded interactive code editor for syntax exploration and snippet modification.
- **Terminal Emulator:** Custom glassmorphic terminal powered by [xterm.js](https://xtermjs.org/) for real-time build lifecycle logs and stdout/stderr output.
- **Client-Side Engine:** WebAssembly worker compiled from modern C++ via Emscripten for zero-latency AST visualization and lightweight historical dialect interpretation.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Custom configuration for transparency and border refractions.
- **Interactivity:** [Framer Motion](https://www.framer.com/motion/) - Powers modal transitions and UI physics.

### Key Components:
- **Force-Directed Graph:** The central hub for navigation.
- **Interactive Modals:** Detailed views for specific languages using transparent glass aesthetics.
- **Interactive Code Workspace:** Monaco-powered editor with live execution controls inside `CodeBlock.tsx` and `LanguageModal.tsx`.
- **AST Visualizer:** Interactive tree visualizer rendering AST hierarchies generated in-browser via WebAssembly.
- **Compiler Console:** Real-time terminal output panel with metrics (compile time, memory usage, exit code).
- **Search & Filter:** Contextual tools to isolate specific eras or paradigms.

---

## 3. Backend Stack (API Services & Execution Gateway)

The backend is a secure, scalable Java application responsible for data orchestration, execution governance, and business logic.

- **Framework:** [Spring Boot](https://spring.io/projects/spring-boot)
- **Data Access:** [Spring Data JPA](https://spring.io/projects/spring-data-jpa) - Simplifies database interactions.
- **RPC Client:** `grpc-spring-boot-starter` / Netty gRPC channel pool for communicating with the C++ compiler daemon.
- **Caching & Rate Limiting:** SHA-256 deterministic snippet caching (Caffeine/Redis) and token-bucket rate limiting per IP address.
- **Security:** Standard JWT-based or Session management (as required).
- **API Style:** RESTful JSON API and WebSocket/SSE streaming for compiler logs.

### Core Responsibilities:
- Serving graph nodes and edges optimized for frontend rendering.
- Providing detailed language history and code snippets.
- Validating execution payloads and enforcing execution quotas.
- Forwarding compilation and execution jobs over gRPC to the sandbox daemon.
- Validating community-submitted data formats.

---

## 4. Data Layer & GitOps Pipeline

The system treats data as code, allowing the community to contribute directly via GitHub.

### Database Schema (PostgreSQL):
- **Languages Table:** Stores core attributes (id, name, paradigm, creators, etc.).
- **Connections Table:** A junction table defining typed relationships (`Influenced By`, `Forked From`, `Runs On`).
- **Metadata:** Support for Markdown descriptions and code snippets.

### The Ingestion Pipeline:
1. **Contribution:** Users submit JSON/Markdown files via Pull Requests.
2. **Validation:** GitHub Actions run Python scripts to validate syntax and schema integrity.
3. **Synchronization:** Upon merge, the Python script synchronizes the latest data into the production PostgreSQL instance.

---

## 5. Software Design Patterns

To maintain a clean separation of concerns, scalability, and code testability, the project implements several core design patterns:

### 5.1 Backend Patterns (Spring Boot & Microservices)
* **Controller-Service-Repository (Layered Architecture):** Decouples request handling (Controller), business rules (Service), and database queries (Repository).
* **Repository Pattern:** Implemented via Spring Data JPA to abstract database interactions and keep the service layer clean of SQL/persistence details.
* **Data Transfer Object (DTO):** Standardizes API contracts by transforming internal database entities into specific response formats (e.g., node-and-link payloads for the graph canvas) before returning them to the frontend.
* **Strategy Pattern:** Utilized in the data validation and graph mapping layers to dynamically apply parsing or formatting rules depending on the connection type (`INFLUENCED_BY`, `FORKED_FROM`, `RUNS_ON`).
* **API Gateway & Reverse RPC Proxy:** The Spring Boot backend exposes a clean public REST/WebSocket interface to clients while abstracting backend microservices and maintaining pooled gRPC binary channels to the C++ compiler daemon.
* **Deterministic Cache-Aside:** Hashes execution parameters (language + source + flags) using SHA-256 to serve repeated compilation requests instantaneously.

### 5.2 Frontend Patterns (Next.js/React & WebAssembly)
* **Component-Based Architecture:** The user interface is composed of modular, self-contained components (e.g., specific graph visualizers, dialog modals, search capsules, terminal panels).
* **Container-Presenter Pattern:** Separates logical wrapper components (responsible for fetching, searching, filtering graph dataset state, or running code jobs) from presentation components (responsible for layout styling, border refractions, and animation rendering).
* **Web Worker Offloading Pattern:** Isolates CPU-intensive WebAssembly AST generation and bytecode parsing inside dedicated background Web Workers (`compiler.worker.ts`), guaranteeing that UI thread frame rates never drop.
* **React Context & State Hooks:** Centralizes key UI states (e.g., active node selection, modal open/close states, active execution output) to avoid deep prop-drilling across the force-directed canvas layout.

### 5.3 System Security Patterns (C++ Sandbox Daemon)
* **Principle of Least Privilege:** Sandboxed runner processes run with zero capabilities (`cap_drop: ALL`) and strictly reduced Linux namespaces.
* **Defense in Depth:** Multi-tiered defense combining seccomp-bpf syscall blacklists, cgroups v2 physical memory/CPU ceilings, and ephemeral tmpfs isolation.

---

## 6. UI/UX Philosophy

The interface is inspired by a modern transparent aesthetic, prioritizing:
- **Depth:** Layered transparency with thin white border refractions (`border-white/10`).
- **Vibrancy:** Dynamic accent colors that correlate to language paradigms.
- **Fluidity:** Animation-first navigation and interactive runtime feedback to prevent "jarring" page loads.