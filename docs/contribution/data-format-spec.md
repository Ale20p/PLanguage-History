# Data Format Specification

This document defines the schema and formatting requirements for community-submitted programming language data. Following these standards ensures that your contribution is automatically validated and correctly displayed in the "Liquid Glass" interface.

## 1. Directory Structure

Data is organized by language ID (slug) in the `/data/languages` directory:
```text
/data/languages/
  ├── javascript/
  │   ├── metadata.json
  │   └── description.md
  ├── python/
  │   ├── metadata.json
  │   └── description.md
```

---

## 2. Metadata Schema (`metadata.json`)

Each language must have a `metadata.json` file. This file provides the structured data for the force-directed graph and search filters.

### Example
```json
{
  "id": "typescript",
  "name": "TypeScript",
  "releaseDate": "2012-10-01",
  "creators": ["Anders Hejlsberg", "Microsoft"],
  "paradigms": ["Object-oriented", "Functional", "Generic"],
  "website": "https://www.typescriptlang.org/",
  "relationships": [
    {
      "targetId": "javascript",
      "type": "FORKED_FROM"
    },
    {
      "targetId": "csharp",
      "type": "INFLUENCED_BY"
    }
  ]
}
```

### Field Definitions
| Field | Requirement | Type | Description |
| :--- | :--- | :--- | :--- |
| `id` | **Required** | String | Unique lowercase slug (e.g., `cpp`). |
| `name` | **Required** | String | Official display name. |
| `releaseDate`| **Required** | String | ISO 8601 date (YYYY-MM-DD). |
| `creators` | **Required** | Array<String> | Individuals or organizations. |
| `paradigms` | **Required** | Array<String> | e.g., Functional, Procedural. |
| `relationships`| Optional | Array<Obj> | List of connections to other languages. |

---

## 3. Relationship Types

When defining a relationship in `metadata.json`, use one of the following explicit types:

- **`INFLUENCED_BY`**: Conceptual, syntactical, or philosophical influence.
- **`FORKED_FROM`**: Direct codebase lineage (e.g., C++ from C).
- **`RUNS_ON`**: Shared runtime or VM (e.g., Kotlin runs on JVM).

---

## 4. Description Content (`description.md`)

The `description.md` file contains the "Liquid Glass" modal content.

### Requirements:
- **First Line**: Must be a level 1 heading (`# Language Name`).
- **Code Snippets**: Use fenced code blocks with the appropriate language identifier.
- **Length**: Aim for 300-500 words covering history, unique features, and legacy.

### Example:
```markdown
# TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript...

## Why it matters
By adding static type definitions, TypeScript allows developers to catch errors early...

## Example Code
```typescript
interface User {
  name: string;
  id: number;
}
```
```

---

## 5. Validation Rules

1.  **Unique IDs**: The `id` must match the directory name.
2.  **Circular References**: Avoid circular `FORKED_FROM` relationships.
3.  **Image Assets**: If referencing images, use relative paths to the `/assets` folder.
4.  **Date Precision**: Use `YYYY-01-01` if the specific month/day of release is unknown.
