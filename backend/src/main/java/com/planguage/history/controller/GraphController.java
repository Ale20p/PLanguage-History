package com.planguage.history.controller;

import com.planguage.history.dto.GraphResponseDTO;
import com.planguage.history.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the force-directed graph data endpoint.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class GraphController {

    private final GraphService graphService;

    /**
     * GET /api/v1/graph
     * Returns the complete node-link dataset for the react-force-graph-2d canvas.
     */
    @GetMapping("/graph")
    public ResponseEntity<GraphResponseDTO> getGraph() {
        GraphResponseDTO graph = graphService.getFullGraph();
        return ResponseEntity.ok(graph);
    }
}
