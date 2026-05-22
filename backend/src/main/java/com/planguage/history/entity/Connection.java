package com.planguage.history.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing a directed edge in the language genealogy graph.
 * Maps to the "connections" table.
 */
@Entity
@Table(name = "connections",
       uniqueConstraints = @UniqueConstraint(columnNames = {"source_id", "target_id", "connection_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Connection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    private Language source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private Language target;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_type", nullable = false, length = 50)
    private ConnectionType connectionType;
}
