package com.planguage.history.service;

import com.planguage.history.dto.LanguageDetailDTO;
import com.planguage.history.dto.LanguageSummaryDTO;
import com.planguage.history.entity.Connection;
import com.planguage.history.entity.ConnectionType;
import com.planguage.history.entity.Creator;
import com.planguage.history.entity.Language;
import com.planguage.history.entity.Paradigm;
import com.planguage.history.repository.ConnectionRepository;
import com.planguage.history.repository.CreatorRepository;
import com.planguage.history.repository.LanguageRepository;
import com.planguage.history.repository.ParadigmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final CreatorRepository creatorRepository;
    private final ParadigmRepository paradigmRepository;

    /**
     * Fetch a language by ID and transform it into a full detail DTO,
     * including computed influence relationships.
     */
    public Optional<LanguageDetailDTO> getLanguageDetail(String id) {
        return languageRepository.findById(id)
                .map(this::toDetailDTO);
    }

    /**
     * Update an existing language and its associations (creators, paradigms).
     */
    @Transactional
    public Optional<LanguageDetailDTO> updateLanguage(String id, LanguageDetailDTO dto) {
        return languageRepository.findById(id).map(language -> {
            language.setName(dto.getName());
            language.setReleaseDate(dto.getReleaseDate());
            language.setWebsite(dto.getWebsite());
            language.setDescription(dto.getDescription());
            language.setCodeSnippet(dto.getCodeSnippet());
            language.setUpdatedAt(LocalDateTime.now());

            // Update Paradigms
            Set<Paradigm> updatedParadigms = new HashSet<>();
            if (dto.getParadigms() != null) {
                for (String pName : dto.getParadigms()) {
                    if (pName != null && !pName.trim().isEmpty()) {
                        String cleanName = pName.trim();
                        Paradigm paradigm = paradigmRepository.findByNameIgnoreCase(cleanName)
                                .orElseGet(() -> {
                                    Paradigm newP = new Paradigm();
                                    newP.setName(cleanName);
                                    return paradigmRepository.save(newP);
                                });
                        updatedParadigms.add(paradigm);
                    }
                }
            }
            language.setParadigms(updatedParadigms);

            // Update Creators
            Set<Creator> updatedCreators = new HashSet<>();
            if (dto.getCreators() != null) {
                for (String cName : dto.getCreators()) {
                    if (cName != null && !cName.trim().isEmpty()) {
                        String cleanName = cName.trim();
                        Creator creator = creatorRepository.findByNameIgnoreCase(cleanName)
                                .orElseGet(() -> {
                                    Creator newC = new Creator();
                                    newC.setName(cleanName);
                                    return creatorRepository.save(newC);
                                });
                        updatedCreators.add(creator);
                    }
                }
            }
            language.setCreators(updatedCreators);

            Language saved = languageRepository.save(language);

            // Update influences connections (incoming)
            List<Connection> existingIncoming = connectionRepository.findByTargetId(saved.getId());
            connectionRepository.deleteAll(existingIncoming);
            if (dto.getInfluences() != null) {
                for (String infName : dto.getInfluences()) {
                    if (infName != null && !infName.trim().isEmpty()) {
                        languageRepository.findByNameIgnoreCase(infName.trim()).ifPresent(sourceLang -> {
                            Connection conn = new Connection();
                            conn.setSource(sourceLang);
                            conn.setTarget(saved);
                            conn.setConnectionType(ConnectionType.INFLUENCED_BY);
                            connectionRepository.save(conn);
                        });
                    }
                }
            }

            // Update influenced connections (outgoing)
            List<Connection> existingOutgoing = connectionRepository.findBySourceId(saved.getId());
            connectionRepository.deleteAll(existingOutgoing);
            if (dto.getInfluenced() != null) {
                for (String infName : dto.getInfluenced()) {
                    if (infName != null && !infName.trim().isEmpty()) {
                        languageRepository.findByNameIgnoreCase(infName.trim()).ifPresent(targetLang -> {
                            Connection conn = new Connection();
                            conn.setSource(saved);
                            conn.setTarget(targetLang);
                            conn.setConnectionType(ConnectionType.INFLUENCED_BY);
                            connectionRepository.save(conn);
                        });
                    }
                }
            }

            return toDetailDTO(saved);
        });
    }

    /**
     * Create a new language, set up its associations, and link influences/influenced.
     */
    @Transactional
    public LanguageDetailDTO createLanguage(LanguageDetailDTO dto) {
        String generatedId = slugify(dto.getName());
        if (languageRepository.existsById(generatedId)) {
            throw new IllegalArgumentException("A language with name '" + dto.getName() + "' (ID: " + generatedId + ") already exists.");
        }

        Language language = new Language();
        language.setId(generatedId);
        language.setName(dto.getName());
        language.setReleaseDate(dto.getReleaseDate());
        language.setWebsite(dto.getWebsite());
        language.setDescription(dto.getDescription());
        language.setCodeSnippet(dto.getCodeSnippet());
        language.setCreatedAt(LocalDateTime.now());
        language.setUpdatedAt(LocalDateTime.now());

        // Save paradigms
        Set<Paradigm> paradigms = new HashSet<>();
        if (dto.getParadigms() != null) {
            for (String pName : dto.getParadigms()) {
                if (pName != null && !pName.trim().isEmpty()) {
                    String cleanName = pName.trim();
                    Paradigm paradigm = paradigmRepository.findByNameIgnoreCase(cleanName)
                            .orElseGet(() -> {
                                Paradigm newP = new Paradigm();
                                newP.setName(cleanName);
                                return paradigmRepository.save(newP);
                            });
                    paradigms.add(paradigm);
                }
            }
        }
        language.setParadigms(paradigms);

        // Save creators
        Set<Creator> creators = new HashSet<>();
        if (dto.getCreators() != null) {
            for (String cName : dto.getCreators()) {
                if (cName != null && !cName.trim().isEmpty()) {
                    String cleanName = cName.trim();
                    Creator creator = creatorRepository.findByNameIgnoreCase(cleanName)
                            .orElseGet(() -> {
                                Creator newC = new Creator();
                                newC.setName(cleanName);
                                return creatorRepository.save(newC);
                            });
                    creators.add(creator);
                }
            }
        }
        language.setCreators(creators);

        Language savedLanguage = languageRepository.save(language);

        // Save influences connections (incoming connections)
        if (dto.getInfluences() != null) {
            for (String infName : dto.getInfluences()) {
                if (infName != null && !infName.trim().isEmpty()) {
                    languageRepository.findByNameIgnoreCase(infName.trim()).ifPresent(sourceLang -> {
                        Connection conn = new Connection();
                        conn.setSource(sourceLang);
                        conn.setTarget(savedLanguage);
                        conn.setConnectionType(ConnectionType.INFLUENCED_BY);
                        connectionRepository.save(conn);
                    });
                }
            }
        }

        // Save influenced connections (outgoing connections)
        if (dto.getInfluenced() != null) {
            for (String infName : dto.getInfluenced()) {
                if (infName != null && !infName.trim().isEmpty()) {
                    languageRepository.findByNameIgnoreCase(infName.trim()).ifPresent(targetLang -> {
                        Connection conn = new Connection();
                        conn.setSource(savedLanguage);
                        conn.setTarget(targetLang);
                        conn.setConnectionType(ConnectionType.INFLUENCED_BY);
                        connectionRepository.save(conn);
                    });
                }
            }
        }

        return toDetailDTO(savedLanguage);
    }

    private String slugify(String name) {
        if (name == null) {
            return "";
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-$", "")
                .trim();
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
