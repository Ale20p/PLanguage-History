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

CREATE TABLE paradigms (
    id      SERIAL          PRIMARY KEY,
    name    VARCHAR(100)    NOT NULL UNIQUE
);

CREATE TABLE creators (
    id      SERIAL          PRIMARY KEY,
    name    VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE connections (
    id                  SERIAL          PRIMARY KEY,
    source_id           VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    target_id           VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    connection_type     VARCHAR(50)     NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_connection UNIQUE (source_id, target_id, connection_type),
    CONSTRAINT chk_no_self_reference CHECK (source_id <> target_id),
    CONSTRAINT chk_connection_type CHECK (
        connection_type IN ('INFLUENCED_BY', 'FORKED_FROM', 'RUNS_ON')
    )
);

CREATE TABLE language_paradigm (
    language_id     VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    paradigm_id     INTEGER         NOT NULL REFERENCES paradigms(id) ON DELETE CASCADE,
    PRIMARY KEY (language_id, paradigm_id)
);

CREATE TABLE language_creator (
    language_id     VARCHAR(100)    NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    creator_id      INTEGER         NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    PRIMARY KEY (language_id, creator_id)
);

CREATE INDEX idx_connections_source ON connections(source_id);
CREATE INDEX idx_connections_target ON connections(target_id);
CREATE INDEX idx_languages_name ON languages(name);
CREATE INDEX idx_connections_type ON connections(connection_type);
