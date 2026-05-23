# Programming Language Genealogy & Evolution (PLanguage-History)

Welcome to the **PLanguage-History** project! This is an interactive, open-source, and visually stunning web platform that maps the historical lineage of programming languages, their versions, and their conceptual influences. 

Our goal is to build a "digital museum" where the community can explore how programming languages evolved and were influenced by one another over time.

## 🌟 Core Features

- **Force-Directed Graph Visualization:** A physics-based node-edge map representing languages and their versions.
- **Typed Connections:** Explicitly categorized relationships between languages:
  - `Influenced By` (Conceptual/Syntax)
  - `Forked From` (Codebase origin)
  - `Runs On` (Shared Runtime/VM, e.g., JVM, LLVM)
- **Interactive Modals:** Detailed "Liquid Glass" (frosted glass) popups containing language history, code snippets, and creator information.
- **Open-Source Contribution Model:** Data updates are handled via GitHub Pull Requests (using JSON/Markdown files) and automatically synced to a live production database.

## 🛠️ Technical Stack

### Frontend
- **Framework:** Next.js (React)
- **Visualization:** `react-force-graph-2d` for high-performance canvas rendering.
- **Styling:** Tailwind CSS with a "Liquid Glass" (Glassmorphism) theme.
- **Animations:** Framer Motion for spring-based UI physics.

### Backend
- **Framework:** Java & Spring Boot
- **Architecture:** REST API serving the graph structure and detailed node content.
- **Data Access:** Spring Data JPA.

### Database
- **Engine:** PostgreSQL
- **Schema:** Relational structure using junction tables to manage many-to-many "Language-to-Language" connections with typed metadata.

### Automation (GitOps)
- **GitHub Actions:** Triggered automatically on merged PRs.
- **Python Scripting:** Parses community-submitted files and synchronizes the production PostgreSQL database.

## 💎 UI/UX Philosophy

The interface is inspired by high-end, modern design aesthetics, featuring a "Liquid Glass" look. Key elements include `backdrop-blur`, subtle transparency, vibrant accent colors for nodes, and fluid transitions. The UI is built to feel modern, lightweight, and professional.

## 🤝 How to Contribute

We use a GitOps model for managing our language data. Community contributions (adding new languages, updating historical facts, or linking influences) are handled via Pull Requests containing JSON or Markdown files. Once merged, these updates are automatically synced to our live database!

*(See our `docs/contribution/` guidelines for detailed instructions on how to contribute code or language data.)*

## 📜 Licensing

- **Code:** [Apache License 2.0](./LICENSE)
- **Data/Content:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA)

---

Enjoy exploring the history of programming languages! 🚀
