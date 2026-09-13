# Programming Language Genealogy & Evolution (PLanguage-History)

Welcome to the **PLanguage-History** project! This is an interactive, open-source, and visually stunning web platform that maps the historical lineage of programming languages, their versions, and their conceptual influences. 

Our goal is to build a "digital museum" where the community can explore how programming languages evolved and were influenced by one another over time.

## 🌟 Core Features

- **Force-Directed Graph Visualization:** A physics-based node-edge map representing languages and their versions.
- **Typed Connections:** Explicitly categorized relationships between languages:
  - `Influenced By` (Conceptual/Syntax)
  - `Forked From` (Codebase origin)
  - `Runs On` (Shared Runtime/VM, e.g., JVM, LLVM)
- **Interactive Modals:** Detailed "Liquid Glass" (transparent glass) popups containing language history, code snippets, and creator information.
- **Interactive Code Execution & AST Lab:** Live editing and sandboxed execution of language snippets. Features an embedded Monaco Editor, WebAssembly AST generator, and real-time execution logs.
- **Open-Source Contribution Model:** Data updates are handled via GitHub Pull Requests (using JSON/Markdown files) and automatically synced to a live production database.

## 🛠️ Technical Stack

### Frontend
- **Framework:** Next.js (React)
- **Visualization:** `react-force-graph-2d` for high-performance canvas rendering.
- **Code Editing & Terminal:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) + [xterm.js](https://xtermjs.org/) glassmorphic terminal.
- **Client-Side Engine:** WebAssembly (compiled from modern C++ via Emscripten) for zero-latency AST parsing and historical dialect evaluation.
- **Styling:** Tailwind CSS with a "Clear Glass" (transparent glass) theme.
- **Animations:** Framer Motion for spring-based UI physics.

### Backend & API Gateway
- **Framework:** Java 21 & Spring Boot
- **Architecture:** REST API serving the graph structure, language metadata, deterministic caching, and gRPC execution dispatch.
- **Data Access:** Spring Data JPA.
- **Streaming:** WebSocket and Server-Sent Events (SSE) for real-time compilation logs.

### Compiler & Sandboxed Execution Daemon
- **Core Engine:** Modern C++20 microservice communicating over gRPC (`compiler.proto`).
- **Isolation & Security:** Multi-layered defense using Linux kernel primitives:
  - `seccomp-bpf` syscall whitelisting.
  - `cgroups v2` resource throttling (CPU ceiling, 128MB RAM limit, 32 PIDs max).
  - Isolated Linux namespaces (`unshare` PID, Mount, Network, IPC) with zero network egress.
  - Ephemeral in-memory `tmpfs` mounts wiped upon termination.
- *(See [Compiler & Execution Engine Architecture](docs/architecture/compiler-execution-engine.md) for full specifications.)*

### Database
- **Engine:** PostgreSQL
- **Schema:** Relational structure using junction tables to manage many-to-many "Language-to-Language" connections with typed metadata.

### Automation (GitOps)
- **GitHub Actions:** Triggered automatically on merged PRs.
- **Python Scripting:** Parses community-submitted files and synchronizes the production PostgreSQL database.

## 💎 UI/UX Philosophy

The interface is inspired by a literal see-through aesthetic, featuring a "Clear Glass" look. Key elements include complete transparency, thin white border refractions (`border-white/10`), vibrant accent colors for nodes, and fluid transitions. The UI is built to feel modern, lightweight, and completely transparent, eschewing any frosted or blurred backgrounds.

## 🤝 How to Contribute

We use a GitOps model for managing our language data. Community contributions (adding new languages, updating historical facts, or linking influences) are handled via Pull Requests containing JSON or Markdown files. Once merged, these updates are automatically synced to our live database!

*(See our `docs/contribution/` guidelines for detailed instructions on how to contribute code or language data.)*

## 📜 Licensing

- **Code:** [Apache License 2.0](./LICENSE)
- **Data/Content:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA)

---

Enjoy exploring the history of programming languages! 🚀
