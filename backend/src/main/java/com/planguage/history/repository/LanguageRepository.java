package com.planguage.history.repository;

import com.planguage.history.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Language entities with custom search and filter queries.
 */
@Repository
public interface LanguageRepository extends JpaRepository<Language, String> {

    /**
     * Case-insensitive search by language name.
     */
    @Query("SELECT l FROM Language l WHERE LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Language> searchByName(@Param("query") String query);

    /**
     * Filter languages by paradigm name.
     */
    @Query("SELECT DISTINCT l FROM Language l JOIN l.paradigms p WHERE LOWER(p.name) = LOWER(:paradigm)")
    List<Language> findByParadigm(@Param("paradigm") String paradigm);

    /**
     * Filter languages by release decade (era).
     * Expects era in format like "1990s" — extracts the starting year.
     */
    @Query("SELECT l FROM Language l WHERE EXTRACT(YEAR FROM l.releaseDate) >= :startYear AND EXTRACT(YEAR FROM l.releaseDate) < :endYear")
    List<Language> findByEra(@Param("startYear") int startYear, @Param("endYear") int endYear);

    /**
     * Combined search: name query AND paradigm filter.
     */
    @Query("SELECT DISTINCT l FROM Language l JOIN l.paradigms p " +
           "WHERE LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "AND LOWER(p.name) = LOWER(:paradigm)")
    List<Language> searchByNameAndParadigm(@Param("query") String query, @Param("paradigm") String paradigm);
}
