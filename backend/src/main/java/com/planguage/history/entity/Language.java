package com.planguage.history.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Core entity representing a programming language node in the genealogy graph.
 * Maps to the "languages" table.
 */
@Entity
@Table(name = "languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Language {

    @Id
    @Column(length = 100)
    @EqualsAndHashCode.Include
    private String id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @Column(length = 255)
    private String website;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Many-to-Many: Language <-> Paradigm ──
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "language_paradigm",
        joinColumns = @JoinColumn(name = "language_id"),
        inverseJoinColumns = @JoinColumn(name = "paradigm_id")
    )
    private Set<Paradigm> paradigms = new HashSet<>();

    // ── Many-to-Many: Language <-> Creator ──
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "language_creator",
        joinColumns = @JoinColumn(name = "language_id"),
        inverseJoinColumns = @JoinColumn(name = "creator_id")
    )
    private Set<Creator> creators = new HashSet<>();

    // ── Connections where this language is the SOURCE (influencer/origin) ──
    @OneToMany(mappedBy = "source", fetch = FetchType.LAZY)
    private Set<Connection> outgoingConnections = new HashSet<>();

    // ── Connections where this language is the TARGET (influenced/derived) ──
    @OneToMany(mappedBy = "target", fetch = FetchType.LAZY)
    private Set<Connection> incomingConnections = new HashSet<>();
}
