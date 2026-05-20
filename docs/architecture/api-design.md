# API Design: Programming Language Genealogy

This document outlines the RESTful API design for the Programming Language Genealogy platform. The API is built with Spring Boot and serves as the bridge between the PostgreSQL database and the Next.js frontend.

## 1. Base Configuration
- **Base URL:** `/api/v1`
- **Format:** JSON
- **Authentication:** Public (Read-only) / API Key for ingestion pipeline updates.

---

## 2. Endpoints

### 2.1 Graph Data
Used to fetch the complete dataset for the `react-force-graph-2d` visualization.

- **URL:** `/graph`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "nodes": [
      { "id": "python", "name": "Python", "group": "Object-Oriented", "year": 1991 },
      { "id": "c", "name": "C", "group": "Procedural", "year": 1972 }
    ],
    "links": [
      { "source": "c", "target": "python", "type": "Influenced By" }
    ]
  }
  ```

### 2.2 Language Details
Fetches comprehensive data for a specific language node to populate the "Liquid Glass" modals.

- **URL:** `/languages/{id}`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": "python",
    "name": "Python",
    "releaseDate": "1991-02-20",
    "paradigm": ["Object-oriented", "Imperative", "Functional"],
    "creators": ["Guido van Rossum"],
    "description": "Python is a high-level, general-purpose programming language...",
    "codeSnippet": "print('Hello, World!')",
    "influences": ["C", "ABC", "Modula-3"],
    "influenced": ["Ruby", "Swift", "Go"]
  }
  ```

### 2.3 Search & Discovery
Provides filtering and searching capabilities for the explorer interface.

- **URL:** `/languages/search`
- **Method:** `GET`
- **Parameters:**
  - `q`: Search query string.
  - `paradigm`: Filter by paradigm (e.g., `functional`).
  - `era`: Filter by decade (e.g., `1990s`).
- **Response:** List of summary language objects.

---

## 3. Data Models

### 3.1 Language Entity
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (Slug) | Unique identifier (e.g., "javascript"). |
| `name` | String | Display name. |
| `releaseDate` | Date | Initial release date. |
| `paradigm` | Array<String> | List of programming paradigms. |
| `creators` | Array<String> | List of primary developers/organizations. |
| `description` | String (Markdown) | Detailed history and context. |
| `codeSnippet` | String | Representative "Hello World" or unique syntax. |

### 3.2 Relationship Entity
| Field | Type | Description |
| :--- | :--- | :--- |
| `sourceId` | String | Origin language ID. |
| `targetId` | String | Destination language ID. |
| `type` | Enum | `INFLUENCED_BY`, `FORKED_FROM`, `RUNS_ON`. |

---

## 4. Error Handling
The API uses standard HTTP status codes:
- `200 OK`: Successful request.
- `404 Not Found`: Language ID does not exist.
- `500 Internal Server Error`: Database or server-side failure.

---

## 5. Ingestion Pipeline Endpoint
Internal endpoint used by GitHub Actions (Python script) to sync the database.

- **URL:** `/internal/sync`
- **Method:** `POST`
- **Headers:** `X-API-Key: <secure_key>`
- **Payload:** Full JSON data dump or incremental update.
