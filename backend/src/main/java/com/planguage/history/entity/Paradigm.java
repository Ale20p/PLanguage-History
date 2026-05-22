package com.planguage.history.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Dictionary entity for programming paradigms (e.g., Functional, Object-Oriented).
 */
@Entity
@Table(name = "paradigms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Paradigm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;
}
