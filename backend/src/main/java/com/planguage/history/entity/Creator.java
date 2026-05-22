package com.planguage.history.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Dictionary entity for language creators — individuals or organizations.
 */
@Entity
@Table(name = "creators")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Creator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;
}
