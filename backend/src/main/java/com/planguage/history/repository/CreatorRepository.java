package com.planguage.history.repository;

import com.planguage.history.entity.Creator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Creator dictionary entities.
 */
@Repository
public interface CreatorRepository extends JpaRepository<Creator, Integer> {
}
