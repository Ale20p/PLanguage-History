package com.planguage.history.service;

import com.planguage.history.dto.GraphResponseDTO;
import com.planguage.history.dto.LinkDTO;
import com.planguage.history.dto.NodeDTO;
import com.planguage.history.entity.Connection;
import com.planguage.history.entity.Language;
import com.planguage.history.entity.Paradigm;
import com.planguage.history.repository.ConnectionRepository;
import com.planguage.history.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service responsible for constructing the full graph payload
 * (nodes + links) consumed by react-force-graph-2d.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GraphService {

    private final LanguageRepository languageRepository;
    private final ConnectionRepository connectionRepository;

    /**
     * Build the complete graph response with all language nodes and connection edges.
     */
    public GraphResponseDTO getFullGraph() {
        List<Language> languages = languageRepository.findAll();
        List<Connection> connections = connectionRepository.findAll();

        List<NodeDTO> nodes = languages.stream()
                .map(this::toNodeDTO)
                .collect(Collectors.toList());

        List<LinkDTO> links = connections.stream()
                .map(this::toLinkDTO)
                .collect(Collectors.toList());

        return new GraphResponseDTO(nodes, links);
    }

    /**
     * Transform a Language entity into a graph NodeDTO.
     * Uses the first paradigm alphabetically as the "group" for node color-coding.
     */
    private NodeDTO toNodeDTO(Language language) {
        String group = language.getParadigms().stream()
                .map(Paradigm::getName)
                .sorted()
                .findFirst()
                .orElse("Unknown");

        return new NodeDTO(
                language.getId(),
                language.getName(),
                group,
                language.getReleaseDate().getYear()
        );
    }

    /**
     * Transform a Connection entity into a graph LinkDTO.
     */
    private LinkDTO toLinkDTO(Connection connection) {
        return new LinkDTO(
                connection.getSource().getId(),
                connection.getTarget().getId(),
                connection.getConnectionType().name()
        );
    }
}
