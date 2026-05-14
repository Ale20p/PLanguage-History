# System Overview: Programming Language Genealogy

This document provides a high-level technical overview of the **Programming Language Genealogy & Evolution** platform. The system is designed to be a high-performance, interactive "digital museum" that visualizes the historical connections between programming languages.

## 1. High-Level Architecture

The platform follows a modern three-tier architecture with a decoupled GitOps-driven data pipeline:

- **Client Tier:** A responsive Next.js application focused on interactive visualization.
- **API Tier:** A robust Spring Boot backend providing RESTful endpoints for graph data and content.
- **Data Tier:** A relational PostgreSQL database optimized for many-to-many relationship queries.
- **Pipeline:** A Python-based ingestion engine triggered by GitHub Actions for community-driven data updates.

---

## 2. Frontend Stack (The "Liquid Glass" UI)

The frontend is built for visual impact and smooth performance, adhering to a "Liquid Glass" design philosophy.

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Visualization:** [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) - Utilizes HTML5 Canvas for rendering thousands of nodes and edges smoothly.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Custom configuration for `backdrop-blur` and transparency effects.
- **Interactivity:** [Framer Motion](https://www.framer.com/motion/) - Powers modal transitions and UI physics.

### Key Components:
- **Force-Directed Graph:** The central hub for navigation.
- **Interactive Modals:** Detailed views for specific languages using frosted glass aesthetics.
- **Search & Filter:** Contextual tools to isolate specific eras or paradigms.

---

## 3. Backend Stack (API Services)

The backend is a secure, scalable Java application responsible for data orchestration and business logic.

- **Framework:** [Spring Boot](https://spring.io/projects/spring-boot)
- **Data Access:** [Spring Data JPA](https://spring.io/projects/spring-data-jpa) - Simplifies database interactions.
- **Security:** Standard JWT-based or Session management (as required).
- **API Style:** RESTful JSON API.

### Core Responsibilities:
- Serving graph nodes and edges optimized for frontend rendering.
- Providing detailed language history and code snippets.
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

## 5. UI/UX Philosophy

The interface is inspired by Apple's design language, prioritizing:
- **Depth:** Layered transparency and background blurs.
- **Vibrancy:** Dynamic accent colors that correlate to language paradigms.
- **Fluidity:** Animation-first navigation to prevent "jarring" page loads.