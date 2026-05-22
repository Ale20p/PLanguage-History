package com.planguage.history.service;

import com.planguage.history.dto.LanguageDetailDTO;
import com.planguage.history.dto.LanguageSummaryDTO;
import com.planguage.history.entity.Connection;
import com.planguage.history.entity.Creator;
import com.planguage.history.entity.Language;
import com.planguage.history.entity.Paradigm;
import com.planguage.history.repository.ConnectionRepository;
import com.planguage.history.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for language detail retrieval and search operations.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LanguageService {

    private final LanguageRepository languageRepository;
    private final ConnectionRepository connectionRepository;

    /**
     * Fetch a language by ID and transform it into a full detail DTO,
     * including computed influence relationships.
     */
    public Optional<LanguageDetailDTO> getLanguageDetail(String id) {
        return languageRepository.findById(id)
                .map(this::toDetailDTO);
    }

    /**
     * Search and filter languages based on optional query parameters.
     *
     * @param query    Name search string (optional)
     * @param paradigm Paradigm filter (optional)
     * @param era      Decade filter, e.g., "1990s" (optional)
     */
    public List<LanguageSummaryDTO> searchLanguages(String query, String paradigm, String era) {
        List<Language> results;

        if (era != null && !era.isBlank()) {
            // Parse era like "1990s" → startYear=1990, endYear=2000
            int startYear = parseEra(era);
            int endYear = startYear + 10;
            results = languageRepository.findByEra(startYear, endYear);

            // Apply additional filters in-memory if needed
            if (query != null && !query.isBlank()) {
                String lowerQuery = query.toLowerCase();
                results = results.stream()
                        .filter(l -> l.getName().toLowerCase().contains(lowerQuery))
                        .collect(Collectors.toList());
            }
            if (paradigm != null && !paradigm.isBlank()) {
                String lowerParadigm = paradigm.toLowerCase();
                results = results.stream()
                        .filter(l -> l.getParadigms().stream()
                                .anyMatch(p -> p.getName().toLowerCase().equals(lowerParadigm)))
                        .collect(Collectors.toList());
            }
        } else {
            boolean hasQuery = query != null && !query.isBlank();
            boolean hasParadigm = paradigm != null && !paradigm.isBlank();

            if (hasQuery && hasParadigm) {
                results = languageRepository.searchByNameAndParadigm(query, paradigm);
            } else if (hasQuery) {
                results = languageRepository.searchByName(query);
            } else if (hasParadigm) {
                results = languageRepository.findByParadigm(paradigm);
            } else {
                results = languageRepository.findAll();
            }
        }

        return results.stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    // ── Private Mapping Methods ──

    private LanguageDetailDTO toDetailDTO(Language language) {
        // Compute "influences": languages that influenced THIS language
        // (connections where THIS language is the target)
        List<String> influences = connectionRepository.findByTargetId(language.getId()).stream()
                .map(Connection::getSource)
                .map(Language::getName)
                .sorted()
                .collect(Collectors.toList());

        // Compute "influenced": languages that THIS language influenced
        // (connections where THIS language is the source)
        List<String> influenced = connectionRepository.findBySourceId(language.getId()).stream()
                .map(Connection::getTarget)
                .map(Language::getName)
                .sorted()
                .collect(Collectors.toList());

        return new LanguageDetailDTO(
                language.getId(),
                language.getName(),
                language.getReleaseDate(),
                language.getWebsite(),
                language.getParadigms().stream().map(Paradigm::getName).sorted().collect(Collectors.toList()),
                language.getCreators().stream().map(Creator::getName).sorted().collect(Collectors.toList()),
                language.getDescription(),
                language.getCodeSnippet(),
                influences,
                influenced
        );
    }

    private LanguageSummaryDTO toSummaryDTO(Language language) {
        return new LanguageSummaryDTO(
                language.getId(),
                language.getName(),
                language.getReleaseDate().getYear(),
                language.getParadigms().stream().map(Paradigm::getName).sorted().collect(Collectors.toList())
        );
    }

    /**
     * Parse an era string like "1990s" into the starting year (1990).
     */
    private int parseEra(String era) {
        String digits = era.replaceAll("[^0-9]", "");
        return Integer.parseInt(digits);
    }
}
