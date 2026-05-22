-- =============================================================
-- Programming Language Genealogy & Evolution
-- PostgreSQL Schema Definition
-- =============================================================

-- Drop existing tables (in dependency order) if they exist
DROP TABLE IF EXISTS language_creator CASCADE;
DROP TABLE IF EXISTS language_paradigm CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS paradigms CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- =============================================================
-- 1. Core Tables
-- =============================================================

-- Languages: Primary node data for the force-directed graph
CREATE TABLE languages (
    id              VARCHAR(100)    PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    release_date    DATE            NOT NULL,
    website         VARCHAR(255),
    code_snippet    TEXT,
    description     TEXT            NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Paradigms: Dictionary table of programming paradigms
CREATE TABLE paradigms (
    id      SERIAL          PRIMARY KEY,
    name    VARCHAR(100)    NOT NULL UNIQUE
);

-- Creators: Dictionary table for language creators/organizations
CREATE TABLE creators (
    id      SERIAL          PRIMARY KEY,
    name    VARCHAR(150)    NOT NULL UNIQUE
);

-- =============================================================
-- 2. Junction / Relationship Tables
-- =============================================================

-- Connections: Directed edges in the genealogy graph
CREATE TABLE connections (
    id                  SERIAL          PRIMARY KEY,
    source_id           VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    target_id           VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    connection_type     VARCHAR(50)     NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate edges
    CONSTRAINT uq_connection UNIQUE (source_id, target_id, connection_type),

    -- Prevent self-referential connections
    CONSTRAINT chk_no_self_reference CHECK (source_id <> target_id),

    -- Enforce valid connection types
    CONSTRAINT chk_connection_type CHECK (
        connection_type IN ('INFLUENCED_BY', 'FORKED_FROM', 'RUNS_ON')
    )
);

-- Language <-> Paradigm (Many-to-Many)
CREATE TABLE language_paradigm (
    language_id     VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    paradigm_id     INTEGER         NOT NULL REFERENCES paradigms(id) ON DELETE CASCADE,
    PRIMARY KEY (language_id, paradigm_id)
);

-- Language <-> Creator (Many-to-Many)
CREATE TABLE language_creator (
    language_id     VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    creator_id      INTEGER         NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    PRIMARY KEY (language_id, creator_id)
);

-- =============================================================
-- 3. Indices for Query Optimization
-- =============================================================

-- Graph load optimization: fast lookup of edges by source/target
CREATE INDEX idx_connections_source ON connections(source_id);
CREATE INDEX idx_connections_target ON connections(target_id);

-- Search optimization: fast language name lookups
CREATE INDEX idx_languages_name ON languages(name);

-- Connection type filtering
CREATE INDEX idx_connections_type ON connections(connection_type);
