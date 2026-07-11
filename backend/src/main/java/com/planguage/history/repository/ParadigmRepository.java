package com.planguage.history.repository;

import com.planguage.history.entity.Paradigm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Paradigm dictionary entities.
 */
@Repository
public interface ParadigmRepository extends JpaRepository<Paradigm, Integer> {
    Optional<Paradigm> findByNameIgnoreCase(String name);
}
