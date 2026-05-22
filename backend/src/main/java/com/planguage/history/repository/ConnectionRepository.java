package com.planguage.history.repository;

import com.planguage.history.entity.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Connection (graph edge) entities.
 */
@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Integer> {

    /**
     * Find all connections where the given language is the source (influencer/origin).
     */
    List<Connection> findBySourceId(String sourceId);

    /**
     * Find all connections where the given language is the target (influenced/derived).
     */
    List<Connection> findByTargetId(String targetId);
}
